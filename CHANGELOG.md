# Changelog — Tablero Rö

All notable changes to this project will be documented in this file.

---

## [1.7.9] — 2026-07-21

### OAuth

- Default Client ID live: `913158816697-q9ceacnedpeu1sgkoq73hv829dgnlocj…`
- Still purges dead `5033046467…` from localStorage.

## [1.7.8] — 2026-07-21

### OAuth

- Remove dead GCAL_CLIENT_ID default (GeneralOAuthFlow / invalid_client).
- Purge stale localStorage client; require paste of new Web client ID.

## [1.7.6] — 2026-07-21

### Journey · una app, no dos destinos

- **app-rail** full-width: tabs **Semana | Ops** (imposibles de perder)
- Hint: Ops embebido = mismo canvas que `/ops` (no otro producto)
- Chip de capa clickeable para alternar vistas
- `/ops` standalone = fullscreen opcional del mismo board

## [1.7.5] — 2026-07-21

### Local · vault y apps

- Menú **☰ Más**: Obsidian · Editor local · Copiar ruta vault
- Admin **📂 Local**: rutas configurables + URI `obsidian://` / `vscode://` / `cursor://`
- Ops toolbar: 📓 nota ops · 📂 editor
- Best practice: no `file://` desde HTTPS (bloqueo browser)

## [1.7.4] — 2026-07-21

### Ops embed · atomic + responsive

- Segmented control **Semana | Sprint/Ops (/ops) | Full** (BEM atoms/molecules).
- Organism `ops-embed`: toolbar, reload, shell + iframe full-height (`dvh`, safe-area).
- Deep link `?view=ops` · tabs a11y (`role=tablist/tabpanel`).

## [1.7.3] — 2026-07-21

### Capa A one-click

- Admin: **＋ ICS → GCal (A)** (deep link `cid=` al feed Trello) y **📋 Copiar ICS**.
- Docs: URL ICS fija + rename sugerido `Espacio Seguro / Camila`.

## [1.7.2] — 2026-07-21

### Trello ↔ Google (capas A+B+C)

- **Fuente Espacio Seguro** como `type: 'trello'` + `trelloBoardId` (API preferida; ICS fallback).
- **Admin**: status Key/Token/Bridge/OAuth, Sync Trello sin re-pegar secretos, toggle bridge, borrar token.
- **Bridge C**: upsert due → `gaete.gaona@gmail.com` con mapa local + `extendedProperties.private.tableRoTrelloId`.
- **Docs**: `docs/TRELLO-GOOGLE.md` (checklist best practices).
- Cache bust **v1.7.2**.

## [1.6.0] — 2026-06-19

### 🎨 Lectura crómática Clave A — BuJo (Sprint A)

- **`buildBujoPrompt()` v2**: bloque Clave A (rosa/gris/verde/naranja/amarillo) cuando hay imágenes.
- **Schema JSON**: `color_trace`, `source_type` por ítem; warnings de conflicto color/símbolo.
- **Post-proceso** `normalizeClaveAExtraction()`: prioriza color, amarillo→`note`, anonimización `[INSTITUCIÓN]` en `details`.
- **UI**: chips de color en revisión BuJo, panel hallazgos cromáticos, filtro «Con color».
- **Admin**: toggles `chromaticReading` y `prioritizeColor` (+ flags de extracción).
- **PWA**: service worker `table-ro-v8`.

## [1.5.0] — 2026-06-19

### 🚀 Production Hardening (Sprint 2)

- **CI a11y**: job `pa11y-ci` WCAG2AA en `index.html`, `privacy.html`, `terms.html`.
- **PWA icons**: `icons/icon.svg` + `icons/icon-maskable.svg` en manifest.
- **HANDOFF.md**: runbook deploy, Worker, rollback, checklist release.
- **DEPLOY-GITHUB-PAGES.md**: bump SW version, Worker, tag release.
- **DESIGN-SPRINT.md**: plan end-to-end design thinking → producción.

### 🔒 Security & Privacy by Design (Sprint 0)

- **API keys IA**: ya no se persisten en `localStorage` en producción; migración automática borra keys legacy.
- **Proxy Worker**: flujo IA en prod requiere URL de Cloudflare Worker; keys directas solo en dev local.
- **XSS**: `escapeHtml()` en cards, ítems BuJo, errores sync y mensajes IA.
- **CSP**: Content-Security-Policy en `index.html` (script GSI, connect-src acotado).
- **Privacidad**: `privacy.html` y `terms.html` v2 — IA, BuJo, Worker, Ley 21.719 Chile.
- **Consent banner**: aviso primera visita (`tablero_consent_ro`).
- **A11y modales**: focus trap + Escape + restore de foco.
- **PWA**: service worker `table-ro-v7`.

## [1.4.0] — 2026-05-07

### 🎮 Onboarding gamificado para nuevos usuarios

- Se agregó un flujo de onboarding de 5 pasos que aparece únicamente en la primera sesión.
- **Bienvenida personalizada**: ingresa tu nombre para recibir mensajes personalizados en todo el flujo.
- **Tour del tablero**: resumen visual de las funciones principales (columnas, filtros, sync, guardado).
- **Primera acción asistida**: botón que abre el modal de nueva tarea y detecta automáticamente cuándo se crea la primera tarea para avanzar al paso de recompensa.
- **Sistema de XP**: 20 XP al iniciar, 30 XP al completar el tour, 50 XP al crear la primera tarea, 20 XP al terminar. Total máximo: 120 XP.
- **Recompensa con badge**: paso 4 muestra badge animado y total de XP acumulado.
- **Checklist de perfil listo**: paso 5 con accesos directos a Sync y Bullet Journal.
- **Saltar y retomar**: opción "Saltar tutorial" disponible en todo momento; se puede reiniciar desde ⚙️ Admin → Zona de peligro → Reiniciar tutorial.
- **Persistencia inteligente**: estado guardado en localStorage `tablero_onboarding_ro`; no vuelve a mostrarse si ya fue completado o omitido.

## [1.3.1] — 2026-05-07

### 🐛 Fix — duplicados de eventos sincronizados

- Se agregó un guard de sincronización por fuente (`SYNC_IN_FLIGHT`) para evitar corridas concurrentes de `syncSource()` sobre la misma fuente.
- Se corrigió la limpieza previa a sync para eliminar eventos sincronizados por `srcId`/`cal` aunque no tengan `uid`.
- Se agregó deduplicación defensiva de eventos sincronizados (`dedupeSyncedEvents()`), aplicada después de sync y al cargar caché (`loadSyncedCache`).
- Resultado esperado: no se duplican tarjetas por re-sync solapado ni por arrastre de caché histórica.

## [1.2.2] — 2026-04-05

### 🔧 Interacciones y manejo de estado

- Refactor en `js/app.js` para mejorar la consistencia de interacciones de tarjetas y acciones asociadas.
- Ajustes de flujo interno de estado para reducir efectos secundarios entre acciones de UI.
- Limpieza de rutas de actualización para una experiencia más predecible en uso diario.

## [1.2.1] — 2026-04-04

### 📱 Mobile long-press para menú contextual

- **Long-press (520 ms)**: activar el menú de acciones (editar / cancelar / eliminar) con presión sostenida en dispositivos táctiles.
- **Supresión de click fantasma**: `LAST_LONG_PRESS_AT` evita que el `click` disparado tras soltar el dedo cierre el menú.
- **Feedback visual** `.card.press-hold`: fondo violeta semitransparente + leve escala durante la presión.
- **`touch-action: manipulation`**: evita doble-tap zoom en iOS durante la interacción.
- Listeners pasivos: `touchstart`, `touchmove`, `touchend`, `touchcancel` con `{ passive: true }`.

### 🖱 CRUD via menú contextual (click derecho / long-press)

- `showCtxMenu(e, card)` — crea menú posicionado en coordenadas del puntero.
- `editFromCtx()` — abre modal de edición con campos pre-rellenados.
- `cancelFromCtx()` — alterna estado cancelado (tachado + emoji 🚫).
- `deleteFromCtx()` — elimina con confirmación de texto.
- `submitEdit()` — guarda cambios incluyendo migración de día (remapeo de `cardKey`).
- Estado `cancelled` persistido en `localStorage` junto a `done` y `detail`.

---

## [1.2.0] — 2026-04-04

### 🔄 Auto-guardado inteligente (Human-Centered Design)

- **Auto-save debounce** (1.2s): se guarda automáticamente al marcar una tarea como completada, mover una tarjeta (drag & drop), editar detalles (on blur), o cambiar categoría.
- **Toast notifications**: feedback visual no-bloqueante reemplaza `alert()` en operaciones de sync y guardado. Toasts tipo `ok`, `error`, `info` con animación suave.
- **localStorage quota check**: si el almacenamiento está lleno, muestra advertencia en lugar de fallar silenciosamente.
- **Indicador visual**: el botón Guardar cambia a verde con conteo de tarjetas guardadas.

### ♿ Accesibilidad (WCAG 2.1 AA)

- **Skip-to-content link**: enlace "Saltar al tablero" visible con Tab para usuarios de teclado.
- **Landmarks semánticos**: `<nav>` para topbar, `<main>` para el tablero, `role="region"` para el board.
- **Focus-visible**: outlines violeta en cards, botones y pills al navegar con teclado.
- **Reduced motion**: `@media (prefers-reduced-motion)` deshabilita animaciones y transiciones.
- **Keyboard navigation**: Escape cierra el category picker; Ctrl+Z deshace el último toggle de completado.
- **Tooltips con atajos**: botón Guardar muestra "(Ctrl+S)" en el tooltip.

### ⌨️ Undo (Design Thinking — reduce fricciones)

- **Ctrl+Z / Cmd+Z**: deshace el último toggle de "completado" (ventana de 15 segundos).
- Sistema extensible con `pushUndo(type, card, prevState)`.

### 🎨 UI / Legibilidad (Atomic Design)

- **Toast component**: componente reutilizable con variantes semánticas (`ok`, `error`, `info`).
- **Category picker animation**: entrada suave con `catPickerIn` keyframe.
- **Print styles**: `@media print` oculta chrome de la app, muestra solo el tablero en blanco limpio.
- **Save indicator**: clase `.saved` con borde verde para feedback de guardado.

### 🧹 Limpieza técnica (Debug / Scrum)

- Eliminado ternario muerto `(true) ? ...` en `syncBtn`.
- Reemplazados `alert()` por `showToast()` en `syncAllToGCal`, sync vacío, y fallback URL.
- Error boundary en `saveBoard` con catch de `QuotaExceededError`.
- Version header actualizado a 1.2.0 en JS, CSS y HTML.
- Cache bust `?v=1.2.0` en assets.

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
