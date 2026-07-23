## Fase E — Unificar navegación y deprecar el legacy (Opción B aprobada)

Sin cambios de esquema. Solo UI + rutas.

### Parte 1 — Sidebar (`src/components/layout/AppSidebar.tsx`)
En el bloque genérico (base para consultor/firma):
- Quitar `{ title: "Desafíos", url: "/projects" }` y `{ title: "Propuestas", url: "/proposals" }`.
- Ajustar índice del `splice` de Cordadas abiertas / Mis Cordadas para insertar tras "Directorio".

### Parte 2 — Dashboard (`src/pages/Dashboard.tsx`)
- CTA cliente: `/projects/new` "Publicar Proyecto" → `/challenges` "Mis Desafíos".
- CTA consultor/firma: `/projects` "Ver Desafíos" → `/cordadas-abiertas` "Ver Desafíos Abiertos".
- Card "Desafíos Abiertos" (link `/projects`) → `/cordadas-abiertas`.

### Parte 3 — Rutas legacy (`src/App.tsx`)
Reemplazar las 6 rutas por redirects:
- `/projects` → componente role-aware: cliente → `/challenges`, consultor/firma → `/cordadas-abiertas`, resto → `/dashboard`.
- `/projects/new` → `<Navigate to="/challenges/new" replace />`.
- `/projects/:id` y `/projects/:id/edit` → `/dashboard`.
- `/projects/:id/apply` → `/cordadas-abiertas`.
- `/proposals` → `/mis-cordadas`.
Retirar imports de las 6 páginas legacy.

### Parte 4 — Eliminar páginas legacy
`rm` de: `Projects.tsx`, `ProjectNew.tsx`, `ProjectDetail.tsx`, `ProjectEdit.tsx`, `ProjectApply.tsx`, `Proposals.tsx`.
Ajustar `src/pages/ConsultantRequirements.tsx:401`: `<Link to="/projects">` → `/cordadas-abiertas`.

### Parte 5 — BD
Opción B: sin cambios. `projects`, `project_messages`, `discarded_projects`, `proposals.project_id`, `is_legacy` y CHECK quedan dormidos. Inbox sigue funcional.

### Verificación
- `rg -n "/projects|/proposals" src` solo devuelve las líneas `<Navigate>` de `App.tsx`.
- `rg -n "pages/Project|pages/Proposals" src` vacío.
- Rutas manuales redirigen; Fases A–D intactas.

Necesito que cambies a build mode para aplicar estos cambios.
