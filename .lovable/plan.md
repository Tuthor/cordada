## Objetivo

Dar al administrador la capacidad de eliminar completamente a **consultores, empresas de consultoría, clientes y partners** desde el panel de administración, sin importar el estado en que se encuentren (postulante, invitado, activado, aceptado, rechazado, etc.).

## Alcance funcional

Cada eliminación borra:
1. La postulación asociada (si existe).
2. El usuario de autenticación (si ya fue activado).
3. En cascada: perfil (`profiles`), roles (`user_roles`), perfil de consultor, membresías en empresas/cordadas.

Restricciones:
- Solo usuarios con rol `admin` pueden ejecutar la acción.
- Confirmación explícita en el frontend (diálogo "¿Eliminar definitivamente?") antes de invocar la función.
- Un admin no puede eliminarse a sí mismo.

## Cambios técnicos

### 1. Edge Functions (nuevas / ampliadas)

- **`delete-consultant-application`** (ya existe): sin cambios, ya cubre postulantes y aceptados con user asociado.
- **`delete-firm-application`** (ya existe): ampliar para que, si la firma ya fue activada, también elimine sus `firm_members`, la fila en `consulting_firms` y los usuarios auth de los líderes.
- **`delete-user`** (nueva): recibe `user_id`, valida admin, valida que no sea self-delete, y llama `auth.admin.deleteUser(user_id)`. Se usa para **clientes y partners** (que no tienen tabla de postulación). Cascade FK ya limpia `profiles` y `user_roles`.

### 2. Frontend

- **`ConsultantsPanel.tsx`**: añadir botón de eliminar (icono papelera) por fila con `AlertDialog` de confirmación → invoca `delete-consultant-application`.
- **`ApplicationsPanel.tsx`**: ya tiene flujo de detalle; añadir botón eliminar directo en la fila también.
- **`FirmApplicationsPanel.tsx`**: añadir botón eliminar por fila (postulantes y activadas) → invoca `delete-firm-application`.
- **Nuevo `UsersPanel.tsx`** dentro de la pestaña de orquestación (o nueva pestaña "Usuarios"): lista `profiles` con su rol (`user_roles`), filtro por rol (client/partner/consultant/firm/admin), botón eliminar → invoca `delete-user`. Permite gestionar clientes y partners que hoy no tienen panel dedicado.
- **`OrchestrationTabs.tsx`**: añadir la pestaña "Usuarios".

### 3. Base de datos

Verificar que existen `ON DELETE CASCADE` desde `auth.users` hacia:
- `public.profiles.user_id`
- `public.user_roles.user_id`
- `public.consultant_profiles.user_id`
- `public.firm_members.user_id`
- `public.cordada_members.consultant_id` (o SET NULL si se prefiere preservar historia)

Si falta alguno, se agrega en una migración. No se crean nuevas tablas.

## Detalles técnicos

- Todas las funciones usan el patrón ya establecido: validar `Authorization`, obtener claims, verificar `has_role(uid, 'admin')` con `service_role`, luego ejecutar el borrado con `service_role`.
- El `delete-user` retorna `403` si `claims.sub === user_id` (no self-delete).
- Toasts de éxito/error en cada acción del frontend.
- Refresh automático de la tabla tras eliminar.
