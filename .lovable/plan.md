# Ingreso de Empresas Consultoras — Plan actualizado

Hoy las empresas consultoras se auto-registran desde `/auth` sin evaluación. Se alinean al estándar de consultores individuales: postulación evaluada + activación privada por invitación, con un cuestionario diferenciado que evalúa a la firma. Los líderes representantes se capturan dinámicamente durante la postulación para generar enlaces individuales de evaluación que el postulante distribuye por sus propios medios.

## 1. Autenticación pública

- Quitar la opción **"Empresa de Consultoría"** del selector de rol en `Auth.tsx` (queda Cliente y Partner).
- Añadir aviso: *"¿Representas una empresa consultora? El acceso es solo por invitación. Realiza el Diagnóstico de Firma →"*.

## 2. Diagnóstico de firma (`/diagnostico-firma`)

Cuestionario en tres bloques:

**Bloque A — Perfil de la firma**
- Razón social, RUT, sitio web, año de fundación
- Tamaño (nº de consultores, nº de socios), facturación anual (UF)
- Sectores atendidos, áreas de práctica, clientes representativos
- Certificaciones y alianzas

**Bloque B — Consultores líderes representantes (dinámico)**
- Aparece **un solo set de campos** con: Nombre, Cargo, Email corporativo, LinkedIn (opcional)
- Botón **"Agregar otro líder"** que añade una nueva tarjeta con los mismos campos
- Botón **"Eliminar"** por tarjeta (excepto el primero, obligatorio)
- Sin mínimo fijo más allá de 1; sin máximo estricto (validación blanda a 10)

**Bloque C — Escala de madurez de la firma** (1–5)
- Metodología documentada, gestión del conocimiento, aseguramiento de calidad
- Desarrollo interno, capacidad multidisciplinaria, ética/confidencialidad, track record

Al enviar, el postulante ve **solo confirmación de recepción** ("Tu postulación fue recibida. Nuestro equipo la revisará y te contactará.") — sin score.

**Además**, la pantalla de confirmación muestra la sección **"Enlaces para tus líderes"**:
- Por cada líder ingresado, una fila con nombre, cargo, email y su **link único** de evaluación individual.
- Botón **"Copiar"** por líder y un botón **"Copiar todos"** con un mensaje listo para reenviar por email/WhatsApp/etc.
- Nota: *"Copia y envía cada enlace al líder correspondiente por el medio que prefieras. Cada enlace es personal y le permitirá realizar su Diagnóstico de Madurez del Consultor."*

Los enlaces son de la forma `/evaluacion-consultor?firm_token=XYZ&leader=<id>` y precargan nombre, cargo y email del líder al iniciar la evaluación (campos editables por seguridad). Cada enlace queda asociado a la postulación de firma para efectos de trazabilidad.

## 3. Base de datos

Nueva tabla `firm_applications`:
- Datos de firma (bloque A)
- Puntajes por dimensión y global (bloque C) — solo visibles a admin
- Estado: `pending` → `in_review` → `accepted` / `rejected`
- `invitation_token`, `invitation_expires_at`
- Consentimientos de la firma: código de conducta + ley de datos

Nueva tabla `firm_application_leaders`:
- `firm_application_id` (FK)
- `full_name`, `position`, `email`, `linkedin`
- `leader_token` (único, para el enlace individual)
- `assessment_status`: `pending` | `completed`
- `consultant_application_id` (FK opcional, se enlaza cuando el líder completa su evaluación)

GRANTs y RLS solo-admin en ambas tablas. `firm_invitation_ttl_hours` en `platform_settings`.

Extender `consultant_applications` con `source_firm_leader_token` opcional para vincular postulaciones que vengan por enlace de líder.

## 4. Panel de administración

Nueva pestaña **"Firmas"** en Orquestación:
- Lista de postulaciones con estado y puntaje global
- Detalle con bloques A/C, lista de líderes y estado de evaluación individual de cada uno
- Acciones: Aceptar / Rechazar / Eliminar
- Pestaña **Acceso** al aceptar: enviar/reenviar invitación de activación a la firma, copiar link
- Ver enlaces de líderes (por si se necesita reenviar) y estado de cada evaluación

## 5. Activación privada

**`/firma/activar`**:
- Valida token
- Muestra Código de Conducta + Consentimiento Ley 19.628 (obligatorios)
- Crea cuenta con rol `consulting_firm`
- Crea registro en `consulting_firms`
- Los líderes ya evaluados y aprobados quedan enlazados como `firm_members` de la firma; los pendientes de evaluación siguen su curso individual.

**Flujo del líder individual:**
1. El postulante de la firma copia y envía el enlace individual.
2. El líder abre `/evaluacion-consultor?firm_token=...&leader=...`, ve sus datos precargados y realiza la evaluación.
3. Si es aprobado por admin, recibe invitación estándar a `/consultor/activar` (código de conducta + consentimiento de datos).
4. Al activarse, su cuenta queda vinculada automáticamente a la firma postulante.

## 6. Home

En "Para Consultores", CTA secundario **"Postular como empresa consultora"** → `/diagnostico-firma`.

## Detalles técnicos

- Nuevos archivos: `src/data/firmAssessmentData.ts`, `src/types/firmAssessment.ts`, `src/components/firm/FirmAssessment.tsx` (+ Welcome / LeadersStep / Confirmation con enlaces copiables), `src/pages/FirmDiagnostic.tsx`, `src/pages/FirmActivate.tsx`, `src/components/admin/FirmApplicationsPanel.tsx`.
- Edge Functions: `submit-firm-application` (crea firma + líderes + tokens y devuelve enlaces), `send-firm-invitation`, `validate-firm-invitation`, `activate-firm`, `delete-firm-application`.
- `ConsultantAssessment` acepta parámetros `firm_token` y `leader` para precargar datos y registrar la vinculación al enviar.
- Migración: tablas `firm_applications` y `firm_application_leaders` con GRANTs y RLS solo-admin; setting `firm_invitation_ttl_hours`; columna `source_firm_leader_token` en `consultant_applications`.
- `Auth.tsx`: quitar `consulting_firm` del signup público (solo UI; enum del schema se conserva).
- Rutas en `App.tsx`: `/diagnostico-firma` y `/firma/activar`.
- Confirmación tras enviar: mensaje de recepción + tabla de enlaces copiables por líder, sin score.
