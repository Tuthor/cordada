
## Diagnóstico del flujo actual

Hoy existen **dos puertas paralelas** para consultores, sin conexión entre ellas:

1. **Evaluación pública** (`/evaluacion-consultor`) crea un registro en `consultant_applications` con estado `pendiente`. El admin lo aprueba, pero eso **no crea un usuario** — el consultor aceptado queda sin acceso.
2. **Registro libre** (`/auth`) permite a cualquiera crear una cuenta como `consultant` **sin evaluación previa**, saltándose el filtro de calidad.

## Objetivo

Un único camino: **evaluación → aprobación admin → invitación privada por email → aceptar Código de Conducta y Consentimiento de Datos Personales → crear cuenta** ligada a la aplicación aprobada.

## Cambios

### 1. Cerrar el auto-registro de consultores
- En `src/pages/Auth.tsx`: quitar la opción "Consultor" del selector de tipo de cuenta.
- Mensaje sustituto: *"¿Eres consultor? El acceso es por invitación tras aprobar la evaluación de madurez."* + link a `/evaluacion-consultor`.
- Ajustar el trigger `handle_new_user_role` para que **rechace** `consultant` desde signup público (el rol se asigna solo desde la edge function de activación con service_role).

### 2. Aprobación del admin genera invitación
En `ApplicationDetailDialog` / `ApplicationsPanel`, al marcar una aplicación como `aceptado`:
- Se genera un `invitation_token` (uuid) con expiración configurable (ver punto 5).
- Se envía email al postulante con link privado: `https://<app>/consultor/activar?token=<uuid>`.
- Nuevos botones en el panel admin sobre cada aplicación aceptada:
  - **Reenviar invitación** (regenera token si expiró).
  - **Copiar link** de activación.
  - **Eliminar postulación** (borra la aplicación y, si ya activó cuenta, también el usuario asociado).

### 3. Página privada de activación `/consultor/activar`
Nueva `ConsultantActivate.tsx` (ruta pública, solo funciona con token válido):
1. Valida el token vía edge function (retorna solo `email` + `full_name` si es válido).
2. Muestra el **Código de Conducta CORDADA** (scrollable) — checkbox obligatorio "He leído y acepto el Código de Conducta".
3. Muestra el **Consentimiento de Tratamiento de Datos Personales** (Ley 19.628 Chile, actualizada por Ley 21.719) — checkbox obligatorio.
4. Campos: contraseña + confirmación.
5. Al enviar → edge function `activate-consultant` (service_role):
   - Crea usuario (`auth.admin.createUser`, email confirmado).
   - Asigna rol `consultant` en `user_roles`.
   - Crea `profiles` y `consultant_profiles`.
   - Vincula `consultant_applications.user_id`, marca `invitation_used_at`, `code_of_conduct_accepted_at`, `data_consent_accepted_at`.
   - Frontend hace `signInWithPassword` y redirige a `/dashboard`.

### 4. Textos legales (borradores iniciales, editables)

**Código de Conducta CORDADA** (`src/data/codeOfConduct.ts`) — cubrirá:
- Compromiso con la excelencia y responsabilidad profesional.
- Confidencialidad absoluta sobre información del cliente y de la cordada.
- Manejo de conflictos de interés: divulgación proactiva.
- No competencia desleal con CORDADA ni contacto directo con clientes fuera de la plataforma durante la vigencia del desafío y 12 meses posteriores.
- Trato respetuoso e inclusivo con clientes, pares y el equipo CORDADA.
- Cumplimiento de plazos, entregables y rituales (Brief, Chequeo, Cierre).
- Uso responsable de la marca y de los canales de la plataforma.
- Consecuencias del incumplimiento: suspensión o expulsión del ecosistema.

**Consentimiento de Datos Personales** (`src/data/dataConsent.ts`) — cubrirá, según Ley 19.628 / 21.719 (Chile):
- Identificación del responsable (CORDADA).
- Datos que se recopilan (identificación, contacto, trayectoria profesional, resultados de evaluación, participación en desafíos).
- Finalidades: matchmaking, evaluación de madurez, comunicación con clientes, gestión operativa del ecosistema.
- Base de licitud: consentimiento expreso del titular.
- Destinatarios: clientes de CORDADA que reciben propuestas de equipos donde el consultor es sugerido.
- Plazo de conservación y derechos ARCO (Acceso, Rectificación, Cancelación, Oposición) + canal para ejercerlos.
- No transferencia internacional sin nuevo consentimiento.

> Los textos serán borradores editables — el usuario podrá refinarlos después.

### 5. Parametrización de la vigencia del token
- Nueva tabla mínima `public.platform_settings` (key/value) o columna en configuración existente para guardar `consultant_invitation_ttl_days` (default: 14).
- Panel admin: pequeña sección "Configuración" en Orquestación para editar el valor.
- La edge function de invitación lee ese valor al generar el token.

### 6. Migración de consultores de prueba ya aceptados
- Los 12 consultores de prueba actuales quedan como están en `consultant_applications` (sin `user_id`).
- Desde el panel admin, con los nuevos botones "Enviar invitación" / "Copiar link" / "Eliminar", el usuario decide caso a caso.

## Cambios técnicos resumidos

**Migración DB**:
```sql
ALTER TABLE public.consultant_applications
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN invitation_token uuid,
  ADD COLUMN invitation_expires_at timestamptz,
  ADD COLUMN invitation_used_at timestamptz,
  ADD COLUMN code_of_conduct_accepted_at timestamptz,
  ADD COLUMN data_consent_accepted_at timestamptz;

CREATE UNIQUE INDEX ON public.consultant_applications(invitation_token)
  WHERE invitation_token IS NOT NULL;

CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- + GRANT, RLS (solo admin escribe; lectura por has_role admin o edge functions).
INSERT INTO public.platform_settings(key, value)
  VALUES ('consultant_invitation_ttl_days', '14'::jsonb);
```

**Edge functions nuevas** (service_role):
- `send-consultant-invitation` — genera token, guarda, envía email vía la infraestructura de emails de Lovable Cloud.
- `validate-consultant-invitation` — valida token, retorna datos mínimos.
- `activate-consultant` — crea usuario + rol + profiles + marca aceptación de código y consentimiento.
- `delete-consultant-application` — borra postulación y usuario asociado si existe.

**Emails**: Se usará la infraestructura de emails de Lovable Cloud (requiere dominio propio configurado). Si aún no hay dominio, se guiará al usuario a configurarlo antes de que las invitaciones puedan enviarse; mientras tanto, el botón "Copiar link" permite operar manualmente.

**Trigger `handle_new_user_role`**: se ajusta el `IN (...)` para excluir `'consultant'`.

**Rutas**: `/consultor/activar` como ruta pública en `App.tsx`.

## Fuera de alcance
- Flujo de suspensión/expulsión de consultores (solo lo mencionamos en el Código).
- Auditoría avanzada de aceptaciones legales más allá del timestamp.
- Traducciones de los textos legales.
