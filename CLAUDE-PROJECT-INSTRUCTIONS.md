# CLAUDE — Instrucciones del Proyecto Tablero Rö

## Contexto

Este es el tablero semanal personal de Rö. Es un archivo HTML único (`index.html`) sin framework ni build. Se despliega en GitHub Pages.

**Repo:** https://github.com/vientonorte/table-ro  
**Live:** https://vientonorte.github.io/table-ro  
**Stack:** HTML + CSS + JS vanilla · Google Identity Services · Google Calendar API v3 · localStorage

---

## Arquitectura del archivo

### Secciones principales de `index.html`

| Sección | Descripción |
|---------|-------------|
| `TOKENS (:root)` | Variables CSS de color por categoría |
| `CAL {}` | Mapa de categorías → color + label |
| `EVENTS []` | Array de eventos hardcodeados del mes |
| `BUJO_INIT []` | Tareas iniciales precargadas del BuJo p.41 |
| `DRAG ENGINE` | Drag & drop entre columnas |
| `makeCard()` | Renderiza cada card del tablero |
| `renderWeek()` | Renderiza las 7 columnas de la semana activa |
| `DRAWER` | Panel lateral BuJo |
| `CALENDAR SYNC` | ICS parser + sync por fuente |
| `CATEGORY TOGGLES` | Filtros de leyenda |
| `QUICK-ADD MODAL` | Modal para agregar tareas manualmente |
| `ADMIN / FAQ / RECURSOS` | Modal de configuración con tabs |
| `💾 GUARDAR / CARGAR` | Persistencia localStorage |
| `🔑 GOOGLE OAUTH` | Google Identity Services token flow |
| `📅 GCAL API v3` | fetchGCalEvents + pushEventToGCalAPI |

---

## Simbología BuJo de Rö

| Símbolo | Categoría | Color |
|---------|-----------|-------|
| ● | Personal | #EC4899 (rosa) |
| ○ | Bienestar | #EC4899 (rosa) |
| ◆ | Vínculos | #7C3AED (morado) |
| > | Camila | #10B981 (verde) |
| * | Trabajo | #F97316 (naranja) |
| — | Personal | #EC4899 (rosa) |

---

## Credenciales (no sensibles — OAuth público)

- **Client ID:** `5033046467-kgd7gl4tekb4fkt90jq32rob4evmgnmn.apps.googleusercontent.com`
- **Cuenta personal:** `gaete.gaona@gmail.com`
- **Calendario Camila:** `c.camilapalma@gmail.com`
- **Finanzas gcalId:** `9616f51a807e24559b4df624c70d7fe1d81de62f9aa8baf44c1190db5887b12f@group.calendar.google.com`

---

## Reglas para modificar el código

1. **No romper el archivo único** — todo va en `index.html`
2. **Mantener simbología BuJo** — Camila=verde, Vínculos=morado, Personal/Bienestar=rosa, Trabajo/Finanzas=naranja
3. **Sin dependencias externas nuevas** — solo Google Fonts y GIS (ya incluidos)
4. **localStorage keys:** `tablero_states_ro`, `tablero_extra_ro`, `gcal_client_id`, `gcal_sura_id`, `ics_*`
5. **Zona horaria:** siempre `America/Santiago`
6. **Al agregar eventos al array EVENTS:** formato `{iso:'YYYY-MM-DD', title:'...', cal:'categoría', time:'HH:MM'}` o `allDay:true`

---

## Tareas frecuentes

### Agregar evento al tablero
Añadir objeto al array `EVENTS` en el JS:
```js
{iso:'2026-03-15', title:'Mi evento', cal:'personal', time:'10:00'}
```

### Cambiar mes / año
Actualizar el `<h1>` del topbar y el array `EVENTS` con las fechas del nuevo mes.

### Actualizar BuJo inicial (p.XX)
Editar el array `BUJO_INIT` con los nuevos items de la página del BuJo.

### Agregar nueva fuente de calendario
Agregar objeto al array `SOURCES` con `id`, `name`, `cal`, `color`, `icon`, `gcalId`, `icsUrl`, `lsKey`.

---

## Flujo BuJo → Tablero

1. Rö sube foto del BuJo al drawer o la comparte en el chat
2. Claude analiza la imagen con el protocolo BuJo (transcripción + análisis semántico)
3. Resultado en formato: `● texto`, `◆ texto`, `> texto`, etc.
4. Rö pega el texto en el área del drawer → clic "✨ Procesar"
5. Marca items → "＋ Agregar al tablero"
