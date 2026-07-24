
# Rediseño del bloque de credibilidad en Home

## Objetivo

Eliminar la sección de "frases motivacionales" del Home público y dejarla en blanco (sin bloque) hasta que la plataforma tenga tracción real: **≥ 20 consultores aceptados y ≥ 10 empresas registradas**. En ese momento (y solo entonces), aparecen las estadísticas reales.

Beneficios:

- Deja de mostrar métricas o mensajes que evidencian que la plataforma aún está vacía.
- Cierra el hallazgo funcional de los `HEAD 401` a `cordadas` y `consultant_applications` (hoy anon no puede contarlos), sin abrir RLS.

## Cambios

### 1. Backend — RPC pública para el conteo

Nueva función `public.get_public_platform_stats()`:

- `SECURITY DEFINER`, `STABLE`, `search_path = public`.
- Devuelve tres enteros: `consultants_accepted`, `companies`, `cordadas_convocatoria`.
- Cuenta:
  - `consultant_applications` con `status = 'aceptado'`.
  - `client_companies` (total de filas).
  - `cordadas` con `status = 'convocatoria'`.
- `GRANT EXECUTE` a `anon` y `authenticated`. Sin acceso a filas: solo enteros agregados, no expone datos individuales.

### 2. Frontend — `src/pages/Home.tsx`

- Reemplazar el `Promise.all` de tres `select head:true` por una sola llamada `supabase.rpc('get_public_platform_stats')`.
- Mantener las constantes `CONSULTANT_THRESHOLD = 20` y `COMPANY_THRESHOLD = 10`.
- Nuevo comportamiento del bloque bajo el hero:
  - **Si aún no hay datos cargados** (`isLoading` o `!data`): no renderizar la sección (sin skeleton, sin bloque).
  - **Si `consultants < 20` o `companies < 10`**: no renderizar la sección. El Home pasa directo del hero a "Todo lo que necesitas en una plataforma".
  - **Si se cumplen ambos umbrales**: renderizar el grid de 4 stats reales (Consultores, Empresas, Desafíos, Satisfacción 95%).
- Eliminar del archivo:
  - El arreglo `motivationalQuotes` completo.
  - La rama `else` que renderiza el grid de citas.
  - El import de `Quote` de `lucide-react` (queda huérfano).

### 3. Cache y refresh

- Conservar `staleTime: 5 min` en el `useQuery` para no bombardear la RPC.
- No se necesita invalidación manual: cuando se crucen los umbrales, el bloque aparecerá al siguiente refetch/navegación.

## No se toca

- Hero, Features, "¿Cómo funciona?", CTA, Footer y el acceso admin discreto (`•`) permanecen idénticos.
- RLS de `cordadas`, `consultant_applications` y `client_companies` no se modifica.
- Umbrales siguen siendo 20/10; si se quieren ajustar es un cambio de constante posterior.

## Verificación

1. `supabase.rpc('get_public_platform_stats')` devuelve los tres conteos correctos, tanto para `anon` como para `authenticated`.
2. Home público (`/`): entre el hero y "Todo lo que necesitas..." **no hay bloque**. Consola sin `401`.
3. Simulación de umbral cumplido (query directa en DB o insertando datos de prueba): al recargar `/`, aparece el grid de 4 estadísticas reales.
4. `rg "motivationalQuotes|Quote" src/pages/Home.tsx` → sin resultados.
