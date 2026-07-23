# Botón "Atrás" en vistas de postulación

Agregar un ícono de flecha (`ArrowLeft` de lucide-react) con texto "Volver" en la esquina superior izquierda de las siguientes vistas públicas, para regresar a la vista previa (o al Home si no hay historial).

## Vistas afectadas

1. **Consultores**
   - `src/pages/ConsultantAssessment.tsx` — diagnóstico de madurez
   - `src/pages/ConsultantActivate.tsx` — activación por invitación

2. **Empresas consultoras (Firmas)**
   - `src/pages/FirmDiagnostic.tsx` — diagnóstico de firma
   - `src/pages/FirmActivate.tsx` — activación por invitación

3. **Clientes / Empresas**
   - `src/pages/BusinessDiagnostic.tsx` — diagnóstico empresarial
   - `src/pages/Auth.tsx` — registro/login (donde ingresan clientes y partners)

4. **Partner**
   - Los partners se registran vía `/auth`, ya cubierto arriba. Si existiera una vista dedicada de onboarding partner (no la hay actualmente), se aplicaría el mismo patrón.

## Comportamiento

- Botón `variant="ghost"` con `ArrowLeft` + texto "Volver".
- Posicionado arriba a la izquierda del contenido principal, dentro del contenedor existente.
- Handler: `navigate(-1)` si `window.history.length > 1`, si no `navigate('/')`.
- En pantallas de confirmación/éxito (ej. recepción de postulación de firma), el botón regresa al Home en vez de al formulario ya enviado.

## Detalles técnicos

- Reutilizar `useNavigate` de `react-router-dom` (ya importado en varios de estos archivos).
- No modificar layouts internos ni lógica de negocio; solo agregar el elemento visual.
- No agregar el botón en vistas dentro de `DashboardLayout` (ya autenticadas), pues el alcance es "postulación".
