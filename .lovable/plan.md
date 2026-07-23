# Botón "Volver" solo en la vista inicial de cada formulario

El botón actual está en modo `floating` (fixed) y bloquea los formularios. Debe:
1. Ser **inline** (no fijo), sin cubrir campos.
2. Aparecer **solo en la pantalla inicial** de cada flujo, no durante el llenado avanzado, ni en pantallas de resultado/confirmación.

## Definición de "vista inicial" por flujo

- **`ConsultantAssessment`** (`src/components/Assessment.tsx`) → pantalla `welcome` (`WelcomeScreen`). Ocultar en `enrollment`, `questions`, `results`.
- **`BusinessDiagnostic`** (`src/components/business/BusinessAssessment.tsx`) → pantalla `welcome` (`BusinessWelcomeScreen`). Ocultar en `questions` y `results`.
- **`FirmDiagnostic`** → el formulario es una sola vista larga; mostrar el botón arriba del encabezado del formulario. Ocultar en la pantalla `Confirmation` (post-envío).
- **`ConsultantActivate`** y **`FirmActivate`** → mostrar solo cuando `phase === 'ready'` (el usuario aún no envió). Ocultar en `loading`, `invalid`, `activating`, `done`.
- **`Auth`** → mostrar en la vista principal (formulario de login/registro). Es de por sí la vista inicial.

## Cambios

- `src/pages/ConsultantAssessment.tsx` y `src/pages/BusinessDiagnostic.tsx`: quitar `<BackButton floating />`. Mover el botón al `WelcomeScreen` / `BusinessWelcomeScreen` respectivo, inline en la parte superior.
- `src/pages/FirmDiagnostic.tsx`: quitar `floating`, colocar `<BackButton />` inline dentro del contenedor `max-w-4xl`, antes del encabezado (solo en la rama que renderiza el formulario, no en `Confirmation`).
- `src/pages/ConsultantActivate.tsx` y `src/pages/FirmActivate.tsx`: quitar `floating`, colocar `<BackButton />` inline solo dentro del bloque `phase === 'ready'` (arriba del formulario).
- `src/pages/Auth.tsx`: quitar `floating`, colocar `<BackButton />` inline dentro de la columna del formulario (arriba del `Card`), tanto en desktop como en móvil.
- `src/components/BackButton.tsx`: sin cambios funcionales.
