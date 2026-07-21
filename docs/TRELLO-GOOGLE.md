# Trello ↔ Google · best practices (table-ro)

**Versión:** 1.7.2  
**Cuenta Google:** `gaete.gaona@gmail.com`  
**Board:** [Espacio Seguro · Romila](https://trello.com/b/69c558a7d79162569df9a98a)  
**Categoría tablero:** Camila (filtro 💚)

No existe un OAuth único “Trello con Google”. Son **dos APIs** y un **hub** (este tablero).

---

## Capas (elige según necesidad)

| Capa | Qué | Dirección | Dónde |
|------|-----|-----------|--------|
| **A · ICS** | Feed iCal del board → Google Calendar “desde URL” | Trello → GCal (lectura) | Calendar web / iPhone |
| **B · Hub API** | Trello REST → table-ro (filtro Camila) | Trello → tablero | 🔄 Sync / ⚙️ Admin |
| **C · Bridge** | Tras sync Trello, upsert eventos en GCal **personal** | Trello → tablero → GCal | Toggle en Admin |

Best practice Viento Norte: **A de respaldo + B siempre + C si Calendar del teléfono debe reflejar due dates**.

```
Trello (Espacio Seguro)
        │ REST (key+token)  o  ICS fallback
        ▼
   table-ro hub  ── cal=camila · filtro RO/Rö
        │ OAuth Calendar (opcional C)
        ▼
Google Calendar (gaete.gaona@gmail.com)
```

---

## Checklist setup (una vez)

### A · ICS en Google Calendar (2 min, sin token)

**URL del board (ya embebida en table-ro):**

```
https://trello.com/calendar/5be8d432f8dc74493aaf53e6/69c558a7d79162569df9a98a/3b84dbc14a0b216f20c2b1ca2120a49f.ics
```

**Camino rápido (recomendado):**

1. Tablero → ⚙️ Admin → **＋ ICS → GCal (A)**  
   (abre Google Calendar con `cid=` del feed Trello).
2. Confirma **Añadir calendario**.
3. En la lista izquierda: ⋮ → **Configuración** → renombrar a **Espacio Seguro / Camila**.
4. Cuenta: `gaete.gaona@gmail.com`.

**Camino manual:**

1. Admin → **📋 Copiar ICS** (o copiar URL de arriba).
2. [Google Calendar](https://calendar.google.com) → **Otros calendarios** (+) → **Desde URL**.
3. Pegar → Añadir. Renombrar como arriba.

Límites: solo lectura · refresh ~1h (`X-PUBLISHED-TTL: PT1H`) · no editas cards desde GCal.

**Nota:** la Calendar API **no** puede suscribir un ICS arbitrario; solo la UI / deep link `cid=`.

### B · API Trello en table-ro

1. [Power-Up Admin / API Key](https://trello.com/power-ups/admin) → genera **API Key**.
2. En la misma página, genera **Token** (lectura de boards es suficiente).
3. Tablero → ⚙️ Admin → **Trello · Espacio Seguro**:
   - Pega Key y Token → **💾 Guardar** (una vez; no se piden en cada sync).
   - Status debe mostrar **Key ✓ · Token ✓**.
4. 🔄 Sync (modal calendario) → fuente **Espacio Seguro** → 🔄  
   o botón **Sync Trello** en Admin.
5. Cards **open** con **due** y título que matchee `RO` / `Rö` entran como **Camila**.

**Buenas prácticas credenciales**

| Hacer | Evitar |
|--------|--------|
| Token con alcance mínimo de lectura | Token en capturas / git / chat |
| Guardar una vez; re-sync sin re-pegar | Pegar key en cada dispositivo sin export seguro |
| Revocar token si se filtra | Compartir `localStorage` de otro PC a ciegas |
| Meta: mover key/token a Worker (no browser) | Hardcodear en repo |

Hoy: `localStorage` keys `trello_api_key`, `trello_api_token` (solo en tu browser).

### C · Bridge → GCal personal

1. Conecta **Google OAuth** en 🔄 Sync (Client ID válido; ver `GOOGLE-OAUTH.md`).
2. Admin → Trello → activa **Bridge GCal** (default ON si hay token Trello).
3. Al sincronizar Trello, cada card due hace **upsert** en  
   `gaete.gaona@gmail.com` con:
   - `extendedProperties.private.tableRoTrelloId` = id de card
   - mapa local `trello_gcal_map_ro` (cardId → eventId) para no duplicar
   - descripción con link a la card Trello
4. Si OAuth no está conectado: tablero igual se actualiza; bridge se **omite** (no error fatal).

**Idempotencia:** re-sync actualiza el mismo evento GCal; no crea clones.

---

## Operación diaria

| Acción | Dónde |
|--------|--------|
| Traer cards nuevas / due updates | 🔄 Sync → Espacio Seguro, o **Sync Trello** en Admin |
| Ver en semana | Vista 📅 Semana · filtro 💚 Camila · dominio Personal |
| Ver en teléfono (sin bridge) | Capa A ICS |
| Ver en teléfono (con bridge) | Eventos en calendario principal gaete.gaona |
| Apagar push a GCal | Admin → Bridge GCal OFF |

---

## Qué NO hace este diseño

- No edita cards Trello desde el tablero (source readonly).
- No escribe en el calendar de Camila (query/RO).
- No unifica login Atlassian ↔ Google.
- No es sync 2-way Unito/Zapier (si lo necesitas, Power-Up aparte).

---

## Troubleshooting

| Síntoma | Qué revisar |
|---------|-------------|
| “Configura API Key y Token” | Admin → guardar ambos; hard refresh |
| 401/403 Trello | Token revocado o sin acceso al board |
| 0 eventos | Cards sin **due**, o no matchean filtro `RO`/`Rö` |
| Bridge 0 pushed | Conectar Google OAuth; Bridge ON |
| Duplicados en GCal | Mapa local borrado + eventos viejos sin `tableRoTrelloId` — borra clones manualmente una vez |
| invalid_client Google | `docs/GOOGLE-OAUTH.md` |

---

## localStorage (referencia)

| Key | Contenido |
|-----|-----------|
| `trello_api_key` | API Key |
| `trello_api_token` | Token |
| `trello_gcal_bridge` | `1` / `0` |
| `trello_gcal_map_ro` | `{ [cardId]: gcalEventId }` |
| `tablero_synced_ro` | caché eventos sync (incl. trello) |

---

## Checklist QA rápido

- [ ] Guardar credenciales → status Key ✓ Token ✓ sin re-pegar en reload
- [ ] Sync Trello sin OAuth → cards en tablero Camila
- [ ] Sync Trello con OAuth + bridge → eventos en GCal personal
- [ ] Segundo sync → mismos eventIds (sin duplicar)
- [ ] Bridge OFF → tablero OK, 0 push GCal
- [ ] Filtro Camila OFF → cards Trello ocultas
- [ ] Dominio Laboral → cards Trello ocultas
