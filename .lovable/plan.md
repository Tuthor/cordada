
# Correcciones previas + Fase F Partes 2 y 3

## Verificación previa

- `/mis-cordadas` **hoy sale vacío** para consultores: `consultant_applications` sólo tiene `Admins can manage all applications` y `Clients can view consultants assigned to their cordadas`; ninguna cubre `user_id = auth.uid()`, y `MisCordadas` cae por RLS.
- Reads consultor-side directos a `consultant_applications` en el código: sólo `src/pages/MisCordadas.tsx:25` y `src/pages/MisCordadaDetail.tsx:29`. Ambos se migran a `rpc('get_my_consultant_application')` en Parte 2. No hay otra pantalla de consultor que rompa.
- `CordadasAbiertas.tsx` no lee `consultant_applications`; su filtrado depende de `consultant_matches_cordada` vía RLS y no se toca.

## Corrección 1 — Acceso propio SIN exponer archetype/maturity

Una sola migración. NO se agrega ninguna policy `SELECT` sobre `consultant_applications`.

```sql
CREATE OR REPLACE FUNCTION public.get_my_consultant_application()
RETURNS TABLE (id uuid, user_id uuid, full_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ca.id, ca.user_id, ca.full_name
  FROM public.consultant_applications ca
  WHERE ca.user_id = auth.uid()
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_consultant_application() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_consultant_application() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.owns_consultant_application(_application_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.consultant_applications
    WHERE id = _application_id AND user_id = _user_id
  );
$$;
REVOKE EXECUTE ON FUNCTION public.owns_consultant_application(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_consultant_application(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Consultants can view their own memberships" ON public.cordada_members;
CREATE POLICY "Consultants can view their own memberships"
ON public.cordada_members FOR SELECT TO authenticated
USING (public.owns_consultant_application(cordada_members.consultant_id, auth.uid()));
```

Efecto: el consultor sigue sin poder leer su fila de `consultant_applications` directamente (archetype/maturity ocultos), pero puede resolver su propio `id`/`full_name` vía RPC y ver sus `cordada_members` sin depender de un EXISTS bajo RLS.

## Corrección 2 — Sin lecturas a `profiles` en Inbox/badge

Fuentes de nombre:
- **Lado cliente → nombre del consultor**: `consultant_applications.full_name` (fila accesible al cliente vía la policy existente "Clients can view consultants assigned to their cordadas"; también trae `user_id` para mensajería).
- **Lado consultor → nombre del cliente**: `cordadas.client_company || cordadas.client_name`, mismo patrón que `MisCordadas`.

Ni `Inbox.tsx` ni el badge de `AppSidebar.tsx` harán `from('profiles')`.

## Parte 2 — Inbox y badge sobre `cordada_messages`

### `src/pages/Inbox.tsx` (reescritura completa)

Tipos:
```ts
type ConversationRole = 'client' | 'consultant';

interface CordadaConversationTarget {
  cordada_id: string;
  cordada_title: string;
  other_user_id: string;
  other_user_name: string;
  role: ConversationRole; // rol del usuario actual
}

interface Conversation extends CordadaConversationTarget {
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface CordadaMessage {
  id: string;
  cordada_id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
```

`fetchAvailableTargets()`:
1. **Como cliente** — `from('cordadas').select('id, title').eq('client_id', uid)`; por cada cordada, `from('cordada_members').select('consultant:consultant_applications(user_id, full_name)').eq('cordada_id', cid)`. Un target por miembro: `other_user_id = ca.user_id`, `other_user_name = ca.full_name`, `role: 'client'`.
2. **Como consultor** — `supabase.rpc('get_my_consultant_application')` → si existe, `from('cordada_members').select('cordada:cordadas(id, title, client_id, client_name, client_company)').eq('consultant_id', app.id)`. Un target por cordada: `other_user_id = cordada.client_id`, `other_user_name = cordada.client_company || cordada.client_name || 'Cliente'`, `role: 'consultant'`.

`fetchConversations()`:
- `from('cordada_messages').select('*').or('sender_id.eq.<uid>,recipient_id.eq.<uid>').order('created_at', { ascending: false })`.
- Agrupa por `${cordada_id}-${otherUserId}`; enriquece nombres desde el map de `availableTargets` (sin re-consultar `profiles` ni `cordadas`).
- Unread: `recipient_id === uid && !is_read`.

`fetchMessages(cordadaId, otherUserId)`:
- `from('cordada_messages').select('*').eq('cordada_id', cordadaId).or('and(sender_id.eq.<uid>,recipient_id.eq.<other>),and(sender_id.eq.<other>,recipient_id.eq.<uid>)').order('created_at')`.
- Marca leído: `update({ is_read: true }).eq('cordada_id', cid).eq('recipient_id', uid).eq('sender_id', otherUserId).eq('is_read', false)`.

`handleSendMessage()`:
- `insert({ cordada_id, sender_id: uid, recipient_id, message })`.
- Validación 10 000 chars con `toast` (reemplaza `alert`).

Realtime:
- Canal `cordada-messages-inbox`, tabla `cordada_messages`, `filter: recipient_id=eq.<uid>`, evento `*`. Refresca conversaciones y, si el hilo está abierto, los mensajes.
- Cleanup con `supabase.removeChannel`.

Selector "Nueva conversación": filtra targets ya conversados, subtítulo con "Consultor:" o "Cliente:" según `role`.

Layout, estilos y `DashboardLayout` sin cambios.

### `src/components/layout/AppSidebar.tsx`

- `fetchUnreadCount`: `from('cordada_messages').select('*', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('is_read', false)`.
- Canal `sidebar-cordada-unread`, tabla `cordada_messages`, `filter: recipient_id=eq.<user.id>`, evento `*`.

## Parte 3 — Estadísticas migradas a `cordadas`

### `src/pages/Home.tsx` (query de proyectos, L33–L54)
```ts
supabase
  .from('cordadas')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'convocatoria')
```
Se conserva la key `projects` en el objeto para no tocar el render ni los umbrales.

### `src/pages/ConsultantRequirements.tsx` (L108–L143)
```ts
supabase
  .from('cordadas')
  .select('id, client_id')
  .in('client_id', clientIds)
  .eq('status', 'convocatoria')
```
El `.filter(p => p.client_id === req.client_id).length` posterior sigue igual.

## Ajuste adicional (mismo turno)

Para que la Corrección 1 no deje código consultor apuntando a la tabla directa:

- `src/pages/MisCordadas.tsx:20-40` — reemplazar el `from('consultant_applications').select('id').eq('user_id', user.id).maybeSingle()` por `supabase.rpc('get_my_consultant_application')` y usar `data?.[0]?.id`.
- `src/pages/MisCordadaDetail.tsx:29` — mismo reemplazo dentro del `Promise.all`.

Ningún cambio de UI en esas pantallas.

## Fuera de alcance

- `projects`, `project_messages`, `discarded_projects`, `proposals.project_id`, `proposals.is_legacy` — Parte 4.
- `CordadasAbiertas.tsx`, `Dashboard.tsx`, editor `OpenFiltersEditor.tsx` — no se tocan.
- No se agrega ninguna policy `SELECT` a `consultant_applications`.

## Orden de ejecución

1. Migración de Corrección 1 (aprobación explícita).
2. `Inbox.tsx`, `AppSidebar.tsx`, `MisCordadas.tsx`, `MisCordadaDetail.tsx`.
3. `Home.tsx`, `ConsultantRequirements.tsx`.

## Reporte final esperado

Archivos tocados:
- Migración: `get_my_consultant_application`, `owns_consultant_application`, policy `Consultants can view their own memberships`.
- `src/pages/Inbox.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/pages/MisCordadas.tsx`
- `src/pages/MisCordadaDetail.tsx`
- `src/pages/Home.tsx`
- `src/pages/ConsultantRequirements.tsx`

Verificación manual sugerida: (a) consultor entra a `/mis-cordadas` y ve sus cordadas; (b) cliente y consultor intercambian mensajes en Inbox, badge se actualiza en realtime, nombres visibles en ambos lados sin leer `profiles`; (c) Home y ficha de cliente en `ConsultantRequirements` muestran conteos de cordadas en `convocatoria`.
