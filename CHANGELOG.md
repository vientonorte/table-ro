# Changelog — Tablero Rö

All notable changes to this project will be documented in this file.

---

## [1.1.2] — 2026-04-05

### 🐛 Bugfixes

- **ctag vacío**: restauradas variables `${ci.c}` y `${ci.l}` en `makeCard()` que fueron eliminadas por un `perl` en v1.1.1, dejando las etiquetas de categoría sin color ni texto.
- **parsePaste() rechazaba texto libre**: el análisis BuJo manual solo aceptaba líneas con viñeta (●◆—○-*>$•). Ahora acepta cualquier línea de texto como tarea personal.
- **changeCat() no funcionaba**: consecuencia directa del ctag vacío — el `<span>` no tenía texto visible para hacer clic.

### 📤 Sync bidireccional a calendarios

- **Botón 📅 en todas las tarjetas locales**: antes solo aparecía en tarjetas con permiso `rw` (solo Personal). Ahora aparece en toda tarjeta no importada desde calendario.
- **Routing por categoría**: `syncToGCal()` ahora resuelve el `gcalId` correcto según la categoría de la tarjeta (Personal → gaete.gaona@gmail.com, Finanzas → grupo finanzas, Camila → c.camilapalma@gmail.com).
- **Nuevo `syncAllToGCal()`**: botón "📤 Enviar a Calendarios" en el menú ☰ que empuja TODAS las tarjetas locales a sus calendarios de destino en un solo clic.
- **`getGCalIdForCal()` helper**: mapea `dataset.cal` → `gcalId` de SOURCES, con fallback a cuenta principal.

## [1.1.0] — 2026-04-04

### 📱 Mobile-first responsive

- Rediseño completo de media queries para pantallas ≤720px.
- Board semanal ahora hace scroll horizontal con CSS snap (una columna por pantalla en móvil).
- Touch targets mínimos 44px en botones, checkboxes y controles (WCAG 2.5.8).
- Drawer BuJo ocupa 100vw en mobile con scroll interno.
- Modales ocupan 96–98vw, campos de formulario con min-height 44px.
- Topbar colapsa: oculta chip y separador, scroll horizontal en acciones.
- Pipeline BuJo en scroll horizontal sin wrap.
- Admin tabs en scroll horizontal para pantallas angostas.

### ♿ Accesibilidad

- Filtros de categoría con `role="button"`, `tabindex="0"`, `aria-label` y `aria-pressed`.
- Pipeline BuJo con `role="tablist"` y pills con `role="tab"` / `aria-selected`.
- Paneles de paso con `role="tabpanel"` y `aria-labelledby`.
- `<input type="file">` con `aria-label` explícito (BuJo e importar JSON).
- Filtros de categoría BuJo (ftags) con `role="button"` y `tabindex="0"`.
- Fix contraste en `.day-count`, `.sum-label`, `.upload-sub`, `.src-desc` (de `#64748B` a `#94a3b8`).

### 🔄 Flujo BuJo simplificado (5 → 3 pasos)

- **Paso 1 — Capturar**: fusiona subir fotos + entrada de texto manual en un solo paso.
- **Paso 2 — Analizar**: la IA procesa fotos y muestra revisión inline (antes eran 2 pasos separados).
- **Paso 3 — Agregar**: confirma e inserta ítems al tablero.
- Nueva función `goToAnalyze()`: valida que haya input (foto o texto), auto-procesa texto manual con `parsePaste()`, y lanza análisis IA si hay fotos con API key configurada.
- Si no hay IA disponible, el flujo manual funciona 100% sin bloqueos.
- Reducción de errores: validación antes de avanzar (no se puede ir a paso 2 sin contenido).

### 📅 Contenido

- Título actualizado de "MARZO 2026" a "ABRIL 2026".
- Bump de assets a v1.1.0 para invalidar caché.

## [1.0.6] — 2026-04-04

### 🚑 Hotfix runtime — optional chaining corrupto

- Corregido `?.` malformado en 7 líneas de `js/app.js` (`? .` → `?.`) que impedía el parseo completo del script.
- El tablero solo mostraba la topbar, sin columnas ni eventos.
- Causa: VS Code auto-formatter reescribe `?.` como `? .` al guardar.
- Bump de assets a `1.0.6` para invalidar caché en producción.

### 🔍 QA intensivo

- Verificada sintaxis con `node --check` post-fix.
- Todos los flujos core validados: renderWeek, drag & drop, BuJo drawer, filtros, modales.

## [1.0.5] — 2026-03-14

### 🤖 Flujo IA anti-cuota

- El análisis BuJo ahora reintenta automáticamente con otros proveedores configurados cuando detecta error de cuota/límite.
- Si no hay API keys disponibles, el flujo pasa directo a modo manual (Paso 4) sin bloquear al usuario.

### ✨ Simplificación UX/UI

- Simplificado el Paso 2 de BuJo eliminando controles de configuración no esenciales del flujo diario.
- Mantenido un estado claro de disponibilidad IA y botón de continuación manual.

### 🔁 Cache busting

- Actualizado versionado de assets en [index.html](/Users/ro/Documents/GitHub/table-ro/index.html) a `1.0.5`.

## [1.0.4] — 2026-03-14

### 🚑 Hotfix runtime + cache busting

- Corregido optional chaining malformado en [js/app.js](/Users/ro/Documents/GitHub/table-ro/js/app.js) (`? .` -> `?.`) que rompía el parseo y podía dejar la interfaz en blanco.
- Actualizado versionado de assets en [index.html](/Users/ro/Documents/GitHub/table-ro/index.html) a `1.0.4` para forzar recarga limpia de JS/CSS en producción.

## [1.0.3] — 2026-03-14

### 🚑 Hotfix runtime

- Corregido optional chaining malformado en [js/app.js](/Users/ro/Documents/GitHub/table-ro/js/app.js) que provocaba fallo de ejecución del frontend.
- Actualizado versionado de assets en [index.html](/Users/ro/Documents/GitHub/table-ro/index.html) a `1.0.3` para invalidar caché de JS/CSS en producción.

## [1.0.2] — 2026-03-14

### 🔁 Cache busting del fix

- Actualizada la versión visible y las URLs de assets en [index.html](/Users/ro/Documents/GitHub/table-ro/index.html) a `1.0.2` para invalidar cualquier JS roto cacheado en producción.

## [1.0.1] — 2026-03-14

### 🧰 Fix de despliegue

- Añadido cache busting en los assets estáticos de [index.html](/Users/ro/Documents/GitHub/table-ro/index.html) para forzar recarga de [css/styles.css](/Users/ro/Documents/GitHub/table-ro/css/styles.css) y [js/app.js](/Users/ro/Documents/GitHub/table-ro/js/app.js) en GitHub Pages y navegadores con caché agresiva.
- Actualizada la versión visible del documento a `1.0.1`.

### 🐛 Fixes funcionales

- Corregidos errores de sintaxis en [js/app.js](/Users/ro/Documents/GitHub/table-ro/js/app.js) que podían dejar la interfaz completa sin renderizar.
- El análisis BuJo ahora reemplaza la lista de revisión con resultados reales en lugar de mezclar ítems demo.
- Los ítems BuJo agregados al tablero intentan respetar la fecha detectada de la imagen en vez de caer siempre en el primer día visible.

## [1.0.0] — 2026-03-14

### 🚀 Lanzamiento a producción — v1.0

#### Arquitectura
- **Refactoring multi-archivo**: el monolito `index.html` (1,395 líneas) fue separado en:
  - `index.html` — estructura HTML limpia (347 líneas)
  - `css/styles.css` — estilos globales con documentación por sección (302 líneas)
  - `js/app.js` — lógica de aplicación con JSDoc completo (850 líneas)
- Añadido `<meta name="version" content="1.0.0">` y título actualizado a `Rö · v1.0`
- `js/app.js` cargado con `defer` para mejor performance de carga

#### Documentación
- `js/app.js` — header JSDoc completo con mapa de todas las funcionalidades (11 módulos)
- `css/styles.css` — header con índice de secciones CSS
- `README.md` — documentación senior completa con Design Thinking:
  - Arquitectura de módulos
  - Guía de desarrollo local
  - Mapa completo de funcionalidades
  - Flujos de usuario documentados
  - Guía de contribución
- `CLAUDE-PROJECT-INSTRUCTIONS.md` — actualizado con nueva arquitectura multi-archivo
- `CHANGELOG.md` — este archivo

#### Sin cambios en funcionalidad
- Toda la lógica de negocio, estilos y HTML son idénticos a la versión anterior
- Compatibilidad 100% con datos guardados en localStorage
- Sin nuevas dependencias

---

## [0.9.x] — Versiones previas (sin versionado formal)

Versiones internas de desarrollo:
- `index.v6.html` — v6 archivada (marzo 2026)
- Iteraciones previas: BuJo drawer, sync GCal, multi-AI, drag & drop, permisos por fuente
