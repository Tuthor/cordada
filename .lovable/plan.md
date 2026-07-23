
# Fase D — Manifestación de interés en cordadas abiertas

Objetivo: el consultor ve las cordadas `open_filtered` que matchean su perfil y manifiesta interés; cliente/admin gestionan interesados y pueden aprobarlos como miembros. Legacy `/projects` + `proposals.project_id` se conserva intacto (Fase E).

---

## Parte 1 — Modelo de datos (migración SQL única)

### 1.1 Extender `proposals`

- `ADD COLUMN cordada_id uuid REFERENCES public.cordadas(id) ON DELETE CASCADE` (nullable).
- `ALTER COLUMN project_id DROP NOT NULL` (permite filas puras de cordada).
- `ADD COLUMN is_legacy boolean NOT NULL DEFAULT false`.
- Backfill: `UPDATE proposals SET is_legacy = true WHERE project_id IS NOT NULL` (todo lo existente es legacy).
- `CHECK`: exactamente uno de (`project_id`, `cordada_id`) no nulo.
- Índice `(cordada_id, consultant_id)` para listar y deduplicar.
- Unique parcial `(cordada_id, consultant_id) WHERE cordada_id IS NOT NULL` — un consultor manifiesta interés una sola vez por cordada.

### 1.2 Semántica de `status` en modo cordada

Se reutilizan los valores existentes (`status` es `text`): `submitted` = interés manifestado, `accepted` = aprobado (dispara conversión a miembro), `rejected` = descartado. Sin cambios de tipo.

### 1.3 `cordada_members` sin cambios estructurales

La aprobación inserta con traducción `auth.uid()` → `consultant_applications.id` dentro de una función SECURITY DEFINER (Parte 3).

---

## Parte 2 — RLS `proposals` (agregar, no reemplazar)

Las policies actuales sobre el mundo `project_id` quedan intactas. Se AGREGAN policies scoped a `cordada_id IS NOT NULL`.

### 2.1 INSERT (consultor manifiesta interés)

```sql
CREATE POLICY "Consultants express interest in matching open cordadas"
ON public.proposals FOR INSERT TO authenticated
WITH CHECK (
  cordada_id IS NOT NULL
  AND project_id IS NULL
  AND is_legacy = false
  AND consultant_id = auth.uid()
  AND status = 'submitted'
  AND public.consultant_matches_cordada(auth.uid(), cordada_id)
  AND EXISTS (
    SELECT 1 FROM public.cordadas c
    WHERE c.id = cordada_id
      AND c.visibility_mode = 'open_filtered'
      AND c.status = 'convocatoria'
  )
);
```

Reusa el guard endurecido de Fase B: sin filtro efectivo, el match devuelve false y el INSERT se bloquea.

### 2.2 SELECT

- Consultor ya cubierto por policy existente (`auth.uid() = consultant_id`).
- Cliente ve propuestas de sus cordadas:

```sql
CREATE POLICY "Clients view interest on their cordadas"
ON public.proposals FOR SELECT TO authenticated
USING (
  cordada_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cordadas c
    WHERE c.id = proposals.cordada_id AND c.created_by = auth.uid()
  )
);
```

- Admin: `USING (public.has_role(auth.uid(), 'admin'))` para SELECT/UPDATE/DELETE (una policy `FOR ALL`).

### 2.3 UPDATE

- Consultor edita/retira su propia manifestación mientras `status = 'submitted'` (scoped `cordada_id IS NOT NULL`).
- Cliente actualiza status en sus cordadas (para rechazo directo):

```sql
CREATE POLICY "Clients update interest status on their cordadas"
ON public.proposals FOR UPDATE TO authenticated
USING (
  cordada_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.cordadas c
    WHERE c.id = proposals.cordada_id AND c.created_by = auth.uid()
  )
);
```

### 2.4 DELETE

- Consultor borra su propia fila mientras `status = 'submitted'`.
- Admin borra todo (via policy admin `FOR ALL`).

Grants existentes de `proposals` ya cubren `authenticated`; no se tocan.

---

## Parte 3 — Aprobación: función SECURITY DEFINER (traducción de identidad)

Traducir `auth.uid()` → `consultant_applications.id` no puede vivir en el cliente. Se encapsula:

```sql
CREATE OR REPLACE FUNCTION public.approve_cordada_interest(
  _proposal_id uuid,
  _role cordada_role
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cordada_id uuid;
  v_user_id uuid;
  v_application_id uuid;
  v_member_id uuid;
BEGIN
  SELECT cordada_id, consultant_id INTO v_cordada_id, v_user_id
  FROM public.proposals WHERE id = _proposal_id AND cordada_id IS NOT NULL;
  IF v_cordada_id IS NULL THEN RAISE EXCEPTION 'Propuesta no válida'; END IF;

  -- Autorización: dueño de la cordada o admin
  IF NOT (
    EXISTS (SELECT 1 FROM public.cordadas WHERE id = v_cordada_id AND created_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Traducción crítica auth.uid() → consultant_applications.id (solo aceptados)
  SELECT id INTO v_application_id
  FROM public.consultant_applications
  WHERE user_id = v_user_id AND status = 'aceptado'
  LIMIT 1;
  IF v_application_id IS NULL THEN
    RAISE EXCEPTION 'El consultor no tiene aplicación aceptada';
  END IF;

  INSERT INTO public.cordada_members (cordada_id, consultant_id, role, is_confirmed)
  VALUES (v_cordada_id, v_application_id, _role, false)
  RETURNING id INTO v_member_id;

  UPDATE public.proposals SET status = 'accepted', updated_at = now() WHERE id = _proposal_id;
  RETURN v_member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_cordada_interest(uuid, cordada_role) TO authenticated;
```

Rechazo se resuelve con `UPDATE proposals SET status='rejected'` apoyado por la policy de UPDATE del cliente (no requiere RPC).

---

## Parte 4 — UI Consultor

### 4.1 Nueva ruta `/cordadas-abiertas` — `src/pages/CordadasAbiertas.tsx`

- Query: `SELECT * FROM cordadas WHERE visibility_mode='open_filtered' AND status='convocatoria'`. La RLS de Fase B filtra por match automáticamente.
- Card por cordada: título, terreno, expertise requerido, badge de "disponibilidad requerida", duración/presupuesto.
- Botón **"Manifestar interés"** → diálogo con `cover_letter` (min 50 chars) y opcionales `scope`/`timeline`. `INSERT` en `proposals` con `cordada_id`, `consultant_id = auth.uid()`, `status='submitted'`.
- Si ya existe fila del consultor para esa cordada: mostrar estado ("Interés manifestado" / "Aprobado" / "Rechazado") + acción de retirar mientras esté `submitted`.

### 4.2 Sidebar — `src/components/layout/AppSidebar.tsx`

Ítem "Cordadas abiertas" (icono `Compass`) visible para `consultant` y `consulting_firm`, encima de "Mis Cordadas".

### 4.3 Ruteo — `src/App.tsx`

Registrar `/cordadas-abiertas` protegida por auth.

### 4.4 Legacy intacto

`/projects`, `/proposals`, `ProjectApply` sin cambios.

---

## Parte 5 — UI Cliente / Admin: pestaña "Interesados"

### 5.1 Cliente — `src/components/client/ClientChallengeDetailDialog.tsx`

Nueva pestaña "Interesados" visible cuando `visibility_mode = 'open_filtered'` y `status IN ('convocatoria','en_curso')`.

- Lista de `proposals` con `cordada_id = cordada.id`, joineadas con datos seguros del consultor vía `get_safe_profile_data(consultant_id)` (nombre, bio) — arquetipo/madurez NO se muestran (privacidad, memoria de proyecto).
- Por fila: `cover_letter`, expertise del consultor, badge de estado, acciones:
  - **Aprobar** → diálogo para elegir `cordada_role` de los 6 roles → `supabase.rpc('approve_cordada_interest', { _proposal_id, _role })`. Invalida queries de miembros e interesados.
  - **Rechazar** → `UPDATE proposals SET status='rejected'`.
- Contador de interesados como badge en el tab.

### 5.2 Admin — `src/components/admin/cordadas/CordadaDetailDialog.tsx`

Misma pestaña "Interesados" con las mismas acciones. Admin ve todo por la policy `has_role`.

---

## Parte 6 — Tipos

- `src/types/cordada.ts`: agregar `CordadaInterest` (proyección de `proposals` en modo cordada).
- `src/integrations/supabase/types.ts` se regenera tras la migración.

---

## Fuera de alcance (Fase E)

- Borrar/deprecar `/projects`, `/proposals`, `ProjectApply/New/Edit/Detail`.
- Migrar datos legacy de `proposals` con `project_id` a cordadas.
- Dropear `project_id` o la tabla `projects`.

---

## Verificación al cerrar Fase D

1. Consultor con expertise "Estrategia" ve una cordada `open_filtered` que la exige; otro sin ella no la ve.
2. INSERT directo saltándose el match → bloqueado por policy (usa `consultant_matches_cordada`).
3. Un consultor no puede manifestar interés dos veces en la misma cordada (unique parcial).
4. Cliente ve interesados en la pestaña "Interesados" del detalle.
5. Aprobar con rol "Explorador" → aparece en `cordada_members` con `consultant_id` = `consultant_applications.id` (no `auth.uid()`); propuesta pasa a `accepted`.
6. Rechazar → status `rejected`, visible al consultor.
7. `/projects` y `/proposals` siguen operativos; filas antiguas marcadas `is_legacy=true`.

---

## Orden de implementación tras tu OK

1. Migración SQL (Partes 1–3) en una sola llamada.
2. Tipos + `CordadasAbiertas.tsx` + sidebar + ruta (Parte 4).
3. Pestaña "Interesados" en diálogos cliente y admin (Parte 5).
4. Verificación end-to-end.
