# Línea base de SEO y Ads — V4
Fecha: 2026-11-25 · Rama `v4-premium`

## Lo que NO se pudo medir (sin acceso)
- **Search Console** (impresiones, clics, posiciones) y **GA4** (sesiones, conversiones): sin acceso. Sin estos datos no hay línea base de tráfico. Pedir acceso de lectura (ver `PENDING_APPROVALS.md`).
- **Google Ads / Meta Ads**: no se tocaron campañas, presupuestos ni conversiones (regla V4).
- No se usaron herramientas de pago (Ahrefs, Semrush). Los volúmenes de búsqueda no están medidos.

## Línea base técnica (medida en el código)
Detalle por página: `docs/SEO_PAGE_BASELINE.csv` (74 páginas: title, longitud, meta, H1, canonical, hreflang, tipos de schema, noindex, problemas).

| Métrica | Resultado |
|---|---|
| Páginas indexables | 73 (`/partners/` es noindex a propósito) |
| JSON-LD válido | 78 bloques, 0 errores |
| Enlaces internos rotos | 0 |
| H1 único por página | sí, en todas |
| Canonical | todas las indexables |
| Titles > 60 caracteres | 4 (`/book-before-you-arrive/`, `/es/`, `/es/doctor-a-domicilio-cabo/`, `/es/sueroterapia-a-domicilio-cabo/`): Google puede recortarlos |
| Meta description > 160 | 11 páginas: recorte visual en el snippet, no es un error |
| Titles o H1 duplicados | 0 |
| Schema de horario | 09:00–17:00 (antes 00:00–23:59) |

## Medición de conversiones (GA4 `GT-5NXQRS23`)
| Evento | Dónde | Datos enviados |
|---|---|---|
| `generate_lead` (online_booking) | envío de la reserva | total en USD |
| `booking_request` | envío de la reserva | total en USD, número de sueros |
| `generate_lead` (whatsapp_form) | formulario de WhatsApp | ninguno |
| `whatsapp_click` | formulario de WhatsApp | `https://wa.me/<número>`, ruta de la página. **Corregido en V4**: antes enviaba el texto escrito por el visitante |
| `partner_referral` | `?ref=` de concierges | código del socio |
| `data-track` en los CTA | hero_book, imaging_book_hero, etc. | nombre del botón |

**Regla V4 aplicada:** ningún evento envía nombre, teléfono, correo, síntomas, notas ni el servicio médico concreto. Si en el futuro se activan Google Ads o Meta, usar solo `generate_lead` con el valor; no subir audiencias con datos de salud.

**Pendiente:** el GA4 "enhanced measurement" registra los clics a enlaces salientes con la URL completa. Los enlaces de WhatsApp del sitio llevan mensajes predefinidos (sin datos del paciente), así que no hay fuga. Aun así, conviene revisar en GA4 que no se guarden URLs con `?text=` de formularios.

## Señales on-page después de V4
- Precios con IVA incluido en títulos y en tarjetas (doctor $189, clínica $99, video $59, suero $159, grupo $119).
- Un URL principal por intención (`KEYWORD_MAP.csv`).
- Navegación más corta: menos enlaces repetidos en el menú y la autoridad interna se concentra en las páginas principales.
- Sin promesas no verificables (tiempo de llegada, certificaciones, COFEPRIS). Esto reduce el riesgo de quejas y de rechazos de anuncios de salud en Google Ads.

## Qué medir en las 4 semanas después de publicar
1. Search Console: impresiones y CTR de `/iv-therapy-cabo/`, `/home-doctor-cabo-san-lucas/`, `/pharmacy-delivery-cabo-san-lucas/`, `/walk-in-clinic-cabo-san-lucas/`, `/video-doctor-consultation-cabo/`.
2. GA4: tasa `booking_request / sesiones` en `/book/` y clics en "Book care" frente a WhatsApp.
3. Correos de reserva recibidos frente a reservas confirmadas (manual).
