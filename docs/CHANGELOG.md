# Changelog
V4 está en producción desde el 2026-11-25 (`61c7133`). V5 está en la rama `v5-premium`, pendiente de aprobación.

## 2026-11-26 — V5.3 (rama `v5-premium`, no publicada)
- Fuente única `assets/pd-data.json` (precios, tratamientos, duraciones, horarios, políticas); el servidor la usa; `tests/consistency.test.js` (16 pruebas) impide contradicciones.
- Catálogo interactivo de IV (modalidad, buscador, filtros, personas, precio y total en vivo, Book now preseleccionado), carrusel en la home, selector en las 8 páginas de tratamiento con tratamientos relacionados, calculadora de grupos (3 páginas) y selector de doctor (4 páginas).
- Reserva: conserva lugar (hotel, villa o yate), cantidad y modalidad; laboratorio como cotización; rayos X ya no forzado a clínica.
- Enlaces firmados con monto cotizado (rayos X, laboratorio, estética, enfermería); 47 pruebas de pagos.
- Consistencia: 81 correcciones (sin pago en visita para servicios médicos, sin anticipo ni código muerto de 0, sin promesas de llegada o respuesta, sin 24 h físico, una duración de suero, plazo de reembolso).
- Tarjetas compactas en móvil; páginas de pago y concierge sin barra flotante ni bot.

## 2026-11-25 — V5.1 (rama `v5-premium`, no publicada)
- **Pagos**: enlaces firmados (HMAC) con vencimiento, solo del personal (`/api/paylink`, `/concierge/`); resumen y monto desde el servidor; bloqueo de doble cobro (409) e idempotencia; webhook con estados pagado, pendiente, fallido, expirado y reembolsado, y verificación de importe y moneda; evento GA `purchase` solo con pago verificado; 42 pruebas unitarias; servidor local con Stripe simulado.
- **Radiología**: "Mobile X-ray" con Clínica San José, DICOM con reporte, horarios y límites técnicos. **Sin ultrasonido** en ninguna parte.
- **Páginas**: laboratorio (bajo solicitud) y concierge (noindex); recorridos por tipo de cliente en la home; hero invertido en 4 páginas.
- **Calidad**: contenido nunca oculto por animación; mínimo de 12 px; rejilla de 2 columnas en móvil; globo de Sofía solo en escritorio; bot sin recomendar tratamientos por síntomas; 6 precios de "mercado" del blog corregidos; títulos más cortos.
- **Integración**: merge de `hotfix-hero-tablet` (arreglo 760–900 px). Foto original del Dr. Kevin restaurada (la editada quedó como opción en `docs/`).
- **SEO y privacidad**: `robots.txt` y `X-Robots-Tag` para `/pay`, `/concierge` y `/api`; laboratorio en el sitemap.
- **Docs**: `CLAUDE.md`, `PAYMENTS_SETUP.md` (guía completa), `PENDING_APPROVALS.md` (P0/P1/P2), auditoría final, `PROGRESS.md`.

## 2026-11-25 — V5 (rama `v5-premium`, no publicada)
- **Identidad premium**: escenario azul marino en todos los heroes, Cormorant Garamond y Public Sans, motivo de arco, secciones numeradas, menú de tratamientos con líneas de puntos, tarjetas planas. Nuevo `assets/v5.css` cargado en 80 páginas.
- **Navegación**: NAD+, video y equipo médico en Doctores, radiología móvil y villas, hoteles y grupos en Más servicios.
- **Páginas nuevas**: `/nad-plus-iv-therapy-cabo/`, `/medical-team/`, `/villas-hotels-groups-cabo/`, `/pay/`, `/pay/success/`.
- **Rediseñadas**: home EN/ES, catálogo de sueros EN/ES, 7 sueros, doctor a domicilio EN/ES, video, walk-in y seguros (de artículo a página de servicio), radiología móvil, estética (con la aclaración de la Dra. Rosibel), reserva EN/ES y política de cancelación.
- **Cobro del 100 %**: `api/checkout.js` (Stripe Checkout, monto en el servidor), `api/stripe-webhook.js` (aviso "PAID" por correo) y `assets/pay.js`. La reserva genera el enlace y el mensaje para el cliente en el correo.
- **Correcciones**: "prescribe" condicionado, promesa de "1–2 hours", política inventada "not charged" y migas de pan duplicadas.
- **Pruebas**: `tests/payments.test.js` (30/30). JSON-LD 0 errores. Enlaces 0 rotos.

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
