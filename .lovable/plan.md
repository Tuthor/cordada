## Plan: Ajustes puntuales en Home.tsx

### Cambios a realizar (solo en `src/pages/Home.tsx`)

1. **Quitar dato dummy de estadísticas**
   - Eliminar la entrada `{ value: '95%', label: 'Satisfacción' }` del array `stats`.
   - Ajustar la grilla de estadísticas de `grid-cols-2 md:grid-cols-4` a `grid-cols-1 sm:grid-cols-3` para mostrar bien las tres métricas reales: Consultores, Empresas, Desafíos.
   - No modificar la lógica de umbrales ni la llamada a `get_public_platform_stats`.

2. **Quitar claim no sustentada del hero**
   - Reemplazar el texto del badge `"Plataforma #1 de Consultoría B2B"` por `"Ágora de Colaboración Estratégica"`.
   - Mantener el ícono `Star` y el estilo actual del badge (`bg-mountaineer-red`, etc.).

3. **Unificar terminología a "Desafío"**
   - En la tarjeta "Para Empresas":
     - `"Publica tu proyecto con requisitos específicos"` → `"Publica tu desafío con requisitos específicos"`
     - `"Gestiona el proyecto y la comunicación en un solo lugar"` → `"Gestiona el desafío y la comunicación en un solo lugar"`
   - Revisar el resto del archivo y reemplazar cualquier otra aparición visible de `"proyecto/proyectos"` por `"desafío/desafíos"`, sin tocar nombres de variables, rutas ni comentarios.

### Lo que NO se tocará
- Lógica de umbrales (`CONSULTANT_THRESHOLD`, `COMPANY_THRESHOLD`, `showRealStats`).
- Fuente de datos (`get_public_platform_stats`).
- Rutas, estilos globales ni otros componentes.