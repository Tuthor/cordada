
# Fase F — Parte 1: Nueva mensajería sobre cordadas

Sólo la migración de esquema. UI e Inbox vienen en Parte 2 tras tu OK.

## Tabla `public.cordada_messages`

Columnas:
- `id uuid pk default gen_random_uuid()`
- `cordada_id uuid not null references public.cordadas(id) on delete cascade`
- `sender_id uuid not null references auth.users(id) on delete cascade`
- `recipient_id uuid not null references auth.users(id) on delete cascade`
- `message text not null`
- `is_read boolean not null default false`
- `created_at timestamptz not null default now()`

Índices:
- `(cordada_id, created_at desc)` — cargar hilo.
- `(recipient_id, is_read)` — badge de no leídos.

## GRANTs + RLS + Realtime

```sql
GRANT SELECT, INSERT, UPDATE ON public.cordada_messages TO authenticated;
GRANT ALL ON public.cordada_messages TO service_role;
ALTER TABLE public.cordada_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cordada_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cordada_messages;
```

Sin `DELETE` (mensajes inmutables; `ON DELETE CASCADE` en `cordada_id` cubre la limpieza).

## Helper `SECURITY DEFINER` para validar contraparte

Encapsula la traducción `cordada_members.consultant_id → consultant_applications.user_id` y evita recursión de RLS:

```sql
CREATE OR REPLACE FUNCTION public.is_cordada_counterparty(
  _cordada_id uuid, _a uuid, _b uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH client AS (
    SELECT client_id AS uid FROM public.cordadas WHERE id = _cordada_id
  ),
  members AS (
    SELECT ca.user_id AS uid
    FROM public.cordada_members cm
    JOIN public.consultant_applications ca ON ca.id = cm.consultant_id
    WHERE cm.cordada_id = _cordada_id
  ),
  participants AS (SELECT uid FROM client UNION SELECT uid FROM members)
  SELECT _a <> _b
     AND EXISTS (SELECT 1 FROM participants WHERE uid = _a)
     AND EXISTS (SELECT 1 FROM participants WHERE uid = _b)
     AND (
       EXISTS (SELECT 1 FROM client WHERE uid = _a)
       OR EXISTS (SELECT 1 FROM client WHERE uid = _b)
     );
$$;
```

La última cláusula obliga a que todo par válido sea cliente↔miembro (nunca miembro↔miembro), espejando la mensajería actual.

## Policies

- `SELECT`: `auth.uid() IN (sender_id, recipient_id)`.
- `INSERT`: `sender_id = auth.uid() AND public.is_cordada_counterparty(cordada_id, sender_id, recipient_id)`.
- `UPDATE` (marcar leído): `USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id)`.

## Fuera del alcance de esta parte

- Inbox, sidebar badge, Home, ConsultantRequirements → Parte 2 y 3.
- Cualquier `DROP` de tablas legacy → Parte 4.

Al aprobar, lanzo la migración vía la herramienta de migraciones y te reporto.
