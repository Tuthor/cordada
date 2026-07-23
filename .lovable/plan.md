## Fase C — UI Cliente: Modo de convocatoria + editor de filtros (revisado)

### Objetivo
Permitir que el cliente, al crear o editar un Desafío en borrador, elija entre:
- **Match orquestado (recomendado)** → `visibility_mode = 'curated'` (comportamiento actual).
- **Abierto a perfiles filtrados** → `visibility_mode = 'open_filtered'` (los consultores que cumplan los filtros verán el desafío y podrán manifestar interés en Fase D).

Al publicar, la UI valida que un desafío `open_filtered` tenga al menos un filtro efectivo, coherente con el guard endurecido de `consultant_matches_cordada`.

### Alcance del cliente (v1)
Los únicos ejes visibles al cliente son **Expertise requerido** y **Disponibilidad requerida**. Arquetipo y nivel de madurez son taxonomía interna y NO se exponen al cliente (principio de privacidad — flujo 4.4). El backend sigue soportando los 4 ejes; simplemente ninguna UI del cliente los setea.

---

## Paso previo obligatorio — Corrección 1: unificar vocabulario de expertise

Sin esto, el filtro por expertise del cliente casi nunca calzaría con el consultor (texto libre vs. catálogo).

### 1a. `src/pages/Settings.tsx` — expertise como multi-select controlado
- Cambiar Zod: `expertise: z.array(z.string()).optional().default([])`.
- Reemplazar el input de texto libre por un grupo de toggle-badges/checkboxes alimentado desde `expertiseOptions` (`src/data/cordadaData.ts`).
- Al cargar: poblar el array desde `data.expertise ?? []` (ya no hacer `.join(', ')`).
- Al guardar: escribir el array tal cual en `consultant_profiles.expertise` (columna `text[]`).
- Fuente única de verdad: `expertiseOptions`. Client, Settings y Directory deben leer de ahí.

### 1b. Migración one-time de datos existentes
Función/script SQL no destructivo sobre `consultant_profiles.expertise`:
- Normalizar cada valor (lowercase + sin acentos + trim) y compararlo contra la versión normalizada de cada valor de `expertiseOptions`.
- Si mapea → reemplazar por el string exacto del catálogo (ej. `"transformacion digital"` → `"Transformación Digital"`).
- Si no mapea → preservar tal cual (no borrar).
- Reportar en la descripción de la migración cuántas filas se normalizaron y cuántas quedaron con al menos un valor sin mapear (para que esos consultores reajusten su expertise en Settings).

### 1c. Verificación
- Consultor con `expertise = ["Estrategia"]` (exacto) matchea un desafío con `expertise_tags: ["Estrategia"]`.
- Consultor con expertise vacío/NULL no matchea filtros de expertise (comportamiento estricto esperado; se comunica en la UI del cliente).

---

## Cambios de Fase C

### 2. Tipos (`src/types/cordada.ts`)
- `export type CordadaVisibilityMode = 'curated' | 'open_filtered'`.
- Extender `Cordada`:
  - `visibility_mode: CordadaVisibilityMode`
  - `open_filters: CordadaOpenFilters | null`
- Tipo:
```ts
export interface CordadaOpenFilters {
  // Ejes soportados por el backend; el cliente v1 solo setea los dos últimos.
  archetypes?: string[];
  min_maturity_level?: string;
  expertise_tags?: string[];
  availability_required?: boolean;
}
```

### 3. Catálogos (`src/data/cordadaData.ts`)
- `visibilityModeOptions`:
  - `curated`: "Match orquestado (recomendado)"
  - `open_filtered`: "Abierto a perfiles filtrados"
- Reutilizar `expertiseOptions` para el editor del cliente.
- No agregar catálogos de `archetypes` ni `maturityLevelOptions` para el cliente v1 (quedan para un futuro editor solo-admin).

### 4. Componente `OpenFiltersEditor` (cliente)
- Nuevo: `src/components/client/OpenFiltersEditor.tsx`.
- Props: `value: CordadaOpenFilters | null`, `onChange`.
- Se renderiza solo cuando `visibility_mode === 'open_filtered'`.
- Controles v1:
  - **Expertise requerido**: multi-select desde `expertiseOptions` → escribe `expertise_tags`.
  - **Disponibilidad requerida**: checkbox → escribe `availability_required`.
- Nota inline: *"El filtro por expertise solo alcanza a consultores que hayan completado su perfil profesional."*
- Helper `hasEffectiveFilter(filters)` v1:
  - `(filters?.expertise_tags?.length ?? 0) > 0 || filters?.availability_required === true`.
- Componente extensible para reutilizar en un futuro editor admin (arquetipo/madurez), pero la instancia del cliente NO los muestra.

### 5. `ClientChallengeNew.tsx`
- Extender schema Zod con `visibility_mode` y `open_filters` (objeto opcional/nullable).
- Defaults: `visibility_mode: 'curated'`, `open_filters: null`.
- Renderizar selector de modo + `<OpenFiltersEditor />`.
- Insertar ambas columnas en Supabase.

### 6. `ClientChallengeEdit.tsx`
- Extender schema igual.
- Popular desde la cordada cargada.
- Incluirlas en el `update`.
- Ya está protegido a `status === 'draft'`.

### 7. `ClientChallenges.tsx` — validación al publicar
- Antes de `updateStatusMutation.mutate({ id, status: 'convocatoria' })`:
  - Si `cordada.visibility_mode === 'open_filtered'` y `!hasEffectiveFilter(cordada.open_filters)`:
    - Toast destructivo: *"Para publicar en modo abierto debes definir al menos un filtro efectivo (expertise requerido o disponibilidad)."*
    - No ejecutar la mutación.
- Opcional: badge del modo en cada tarjeta.

### 8. `ClientChallengeDetailDialog.tsx`
- Mostrar en lectura el modo de convocatoria.
- Si `open_filtered`, listar `expertise_tags` y disponibilidad requerida con labels legibles.

### 9. RLS
- No requiere cambios: agregar columnas no cambia las policies existentes de `cordadas` (son a nivel de fila y no excluyen columnas).

---

## Fuera de alcance
- Diálogos admin (`CreateCordadaDialog` / `EditCordadaDialog`): sin cambios; siguen creando desafíos en `curated`.
- Manifestación de interés de consultores: Fase D.
- Exponer arquetipo/madurez al cliente: requiere fase aparte con etiquetas neutrales y revisión de privacidad, no reutilizando la taxonomía interna cruda.

---

## Verificación

1. Consultor entra a Settings → selecciona expertise desde el catálogo (multi-select) → se guarda como `text[]` de valores del catálogo.
2. Migración: consultores con texto libre mapeable quedan normalizados; los no mapeables se conservan sin romper.
3. Cliente crea desafío en **Match orquestado** → publica sin filtros: igual que hoy.
4. Cliente crea desafío en **Abierto a perfiles filtrados** sin filtro efectivo → al publicar se bloquea con toast.
5. Cliente define `expertise_tags = ["Estrategia"]` (y/o `availability_required = true`) → publica; un consultor con "Estrategia" en su perfil lo ve, uno sin ella no.
6. El editor del cliente NO muestra arquetipo ni madurez.
7. Detalle del desafío → muestra modo y filtros configurados con labels legibles.