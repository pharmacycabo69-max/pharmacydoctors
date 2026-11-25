# Cobro del 100 % — cómo activarlo (V5)
Fecha: 2026-11-25 · Rama `v5-premium` · **Nada de esto cobra hasta que el dueño configure las claves.**

## Cómo funciona
1. **El cliente reserva** en `/book/` o `/es/reservar/`. No se cobra nada.
2. **Llega el correo de la reserva** (Web3Forms) con dos campos nuevos:
   - **"Pay link (send AFTER confirming)"**, por ejemplo `https://www.pharmacydoctors.com/pay/?b=PD-261125-ABCD&i=iv:2,doc:1&w=door`;
   - **"Message for the guest after confirming"**: un mensaje listo para pegar en WhatsApp ("Your booking … is confirmed for … You can pay securely here: …").
3. **El equipo confirma la disponibilidad** y envía ese mensaje. Es el único paso manual.
4. **El cliente abre `/pay/`**:
   - ve el desglose y el total (USD, IVA incluido);
   - acepta la política de cancelación;
   - pulsa **"Pay $X"**, y `/api/checkout` crea una sesión de **Stripe Checkout** por el **100 %**.
5. **Stripe cobra**: envía el recibo al cliente (si se activan los recibos) y redirige a `/pay/success/`, que **verifica con Stripe** que el pago está hecho.
6. **El webhook `/api/stripe-webhook` avisa al equipo por correo**: "PAID · Booking PD-… · $X USD".

### Seguridad
- **El monto lo calcula el servidor** con su propia tabla de precios. Aunque alguien edite el enlace, no puede pagar menos: solo cambia el servicio, y la reserva no coincidiría.
- **Stripe no recibe datos de salud**: la línea del cobro dice "PharmacyDoctors service · Booking PD-…".
- **El webhook verifica la firma de Stripe** (HMAC) y rechaza firmas falsas o antiguas.
- **Solo se cobra lo que tiene precio autorizado**:

  | Servicio | Precio |
  |---|---|
  | Suero | $159 a domicilio · $129 en clínica · $119 grupo 6+ |
  | NAD+ | $279 |
  | Doctor | $189 a domicilio · $99 en clínica |
  | Video | $59 |

- **Estética, imagen, farmacia y enfermería** siguen por cotización, sin cobro en línea.

## Lo que debe hacer el dueño (5 pasos, unos 20 minutos)
1. **Stripe → Developers → API keys**: copiar la **Secret key**.
   - Usa primero la de **modo prueba (`sk_test_…`)**.
   - En Vercel: *Settings → Environment Variables*, variable `STRIPE_SECRET_KEY`, entornos Preview y Production.
2. **Stripe → Developers → Webhooks → Add endpoint**:
   - URL: `https://www.pharmacydoctors.com/api/stripe-webhook`.
   - Eventos: `checkout.session.completed` y `checkout.session.async_payment_succeeded`.
   - Copiar el **Signing secret (`whsec_…`)** a Vercel como `STRIPE_WEBHOOK_SECRET`.
3. **Stripe → Settings → Customer emails**: activar "Successful payments", el recibo automático al cliente.
4. **Prueba en modo test**:
   - abrir un enlace `/pay/?b=PD-261125-TEST&i=iv:1&w=door` en la vista previa;
   - pagar con la tarjeta de prueba de Stripe `4242 4242 4242 4242`;
   - comprobar que la página de éxito dice "Payment received" y que llega el correo "PAID".
5. **Pasar a producción**:
   - cambiar a la clave `sk_live_…` y crear el webhook también en modo live;
   - **desactivar el enlace de anticipo de $50** (`buy.stripe.com/3cI6oAgNm2uycs1eml1sQ0k`).

Mientras no haya clave, `/pay/` muestra: "Online card payment is being activated. You can pay at the visit… or message us". **Nada se rompe.**

## Condición del procesador
Stripe permite cobrar consultas y servicios médicos de un negocio con licencia. **No** permite vender medicamentos con receta en línea sin autorización: por eso farmacia y medicamentos **no** pasan por este cobro. Si Stripe pide información sobre la actividad (verificación de la cuenta "Cabo Walk in clinic"), el dueño debe responder con los datos reales del negocio.

## Pruebas
- `node tests/payments.test.js`: **30 pruebas**, sin red y con claves falsas. Cubren:
  - precios y la regla de grupo;
  - la exclusión de NAD+ del grupo;
  - el rechazo de enlaces manipulados;
  - el 503 cuando no hay clave;
  - que el monto se calcula en el servidor y que el nombre del cargo es genérico;
  - la verificación del pago;
  - las firmas del webhook (válida, falsa y antigua);
  - que el correo de pago no lleva datos del paciente.
