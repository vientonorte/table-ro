# Tablero Rö · v1.0

![Tablero Rö v1.0](https://github.com/user-attachments/assets/b353cb36-19c7-42b3-b55c-d0e32a9c1ab8)

Planificador semanal personal con integración Google Calendar, Bullet Journal (BuJo) y sync bidireccional. Desplegado en GitHub Pages sin dependencias ni build.

**Live:** https://vientonorte.github.io/table-ro  
**Versión:** 1.0.0

---

## Stack

| Capa | Tecnología |
|------|-----------|
| UI | HTML5 + CSS3 vanilla |
| Lógica | JavaScript ES6+ (sin framework) |
| Auth | Google Identity Services (OAuth 2.0) |
| Sync | Google Calendar API v3 + ICS feeds |
| Persistencia | `localStorage` |
| Deploy | GitHub Pages (main branch, sin build) |

---

## Estructura del proyecto

```
table-ro/
├── index.html              # Estructura HTML (topbar, tablero, modales, drawer)
├── css/
│   └── styles.css          # Estilos globales (tokens, layout, componentes)
├── js/
│   └── app.js              # Lógica completa (datos, render, sync, IA, storage)
├── bujo-admin.html         # Panel de administración BuJo (standalone)
├── privacy.html            # Política de privacidad
├── terms.html              # Términos de uso
├── Chillax_Complete/       # Fuente tipográfica local (fallback)
├── README.md
├── CHANGELOG.md
├── CLAUDE-PROJECT-INSTRUCTIONS.md
└── DEPLOY-GITHUB-PAGES.md
```

---

## Mapa de funcionalidades

### 1 · Tablero semanal
- Vista de 7 columnas (Lun–Dom) con navegación ← **Hoy** →
- Drag & drop de cards entre días
- Resaltado automático del día actual
- Conteo de eventos por día

### 2 · Cards de evento
- Checkbox de completado (estado persistido en `localStorage`)
- Etiqueta de categoría con color
- Hora de inicio (o "Todo el día")
- Área de notas expandible (det-area)
- Botón 📅 para push individual a Google Calendar (solo calendarios rw)

### 3 · Categorías y filtros
| Key | Label | Color | Permiso default |
|-----|-------|-------|----------------|
| `personal` | Personal | `#EC4899` | rw |
| `vinculos` | Vínculos | `#7C3AED` | rw |
| `camila` | Camila | `#10B981` | query |
| `trabajo` | Sura | `#F97316` | admin |
| `fin` | Finanzas | `#FB923C` | ro |
| `bujo` | 📓 BuJo | `#C084FC` | — |

### 4 · Bullet Journal (BuJo) Drawer
- Subida de imágenes del BuJo (drag & drop o file picker)
- Extracción automática de tareas con IA (Claude / OpenAI / Gemini)
- Parseo manual de texto con simbología BuJo:
  - `●` `○` `—` → Personal
  - `◆` `✦` → Vínculos
  - `>` `⬡` → Camila
  - `*` → Trabajo
  - `$` → Finanzas
- Filtrado de ítems extraídos por categoría
- Agregar ítems marcados al tablero con un click

### 5 · Integración IA (BuJo)
| Proveedor | Modelo default | Modo |
|-----------|---------------|------|
| Claude | claude-sonnet-4-6 | Multimodal |
| OpenAI | gpt-5.4 | Multimodal (Responses API) |
| Gemini | gemini-3.1-pro-preview | Multimodal |

Configuración en ⚙️ Admin → pestaña IA: proveedor, modelo, perfil (speed/balanced/quality), JSON mode, flags de procesamiento.

### 6 · Sync Google Calendar
- **OAuth 2.0** via Google Identity Services (token implícito)
- Fetch de eventos de múltiples calendarios (API v3)
- Push de eventos al calendario personal (PATCH/POST)
- Fallback ICS para calendarios sin API (Sura Outlook Office 365)
- Estado de sync por fuente con timestamp

### 7 · Fuentes de calendario
| Fuente | Cuenta | Modo |
|--------|--------|------|
| Personal | gaete.gaona@gmail.com | Lectura + Escritura |
| Finanzas | grupo calendar Google | Solo lectura |
| Sura Investments | Outlook Office 365 ICS | Solo lectura (Admin) |
| Camila | c.camilapalma@gmail.com | Consulta compartida |

### 8 · Modales
- **＋ Añadir** — quick-add con título, hora, fecha, categoría
- **🔄 Sync** — configuración y estado de fuentes de calendario
- **⚙️ Admin** — tabs: Admin · Permisos · IA · FAQ · Recursos

### 9 · Persistencia (`localStorage`)
| Key | Contenido |
|-----|-----------|
| `tablero_states_ro` | Estados de cards (done, detail) |
| `tablero_extra_ro` | Eventos agregados manualmente |
| `tablero_perms_ro` | Permisos habilitados por fuente |
| `tablero_ai_cfg_ro` | Config de IA (provider, keys, modelos) |
| `gcal_client_id` | OAuth Client ID personalizado |
| `gcal_sura_id` | Calendar ID de Sura (admin) |
| `ics_*` | URLs privadas ICS por fuente |

---

## Desarrollo local

```bash
# Clonar
git clone https://github.com/vientonorte/table-ro.git
cd table-ro

# Servidor local (sin build)
python3 -m http.server 8080
# Abre http://localhost:8080/
```

### Configuración OAuth (primera vez)

1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. OAuth Client ID → **Authorized JavaScript Origins**:
   - `http://localhost:8080`
   - `https://vientonorte.github.io`
3. **Authorized redirect URIs**:
   - `https://vientonorte.github.io/table-ro`

---

## Deploy a producción

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin main
# GitHub Pages publica automáticamente en ~1 min
```

Ver [DEPLOY-GITHUB-PAGES.md](DEPLOY-GITHUB-PAGES.md) para instrucciones detalladas.

---

## Guía de contribución

### Agregar un evento al mes
En `js/app.js`, array `EVENTS`:
```js
{iso:'2026-03-15', title:'Mi evento', cal:'personal', time:'10:00'}
// o para todo el día:
{iso:'2026-03-15', title:'Evento día completo', cal:'camila', allDay:true}
```

### Cambiar el mes activo
1. Actualizar `<h1>` en `index.html`
2. Actualizar el array `EVENTS` en `js/app.js` con fechas del nuevo mes

### Agregar nueva fuente de calendario
En `js/app.js`, array `SOURCES`:
```js
{
  id:'nueva', name:'Nombre fuente', desc:'cuenta@email.com',
  cal:'personal', color:'#EC4899', icon:'📅',
  gcalId:'calendar-id@gmail.com', readonly:true,
  icsUrl:'https://...', lsKey:'ics_nueva', permKey:'personal'
}
```

### Actualizar ítems BuJo iniciales
En `js/app.js`, array `BUJO_INIT`:
```js
{text:'Nueva tarea', type:'trabajo'}
```

---

## Zona horaria

Todos los eventos usan `America/Santiago`. Las conversiones de timestamps UTC (ICS con `Z`) se realizan automáticamente con `Intl.DateTimeFormat`.

---

Rö · v1.0 · 2026
