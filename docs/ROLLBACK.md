# Rollback — V4
Fecha: 2026-11-25

## Situación actual
- Producción (`main`, último commit `f21d024`) **no se tocó**. Vercel sigue sirviendo `main`.
- Todo el trabajo de V4 está en la rama `v4-premium` (commits `b226611` a `HEAD`). La rama base `radiology-aesthetics-booking` (`b8399f1`) está incluida.

## Si la vista previa no se aprueba
No hay que hacer nada: la producción no cambia. Para descartar la rama:
```
git push origin --delete v4-premium
```

## Si se fusiona y hay que volver atrás
1. Revertir la fusión en `main` sin reescribir el historial:
```
git checkout main
git pull
git revert -m 1 <commit-de-merge>
git push
```
2. Vercel publica el revert automáticamente (1–2 minutos).
3. Alternativa inmediata, sin git: en Vercel → Deployments, elegir el último deployment de `main` anterior a la fusión → "Promote to Production".

## Revertir solo una parte
| Parte | Commit | Comando |
|---|---|---|
| Sin anticipo / claims / dosis (P0) | `b226611` | `git revert b226611` |
| Marca, navegación, hero (P1) | `468c751` | `git revert 468c751` |
| Filtros de IV y bloque de seguridad | `c204a9d` | `git revert c204a9d` |
| QA 1: CTAs del hero, fotos | `ca96657` | `git revert ca96657` |
| QA 2: pie de página, horario, claims Rx | `3e501ac` | `git revert 3e501ac` |
| QA 3: tiempos de llegada | `a8dbb54` | `git revert a8dbb54` |
| Reserva: horario de clínica, analítica | `1c45352` | `git revert 1c45352` |

Si se revierte un commit de forma aislada, puede haber conflictos con los posteriores. En ese caso conviene revertir desde el más reciente hacia el más antiguo.

## Lo que el rollback NO cubre
- Stripe (nada se cambió), DNS, campañas, Google Business Profile y Web3Forms: fuera del repositorio.
- La tarea diaria del blog: sigue publicando en `main` con su propio flujo.

## V5
- V5 vive solo en la rama `v5-premium`. Si no se aprueba, no hay que hacer nada: la producción sigue en V4 (`61c7133`).
- Si se fusiona y hay que volver: `git revert -m 1 <merge-de-v5>`, o en Vercel promover el último deployment de V4.
- Pagos: si algo falla con Stripe, basta con **borrar `STRIPE_SECRET_KEY` en Vercel**. `/pay/` vuelve a mostrar "pay at the visit / WhatsApp", sin tocar código.

## V5.1
| Problema | Acción inmediata | Tiempo |
|---|---|---|
| Error en los pagos | Borrar `STRIPE_SECRET_KEY` en Vercel y hacer Redeploy. `/pay/` pasa a "pay at the visit" | 2 min |
| Enlace de pago filtrado | Cambiar `PAY_LINK_SECRET` y hacer Redeploy: todos los enlaces quedan inválidos | 2 min |
| Clave del personal comprometida | Cambiar `CONCIERGE_KEY` y hacer Redeploy | 2 min |
| Error visual tras publicar V5 | Vercel → Deployments → el último de V4 → **Promote to Production** | 1 min |
| Revertir el código | `git revert -m 1 <merge de v5-premium en main>` y push (con autorización) | 5 min |
| Solo el arreglo de tablet | `git revert -m 1 <merge de hotfix-hero-tablet>` | 5 min |
