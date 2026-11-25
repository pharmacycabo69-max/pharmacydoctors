# HANDOFF — pharmacydoctors.com (Prompt Maestro V3.1)
Fecha: 2026-11-24 · Rama de trabajo: `master-v31` — **aprobada por el dueño y publicada en `main` el 2026-11-24 (commit 2003fea)** · Commit base: `main` @ antes de 8d4721d

## Decisiones del propietario aplicadas (2026-11-24)
- Precios USD **con impuestos incluidos**: médico a domicilio $189, consulta en clínica $99, videoconsulta $59, los 7 sueros $159 a domicilio / $129 en clínica, NAD+ $279, grupos 6+ $119, anticipo en línea $50 (reembolsable con 24 h).
- Se **mantiene "24/7"** en pharmacydoctors.com (decisión explícita, distinta del 9–17 del documento).
- Se **eliminan todas las menciones a COFEPRIS** y al número 05-022-B.
- Publicación: rama + vista previa de Vercel; el propietario aprueba antes de pasar a `main`.
- Decisiones D11–D17 de RMC aplican solo a RMC (salvo lo que el dueño eligió del documento arriba).

## Cambios en esta rama
- Precios en 85+ páginas, JSON-LD `Offer`, reservas (`assets/booking.js`: NAD+ sin descuento de grupo, videoconsulta), bot Sofía (`assets/sofia-brain.js`), widget rápido (`assets/premium.js`), página de precios.
- COFEPRIS fuera de todas las páginas, bot, plantilla del blog y reglas del blog diario.
- Equipo: Dr. Kevin González Adame (Director Médico, Médico Cirujano y Partero, IPN, céd. 14796516); Dra. Myriam Aisse Palacios Alarcón (céd. 11664989); Luis Antonio Camacho Villegas retirado de "radiólogo" (colaborador externo de imagenología, título pendiente) — sin tarjeta pública.
- Seguros: texto confirmado EN en todo el sitio; página nueva `/travel-insurance-doctor-cabo/`; eliminadas menciones a aseguradoras concretas (Allianz, GeoBlue…).
- Páginas nuevas: `/video-doctor-consultation-cabo/`, `/aesthetic-medicine-cabo/`, `/travel-insurance-doctor-cabo/`; menú "Doctors & Nurses" actualizado en todo el sitio.
- Docs: `docs/COMPETITOR_MATRIX.csv`, `docs/COMPETITOR_AUDIT.md`, `docs/KEYWORD_MASTER_MAP.csv`, `docs/URL_INVENTORY.csv`, este HANDOFF y `docs/PENDING_BUSINESS_DATA.md` (carpeta excluida del deploy).

## Pruebas hechas
- JSON-LD válido en todas las páginas; 0 enlaces internos rotos; flujo de reserva probado localmente (EN/ES) sin envío real.

## Reversión
- Nada está en producción. Para descartar: borrar la rama `master-v31`. Para publicar: fusionar `master-v31` en `main` (Vercel despliega).

## Nota operativa
- La tarea programada del blog diario trabaja en esta misma carpeta y hace push a `main`. Mientras la rama esté abierta, los posts nuevos de `main` deben traerse a la rama antes de fusionar (`git merge main`).
