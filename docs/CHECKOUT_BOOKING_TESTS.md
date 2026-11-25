# Pruebas de reserva y cobro — V4
Fecha: 2026-11-25 · Entorno: servidor local `http://localhost:8080` (rama `v4-premium`), Chromium del panel de Claude, 390×844 y 1440×900.
Reglas: **no se envió ninguna reserva real** (enviarla manda un correo real al negocio) y **no se hizo ningún cobro**. Los datos de prueba son ficticios (`QA Test`, `+1 555 010 0000`, `qa@example.com`).

## 1. Enlaces profundos (preselección de servicio y precio)
| # | URL | Resultado esperado | Resultado | OK |
|---|---|---|---|---|
| 1 | `/book/?drip=hangover-rescue` | Hangover Rescue ×1, $159, a domicilio | "Hangover Rescue IV × 1 · $159 · Estimated total $159" | ✅ |
| 2 | `/book/?service=doctor` | Doctor a domicilio $189 | "Doctor visit at your location $189" | ✅ |
| 3 | `/book/?service=doctor&where=clinic` | Doctor en clínica $99 | "At our downtown clinic · $99" | ✅ |
| 4 | `/book/?service=video` | Video $59 | "Video consultation $59" | ✅ |
| 5 | `/book/?group=1` | 6 sueros a $119 c/u | "× 6 group rate · $714 · Group rate applied: $119 per person" | ✅ |
| 6 | `/book/?service=aesthetic&treatment=botox` | Clínica, valoración primero | "Aesthetic evaluation: Facial Botox · evaluation first · listed price $550" | ✅ |
| 7 | `/book/?service=imaging` | Cotización, sin precio | "Imaging quote request · quoted on confirmation" | ✅ |
| 8 | `/book/?drip=nad-plus&where=clinic` | NAD+ $279 (sin descuento de clínica ni de grupo) | "NAD+ IV × 1 · $279" | ✅ |
| 9 | `/book/?service=pharmacy` | Precio al confirmar, envío gratis desde $50 | "items priced on confirmation · free delivery over $50" | ✅ |
| 10 | `/es/reservar/?drip=myers-cocktail` | Español, $159, IVA incl. | "Myers Cocktail IV × 1 IVA incl. $159 … No se cobra nada ahora" | ✅ |

## 2. Flujo completo (doctor en clínica)
| Paso | Prueba | Resultado | OK |
|---|---|---|---|
| 1 Elegir | El botón "Choose date & time →" avanza | Avanza al paso 2 | ✅ |
| 2 Fecha y hora | Avanzar sin fecha | "Pick a date and a time." (bloquea) | ✅ |
| 2 | Texto superior | "You can request care 24/7 … We confirm the arrival time when we confirm your booking." (ya no dice "30–45 minutes") | ✅ (corregido en esta QA) |
| 2 | Horarios de clínica | 9:00 AM – 4:30 PM (16 opciones) + nota "Clinic hours: 9 AM–5 PM…" | ✅ (corregido en esta QA: antes ofrecía 24 h) |
| 2 | Horarios a domicilio | 24 h, empezando a las 7:00 AM | ✅ (solicitud 24/7) |
| 3 Datos | Avanzar con los campos vacíos | "Please fill in the required fields (*) with a valid email and phone." | ✅ |
| 3 | Campos | Nombre*, teléfono*, correo*, notas | ✅ |
| 4 Revisar | Resumen | Folio PD-…, lugar, fecha/hora, servicio $99, total, datos | ✅ |
| 4 | Texto de pago | "Nothing is charged now… you pay the full confirmed price — by secure card link or at the visit… No deposit." | ✅ |
| 4 | Seguridad | "In a life-threatening emergency call 911." | ✅ |
| 4 | Enviar | **No se presionó** (enviaría un correo real) | ⏸ pendiente: prueba del dueño |

## 3. Resumen móvil
- En ≤980 px el resumen ("Your booking") aparece **después** de las opciones; antes aparecía arriba y empujaba el contenido. ✅

## 4. Pago
- `DEPOSIT_URL = ''`: no aparece ningún botón de anticipo. ✅
- La pantalla final dice "What happens next" en 3 pasos: confirmamos, enlace seguro por el total o pago en la visita, llega el equipo. (Revisado en el código; no se mostró en pantalla porque requiere enviar.)
- Enlaces de pago por el total: **no existen todavía** (ver `PENDING_APPROVALS.md`).

## 5. Privacidad y analítica
- `booking_request` y `generate_lead` solo envían el total y el número de sueros. Sin nombre, síntomas ni notas. ✅
- `wa-forms.js` enviaba a GA4 los primeros 100 caracteres de la URL de WhatsApp, que incluían lo que escribe el visitante. **Corregido**: ahora envía solo `https://wa.me/<número>`. ✅

## 6. Prueba que debe hacer el dueño en la vista previa
1. Hacer una reserva real con sus propios datos en la vista previa.
2. Confirmar que llega el correo (Web3Forms; FormSubmit como respaldo).
3. Responder por WhatsApp como lo haría con un cliente.
