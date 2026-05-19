# Tablero Rö · v1.4.0

![Tablero Rö v1.0](https://github.com/user-attachments/assets/b353cb36-19c7-42b3-b55c-d0e32a9c1ab8)

Planificador semanal personal con autenticación biométrica (passkeys), integración Google Calendar, Bullet Journal (BuJo) con IA multimodal (Claude/OpenAI/Gemini), auto-save, undo y accesibilidad. Desplegado en GitHub Pages sin dependencias ni build.

**Live:** https://vientonorte.github.io/table-ro  
**Versión:** 1.4.0

---

## Stack

| Capa | Tecnología |
|------|-----------|
| UI | HTML5 + CSS3 vanilla |
| Lógica | JavaScript ES6+ (sin framework) |
| Auth | WebAuthn (Passkeys) + Google Identity Services (OAuth 2.0) |
| Sync | Google Calendar API v3 + ICS feeds |
| Persistencia | `localStorage` + `sessionStorage` |
| Deploy | GitHub Pages (main branch, sin build) |

---

## 🔐 Seguridad con Passkeys

TABLERO Rö implementa **autenticación sin contraseñas** mediante passkeys (WebAuthn/FIDO2) para proteger el acceso a tu tablero personal.

### ¿Qué son los passkeys?

Los passkeys son credenciales criptográficas modernas que reemplazan las contraseñas tradicionales:

- **🔒 Más seguras:** Inmunes a phishing, reutilización de contraseñas y ataques de fuerza bruta
- **😌 Más fáciles:** Usa tu rostro, huella digital, PIN o llave de seguridad
- **🚀 Más rápidas:** Inicio de sesión en un solo toque
- **🔐 Privadas:** Tus datos biométricos nunca salen de tu dispositivo

### Compatibilidad

Passkeys funciona en:

- **iOS/iPadOS 16+** — Face ID, Touch ID
- **macOS 13+** — Touch ID, contraseña del Mac
- **Android 9+** — Huella digital, reconocimiento facial, PIN
- **Windows 10+** — Windows Hello (PIN, huella, reconocimiento facial)

Navegadores compatibles:
- Chrome/Edge 108+
- Safari 16+
- Firefox 122+

### Primer uso

1. **Primera vez sin passkey registrado:** Acceso directo al tablero
2. **Registrar passkey:** Abre ⚙️ Admin → 🔐 Seguridad · Passkey
3. **Próximas visitas:** Autenticación automática con tu biometría

### Gestión de passkeys

Desde ⚙️ Admin → 🔐 Seguridad · Passkey puedes:

- **Cerrar sesión** — termina tu sesión actual (duración: 24h)
- **Gestionar passkeys** — ver y eliminar passkeys registrados
- **Registrar múltiples usuarios** — cada dispositivo/usuario puede tener su propio passkey

### Datos almacenados

La autenticación con passkeys almacena **localmente** en tu navegador:

- Nombre de usuario (el que tú elijas)
- ID de credencial (identificador público generado por WebAuthn)
- Fecha de registro

**No se almacenan:**
- Contraseñas (no existen)
- Datos biométricos (permanecen en tu dispositivo)
- Claves privadas (permanecen en el hardware seguro de tu dispositivo)

Ver más en [Política de Privacidad](privacy.html).

---

## Estructura del proyecto

```
table-ro/
├── index.html              # Estructura HTML (topbar, tablero, modales, drawer)
├── css/
│   └── styles.css          # Estilos globales (tokens, layout, componentes)
├── js/
│   ├── app.js              # Lógica completa (datos, render, sync, IA, storage)
│   └── auth-passkey.js     # Módulo de autenticación con passkeys (WebAuthn)
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

### 0 · Autenticación biométrica 🆕
- Passkeys (WebAuthn/FIDO2) para login sin contraseñas
- Soporte para Face ID, Touch ID, Windows Hello, llave de seguridad
- Sesiones de 24 horas con cierre automático
- Gestión de múltiples usuarios/dispositivos
- Primera vez: acceso directo sin registro (opcional)

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

### 9 · Mejoras v1.1–v1.2
- **Auto-save** — debounce 2s en localStorage tras cada cambio
- **Toast notifications** — reemplazo de `alert()` con sistema no-intrusivo
- **Undo** — Ctrl+Z / ⌘+Z para revertir última acción
- **Cambio de categoría** — click en etiqueta de color para reasignar
- **Sync masivo** — botón "📤 Enviar a Calendarios" para push bulk a GCal
- **Accesibilidad** — skip-to-content, landmarks ARIA, focus-visible, reduced motion
- **Print styles** — hoja de estilos optimizada para impresión
- **Mobile-first** — responsive completo, touch-friendly
- **BuJo 3 pasos** — pipeline simplificado (Subir → Revisar → Agregar)

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
| `tablero_passkey_users` | 🆕 Lista de usuarios con passkeys registrados |
| `tablero_current_user` | 🆕 Usuario actualmente autenticado |

**sessionStorage:**
| Key | Contenido |
|-----|-----------|
| `tablero_session_token` | 🆕 Token de sesión (timestamp) |
| `tablero_session_user` | 🆕 Username del usuario en sesión |

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

### Probar autenticación con passkeys en local

⚠️ **Importante:** Para que passkeys funcione en desarrollo local, debes usar:

- `http://localhost:8080` (funciona)
- `http://127.0.0.1:8080` (funciona)

**NO usar:**
- `file:///` (no soportado por WebAuthn por seguridad)
- IP local diferente a 127.0.0.1 (puede requerir HTTPS)

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

## Prácticas de Seguridad

### Para usuarios

1. **Activa passkey en tu primer uso** — protege tu tablero personal con autenticación biométrica
2. **Cierra sesión en dispositivos compartidos** — desde ⚙️ Admin → Cerrar sesión
3. **No compartas claves de API** — las claves de IA (Claude, OpenAI, Gemini) son personales
4. **Revoca passkeys antiguos** — elimina passkeys de dispositivos que ya no uses

### Para desarrolladores

1. **Nunca almacenar secretos en el código** — usar variables de entorno o localStorage (solo client-side)
2. **Validar origen de WebAuthn** — las credenciales están vinculadas al dominio (protección anti-phishing)
3. **Expirar sesiones** — la sesión actual expira automáticamente después de 24 horas
4. **No transmitir tokens** — el token OAuth de Google se mantiene solo en memoria
5. **HTTPS en producción** — GitHub Pages garantiza HTTPS; WebAuthn requiere contexto seguro

### Reporte de vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, repórtala de forma responsable a:
📧 [gaete.gaona@gmail.com](mailto:gaete.gaona@gmail.com)

**No** publiques vulnerabilidades como issues públicos.

---

Rö · v1.4.0 · Mayo 2026
