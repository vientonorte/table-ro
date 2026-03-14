# Changelog — Tablero Rö

All notable changes to this project will be documented in this file.

---

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
