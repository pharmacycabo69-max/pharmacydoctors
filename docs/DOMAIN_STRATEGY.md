# Estrategia de dominios — V4
Fecha: 2026-11-25 · No se cambió ningún DNS ni dominio (regla V4).

## Dominios y papel de cada uno
| Dominio | Papel | Intención principal | Notas |
|---|---|---|---|
| **pharmacydoctors.com** | Marca principal para viajeros de EE. UU. y Canadá | atención a domicilio (doctor, IV, enfermera), video, farmacia a domicilio, seguros | Este repositorio. Inglés primero, `/es/` para hispanohablantes |
| cabowalkinclinic.com | Sitio de la clínica física | "walk-in clinic Cabo", "clinic near me" | Mismo dueño (según el chat). Debe ser el URL principal de la clínica en Google Business Profile |
| rmcpharmacy.com | Cadena de farmacias (5 sucursales) | "pharmacy Cabo San Lucas", "farmacia cerca" | Dueño del Map Pack de farmacia (un perfil de Google por sucursal) |
| medicinaesteticaencabo.com | Referencia de precios de estética | "lip fillers / botox Cabo" | Solo se copiaron los precios, por instrucción del dueño. No se copió texto |
| cabobaymedical.com | **No es del dueño** (confirmado 2026-11-24) | competidor | Usa texto antiguo de Cabo Walk-In Clinic: el dueño puede valorar un aviso de retiro |

## Reglas
1. **Un URL principal por intención y por dominio.** No crear páginas casi iguales en dos dominios (contenido duplicado, se canibalizan).
2. **Enlaces entre marcas solo cuando ayudan al usuario** (p. ej. "Our clinic: Cabo Walk-In Clinic"), sin redes de enlaces ni textos ancla forzados.
3. **Datos NAP idénticos** (nombre, dirección, teléfono) en el pie, el schema, Google Business Profile y directorios. Hoy el sitio usa: Francisco I. Madero, Centro, 23450 Cabo San Lucas · +52 624 226 1023.
4. **Horario coherente**: si la clínica abre de 9 a 17, el mismo dato debe aparecer en cabowalkinclinic.com, en Google Business Profile y en este sitio (hoy cabowalkinclinic anuncia 9 AM–10 PM: ver conflicto #8).
5. `www` frente a dominio raíz: el canonical usa `https://www.pharmacydoctors.com/`. Mantener la redirección del dominio raíz a www en Vercel (no se tocó).

## Recomendación
- No abrir dominios nuevos (p. ej. uno de estética) mientras pharmacydoctors.com y cabowalkinclinic.com no tengan Google Business Profile y reseñas. La autoridad se diluye.
- Prioridad de "varios activos en primera página": 1) Google Business Profile de la clínica, 2) perfiles de las 5 sucursales RMC, 3) páginas de servicio de este sitio, 4) cabowalkinclinic.com para "walk-in".
