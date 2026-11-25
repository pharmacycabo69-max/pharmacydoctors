# Aprobaciones pendientes
Actualizado: 2026-11-25 (V5). La producción tiene V4. **V5 está solo en la rama `v5-premium`**.

## V5 — necesario para publicar
- [ ] **Revisar la vista previa** https://pharmacydoctors-git-v5-premium-cabo-pharmacy.vercel.app/ (requiere sesión de Vercel) y aprobar la fusión a `main`.
- [ ] **Probar `/pay/` en la vista previa**, por ejemplo `/pay/?b=PD-261125-TEST&i=iv:1&w=door`: sin clave debe mostrar "Online card payment is being activated".
- [ ] **Stripe**: `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en Vercel, recibos automáticos y prueba con tarjeta de prueba. Detalles en `PAYMENTS_SETUP.md`.
- [ ] **Desactivar el enlace de anticipo de $50** en Stripe.
- [ ] **Aprobar el texto de NAD+** (`/nad-plus-iv-therapy-cabo/`): sin indicaciones clínicas, dice que la evidencia es limitada y no promete resultados.
- [ ] **Aprobar el texto de radiología móvil**: "a domicilio cuando es técnicamente viable". Confirmar que los colaboradores tienen equipo portátil para algún estudio. Si no, cambio el enfoque a "coordinamos el estudio en un centro cercano".
- [ ] **Página de villas, hoteles y grupos**: confirmar que se puede enviar un enlace de pago por huésped.
- [ ] **Sesión de fotos profesional**: clínica, equipo, llegada a una villa y detalle de material. Mientras tanto se usan ilustraciones.
- [ ] **Precios de estética**: ¿incluyen IVA? La página muestra "USD" sin decir IVA.

## V4 (anteriores, siguen vigentes si no están marcadas)

## 1. Publicación (bloqueante)
- [ ] Revisar la vista previa de la rama `v4-premium` en Vercel: https://pharmacydoctors-git-v4-premium-cabo-pharmacy.vercel.app/ (requiere sesión de Vercel)
- [ ] Aprobar la fusión `v4-premium` → `main`. Incluye también la rama anterior `radiology-aesthetics-booking` (radiología, estética y reserva de estética/imagen).

## 2. Pagos (no se tocó nada en Stripe)
- [ ] Crear en Stripe (cuenta "Cabo Walk in clinic") enlaces de pago por el **precio total**: doctor a domicilio $189, clínica $99, video $59, suero $159, suero en clínica $129, NAD+ $279, grupo $119 por persona. Solo el dueño puede hacerlo.
- [ ] Desactivar el enlace del anticipo de $50 (`buy.stripe.com/3cI6oAgNm2uycs1eml1sQ0k`). Ya no se usa en la rama, pero sigue activo en Stripe.
- [ ] Confirmar la política de reembolso de 24 h aplicada al pago total (`/refund-policy/`).

## 3. Datos del negocio (ver `BUSINESS_DATA_CONFLICTS.md`)
- [ ] Rol "Medical Director" del Dr. Kevin: reconfirmar.
- [ ] Título de Luis Camacho Villegas (constancia de radiólogo).
- [ ] 24/7 en títulos y H1 (doctor, farmacia, urgent care).
- [ ] Horario de la clínica: días y hora exacta.
- [ ] Precios de estética: ¿publicados o cotización? ¿IVA incluido?
- [ ] Sueros en clínica $129 y grupos $119 vigentes.

## 4. Contenido y fotos
- [ ] Fotos reales de la clínica (fachada, consultorio, recepción). Hoy las páginas tipo artículo usan una foto genérica del Arco.
- [ ] Foto autorizada de la Dra. Rosibel.
- [ ] Descripción aprobada de NAD+ (sin indicaciones clínicas) para una página propia.

## 5. Cuentas externas (solo el dueño)
- [ ] Google Business Profile de la clínica (sin él no hay Map Pack).
- [ ] Acceso de lectura a Google Search Console y GA4, para medir la línea base real (`SEO_ADS_BASELINE.md`).
- [ ] Clave de Web3Forms en Vercel y prueba de una reserva real hecha por el dueño (yo no envié reservas reales).

## 6. Riesgo operativo
- La tarea diaria del blog publica en `main`. Mientras `v4-premium` no se fusione, los artículos nuevos salen con el diseño anterior. Después de fusionar heredan el nuevo diseño automáticamente (el generador copia una página existente como plantilla).
