Objetivo: En la página `/auth`, tanto el bloque de marca del panel lateral (desktop) como el logo móvil dentro de la tarjeta de formularios deben funcionar como enlaces que devuelvan al usuario al homepage (`/`).

Cambios a realizar en `src/pages/Auth.tsx`:

1. **Importar `Link`** desde `react-router-dom` junto al `useNavigate` existente.
2. **Panel lateral (desktop)**: envolver el bloque de marca (icono + texto "CORDADA" + "Ecosistema de Consultoría") en un componente `<Link to="/">`. Mantener el estilo visual actual y añadir `hover:opacity-80 transition-opacity` para indicar que es clickeable.
3. **Header móvil**: envolver el logo y texto "CORDADA" dentro de `<CardHeader>` en un `<Link to="/">` con el mismo tratamiento visual.
4. **Verificación**: confirmar que la navegación a `/` funciona en ambas vistas sin romper el layout ni los estilos existentes.

No se requieren cambios en backend, estado ni en otros componentes.