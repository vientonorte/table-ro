# QA Manual — table-ro v1.5.0

Checklist para validar prod después del Worker deploy y antes de Sprint Clave A (v1.6).

**Base URL:** https://vientonorte.github.io/table-ro/

---

## Enlaces rápidos

| Área | URL |
|------|-----|
| App principal | https://vientonorte.github.io/table-ro/ |
| Privacidad | https://vientonorte.github.io/table-ro/privacy.html |
| Términos | https://vientonorte.github.io/table-ro/terms.html |
| Manifest PWA | https://vientonorte.github.io/table-ro/manifest.json |
| Service Worker | https://vientonorte.github.io/table-ro/sw.js |
| Repo GitHub | https://github.com/vientonorte/table-ro |
| CI Actions | https://github.com/vientonorte/table-ro/actions |
| Tag v1.5.0 | https://github.com/vientonorte/table-ro/releases/tag/v1.5.0 |
| Hub viento norte | https://vientonorte.github.io/ |
| Google OAuth perms | https://myaccount.google.com/permissions |
| Cloudflare Workers | https://dash.cloudflare.com/ |

---

## A · Smoke (5 min)

- [ ] **A1** Título muestra `v1.5.0` en pestaña del navegador
- [ ] **A2** Banner consentimiento aparece (primera visita / incógnito) → "Entendido" lo cierra
- [ ] **A3** Tablero 7 columnas visible; día actual resaltado
- [ ] **A4** Navegación ← Hoy → cambia semana
- [ ] **A5** Sin errores rojos en DevTools → Console

---

## B · Passkey (opcional, 5 min)

- [ ] **B1** Si hay usuarios registrados: modal auth al cargar
- [ ] **B2** Registrar passkey (dispositivo con biometría)
- [ ] **B3** Cerrar sesión desde ⚙️ Admin → Seguridad
- [ ] **B4** Re-autenticar con passkey

---

## C · Tablero + CRUD (10 min)

- [ ] **C1** ＋ Añadir → crear tarea "QA test [fecha]" → aparece en columna
- [ ] **C2** Reload página → tarea persiste
- [ ] **C3** Checkbox completar → estado persiste tras reload
- [ ] **C4** Menú contextual (click derecho / long-press mobile) → Editar
- [ ] **C5** Editar título y día → card se mueve
- [ ] **C6** Filtros categoría → oculta/muestra cards

---

## D · Google Calendar (10 min, requiere OAuth)

- [ ] **D1** 🔄 Sync → conectar Google (si no conectado)
- [ ] **D2** Sincronizar Todo → fuentes muestran ✓ N eventos
- [ ] **D3** Botón 📅 en card manual → push a GCal (si permiso rw)

---

## E · BuJo + Worker IA (15 min) — **crítico**

Prerequisito: Proxy Worker configurado (ver `WORKER-DEPLOY.md`).

- [ ] **E1** 📓 Bullet Journal → subir 1 foto Bullet Ro
- [ ] **E2** Thumbnail visible; botón Analizar habilitado
- [ ] **E3** Analizar → barra progreso → preview "N ítems"
- [ ] **E4** Ítems en lista con categoría y confidence
- [ ] **E5** Seleccionar ítems → ＋ Agregar al tablero → cards en semana
- [ ] **E6** Modo texto manual (sin foto): pegar `● Tarea QA` → parsea sin IA
- [ ] **E7** DevTools Network: POST a `*.workers.dev/api/` (no API directa en prod)

---

## F · Admin + Security (5 min)

- [ ] **F1** ⚙️ Admin → Proxy Worker URL guardada
- [ ] **F2** Campos API Key **ocultos/deshabilitados** en vientonorte.github.io
- [ ] **F3** localStorage `tablero_ai_cfg_ro` → sin campos `key` con valor
- [ ] **F4** Links Privacidad · Términos funcionan
- [ ] **F5** Export JSON → descarga archivo

---

## G · Mobile (iPhone, 10 min)

- [ ] **G1** Scroll horizontal snap entre días
- [ ] **G2** Botones ≥44px táctiles
- [ ] **G3** Long-press 520ms abre menú contextual
- [ ] **G4** Drawer BuJo usable en portrait
- [ ] **G5** Consent banner no tapa controles críticos

---

## H · A11y (5 min)

- [ ] **H1** Tab desde inicio llega a topbar y tablero
- [ ] **H2** Escape cierra modal abierto
- [ ] **H3** VoiceOver anuncia semana y modales
- [ ] **H4** CI pa11y verde: https://github.com/vientonorte/table-ro/actions

---

## I · PWA (3 min)

- [ ] **I1** Añadir a pantalla inicio (iOS/Android)
- [ ] **I2** Abre standalone sin barra Safari
- [ ] **I3** Offline: shell carga (sync falla gracefully)

---

## Registro de QA

| Fecha | Tester | Worker URL | E1–E7 | Resultado |
|-------|--------|------------|-------|-----------|
| | Rö | | | ☐ PASS / ☐ FAIL |

**Notas:**

---

## Siguiente: QA Clave A (v1.6)

Cuando implementes lectura crómática, añadir:

- [ ] **K1** Ítem con resaltado rosa → categoría Personal + chip color
- [ ] **K2** Ítem naranja → Trabajo aunque símbolo sea ●
- [ ] **K3** Warning visible si color ≠ símbolo
- [ ] **K4** `color_trace` en export JSON

Ver `DESIGN-SPRINT-CLAVE-A.md`.