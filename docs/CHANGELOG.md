# Changelog — rama `v4-premium`
Ninguno de estos cambios está en producción.

## 2026-11-25 — V4
### P0 · Cumplimiento y honestidad
- **Sin anticipo**: se eliminó el anticipo de $50. "Nada se cobra ahora; confirmamos disponibilidad y pagas el precio total con enlace seguro o en la visita". Afecta la reserva (`booking.js`), las FAQ, `/prices/`, `/refund-policy/` y las páginas de sueros.
- **Disponibilidad**: "Request care 24/7" sustituye a "Team available now". Se eliminaron unas 115 promesas de llegada en "30–45 / 30–60 / 40–70 min" (páginas, schema, bot Sofía y wizard). "Call 24/7" pasó a "Call +52 624 226 1023".
- **Horario de la clínica**: 9 AM–5 PM, fuera de horario con cita (pie de página en 74 páginas, contacto, schema, bot). En la reserva, la clínica solo ofrece horarios de 9:00 a 16:30.
- **Claims**: sin "board-certified" ni "médicos certificados", sin COFEPRIS, sin dosis, sin nombres de medicamentos con receta (Zofran, Toradol), sin "detox", "boost" ni inmunidad, sin frases de eficacia de medicamentos ("settles the stomach fast", "safer than NSAIDs"). FAQ de los 7 sueros reescritas (6 preguntas seguras, visibles y en schema).
- **Imagenología**: Luis y Jenifer aparecen como colaboradores externos de imagen, sin "Dr." ni "radiólogo".
- **Privacidad**: el formulario de WhatsApp ya no envía a GA4 el texto que escribe el visitante.
- **Fotos**: se quitaron las fotos de ambulancia y se reemplazaron por fotos reales de sesiones.

### P1 · Marca y diseño
- Sistema de marca: marfil `#F7F5EF`, azul marino `#152E43`, salvia `#77948A`; títulos en Newsreader (serif editorial), texto en Public Sans. Sin sombras ni degradados genéricos; tarjetas de 18 px; botones planos.
- Navegación simplificada: IV Therapy / Doctors / Video $59 / More care / Insurance (EN y ES), con el botón "Book care" y WhatsApp como secundario. Barra fija en móvil: "Book care" + WhatsApp.
- Home: nuevo hero "English-speaking medical care at your hotel or villa in Los Cabos" y 4 tarjetas de servicio con precio (doctor $189, IV $159, video $59, clínica $99).
- Hero de 30 páginas de servicio: el botón principal es "Book care" (con el servicio ya elegido); WhatsApp queda como secundario y el teléfono pasa al encabezado y al pie.
- Comparador de sueros con filtros por objetivo (hidratación, fiesta, bienestar, viaje, deporte, piel) y el bloque "An IV is not right for everyone".
- Reserva: resumen después de las opciones en móvil y "What happens next" al final.

### QA (iteraciones con capturas)
- Pie de página: la lista de Servicios estaba rota en 68 páginas (todos los enlaces en un solo `<li>`).
- Doctor a domicilio: texto residual "licensed. USD pricing.", frase duplicada, sección vacía "Where the doctor comes".
- Páginas de entrega: secciones vacías "How delivery works".
- Radiología y estética: colores de botones invertidos (reservar = azul marino, WhatsApp = verde).
- ES: "All prices" traducido; "Doctores certificados" cambiado a "con cédula profesional".

### Validación
- JSON-LD: 78 bloques, 0 errores. Enlaces internos: 0 rotos. `booking.js`, `sofia-brain.js` y `wa-forms.js` sin errores de sintaxis.

## 2026-11-24 — rama `radiology-aesthetics-booking` (incluida)
- Página de radiología e imagen (cotización, sin precios), estética con 4 tratamientos, y reserva de estética e imagen.
