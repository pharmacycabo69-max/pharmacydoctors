# Pendientes y aprobaciones — V5.1
Actualizado: 2026-11-25. **Producción = V4** (`main` en `61c7133`). V5.1 está en la rama `v5-premium`; el arreglo de tablet, en `hotfix-hero-tablet`. Nada está publicado.

## P0 — bloqueos para publicar de forma segura
| # | Pendiente | Quién | Qué hacer exactamente |
|---|---|---|---|
| P0-1 | Autorizar la publicación | Dueño | Revisar la vista previa de `v5-premium` y escribir en el chat "publica V5". |
| P0-2 | **Registro persistente de solicitudes** | Dueño decide | Hoy cada solicitud de reserva solo queda en el **correo** (Web3Forms gratuito no guarda historial). Los **pagos** sí quedan en Stripe. Opciones: (a) el CRM o agenda que ya usen (dime cuál y si tiene API); (b) Google Sheets del negocio; (c) Vercel KV/Postgres. No creé ninguna infraestructura nueva sin tu autorización. |
| P0-3 | Variables de pago (modo prueba) | Dueño | En Vercel, **solo Preview**: `STRIPE_SECRET_KEY=sk_test_…`, `PAY_LINK_SECRET`, `CONCIERGE_KEY`, `STRIPE_WEBHOOK_SECRET`. Luego la prueba con la tarjeta 4242 (`PAYMENTS_SETUP.md` §2–4). Sin esto el cobro en línea queda apagado (no se rompe nada: "pay at the visit"). |
| P0-4 | Prueba real del cobro | Dueño + Claude | Después de P0-3 hago la prueba en modo test sobre la vista previa: reserva, enlace, pago, webhook, recibo y reembolso. **La integración real con Stripe NO está probada todavía**: solo con pruebas unitarias y simulación local. |
| P0-5 | ~~Publicar el arreglo de tablet~~ | ✅ | **Publicado en producción el 2026-11-25** (merge df66c19), verificado en vivo a 880 px. |

## P1 — mejoras importantes (no bloquean)
| # | Pendiente | Detalle |
|---|---|---|
| P1-1 | **Fotos profesionales** | Ver la lista de tomas abajo. Hoy video, walk-in, seguros y laboratorio usan ilustración de línea. |
| P1-2 | Foto del Dr. Kevin con logo PharmacyDoctors | Guardada como opción en `docs/design-v5/options/`. No se usa públicamente. Confirmar autorización y que representa bien su relación con la marca. |
| P1-3 | Catálogo maestro de radiología (Cabo Walk-In Clinic) | Cuando llegue: lista de estudios y precios públicos autorizados. La página ya tiene el lugar para integrarlo. Mientras tanto, todo es por cotización. |
| P1-4 | Precios de estética | Fuente: tu instrucción del 2026-11-24 de usar los precios de medicinaesteticaencabo.com, más la confirmación de IVA incluido del 2026-11-25. Además de las 4 categorías, la página muestra **técnicas y precios de detalle** del mismo catálogo: ceja $180, sonrisa gingival $170, mandíbula $170, masetero $350, NCTF $300, PN $350, Radiesse $1,000, Sculptra $1,200. Confirmar que se ofrecen; si no, los paso a "en valoración". |
| P1-5 | Tarifas de grupo | $119 por suero con 6 o más en el mismo lugar y visita (tu respuesta del 2026-11-24) y $129 en clínica. Son el origen de los $714 de las pruebas (6 × $119). Reconfirmar que siguen vigentes. |
| P1-6 | Enlaces de pago por huésped | La técnica existe (el concierge puede crear un enlace por persona con su propio folio), pero **no se anuncia**. La página dice "un enlace por reserva confirmada". Activarlo cuando el equipo pueda gestionar disponibilidad, cancelación y atención por persona. |
| P1-7 | Texto de NAD+ | Aprobado el enfoque de "evidencia limitada". Falta que el equipo médico valide la duración y las contraindicaciones exactas. |
| P1-8 | Protocolos de sueros | Los ingredientes, dosis y contraindicaciones publicados deben coincidir con los protocolos validados por el Dr. Kevin. Hoy no se publican dosis; las listas de ingredientes vienen de V4. |
| P1-9 | Lighthouse y Core Web Vitals | No pude ejecutar Lighthouse sin descargar herramientas. Medición local: 296–415 KB y 12–17 solicitudes por página. Medir en la vista previa (PageSpeed Insights) y en Search Console (datos reales) después de publicar. |
| P1-10 | Search Console y GA4 | Sin acceso. Las oportunidades de palabras clave no están validadas con datos reales. |
| P1-11 | Canal seguro para pólizas | La página de seguros pide no enviar pólizas por formularios públicos. Falta definir el canal (correo cifrado o portal). |
| P1-12 | Respuesta automática al cliente al reservar | Web3Forms gratuito no la incluye. Con Web3Forms Pro, o con el CRM, se puede enviar automáticamente "recibimos tu solicitud". |

## P2 — optimizaciones futuras
- WebP para las fotos grandes (la mayor pesa ~150 KB).
- Versión en español de las páginas nuevas: NAD+, equipo médico, villas, radiología, laboratorio, video y seguros.
- Página de cada colaborador con sus credenciales verificadas.
- Reglas de deduplicación de correos del webhook (hoy un reintento de Stripe puede repetir un aviso; el pago no se duplica).
- Evento de "servicio completado" en GA4 desde el CRM (requiere Measurement Protocol).

## Lista de fotos profesionales (sesión de producción)
1. Dr. Kevin y Dra. Myriam con uniforme neutral o de PharmacyDoctors: retrato vertical 4:5 y plano medio.
2. Dra. Rosibel en consultorio, con autorización y logo de Cabo Walk-In Clinic, solo para estética.
3. Enfermera llegando a una villa: maletín, sin pacientes identificables.
4. Preparación del material estéril de un solo uso (manos y equipo), en vertical para los marcos de arco.
5. Sesión de suero en una terraza al atardecer, con modelo autorizado y consentimiento.
6. Fachada y recepción de la clínica del centro (Francisco I. Madero).
7. Consulta por video: doctor frente a laptop o teléfono.
8. Equipo portátil de rayos X en una habitación de hotel, con consentimiento del colaborador.
9. Detalle del tablero de NAD+: bolsa y bomba, sin marcas comerciales.
10. Grupo en una villa: cuatro a seis personas con sueros, todas con consentimiento escrito.

Formato: JPG o WebP de 2400 px como mínimo en el lado largo, retratos 4:5, con permisos de uso firmados.
