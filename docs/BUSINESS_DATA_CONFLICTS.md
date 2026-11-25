# Conflictos de datos del negocio — V4
Fecha: 2026-11-25 · Rama: `v4-premium` (no publicada)

Regla aplicada: cuando el documento V4 y una instrucción anterior del chat chocan, la rama sigue la opción **más prudente** (la que no promete algo no verificado) y el conflicto queda aquí para que el dueño decida. Cada caso indica cómo revertir.

| # | Tema | Fuente A | Fuente B | Qué hace la rama hoy | Decisión que se necesita |
|---|---|---|---|---|---|
| 1 | Anticipo / forma de cobro | Chat 2026-11-21: anticipo $50 con Stripe | V4: sin anticipo; cobrar 100 % tras confirmar | **Sin anticipo.** "Nada se cobra ahora; confirmamos y pagas el precio total con enlace seguro o en la visita". `DEPOSIT_URL = ''` en `assets/booking.js` | Crear enlaces de pago de Stripe por el precio total (189 / 99 / 59 / 159 / 279) y desactivar el enlace de $50 |
| 2 | Sueros en clínica $129 y grupos 6+ $119 | Chat 2026-11-24: "todos $159, clínica $129, grupos $119" | V4: lo no confirmado → cotización | Se mantienen $129 y $119 (el dueño los dio explícitamente) | Confirmar que $129 y $119 siguen vigentes |
| 3 | Precios de estética (labios $600, bótox $550, rejuvenecimiento desde $300, aclaramiento $1,500) | Chat 2026-11-24: "agarra los precios de medicinaesteticaencabo.com" | V4: estética sin precio confirmado → cotización | Se muestran los precios, siempre "después de una valoración" | ¿Precios publicados o "cotización"? ¿Incluyen IVA y valoración? |
| 4 | "Medical Director" (Dr. Kevin González Adame) | Chat 2026-11-20: "Sí, tenemos… es el doctor Kevin" | V4: no usar el rol sin aprobación | Se mantiene (hay aprobación previa) en ~48 páginas y en el schema | Reconfirmar por escrito. Para quitarlo: reemplazar "Medical Director" por "Physician" |
| 5 | Luis Antonio Camacho Villegas | Chat 2026-11-24: "Luis es radiólogo" | V4: colaborador externo de imagen, título pendiente | "Imaging collaborator" (sin "Dr." ni "radiólogo") | Enviar el título o la constancia de especialidad para poder decir "radiólogo" |
| 6 | 24/7 | Chat 2026-11-24: "Mantener 24/7" | V4: no garantizar disponibilidad física 24/7 | "Solicita atención 24/7" (WhatsApp y teléfono). La hora de llegada se confirma al reservar. Se quitó "Open 24 hours" de la clínica. Se mantienen títulos y H1 con "24/7" | ¿El 24/7 de títulos y H1 de doctor, farmacia y urgent care se mantiene? |
| 7 | Tiempo de llegada "30–45 min" | Textos anteriores del sitio | V4: no validado | Eliminado en todo el sitio, incluidos el bot Sofía y el wizard de reserva | Si hay un dato medido (p. ej. mediana real), se puede volver a publicar como "típico" |
| 8 | Horario de la clínica | V4: 9–17, fuera de horario con cita | Schema anterior: 00:00–23:59; Cabo Walk-In Clinic (competencia o marca hermana) anuncia 9 AM–10 PM | Schema 09:00–17:00 los 7 días; pie de página "Clinic 9 AM–5 PM · after hours by appointment"; la reserva en clínica solo ofrece 9:00–16:30 | Confirmar los días (¿lunes a domingo?) y la hora de cierre |
| 9 | Reembolso | Chat 2026-11-21: "reembolso si avisa 24 h" (era sobre el anticipo) | V4: sin anticipo | Política: si se pagó por adelantado y se cancela con 24 h o más → reembolso total; con menos → lo revisa el personal autorizado | Confirmar que la regla de 24 h aplica al pago total |
| 10 | Envío de reservas por correo | Otra sesión cambió a Web3Forms en main | FormSubmit (respaldo) en el código | La rama usa Web3Forms y FormSubmit como respaldo; no se envió ninguna reserva real en las pruebas | Confirmar que la clave de Web3Forms está activa en Vercel y que llega el correo |
| 11 | Envío gratis desde $50 | Chat 2026-11-24: "Sí, es real" | — | Se mantiene | — |
| 12 | Jenifer Arciga | V4: no es médica | — | "Imaging collaborator · Lic. en Radiología e Imagenología" | — |
| 13 | COFEPRIS | V4: no usar | — | Eliminado | — |

## Cómo revertir un punto
Cada cambio está en commits separados de `v4-premium` (ver `docs/CHANGELOG.md`). Para un ajuste puntual (p. ej. volver a "Medical Director" o a 24 h en el schema), basta con un reemplazo de texto en las páginas. El procedimiento completo está en `docs/ROLLBACK.md`.
