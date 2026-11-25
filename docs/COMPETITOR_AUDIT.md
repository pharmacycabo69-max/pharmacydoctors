# PharmacyDoctors — Competitor audit & page-one strategy
Fecha: 2026-11-24 · Documento maestro: Prompt Maestro V3.1 · Rama: `master-v31`

Matriz completa (23 referencias nominales + 2 adicionales): `docs/COMPETITOR_MATRIX.csv`.
Método: revisión directa de la portada de cada sitio (title, meta, H1/H2, precios visibles, schema, CTA) y búsquedas web para los que no tienen URL. No se midió tráfico, volumen ni rankings (sin herramientas autorizadas); no se interactuó con formularios ni pagos de terceros.

## Hallazgos clave
1. **Casi nadie publica precios.** Solo Cabo Bay Medical e IV Therapy Cabo muestran precios. PharmacyDoctors publica todos con impuestos incluidos ($189 domicilio, $99 clínica, $59 video, sueros $159 / $129 clínica, NAD+ $279, grupos 6+ $119). Es la ventaja más clara: mantenerla visible en títulos, tablas y schema `Offer`.
2. **Seguros:** Sea of Cortes ("We accept International Insurance") y GetWell ("pago directo con tu seguro") lo usan como gancho. Ya publicamos la política confirmada (EE. UU./Canadá, sujeta a verificación) con página propia `/travel-insurance-doctor-cabo/`, sin prometer pago directo.
3. **Cabo Bay Medical** NO es del dueño (confirmado 2026-11-24) y usa casi literal el texto de una versión anterior de cabowalkinclinic.com. Competidor directo; el dueño puede valorar un aviso de retiro por contenido copiado.
4. **Mercado de "walk-in/doctor"** lo dominan hospitales (Hospiten) y apps con cientos de páginas de síntomas (Doctorsa). Nuestra respuesta: páginas de urgent care, walk-in, video y el blog diario de síntomas (ya corriendo).
5. **Farmacia delivery:** competidores con horarios limitados (WeCare: 2–3 h, corte 14:00) o envío gratis desde $99 (Clearwell). Nosotros: 24/7 y gratis desde $50 + receta médica en el mismo flujo.
6. **Debilidades técnicas frecuentes** en la competencia: H1 vacíos o duplicados, sitios de 2–4 mil caracteres, schema pobre. PharmacyDoctors ya tiene schema válido en todas las páginas (verificado 2026-11-24).

## "Varios activos en primera fila" — estrategia de portafolio (sin páginas puerta)
Objetivo: que para una misma búsqueda aparezcan varios activos del dueño en la primera página, cada uno con valor propio.
| Búsqueda | Activo principal | Activo secundario | Otros activos |
|---|---|---|---|
| house call doctor Cabo / hotel doctor | pharmacydoctors.com `/home-doctor-cabo-san-lucas/` | cabowalkinclinic.com (clínica) | Perfil Google Business (pendiente) |
| walk-in clinic Cabo | cabowalkinclinic.com | pharmacydoctors.com `/walk-in-clinic-cabo-san-lucas/` | GBP de la clínica |
| IV therapy Cabo | pharmacydoctors.com `/iv-therapy-cabo/` | cabowalkinclinic `/iv-therapy/` | blog posts IV |
| pharmacy Cabo San Lucas / near me | rmcpharmacy.com (5 sucursales + GBP) | pharmacydoctors `/pharmacy-delivery-cabo-san-lucas/` | cabopharmacy / pharmacycabo |
| pharmacy delivery Los Cabos | pharmacydoctors / CMC Pharmacy | cvupharmacy | — |
| online doctor / telemedicine Cabo | pharmacydoctors `/video-doctor-consultation-cabo/` | cabowalkinclinic video | — |
| travel insurance doctor Cabo | pharmacydoctors `/travel-insurance-doctor-cabo/` | cabowalkinclinic insurance page | — |
| lip fillers / botox Cabo | cabowalkinclinic (perfil completo Rosibel) | pharmacydoctors `/aesthetic-medicine-cabo/` | futura web de estética (no crear sin aprobación) |

Reglas: un URL principal por intención y dominio; no copiar textos entre marcas; enlaces entre marcas solo donde ayuden al usuario (p. ej. "Clínica: Cabo Walk-In Clinic"), sin redes de enlaces artificiales. Lo que más pesa para ocupar varias posiciones en búsquedas locales es **Google Business Profile** por ubicación real (clínica + 5 farmacias RMC) con reseñas — pendiente del dueño.

## Acciones priorizadas (impacto/esfuerzo)
- P0 · Dueño: confirmar si cabobaymedical.com es suyo (contenido idéntico a la versión anterior de Cabo Walk-In Clinic).
- P0 · Dueño: crear/verificar Google Business Profile de la clínica (y RMC). Sin esto no hay "Map Pack".
- P1 · Hecho en esta rama: precios con IVA incluido, seguro sujeto a verificación, video $59, estética, sin COFEPRIS, equipo corregido.
- P1 · Siguiente: versión en español de las nuevas páginas (seguro, video, estética, urgent care, walk-in).
- P1 · Siguiente: ubicaciones ("Our Locations") cuando RMC exporte LOCATIONS_MASTER.
- P2 · Fotos autorizadas (Rosibel, equipo), catálogo de laboratorio Santa Fe e imagenología cuando lleguen precios.
