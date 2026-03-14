# Changelog — Tablero Rö

All notable changes to this project will be documented in this file.

---

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
