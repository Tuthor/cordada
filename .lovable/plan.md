# Documentación técnica completa de CORDADA

Generar un archivo Markdown exhaustivo en `/mnt/documents/CORDADA_Documentacion_Tecnica.md` (persistente y descargable) con toda la información del proyecto para que pueda ser cargado como contexto en Claude.

## Contenido del documento

1. **Encabezado**
   - Nombre: CORDADA — Ecosistema de Consultoría Empresarial
   - Fecha y hora de generación (timestamp real al momento de crear el archivo)
   - Propósito del documento

2. **Visión general del producto**
   - Qué es CORDADA (matchmaking + diagnóstico + orquestación de equipos consultores)
   - Terminología clave (Desafíos, Cordadas, Guía, Rituales)
   - Segmentos: Clientes / Consultores / Firmas / Partners / Admin
   - Tema visual (mountaineering, deep slate blues, rojo mountaineer)

3. **Arquitectura de software**
   - Stack: React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui + React Router + TanStack Query
   - Backend: Lovable Cloud (Supabase) — Auth, Postgres con RLS, Storage, Edge Functions (Deno)
   - Correo: Resend; reCAPTCHA; Lovable AI Gateway
   - Estructura de carpetas relevante (`src/pages`, `src/components`, `src/contexts`, `src/hooks`, `src/data`, `src/types`, `supabase/functions`)
   - Patrones: AuthContext global, roles vía `user_roles` + `has_role()`, tokens de invitación

4. **Rutas de la aplicación** (extraídas de `src/App.tsx`)
   - Públicas: `/`, `/diagnostico-empresarial`, `/evaluacion-consultor`, `/diagnostico-firma`, `/consultor/activar`, `/firma/activar`, `/auth`
   - Autenticadas: `/dashboard`, `/partner`, `/directory`, `/challenges/*`, `/projects/*`, `/inbox`, `/proposals`, `/training`, `/settings`, `/requirements`, `/consultant-requirements`
   - Admin: `/admin/login`, `/admin/dashboard`, `/admin/reset-password`
   - Descripción breve de cada ruta y su propósito

5. **Flujos funcionales principales**
   - Onboarding de consultores (evaluación → aprobación admin → invitación con token → activación con Código de Conducta + Ley 19.628)
   - Onboarding de firmas (diagnóstico + líderes dinámicos → evaluaciones individuales → activación)
   - Onboarding de clientes/partners (registro directo en `/auth`)
   - Ciclo de vida de Desafíos (cliente crea → publica → admin orquesta equipo → cliente aprueba → ejecución)
   - Matchmaking (fórmula de compatibilidad basada en arquetipo + madurez)
   - Rituales (Brief, Chequeo, Cierre)
   - Gestión documental con documentos sensibles (admin + Guía únicamente)
   - Umbral dinámico de homepage (quotes → estadísticas al alcanzar 20 consultores + 10 empresas)
   - Acceso oculto admin vía "•" en footer

6. **Modelo de datos (Base de datos)**
   - Listado de tablas con propósito y columnas clave:
     `profiles`, `user_roles`, `consultant_applications`, `consultant_profiles`, `consultant_evolution_history`, `consultant_requirement_evidence`, `consulting_firms`, `firm_applications`, `firm_application_leaders`, `firm_members`, `client_companies`, `client_requirements`, `cordadas`, `cordada_members`, `cordada_rituals`, `cordada_sensitive_documents`, `courses`, `course_lessons`, `course_progress`, `enrollments`, `partner_courses`, `partner_course_enrollments`, `projects`, `project_messages`, `proposals`, `discarded_projects`, `platform_settings`
   - Enum `app_role`: `client | consultant | consulting_firm | partner | admin`
   - Funciones DB: `has_role`, `handle_new_user`, `handle_new_user_role`, `handle_new_consultant`, `get_safe_profile_data`, `update_updated_at_column`
   - Modelo RLS + patrón `has_role()` para evitar recursión
   - Storage buckets: `proposal-attachments`, `requirement-evidence`, `cordada-attachments`

7. **Edge Functions** (`supabase/functions/`)
   - `activate-consultant`, `activate-firm`
   - `send-consultant-invitation`, `send-firm-invitation`
   - `validate-consultant-invitation`, `validate-firm-invitation`
   - `submit-firm-application`
   - `delete-consultant-application`, `delete-firm-application`
   - `send-enrollment`, `send-password-reset`
   - `public-config`
   - Descripción breve de entradas/salidas y config `verify_jwt`

8. **Seguridad**
   - RLS obligatoria en todas las tablas públicas
   - Roles en tabla separada (nunca en profiles)
   - Rol `consultant` solo asignable vía edge function con service role
   - Tokens de invitación UUID con expiración y uso único
   - Documentos sensibles restringidos por policy
   - Consentimientos versionados (Código de Conducta, Ley 19.628)

9. **Sistema de diseño**
   - Tokens semánticos en `src/index.css`
   - Paleta: deep slate blues + `--mountaineer-red`
   - Tipografía y componentes shadcn tematizados
   - Copyright fijo 2026

10. **Datos de evaluación** (`src/data/`)
    - `assessmentData.ts` (consultor), `businessDiagnosticData.ts` (empresa 32 preguntas 6 dimensiones), `firmAssessmentData.ts` (firma 3 bloques 7 dimensiones), `roleAssessmentData.ts`, `codeOfConduct.ts`, `dataConsent.ts`, `orchestrationData.ts`, `cordadaData.ts`
    - Arquetipos de consultor: experto_silencioso, ex_ejecutivo, tecnico_alto_nivel, consultor_incompleto, independiente_quemado

11. **URLs del proyecto**
    - Preview y publicada (cordada.lovable.app)

## Notas
- Sin secretos, sin project IDs internos, sin URLs de dashboard.
- Documento en español.
- Timestamp real generado con `date` al ejecutar en build mode.
- Al finalizar, exponer link de descarga con `<lov-artifact>` apuntando a `/__l5e/documents/CORDADA_Documentacion_Tecnica.md`.
