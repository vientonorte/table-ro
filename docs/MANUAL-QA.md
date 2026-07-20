<!-- Viento Norte Manual QA v1.0.0 · 2026-07-20 · colectivo -->

# Manual QA — table-ro

**App:** Tablero semanal local-first (PWA) + BuJo + Worker IA  
**Repo:** https://github.com/vientonorte/table-ro  
**Prod:** https://vientonorte.github.io/table-ro/  
**Versión checklist:** 1.0.0 · 2026-07-20  
**Hereda de:** QA-MANUAL del repo (v1.6.x) — esta versión es el estándar colectivo

---

## Enlaces rápidos

| Área | URL |
|------|-----|
| App | https://vientonorte.github.io/table-ro/ |
| Privacidad | https://vientonorte.github.io/table-ro/privacy.html |
| Términos | https://vientonorte.github.io/table-ro/terms.html |
| Manifest | https://vientonorte.github.io/table-ro/manifest.json |
| SW | https://vientonorte.github.io/table-ro/sw.js |
| Actions | https://github.com/vientonorte/table-ro/actions |
| OAuth Google | https://myaccount.google.com/permissions |
| CF Workers | https://dash.cloudflare.com/ |

---

## A · Smoke (5 min) — **obligatorio**

- [ ] **A1** Título de pestaña muestra versión esperada (ej. `v1.6.x`)
- [ ] **A1b** Console: sin `Refused to execute inline event handler` (CSP)
- [ ] **A2** Banner consentimiento (incógnito) → «Entendido» cierra
- [ ] **A3** Tablero 7 columnas visible; día actual resaltado
- [ ] **A4** Navegación ← Hoy → cambia semana
- [ ] **A5** Sin errores rojos en Console

**Resultado A:** PASS / FAIL

---

## B · Passkey (opcional, 5 min)

- [ ] **B1** Modal auth si hay usuarios registrados
- [ ] **B2** Registrar passkey (biometría)
- [ ] **B3** Cerrar sesión desde ⚙️ Admin → Seguridad
- [ ] **B4** Re-autenticar con passkey

**Resultado B:** PASS / FAIL / N/A

---

## C · Tablero + CRUD (10 min) — **crítico**

- [ ] **C1** ＋ Añadir → tarea `QA test [fecha]` aparece en columna
- [ ] **C2** Reload → tarea persiste
- [ ] **C3** Completar checkbox → estado persiste
- [ ] **C4** Menú contextual (right-click / long-press) → Editar
- [ ] **C5** Editar título y día → card se mueve
- [ ] **C6** Filtros categoría → oculta/muestra cards

**Resultado C:** PASS / FAIL

---

## D · Google Calendar (10 min, OAuth)

- [ ] **D1** Sync → conectar Google si hace falta
- [ ] **D2** Sincronizar → fuentes muestran ✓ N eventos
- [ ] **D3** Push a GCal desde card (si permiso rw)

**Resultado D:** PASS / FAIL / N/A

---

## E · BuJo + Worker IA (15 min) — **crítico en releases con Worker**

Prereq: proxy Worker configurado (`WORKER-DEPLOY.md`).

- [ ] **E1** 📓 Bullet Journal → subir 1 foto
- [ ] **E2** Thumbnail visible; Analizar habilitado
- [ ] **E3** Analizar → progreso → preview «N ítems»
- [ ] **E4** Ítems con categoría y confidence
- [ ] **E5** Seleccionar → Agregar al tablero → cards en semana
- [ ] **E6** Modo texto: `● Tarea QA` parsea sin IA
- [ ] **E7** Network: POST a `*.workers.dev/api/` (**no** API modelo directa en prod)

**Resultado E:** PASS / FAIL / N/A

---

## F · PWA + Offline (8 min) — **local-first**

- [ ] **F1** Manifest válido; iconos cargan
- [ ] **F2** Service Worker registered (Application → SW)
- [ ] **F3** Tras 1 visita online: Offline → shell de app carga
- [ ] **F4** CRUD básico offline o mensaje claro si no soportado
- [ ] **F5** Volver online: no duplica cards de forma destructiva

**Resultado F:** PASS / FAIL

---

## G · Admin + legal (5 min)

- [ ] **G1** Panel admin accesible según diseño
- [ ] **G2** privacy.html y terms.html cargan
- [ ] **G3** Export/import datos (si existe) no corrompe tablero

**Resultado G:** PASS / FAIL / N/A

---

## H · Mobile (8 min)

- [ ] **H1** 390×844: tablero usable (scroll horizontal de columnas OK si intencional)
- [ ] **H2** Long-press menú contextual funciona
- [ ] **H3** FAB / botones no tapados por safe-area
- [ ] **H4** Teclado virtual no oculta input de nueva tarea de forma irrecuperable

**Resultado H:** PASS / FAIL

---

## Z · A11y mínimo (5 min)

- [ ] **Z1** Tab order en creación de tarea
- [ ] **Z2** Focus visible en botones de columna
- [ ] **Z3** Escape cierra modales
- [ ] **Z4** Labels en inputs de edición
- [ ] **Z5** Reduced motion no rompe tablero

**Resultado Z:** PASS / FAIL

---

## Go / No-Go

| Check | OK |
|-------|-----|
| Smoke A PASS | [ ] |
| CRUD C PASS | [ ] |
| PWA F PASS o documentado | [ ] |
| Worker E PASS o N/A justificado | [ ] |
| Cero S0/S1 | [ ] |

**Decisión:** GO / GO condicional / NO-GO  
**Executor:** ___________ **Fecha:** ___________ **SHA:** ___________

---

## Protocolo colectivo (extracto)

Severidades: **S0** crash/security (bloquea) · **S1** feature crítica (bloquea) · **S2** UX material · **S3** cosmético.

Gate: Smoke A PASS + 0× S0/S1 = GO. Registrar sesión en issue/PR o archivo de log local.

A11y mínimo (sección Z): tab order, focus visible, Escape en modales, contraste spot, reduced-motion.

Fuente del paquete: workflow Viento Norte · Manual QA 1.0.0
