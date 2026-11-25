# Auditoría pública — pharmacydoctors.com
Fecha: 2026-11-25 · Documento rector: `PharmacyDoctors_V4.txt` · Rama de trabajo: `v4-premium` (no publicada)
Alcance: las 74 páginas HTML del repositorio, la reserva (`/book/`, `/es/reservar/`), el bot Sofía y el formulario de WhatsApp. Revisión en móvil (390 px) y escritorio (1440 px).

## 1. Resumen ejecutivo
El sitio tenía buen SEO técnico (schema válido, precios publicados, contenido local), pero **prometía cosas que el negocio no puede garantizar** y **se veía genérico**. Problemas principales:
1. anticipo de $50;
2. llegada en "30–45 min" en más de 100 lugares;
3. "Open 24 hours" junto a la dirección de la clínica;
4. "board-certified" y "COFEPRIS";
5. dosis y nombres de medicamentos con receta en páginas de sueros;
6. menú con demasiadas opciones;
7. el teléfono como botón principal, en lugar de reservar.

V4 corrige todo eso en la rama `v4-premium`. Quedan decisiones del dueño (`BUSINESS_DATA_CONFLICTS.md`) y tareas que solo él puede hacer: Stripe, Google Business Profile, fotos reales de la clínica.

## 2. Hallazgos por área (antes → después)
| Área | Antes | Después (rama) | Severidad |
|---|---|---|---|
| Cobro | Anticipo de $50 con Stripe; "no payment until we arrive" en unas páginas y anticipo en otras | Sin anticipo. Pago del total después de confirmar, con enlace seguro o en la visita. Política de reembolso alineada | P0 |
| Disponibilidad | "30–45 min", "Team available now", "Call 24/7", "Open 24 hours" | "Request care 24/7"; hora de llegada confirmada al reservar; clínica 9–17 con cita fuera de horario (texto, schema y reserva) | P0 |
| Claims médicos | board-certified, COFEPRIS, dosis, Zofran/Toradol, detox/boost/inmunidad, "safer than NSAIDs" | Eliminados. FAQ seguras con "Is this IV right for me?" y "cuándo llamar al 911" | P0 |
| Equipo | Luis como radiólogo sin constancia | Colaborador externo de imagen hasta recibir el título | P0 |
| Privacidad | El formulario de WhatsApp enviaba a GA4 el texto escrito por el visitante | Solo se envía el número de destino | P0 |
| Marca | Teal y dorado genéricos, sombras y pastillas: aspecto de plantilla | Marfil, azul marino y salvia; serif editorial (Newsreader) más Public Sans; tarjetas planas; fotos reales | P1 |
| Navegación | Muchas entradas y submenús largos | IV / Doctors / Video $59 / More care / Insurance + "Book care" | P1 |
| CTA | El teléfono era el botón principal en 30 páginas | "Book care" (con el servicio ya elegido) como principal; WhatsApp secundario; teléfono en el encabezado | P1 |
| Comparación de sueros | Lista de 7 tarjetas sin filtro | Filtros por objetivo y el bloque "not right for everyone" | P1 |
| Reserva móvil | El resumen aparecía antes de las opciones | Opciones primero, después el resumen; "What happens next" al final | P1 |
| Calidad de texto | Restos de ediciones anteriores ("licensed. USD pricing."), secciones vacías, lista del pie rota en 68 páginas | Corregido | P2 |
| Fotos | Fotos de ambulancia (transmiten emergencia y no son del negocio) | Fotos reales de sesiones de IV | P2 |

## 3. Referencia internacional (patrones aplicados)
Se revisaron sitios de salud reconocidos (One Medical, Cleveland Clinic) y un servicio de IV a domicilio de EE. UU. (The IV Doc), buscando patrones, no para copiar su diseño.
- **Aplicado:**
  - una sola acción principal por pantalla ("Book care");
  - paleta sobria con mucho espacio;
  - tipografía serif editorial para dar confianza;
  - médicos con nombre y cédula;
  - el precio visible antes de reservar;
  - el camino de emergencia (911) siempre visible.
- **Evitado (anti-patrones del sector IV):**
  - banners de promoción;
  - listas de beneficios que suenan a curas;
  - cuentas regresivas;
  - fotos de stock de "modelos con suero";
  - promesas de minutos.

## 4. Accesibilidad y rendimiento
- Contraste: texto azul marino sobre marfil y botones azul marino o verde WhatsApp `#1F8A55` con texto blanco.
- Botones con texto visible e íconos `aria-hidden`; filtros de sueros con `aria-pressed`; grupos con `aria-label`.
- Un solo H1 por página; jerarquía H2/H3 coherente; idioma `lang` correcto en EN y ES.
- Fuentes de Google con `display=swap`; sin librerías JS de terceros, aparte de GA4.
- Pendiente:
  - medir Core Web Vitals reales (PageSpeed o Search Console) después de publicar;
  - las fotos `.jpg` grandes de `/wp-content/uploads/real-iv/` podrían pasarse a WebP.

## 5. Capturas antes y después
`docs/design-before-after/` (ver el README de esa carpeta): home, reserva, IV, doctor, estética y radiología, en móvil y escritorio.

## 6. Pruebas
- Reserva: `CHECKOUT_BOOKING_TESTS.md`. 10 enlaces profundos correctos; flujo completo hasta "Review and send"; no se envió nada real.
- JSON-LD: 0 errores. Enlaces internos: 0 rotos. JS: sin errores de sintaxis.

## 7. Lo que falta (fuera del código)
Ver `PENDING_APPROVALS.md`:
- Stripe por el total;
- Google Business Profile;
- fotos reales de la clínica y de la Dra. Rosibel;
- confirmar las decisiones de datos;
- acceso a Search Console y GA4.
