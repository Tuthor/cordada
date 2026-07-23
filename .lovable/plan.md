## Hallazgo 1 — Fix: propagar `firm_token` / `leader` en la evaluación de líderes

Fix acotado, sin cambios de esquema. Se apoya en columnas ya existentes:
- `enrollments.source_firm_leader_token`
- `firm_application_leaders.assessment_status` (TEXT, DEFAULT `'pending'`)
- `firm_application_leaders.consultant_application_id` (nullable, para trazar líder ↔ postulación resultante)

Valores normalizados en inglés para calzar con el default actual y no migrar filas: **`'pending'` / `'completed'`**.

### Cambios

1. **`src/pages/ConsultantAssessment.tsx`**
   - Leer con `useSearchParams` los parámetros `firm_token` (UUID de `firm_applications.id`) y `leader` (TEXT de `firm_application_leaders.leader_token`, típicamente con forma UUID).
   - Pasarlos como props a `<Assessment />`.

2. **`src/components/Assessment.tsx`**
   - Aceptar props `firmToken?: string`, `leaderToken?: string` y reenviarlos a `<EnrollmentForm />`.

3. **`src/components/EnrollmentForm.tsx`**
   - Aceptar las mismas props e incluirlas en el body enviado a `supabase.functions.invoke('send-enrollment', ...)` como `firmToken` y `leaderToken`.
   - Si están presentes, llamar a una edge function pública para obtener el nombre de la firma y del líder y mostrar banner: "Estás completando la evaluación como líder de la firma X".

4. **`supabase/functions/send-enrollment/index.ts`**
   - Ampliar schema Zod: `firmToken: z.string().uuid().optional()`, `leaderToken: z.string().optional()` (leader_token es TEXT).
   - Si vienen ambos, validar contra `firm_application_leaders` que exista una fila con `firm_application_id === firmToken` (nombre real del FK) AND `leader_token === leaderToken`.
   - Idempotencia: si esa fila ya está en `assessment_status = 'completed'`, devolver 409 con mensaje claro.
   - Insert en `enrollments` con `source_firm_leader_token = leaderToken`.
   - Tras el insert exitoso, con `service_role`:
     ```sql
     UPDATE firm_application_leaders
     SET assessment_status = 'completed',
         consultant_application_id = <id de la application creada si existe, si no NULL>
     WHERE firm_application_id = :firmToken AND leader_token = :leaderToken;
     ```
     (No se toca `completed_at` — la columna no existe y se mantiene "sin cambios de esquema". `updated_at` se refresca por trigger.)
   - Cuando NO vengan los parámetros, el flujo del consultor individual queda idéntico. Mantener reCAPTCHA, rate-limit y validaciones existentes.

5. **`src/components/admin/FirmApplicationsPanel.tsx`**
   - En el detalle de una firm application, mostrar por cada líder su `assessment_status` real con badges **"Pendiente" (`pending`) / "Completado" (`completed`)** — badges en español, valores en BD en inglés.
   - Añadir contador "X de N líderes evaluados" en la fila principal.

6. **Nueva edge function pública `get-firm-invitation-context`** (`verify_jwt = false`)
   - Recibe `firmToken` + `leaderToken` y devuelve solo `{ firm_name, leader_full_name }` — sin datos sensibles.

### Verificación

- Abrir `/evaluacion-consultor?firm_token=<firm_applications.id>&leader=<leader_token>`, completar evaluación, verificar:
  - `enrollments.source_firm_leader_token` grabado.
  - `firm_application_leaders.assessment_status = 'completed'` para esa fila.
- Sin parámetros → comportamiento previo intacto.
- Reenviar el mismo link ya usado → 409.

---

## Hallazgo 2 — Plan por fases (requiere aprobación por fase antes de implementar)

No se borra nada hasta la fase final. `visibility_mode` default `'curated'`, sin efecto sobre cordadas existentes.

### Fase A — Prerrequisito: visibilidad del consultor sobre `cordadas`

**Ojo con la semántica de `consultant_id`:** en `cordada_members.consultant_id` referencia `consultant_applications(id)`, NO `auth.users`. Hay que atravesar `consultant_applications.user_id`.

- Nueva función `SECURITY DEFINER` para encapsular la lógica y evitar recursión:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_cordada_member(_cordada_id uuid, _user_id uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.cordada_members cm
      JOIN public.consultant_applications ca ON ca.id = cm.consultant_id
      WHERE cm.cordada_id = _cordada_id AND ca.user_id = _user_id
    )
  $$;
  ```
- RLS `cordada_members` — SELECT del consultor sobre sus propias membresías:
  ```sql
  CREATE POLICY "Consultants can view their own memberships"
  ON public.cordada_members FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.consultant_applications ca
    WHERE ca.id = cordada_members.consultant_id
      AND ca.user_id = auth.uid()
  ));
  ```
- RLS `cordadas` — SELECT del consultor sobre cordadas donde es miembro:
  ```sql
  CREATE POLICY "Consultants can view cordadas they belong to"
  ON public.cordadas FOR SELECT TO authenticated
  USING (public.is_cordada_member(cordadas.id, auth.uid()));
  ```
- Rutas nuevas lado consultor: `/mis-cordadas` (lista) y `/mis-cordadas/:id` (detalle read-only con rol, terreno, riesgos no sensibles, rituales, equipo).
- Sidebar: agregar "Mis Cordadas" para consultores y líderes de firma.
- Sin cambios en `projects` / `proposals`.

### Fase B — Modelo de datos: modo de visibilidad + filtros

Migración sobre `cordadas`:
- `visibility_mode` (enum `cordada_visibility_mode` con `'curated' | 'open_filtered'`) NOT NULL DEFAULT `'curated'`.
- `open_filters` `jsonb` NULL. Índice GIN.
- GRANTs: `authenticated` (lectura vía policies), `service_role` full. `anon` sin acceso.

Estructura sugerida de `open_filters` (v1, solo campos que hoy existen):
```json
{
  "archetypes": ["ex_ejecutivo", "tecnico_alto_nivel"],
  "min_maturity_level": "<valor del catálogo real, a confirmar en Fase C>",
  "expertise_tags": ["Estrategia", "Transformación Digital"],
  "availability_required": true
}
```
- **`regions` queda fuera de v1** (no existe en `consultant_profiles` ni en `consultant_applications`). Se evalúa agregarla como fase posterior.
- El valor exacto de `min_maturity_level` se define confirmando el catálogo real de `maturity_level` en `consultant_applications` (no hardcodear "consolidado" sin verificar).

Función matcher `SECURITY DEFINER` (fuentes correctas de cada campo):
```sql
CREATE OR REPLACE FUNCTION public.consultant_matches_cordada(_user_id uuid, _cordada_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
-- arquetipo y madurez: consultant_applications (join por user_id)
-- disponibilidad (is_available) y expertise: consultant_profiles (join por user_id)
-- lee cordadas.open_filters y aplica el matching
$$;
```

Nueva RLS `cordadas` (modo abierto) para consultores:
```sql
CREATE POLICY "Consultants can view matching open cordadas"
ON public.cordadas FOR SELECT TO authenticated
USING (
  visibility_mode = 'open_filtered'
  AND status = 'convocatoria'
  AND public.consultant_matches_cordada(auth.uid(), cordadas.id)
);
```

### Fase C — UI cliente: elegir modo al publicar

- En `ClientChallengeNew` y `EditCordadaDialog`: selector "Modo de convocatoria" con **Match orquestado (recomendado)** vs **Abierto a perfiles filtrados**.
- Si `open_filtered`, formulario de filtros usando catálogos ya existentes (arquetipos, niveles de madurez reales, tags de expertise, disponibilidad).
- Validación: si `open_filtered` al publicar, exigir al menos un filtro no vacío.

### Fase D — Manifestación de interés (reutilizar `proposals` apuntando a `cordadas`)

**Ojo con la semántica de `consultant_id`:** en `proposals.consultant_id` es un `auth.users.id` (la RLS actual usa `auth.uid() = consultant_id`). En `cordada_members.consultant_id` es `consultant_applications.id`. La conversión debe ser explícita.

- Migración: `proposals.cordada_id uuid REFERENCES cordadas(id) ON DELETE CASCADE`, nullable durante transición. Añadir `is_legacy boolean DEFAULT false` y marcar `true` en filas legacy existentes.
- RLS nueva sobre `proposals` para el flujo abierto:
  - Consultor `INSERT` si `public.consultant_matches_cordada(auth.uid(), NEW.cordada_id)`.
  - Consultor `SELECT/UPDATE/DELETE` de sus propias filas (mantiene `auth.uid() = consultant_id`).
  - Cliente `SELECT` de propuestas dirigidas a sus cordadas.
  - Admin `ALL`.
- UI consultor: `/cordadas-abiertas` lista cordadas visibles + botón "Manifestar interés" → `INSERT proposals` con `cordada_id` y `consultant_id = auth.uid()`.
- UI cliente/admin: en `CordadaDetailDialog`, pestaña "Interesados". Acción **"Aprobar → agregar al equipo"** ejecuta la traducción auth.uid → consultant_applications.id:
  ```sql
  INSERT INTO public.cordada_members (cordada_id, consultant_id, role)
  SELECT :cordada_id, ca.id, :role
  FROM public.consultant_applications ca
  WHERE ca.user_id = :proposal_consultant_auth_uid;
  ```
  Si el usuario no tiene fila en `consultant_applications` (caso borde), el admin recibe error explícito — no se inserta el auth uid directo (violaría el FK).

### Fase E — Unificación de navegación y deprecación del legacy

- Sidebar:
  - Cliente: "Mis Desafíos" → `/challenges` (backing table `cordadas`).
  - Consultor / firma: "Cordadas Abiertas" (`/cordadas-abiertas`) + "Mis Cordadas" (`/mis-cordadas`). Se retiran del sidebar "Desafíos" (`/projects`) y "Propuestas" (`/proposals`).
- Rutas legacy `/projects` y `/proposals`: **redirección client-side con `<Navigate replace to="...">`** (no hay 301 HTTP real en SPA con React Router).
- Componentes/páginas a deprecar (se mantienen unos releases con banner "vista legacy"): `Projects.tsx`, `Proposals.tsx`, `ProjectDetail.tsx`, `ProjectApply.tsx`, `ProjectNew.tsx`, `ProjectEdit.tsx`.
- Tabla `projects`: no se borra en esta fase. Borrado físico solo tras confirmar cero lecturas durante N semanas.

### Riesgos a tener presentes

- Datos actuales en `projects` / `proposals`: inventariar antes de Fase D. Si hay datos reales, definir política de migración (¿convertir a `cordadas` `open_filtered`?).
- Precondición para modo abierto: `consultant_applications` y `consultant_profiles` bien poblados en los campos del filtro (arquetipo, madurez, expertise, disponibilidad).
- Superficie nueva para admin: pestaña "Interesados" en cordadas open.

---

## Orden de ejecución

1. **Ahora, tras tu OK a este plan:** Hallazgo 1 completo con las correcciones (nombres reales, `'pending'/'completed'`, sin tocar `completed_at`).
2. Después Hallazgo 2 fase por fase (A → B → C → D → E), cada una con aprobación previa.
