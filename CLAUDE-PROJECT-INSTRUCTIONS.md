# CLAUDE — Instrucciones del Proyecto Tablero Rö

## Contexto

Este es el tablero semanal personal de Rö. A partir de v1.0 el proyecto usa arquitectura multi-archivo. Se despliega en GitHub Pages.

**Repo:** https://github.com/vientonorte/table-ro  
**Live:** https://vientonorte.github.io/table-ro  
**Stack:** HTML + CSS + JS vanilla · Google Identity Services · Google Calendar API v3 · localStorage

---

## Arquitectura de archivos (v1.0+)

```
index.html       → estructura HTML (topbar, tablero, modales, drawer BuJo)
css/styles.css   → todos los estilos (variables, componentes, animaciones)
js/app.js        → toda la lógica (datos, render, sync, IA, storage)
```

**No modificar `index.v6.html`** — es archivo de respaldo.

---

## Secciones principales de `js/app.js`

| Sección | Descripción |
|---------|-------------|
| `CAL {}` | Mapa de categorías → color + label |
| `EVENTS []` | Array de eventos hardcodeados del mes |
| `BUJO_INIT []` | Tareas iniciales precargadas del BuJo |
| `SOURCES []` | Fuentes de calendario (Google + ICS) |
| `PERMS_DEFAULT {}` | Permisos por fuente (rw/ro/admin/query) |
| `AI_CFG` | Config de proveedores IA (Claude/OpenAI/Gemini) |
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

## Secciones principales de `css/styles.css`

| Sección | Descripción |
|---------|-------------|
| `:root` | Variables CSS de color por categoría |
| Base | Reset, body, tipografía |
| Topbar | Barra de navegación superior |
| Week board | Grid de 7 columnas |
| Cards | Tarjetas de evento |
| Modales | Quick-add, Sync, Admin |
| Drawer | Panel lateral BuJo |
| Animaciones | Transiciones y utilidades |

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

1. **CSS va en `css/styles.css`** — no agregar `<style>` inline en index.html
2. **JS va en `js/app.js`** — no agregar `<script>` inline en index.html
3. **Mantener simbología BuJo** — Camila=verde, Vínculos=morado, Personal/Bienestar=rosa, Trabajo/Finanzas=naranja
4. **Sin dependencias externas nuevas** — solo Google Fonts y GIS (ya incluidos)
5. **localStorage keys:** `tablero_states_ro`, `tablero_extra_ro`, `gcal_client_id`, `gcal_sura_id`, `ics_*`
6. **Zona horaria:** siempre `America/Santiago`
7. **Al agregar eventos al array EVENTS:** formato `{iso:'YYYY-MM-DD', title:'...', cal:'categoría', time:'HH:MM'}` o `allDay:true`

---

## Tareas frecuentes

### Agregar evento al tablero
En `js/app.js`, añadir objeto al array `EVENTS`:
```js
{iso:'2026-03-15', title:'Mi evento', cal:'personal', time:'10:00'}
```

### Cambiar mes / año
1. Actualizar el `<h1>` del topbar en `index.html`
2. Actualizar el array `EVENTS` en `js/app.js` con las fechas del nuevo mes

### Actualizar BuJo inicial (p.XX)
Editar el array `BUJO_INIT` en `js/app.js` con los nuevos items.

### Agregar nueva fuente de calendario
Agregar objeto al array `SOURCES` en `js/app.js` con `id`, `name`, `cal`, `color`, `icon`, `gcalId`, `icsUrl`, `lsKey`.

### Agregar estilos nuevos
Añadir al final de la sección correspondiente en `css/styles.css`.

---

## Flujo BuJo → Tablero

1. Rö sube foto del BuJo al drawer o la comparte en el chat
2. Claude/GPT/Gemini analiza la imagen con el protocolo BuJo
3. Resultado en formato JSON con ítems categorizados
4. Los ítems aparecen en el drawer con checkboxes
5. Rö marca los que quiere → clic "＋ Agregar al tablero"

