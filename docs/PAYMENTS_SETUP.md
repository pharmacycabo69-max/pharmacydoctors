# Cobro del 100 % — guía para configurar Stripe y Vercel (V5.1)
Actualizado: 2026-11-25 · Rama `v5-premium` · **Hoy no cobra nada: está apagado hasta que configures las variables.**
**Nunca pegues claves en el chat ni en el código.** Solo van en Vercel → Settings → Environment Variables.

## 1. Cómo funciona (en palabras simples)
1. **El cliente pide una reserva** en `/book/`. No se cobra nada.
2. **El correo de la reserva** trae un enlace al **concierge** (`/concierge/?b=PD-…`).
   - **No** es un enlace de pago.
   - Abrirlo sin la clave de personal no sirve para nada.
3. **El concierge confirma** disponibilidad, hora y precio con el cliente. Después, en `/concierge/`:
   - escribe la **clave de personal**;
   - elige los servicios con precio autorizado;
   - pulsa **"Create secure link"**.
4. **El servidor crea un enlace firmado** (`/pay/?t=…`) que vence (6, 24, 48 o 72 h) y un mensaje listo para WhatsApp.
5. **El cliente abre el enlace**:
   - la página pide al servidor el resumen (el navegador no puede cambiar servicios ni montos);
   - el cliente acepta la política;
   - Stripe Checkout cobra el 100 %.
6. **Stripe** envía el recibo al cliente y llama al **webhook**, que envía al equipo el correo:
   - "PAID · Booking … · $X USD";
   - o PENDING / PAYMENT FAILED / REFUNDED, según el caso.
7. **La página `/pay/success/`** consulta a Stripe desde el servidor y solo dice "Payment received" si:
   - Stripe confirma el pago;
   - el monto y la moneda coinciden con lo esperado.

### Protecciones incluidas
- Monto calculado solo en el servidor.
- Enlaces firmados (HMAC) que vencen.
- Solo el personal genera enlaces.
- Idempotencia: el mismo enlace siempre abre la misma sesión de Stripe.
- Bloqueo de doble cobro: si el folio ya está pagado, responde "already paid".
- Firma del webhook verificada.
- Importe y moneda comparados con lo esperado.
- Sin datos médicos hacia Stripe: el cargo dice solo "PharmacyDoctors service · Booking PD-…".
- El registro del pago queda en Stripe aunque falle el correo.

### Servicios que se cobran en línea (precios en `api/_lib/pay.js`)
| Servicio | Precio |
|---|---|
| Suero estándar | $159 a domicilio · $129 en clínica · $119 cada uno con 6+ a domicilio (NAD+ excluido) |
| NAD+ | $279 |
| Doctor a domicilio | $189 |
| Consulta en clínica | $99 |
| Video | $59 |

Estética, rayos X, laboratorio, farmacia y enfermería: **solo con cotización, sin cobro en línea.**

## 2. Variables de entorno (Vercel → Project *pharmacydoctors* → Settings → Environment Variables)
| Variable | Valor | Entornos |
|---|---|---|
| `STRIPE_SECRET_KEY` | **Primero** `sk_test_…` (Stripe → Developers → API keys, con *Test mode* activado) | Preview (y Production solo al final) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` del webhook (paso 4) | Los mismos que la clave |
| `PAY_LINK_SECRET` | Texto aleatorio de **40 caracteres o más**. En PowerShell: `[Convert]::ToBase64String((1..40 \| % {Get-Random -Max 256}))` | Preview y Production |
| `CONCIERGE_KEY` | Contraseña del personal, de **16 caracteres o más**. Compártela solo con el concierge | Preview y Production |
| `WEB3FORMS_KEY` | Opcional (si no, usa la llave pública del sitio) | — |

Después de guardar las variables: Vercel → Deployments → el último de la rama `v5-premium` → **Redeploy**. Las variables solo se aplican en despliegues nuevos.

## 3. Probar solo en modo prueba (sin dinero real)
1. En Stripe activa **Test mode** (interruptor arriba a la derecha).
2. Configura las 4 variables en **Preview** únicamente, con `sk_test_…`.
3. Abre la vista previa (ver sección 7 para el acceso) → `/book/` → haz una reserva de prueba con tus datos.
4. Abre `/concierge/`, pon la `CONCIERGE_KEY`, genera el enlace y ábrelo.
5. Paga con la tarjeta de prueba de Stripe **4242 4242 4242 4242**, cualquier fecha futura y cualquier CVC.
6. Comprueba:
   - [ ] la página dice "Payment received";
   - [ ] en Stripe (Test) → Payments aparece el pago con la descripción "PharmacyDoctors booking PD-…";
   - [ ] llegó el correo "PAID · Booking PD-…";
   - [ ] al abrir de nuevo el enlace dice "This booking is already paid".
7. **Pago rechazado:** prueba con la tarjeta `4000 0000 0000 0002`. Stripe la rechaza y no se cobra.
8. **Reembolso de prueba:** Stripe → el pago → Refund. Comprueba que llega "REFUNDED (full) · Booking PD-…".

## 4. Configurar el webhook
1. Stripe (Test mode) → Developers → **Webhooks → Add endpoint**.
2. URL:
   - para la vista previa: `https://<url-de-la-vista-previa>/api/stripe-webhook`;
   - para producción, después: `https://www.pharmacydoctors.com/api/stripe-webhook`.
   - **Nota:** la protección de Vercel bloquea las llamadas de Stripe a la vista previa. Para probar el webhook ahí, usa *Protection Bypass for Automation* (Vercel → Settings → Deployment Protection). **No desactives la protección completa.**
3. Eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copia el **Signing secret** (`whsec_…`) a `STRIPE_WEBHOOK_SECRET` y haz Redeploy.
5. Comprobar: en Stripe → el webhook → **Send test event** (`checkout.session.completed`) → la respuesta debe ser **200**. En *Event deliveries* verás cada intento y su respuesta.

## 5. Recibos y confirmaciones
- Stripe → Settings → **Customer emails** → activar **Successful payments** y **Refunds**. Es el recibo automático para el cliente.
- Correo al equipo: lo envía el webhook por Web3Forms, al mismo buzón de las reservas.
- **Registro:** Stripe es el registro permanente de pagos y reembolsos. Hoy las *solicitudes* de reserva solo quedan en el correo (ver P0 en `PENDING_APPROVALS.md`).

## 6. Pasar a cobros reales
1. Haz al menos un ciclo completo en modo prueba (sección 3).
2. Stripe en **Live mode**:
   - crea la clave `sk_live_…` y un webhook *live* con la URL de producción;
   - copia su `whsec_…`.
3. En Vercel, entorno **Production**: `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (live), `PAY_LINK_SECRET` y `CONCIERGE_KEY`.
4. Fusionar `v5-premium` a `main`, solo con tu autorización expresa.

## 7. Acceso a la vista previa (sin desactivar la protección)
- Inicia sesión en Vercel con la cuenta del equipo *cabo-pharmacy* y abre el enlace de la vista previa.
- Para que otra persona la vea: Vercel → el deployment → **Share** (enlace temporal).

## 8. Sustituir el enlace antiguo de $50 sin afectar otras marcas
- **Dónde se usa:**
  - en el código de PharmacyDoctors ya **no** se usa (`DEPOSIT_URL = ''`);
  - busqué en los repositorios locales de **CaboWalkInClinic, CaboWalkInClinic-dev, Cabo Pharmacy, Cabo Surprise, Cmc Pharmacy, Cvu pharmacy, Pharmacy Cabo, RMC Pharmacy y rmcpharmacy.com**: **ninguno lo contiene**;
  - **no puedo ver** dónde más podría estar: plantillas de WhatsApp Business, Google Business Profile, correos guardados, PDFs o redes sociales.
- **Pasos seguros:**
  1. En Stripe → Payment Links → el enlace de $50 → revisa **Payments** para ver si alguien lo usó recientemente y desde dónde.
  2. Revisa tus plantillas de WhatsApp y respuestas rápidas.
  3. Cuando el nuevo sistema esté validado en producción, **desactiva** el enlace (no lo borres): así queda el historial.
  4. Si alguien paga un anticipo con el enlace viejo antes de desactivarlo, se descuenta del total al confirmar, como hasta ahora.
- **No lo desactivé** (instrucción tuya).

## 9. Volver atrás si algo falla
- **Apagar el cobro en línea al instante:** borra `STRIPE_SECRET_KEY` en Vercel y haz Redeploy. `/pay/` mostrará "Online payment is being activated — pay at the visit".
- **Apagar los enlaces:** borra `PAY_LINK_SECRET`. Todos los enlaces existentes dejan de funcionar.
- **Cambiar la clave del personal:** reemplaza `CONCIERGE_KEY` y haz Redeploy.
- **Código:** ver `ROLLBACK.md`.

## 10. Probar todo localmente sin Stripe (simulación)
```
node tests/payments.test.js                       # 42 pruebas unitarias
node tools/dev-server.js 8081 --mock              # sitio + /api + Stripe SIMULADO (marcado en pantalla)
```
Clave de personal local (solo para la simulación): `local-dev-staff-key`. **La simulación no prueba Stripe real.**

## 11. Cobrar servicios cotizados (rayos X, laboratorio, estética, enfermería) — V5.3
1. El cliente pide cotización: en `/book/`, rayos X o laboratorio aparecen como **"Quote"**; en estética, primero la valoración.
2. El equipo confirma la viabilidad (rayos X: la confirma el profesional de imagen), el lugar, la hora y el monto, y el cliente **acepta** la cotización.
3. En `/concierge/`:
   - "Quoted service" → tipo (X-ray / Laboratory / Aesthetics / Private nurse);
   - "Quoted amount USD" → el monto aceptado, entre $10 y $5,000, con IVA incluido.
   - Se pueden combinar con servicios de precio fijo (por ejemplo, 1 suero + enfermera).
4. El enlace firmado lleva ese monto. El cliente no puede cambiarlo; Stripe cobra exactamente eso.
5. Farmacia y medicamentos: **sin cobro en línea**. Se cotizan y se cobran como se acuerde al confirmar el pedido.

## 12. Compra completa probada (simulación local, 2026-11-26)
**Myers × 2 en villa ($318):**
1. Catálogo (villa, 2 personas).
2. Book now: reserva preseleccionada, correo con enlace de concierge.
3. Concierge: enlace firmado.
4. `/pay/`, Stripe simulado, `/pay/success/` verificado.
5. Correo "PAID · Booking PD-261126-DDGH · $318.00 USD".
6. Segundo intento de cobro: 409 (bloqueado).

**Rayos X cotizado ($125):** concierge con monto cotizado → `/pay/` "X-ray (accepted quote) $125" → pago simulado → "PAID · Booking PD-261126-XRAY · $125.00 USD".

**Con Stripe real (modo test) falta probarlo:** requiere las variables de §2.

## 13. Estado real de la configuración (2026-11-26)
- **Vercel CLI 67.0.0** instalado; sesión `pharmacycabo69-5399`, equipo **cabo-pharmacy**.
- Vinculado **solo** el proyecto `pharmacydoctors` (en la carpeta `Pharmacy Doctors v5`). `.vercel/` y `.env.local` están en `.gitignore`.
- **Antes había 0 variables de entorno.**
- **Configurado por Claude**, ambas como *Secret* (ocultas), solo en **Preview** y solo para la rama `v5-premium`:
  - `PAY_LINK_SECRET`: aleatoria de 48 caracteres; nadie necesita conocerla.
  - `CONCIERGE_KEY`: aleatoria; guardada en `C:\Users\ZenBook\Documents\PharmacyDoctors-PREVIEW-concierge-key.txt`. Producción tendrá otra.
- **Protección en el servidor:** una clave `sk_live_` se **rechaza** fuera de Production (Preview no puede cobrar dinero real).
- **Faltan, y solo tú puedes ponerlos:** `STRIPE_SECRET_KEY` (`sk_test_…`) y `STRIPE_WEBHOOK_SECRET` (`whsec_…`), con los comandos de abajo. El valor se escribe en tu terminal y no pasa por el chat.

### Comandos exactos (PowerShell)
```
cd "C:\Users\ZenBook\Proyectos Software Sergio\Pharmacy Doctors v5"
vercel env add STRIPE_SECRET_KEY --environment preview --git-branch v5-premium --sensitive
vercel env add STRIPE_WEBHOOK_SECRET --environment preview --git-branch v5-premium --sensitive
```
Cada comando pide el valor: pégalo y pulsa Enter.

### Actualización (2026-11-26)
- `STRIPE_SECRET_KEY` agregada por el dueño como *Secret*, **solo Preview** (todas las ramas de preview).
- Production quedó **sin variables**. Se eliminaron una variable creada por error (con la clave de prueba como nombre) y una `STRIPE_SECRET_KEY` con clave **live** que se había guardado en Production. **Recomendación:** rotar ambas claves en Stripe (Roll key).
- Pendiente: `STRIPE_WEBHOOK_SECRET` (requiere Protection Bypass for Automation en Vercel y el endpoint en Stripe).

## 14. Prueba real con Stripe en modo test (vista previa, 2026-11-26) ✅
- El concierge creó el enlace firmado de **PD-261126-TEST1** (IV Therapy a domicilio, $159 USD) en la vista previa de `v5-premium`.
- `/pay/` mostró "Pay $159 USD" activo, así que el servidor aceptó la clave `sk_test_`.
- Se abrió un Stripe Checkout **real en modo test** (`cs_test_…`) con la línea genérica "PharmacyDoctors service · Booking PD-261126-TEST1". No se envió a Stripe ningún dato médico.
- El dueño pagó con la tarjeta de prueba 4242. No hubo cobro real.
- `/pay/success/` verificó el pago con Stripe y mostró "Payment received — thank you · Booking PD-261126-TEST1 · $159 USD".
- Al volver a abrir el enlace aparece "This booking is already paid". El doble cobro queda bloqueado.
- **Por qué no llegó ningún correo:**
  1. El aviso al equipo ("PAID · Booking …") lo envía el **webhook**, y todavía falta `STRIPE_WEBHOOK_SECRET` (§4).
  2. En modo test, Stripe **no envía recibos automáticos** al cliente. Se pueden ver en Dashboard → Payments (modo test) → el pago → "Send receipt".
- **Pendiente de probar:** webhook, correo de pago y reembolso de prueba.

## 15. Webhook configurado y probado (vista previa, 2026-11-26) ✅ con una limitación
- **Vercel:** el dueño creó "Protection Bypass for Automation" (secreto de 32 caracteres, guardado en `Documents\PharmacyDoctors-PREVIEW-bypass-secret.txt`). La protección de la vista previa sigue activa para todo lo demás.
- **Stripe (modo prueba):** destino `pharmacydoctors-preview-test` (`we_1Ug76t5W1RAXluyqAMKJksxp`), carga "Resumen" (snapshot), API 2026-08-26.dahlia. Escucha 5 eventos: `checkout.session.completed`, `async_payment_succeeded`, `async_payment_failed`, `expired` y `charge.refunded`.
  - URL: `…/api/stripe-webhook/?x-vercel-protection-bypass=…`. **Debe terminar en `/`**: el sitio usa `trailingSlash: true`, la versión sin barra responde 308 y Stripe no sigue redirecciones.
- **Vercel:** `STRIPE_WEBHOOK_SECRET` agregada por el dueño como *Secret*, **solo Preview**. Production sigue **sin variables**.
- **Comprobado:**
  - una firma falsa da `400 bad_signature`;
  - el evento real de PD-261126-TEST1, reenviado, da `200 {"status":"PAID"}`.
- **Limitación:** el correo al equipo **no sale desde el servidor**. Web3Forms (plan gratuito) responde **403 con un reto de Cloudflare** ("Just a moment…") a las peticiones desde Vercel; está registrado con `console.error` en los logs. Las reservas no se ven afectadas, porque se envían desde el navegador del cliente. El pago sí queda registrado en Stripe y la página de éxito lo verifica.
  - **Opciones (decide el dueño):**
    1. Activar en Stripe → Configuración → Notificaciones el aviso por correo de "pagos correctos". No requiere código.
    2. Un proveedor de correo transaccional con API para servidor (p. ej. Resend, con capa gratuita; requiere cuenta, clave y, para usar el dominio propio, registros DNS).
    3. Web3Forms Pro, si permite envíos desde servidor (confirmar con ellos).
