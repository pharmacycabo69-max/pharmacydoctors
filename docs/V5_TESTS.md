# Pruebas V5 — reservas, pagos y QA visual
Fecha: 2026-11-25 · Servidor local `localhost:8080` (rama `v5-premium`), Chromium del panel de Claude, 1440×900 y 390×844.
Reglas: **ningún cobro real**, **ninguna reserva real enviada** (el envío a Web3Forms se interceptó en el navegador) y datos ficticios.

## 1. Pagos — pruebas unitarias (`node tests/payments.test.js`)
**30/30 aprobadas.** No usan red y emplean claves falsas.

| Grupo | Qué se probó |
|---|---|
| Precios | $159 a domicilio · $129 en clínica · 6+ a $119 · el grupo no aplica en la clínica (igual que la reserva) · NAD+ fuera del grupo · NAD+ $279 · doctor $189/$99 · video $59 · carrito mixto |
| Validación | Cantidad 0 o mayor de 30, servicios solo con cotización (p. ej. bótox), texto basura, ubicación inválida y código de reserva falso: todo rechazado |
| Sin clave Stripe | Responde 503 `not_configured` y **no llama a Stripe** |
| Con clave (simulada) | Llama a Checkout Sessions; **monto calculado en el servidor** (6 × $119 = $714, se ignora el monto enviado por el navegador); código de reserva adjunto; nombre del cargo genérico sin datos de salud; URL de éxito en el mismo dominio (funciona en la vista previa) |
| Verificación | `GET /api/checkout?session_id=` devuelve pagado, monto y reserva |
| Webhook | Firma válida aceptada; firma falsa y firma con más de 5 minutos rechazadas; el evento pagado manda el correo "PAID · Booking … · $189.00 USD" **sin nombre ni notas del paciente**; webhook sin firma → 400 |

## 2. Reserva de principio a fin (navegador, envío interceptado)
| Paso | Resultado |
|---|---|
| `/book/?group=1` | 6 × Hangover Rescue, tarifa de grupo $714 |
| Fecha y hora, datos (incluidos zona y dirección, que son obligatorios a domicilio) | Validaciones correctas |
| Envío (interceptado) | Destino `api.web3forms.com` · Booking `PD-261125-YLND` · "Payment: 100% after confirmation…" |
| Enlace generado | `https://www.pharmacydoctors.com/pay/?b=PD-261125-YLND&i=iv:6&w=door` ✅ |
| Mensaje para el cliente | "Your booking PD-261125-YLND is confirmed for Sat, Nov 28 9:00 AM. You can pay securely here: …" ✅ |
| Pantalla final | "Request received!" + "What happens next" ✅ |

## 3. Página de pago `/pay/`
| Prueba | Resultado |
|---|---|
| `i=iv:6&w=door` | "IV therapy (group rate) × 6 · $714" · total $714 ✅ |
| `i=iv:2,doc:1&w=door` (móvil) | $318 + $189 = $507 ✅ |
| Botón de pago antes de aceptar la política | Deshabilitado ✅ |
| Enlace manipulado (`b=hack&i=iv:99`) | "This payment link is not complete" + WhatsApp ✅ |
| Llamada real a `/api/checkout` en la vista previa de Vercel | ⏸ **Pendiente del dueño**: la vista previa pide iniciar sesión en Vercel. Sin clave de Stripe debe mostrar "Online card payment is being activated…" |

## 4. QA visual (capturas en `docs/design-v5/`)
- Escritorio y móvil: home, catálogo, menú de sueros, suero individual, NAD+, video, equipo, radiología, estética, reserva y pago.
- Sin scroll horizontal a 390 px (medido: `scrollWidth = 390` en home, suero y equipo).
- **Errores encontrados y corregidos:**
  1. El hero de la home quedaba comprimido por la rejilla antigua.
  2. Migas de pan duplicadas en 12 páginas.
  3. Títulos de opciones en serif demasiado delgada.
  4. Arco vacío sin tarjeta en radiología y seguros.
  5. Arco de ícono con poco contraste.
  6. Etiquetas de la reserva demasiado altas en móvil.
  7. Menú duplicado en walk-in por un regex de FAQ.
  8. Los `%` del enlace de WhatsApp rompían `sprintf` en los cierres.
  9. Una variable de anticipo con el mismo nombre que la nueva función de pago.

## 5. Validación técnica
JSON-LD: 83 bloques, 0 errores · Enlaces internos: 0 rotos · `booking.js`, `pay.js`, `checkout.js` y `stripe-webhook.js` sin errores de sintaxis · Escaneo de claims (COFEPRIS, board-certified, Rx, dosis, detox, tiempos de llegada, convenios con hoteles): limpio.
