
## Contexto verificado

- `pablo@corte2.cl` (uid `35b7f848…c188c`, rol `client`) **ya es dueño** de la cordada **"Estrategia de Innovación Abierta - Minería"** (`5295db15…`), status `convocatoria`. Es la única en `convocatoria` de la base.
- `p.corte.p@gmail.com` (uid `8689f1c7…88eb`, rol `consultant`) **no tiene fila en `consultant_applications`** (la RPC `get_my_consultant_application` devolvió `[]` en el network log). Por eso `/mis-cordadas` y el lado consultor del Inbox le salen vacíos hoy.
- Los 5 miembros actuales de la cordada de minería son los sintéticos con `user_id = NULL` (inútiles para runtime).

Sin tocar código ni esquema, alcanza con dos inserciones para desbloquear los tres casos del smoke test.

## Sembrado propuesto (una sola migración de datos, reversible)

1. Insertar en `public.consultant_applications` una fila para `p.corte.p@gmail.com`:
   - `user_id = 8689f1c7-a3f8-443d-ad3d-9ab83d9a88eb`
   - `full_name = 'Pablo Corte'` (mismo que `profiles`)
   - `email = 'p.corte.p@gmail.com'`
   - `status = 'aceptado'`
   - `archetype` y `maturity_level`: valores plausibles (ej. `'Estratega'` / `'Alta Montaña'`) para que la fila pase por las funciones existentes, sin exponerlos al consultor.
2. Insertar en `public.cordada_members` un miembro con `role = 'guia_alta_montana'`, `is_confirmed = true`, apuntando a esa nueva application y a la cordada `5295db15…`.

Con esto:
- `get_my_consultant_application()` devuelve la fila de p.corte.p → `/mis-cordadas` la muestra.
- `is_cordada_counterparty(cordada, pablo, p.corte.p)` pasa a `true` → RLS de `cordada_messages` permite el intercambio en ambos sentidos.
- El cliente pablo, en Inbox, verá "Pablo Corte" como contraparte disponible en esa cordada.

Nada de esto altera código, esquema, ni el legacy; solo son dos filas de datos.

## Checklist de smoke test que hará el usuario después

Corrés estos tres casos en la app (ideal en dos navegadores/perfiles distintos para pablo y p.corte.p):

1. **`/mis-cordadas` (consultor p.corte.p)** — debe listar "Estrategia de Innovación Abierta - Minería". Entrar al detalle no debe explotar.
2. **Inbox (ambos lados)**
   - pablo abre Inbox → "Nueva conversación" → aparece "Pablo Corte" en esa cordada → envía un mensaje.
   - p.corte.p, sin recargar, ve subir el badge del sidebar en realtime, abre Inbox, ve el mensaje con nombre del cliente ("Prueba Prueba" o el `client_company/client_name` de la cordada), responde.
   - pablo ve la respuesta llegar en realtime y el badge decrecer al abrir el hilo.
3. **Stats (Parte 3)**
   - `Home.tsx`: la stat "Desafíos" debe contar **1** (la única cordada en `convocatoria`).
   - En `ConsultantRequirements`, la ficha del cliente pablo debe reportar **1** desafío abierto.

## Post-verificación

- Si los tres casos pasan → luz verde para Parte 4 (dropear `projects`, `project_messages`, `discarded_projects`, columnas legacy de `proposals`).
- Si algo falla en runtime, lo diagnostico con los datos ya en pie (el legacy sigue disponible como red).
- Los datos sembrados quedan como fixture útil; no es necesario borrarlos.

## Detalle técnico

- Uso `supabase--insert` (no migración) porque son cambios de datos, no de esquema.
- No inserto `cordada_messages` de prueba: el punto del test 2 es que la UI las cree en vivo y valide la RLS + realtime.
- No agrego roles ni policies; todo funciona con lo ya migrado en Partes 1–3.

¿Doy luz verde a las dos inserciones?
