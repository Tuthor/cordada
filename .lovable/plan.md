# Drop legacy permissive policies on `public.proposals`

## Migration

```sql
DROP POLICY IF EXISTS "Consultants can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Consultants can update own proposals" ON public.proposals;
```

## Verification

Query `pg_policies` for `public.proposals` and confirm the final set is exactly:

- **INSERT (consultant)** — `Consultants express interest in matching open cordadas` (gated by `consultant_matches_cordada` + `visibility_mode='open_filtered'` + `status='convocatoria'`).
- **UPDATE (consultant)** — `Consultants update own cordada interest while submitted` (only `status='submitted'`).
- **SELECT (consultant)** — `Consultants view own proposals`.
- **DELETE (consultant)** — `Consultants delete own cordada interest while submitted`.
- **SELECT (client)** — `Clients view interest on their cordadas`.
- **UPDATE (client)** — `Clients update interest status on their cordadas`.
- **ALL (admin)** — `Admins manage all proposals`.

## Functional checks (post-migration)

1. Consultor matching + cordada `open_filtered`/`convocatoria` → manifestar interés desde `/cordadas-abiertas` responde 200 OK.
2. INSERT directo (SQL/consola) sobre una cordada `curated` o que no matchea → rechazado por RLS.
3. Aprobar/rechazar interesados desde el cliente, Inbox y `/mis-cordadas` sin regresiones.

## Deliverable

Reporte con la lista final de policies vigentes sobre `public.proposals` (nombre, comando, rol, USING/WITH CHECK resumido) y resultado de los 3 checks funcionales.
