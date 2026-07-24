
# Fase F · Parte 4 — Limpieza del esquema legacy (irreversible)

Ejecución en tres pasos, en orden estricto para no romper inserts en vuelo.

## Paso 1 — Ajuste de código (antes de la migración)

`src/pages/CordadasAbiertas.tsx` (línea 74): eliminar `is_legacy: false,` del payload al insertar en `proposals`. Confirmado que es la última referencia viva a esa columna en el código de aplicación.

## Paso 2 — Migración destructiva

Ejecutar como una sola migración, en este orden:

```sql
-- 1. Purga legacy de proposals
DELETE FROM public.proposals WHERE project_id IS NOT NULL;

-- 2. Desacoplar proposals de projects
ALTER TABLE public.proposals DROP CONSTRAINT IF EXISTS proposals_project_xor_cordada;
ALTER TABLE public.proposals DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.proposals DROP COLUMN IF EXISTS is_legacy;
ALTER TABLE public.proposals ALTER COLUMN cordada_id SET NOT NULL;

-- 3. Retirar realtime + tablas legacy
ALTER PUBLICATION supabase_realtime DROP TABLE public.project_messages;
DROP TABLE public.project_messages;
DROP TABLE public.discarded_projects;
DROP TABLE public.projects;

-- 4. Endurecer is_cordada_counterparty (pendiente de Parte 1)
REVOKE EXECUTE ON FUNCTION public.is_cordada_counterparty(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_cordada_counterparty(uuid, uuid, uuid) TO authenticated, service_role;
```

Advertencias:
- Irreversible: se borran datos y tablas legacy.
- El typecheck quedará roto en cuanto Postgres aplique el DROP y hasta que Supabase regenere `src/integrations/supabase/types.ts`. Es esperado en la ventana entre migración y regeneración.

## Paso 3 — Verificación post-migración

1. `rg -n "projects|project_messages|project_id|is_legacy|discarded_projects" src` → tolerable solo en:
   - `src/integrations/supabase/types.ts` (regenerado, ya sin `projects`/`project_messages`; matches residuales aceptables únicamente por nombres derivados como `project_x_...` en tipos regenerados).
   - `src/App.tsx` en los `<Navigate>` de `/projects` y `/proposals` legacy.
2. Typecheck limpio (harness lo corre automáticamente).
3. Smoke funcional (yo lo corro con Playwright autenticado como `pablo@corte2.cl` y `p.corte.p@gmail.com`):
   - `/cordadas-abiertas` → manifestar interés inserta en `proposals` sin `is_legacy` (200 OK).
   - `/mis-cordadas` → sigue listando cordada de Minería.
   - `/challenges` (cliente) → lista y detalle sin errores.
   - Inbox → conversación cliente↔consultor visible, badge se actualiza al leer.

## Entregable

Reporte con:
- Archivos tocados (`CordadasAbiertas.tsx` + migración + types regenerado por Cloud).
- Salida del `rg` de verificación.
- Estado de los 4 smoke checks.
