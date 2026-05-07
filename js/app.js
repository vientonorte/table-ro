/**
 * Tablero Rö — Lógica principal
 * ==============================
 * Versión: 1.3.0
 * Descripción: Tablero semanal personal con integración Google Calendar,
 *              Bullet Journal (BuJo) y sync bidireccional.
 *
 * Arquitectura (Design Thinking — mapeo de funcionalidades):
 *
 *   1. DATA LAYER
 *      · CAL       — tokens de color y etiqueta por categoría
 *      · EVENTS    — eventos del mes (array mutable en runtime)
 *      · BUJO_INIT — ítems iniciales del BuJo preimportados
 *      · SOURCES   — fuentes de calendario (Google + ICS)
 *      · PERMS     — permisos por fuente (rw | ro | admin | query)
 *      · AI_CFG    — configuración de proveedores IA (Claude/OpenAI/Gemini)
 *
 *   2. RENDER ENGINE
 *      · renderWeek()  — renderiza las 7 columnas de la semana activa
 *      · makeCard()    — crea el DOM de una card de evento
 *      · goWeek()      — navega semanas hacia adelante/atrás
 *      · goToday()     — salta a la semana actual
 *
 *   3. DRAG & DROP ENGINE
 *      · setupDrop()       — habilita zona de drop en columna de día
 *      · updateDayCount()  — actualiza contador de eventos por día
 *
 *   4. BULLET JOURNAL (BuJo) DRAWER
 *      · openDrawer() / closeDrawer() — panel lateral BuJo
 *      · handleFiles()    — procesa imágenes subidas
 *      · analyzeBujo()    — llama a la IA para extraer ítems
 *      · parsePaste()     — parsea texto pegado con simbología BuJo
 *      · makeBJItem()     — crea DOM de un ítem BuJo
 *      · addToBoard()     — agrega ítems marcados al tablero
 *
 *   5. AI INTEGRATION
 *      · callClaude()  — Anthropic Claude API (multimodal)
 *      · callOpenAI()  — OpenAI Responses API (multimodal)
 *      · callGemini()  — Google Gemini API (multimodal)
 *      · buildBujoPrompt()      — genera prompt de extracción BuJo
 *      · parseExtractionJson()  — parsea respuesta JSON de la IA
 *      · resolveProvider()      — selecciona proveedor activo según config
 *
 *   6. CALENDAR SYNC
 *      · syncAll()          — sincroniza todas las fuentes habilitadas
 *      · syncSource()       — sincroniza una fuente específica
 *      · fetchGCalEvents()  — obtiene eventos de Google Calendar API v3
 *      · parseICS()         — parsea feed ICS (Outlook, etc.)
 *      · syncToGCal()       — empuja evento al Google Calendar
 *      · pushEventToGCalAPI() — API call PATCH/POST a GCal
 *
 *   7. GOOGLE OAUTH
 *      · initGAuthUI()      — inicializa Google Identity Services
 *      · requestGToken()    — solicita token de acceso OAuth 2.0
 *
 *   8. MODALES
 *      · openAddModal() / closeAddModal()   — modal quick-add
 *      · openCalModal() / closeCalModal()   — modal sync calendario
 *      · openAdminModal() / closeAdminModal() — modal admin / FAQ
 *
 *   9. PERMISOS
 *      · loadPerms() / savePerms()   — persiste permisos en localStorage
 *      · getPermForCal()             — retorna permiso para una categoría
 *      · isSourceEnabled()           — si una fuente está habilitada
 *      · renderPermList()            — renderiza lista de fuentes/permisos
 *
 *   10. PERSISTENCIA
 *      · saveBoard()        — guarda estado de cards en localStorage
 *      · loadBoard()        — restaura estado al iniciar
 *      · applyCardStates()  — aplica estados guardados al DOM
 *
 *   11. FILTROS DE CATEGORÍA
 *      · toggleCat()   — toggle visibilidad de categoría en el tablero
 *      · applyFilter() — aplica filtros activos al DOM
 *
 * Zona horaria: America/Santiago
 * localStorage keys:
 *   tablero_states_ro  — estados de cards (done, detail)
 *   tablero_extra_ro   — eventos agregados manualmente
 *   tablero_synced_ro  — caché de eventos sincronizados (ICS/GCal/Trello)
 *   tablero_perms_ro   — permisos de fuentes
 *   tablero_ai_cfg_ro  — configuración de IA
 *   gcal_client_id     — OAuth Client ID (sobrescribe default)
 *   gcal_sura_id       — Calendar ID de Sura
 *   ics_*              — URLs privadas por fuente ICS
 */

const CAL = {
    personal: { c: '#EC4899', bg: 'rgba(236,72,153,.16)', l: 'Personal' },
    vinculos: { c: '#7C3AED', bg: 'rgba(124,58,237,.16)', l: 'Vínculos' },
    camila: { c: '#10B981', bg: 'rgba(16,185,129,.16)', l: 'Camila' },
    trabajo: { c: '#F97316', bg: 'rgba(249,115,22,.16)', l: 'Sura' },
    fin: { c: '#FB923C', bg: 'rgba(251,146,60,.16)', l: 'Finanzas' },
    'espacio-seguro': { c: '#10B981', bg: 'rgba(16,185,129,.16)', l: 'Espacio Seguro' },
    bujo: { c: '#C084FC', bg: 'rgba(192,132,252,.16)', l: '📓 BuJo' },
};

/* ── Recurring event templates: day 0=Mon … 6=Sun ── */
const RECURRING_WEEKLY = [
    { day: 0, title: 'DESCONEXIÓN SENSORIAL 🌿', cal: 'personal', time: '07:15' },
    { day: 1, title: 'DESCONEXIÓN SENSORIAL 🌿', cal: 'personal', time: '07:15' },
    { day: 2, title: 'DESCONEXIÓN SENSORIAL 🌿', cal: 'personal', time: '07:15' },
    { day: 3, title: 'Kinesiología', cal: 'personal', time: '08:30' },
    { day: 4, title: 'Ordenar 🏠', cal: 'personal', time: '08:30' },
    { day: 4, title: 'Smorgasboard', cal: 'vinculos', time: '10:00' },
    { day: 5, title: 'Check Financiero 💰', cal: 'personal', time: '07:15' },
    { day: 5, title: 'Selfradar', cal: 'personal', time: '09:00' },
    { day: 5, title: 'Bici Paseo 🚴', cal: 'personal', time: '14:15' },
    { day: 5, title: 'Juntos Chill 💚', cal: 'camila', time: '17:00' },
    { day: 6, title: 'Psicoterapia · Rodrigo', cal: 'personal', time: '12:00' },
    { day: 6, title: 'Compra Frutas y Verduras 🛒', cal: 'personal', time: '17:45' },
];

function generateSeedEvents() {
    const evs = [];
    const now = new Date();
    const from = new Date(now); from.setMonth(from.getMonth() - 1); from.setDate(1);
    const to = new Date(now); to.setMonth(to.getMonth() + 2); to.setDate(0);
    const cursor = mondayOf(from);
    while (cursor <= to) {
        RECURRING_WEEKLY.forEach(tpl => {
            const d = addDays(cursor, tpl.day);
            if (d < from || d > to) return;
            evs.push({ iso: isoOf(d), title: tpl.title, cal: tpl.cal, time: tpl.time, source: 'seed' });
        });
        cursor.setDate(cursor.getDate() + 7);
    }
    return evs;
}

const EVENTS = generateSeedEvents();

const BUJO_INIT = [
    { text: 'Enviar cotización Cris (p:36)', type: 'trabajo' },
    { text: 'Enviar Job Description → Cony y Amaya', type: 'trabajo' },
    { text: 'Solicitar planificación Cony y Amaya', type: 'trabajo' },
    { text: 'Enviar proyecto Mtz — CASO UX01', type: 'trabajo' },
    { text: 'TERMINAR FAN p34', type: 'trabajo' },
    { text: 'Seguimiento stancar - RE', type: 'trabajo' },
    { text: 'Checkin financiero', type: 'personal' },
    { text: 'Mantenimiento PSCI', type: 'personal' },
    { text: 'DNA cirugía — Mamá (primeros pasos)', type: 'personal' },
    { text: 'Psiquiatría 9:39', type: 'personal' },
    { text: 'Día con Lily (proponer fecha)', type: 'vinculos' },
    { text: 'Reunión Zuleima — Coliseum 3 noches', type: 'vinculos' },
    { text: 'RADAR con Castillo', type: 'vinculos' },
    { text: 'Seguimiento NEC Camila', type: 'camila' },
    { text: 'Seguimiento NEC Lily', type: 'vinculos' },
    { text: 'Depren general 2×1 — revisar', type: 'personal' },
];

const PERMS_DEFAULT = {
    personal: { perm: 'rw', enabled: true, adminRequired: false },
    finanzas: { perm: 'ro', enabled: true, adminRequired: false },
    trabajo: { perm: 'admin', enabled: false, adminRequired: true },
    camila: { perm: 'query', enabled: true, adminRequired: false },
    'espacio-seguro': { perm: 'ro', enabled: true, adminRequired: false },
};

const SOURCES = [{
        id: 'personal',
        name: 'Personal · Vínculos · Laboral',
        desc: 'gaete.gaona@gmail.com',
        cal: 'personal',
        color: '#EC4899',
        icon: '👤',
        gcalId: 'gaete.gaona@gmail.com',
        readonly: false,
        icsUrl: 'https://calendar.google.com/calendar/ical/gaete.gaona%40gmail.com/public/basic.ics',
        embedUrl: 'https://calendar.google.com/calendar/embed?src=gaete.gaona%40gmail.com&ctz=America%2FSantiago',
        lsKey: 'ics_personal',
        permKey: 'personal'
    },
    {
        id: 'finanzas',
        name: 'Finanzas Personales',
        desc: 'grupo finanzas',
        cal: 'fin',
        color: '#FB923C',
        icon: '💰',
        gcalId: '9616f51a807e24559b4df624c70d7fe1d81de62f9aa8baf44c1190db5887b12f@group.calendar.google.com',
        readonly: true,
        icsUrl: 'https://calendar.google.com/calendar/ical/9616f51a807e24559b4df624c70d7fe1d81de62f9aa8baf44c1190db5887b12f%40group.calendar.google.com/public/basic.ics',
        embedUrl: 'https://calendar.google.com/calendar/embed?src=9616f51a807e24559b4df624c70d7fe1d81de62f9aa8baf44c1190db5887b12f%40group.calendar.google.com&ctz=America%2FSantiago',
        lsKey: 'ics_finanzas',
        permKey: 'finanzas'
    },
    {
        id: 'trabajo',
        name: 'Sura Investments',
        desc: 'Outlook Office 365 · Solo Lectura Admin',
        cal: 'trabajo',
        color: '#F97316',
        icon: '🏢',
        gcalId: null,
        readonly: true,
        icsUrl: '',
        embedUrl: null,
        lsKey: 'ics_trabajo',
        permKey: 'trabajo'
    },
    {
        id: 'camila',
        name: 'Camila',
        desc: 'c.camilapalma@gmail.com · Consulta',
        cal: 'camila',
        color: '#10B981',
        icon: '💚',
        gcalId: 'c.camilapalma@gmail.com',
        readonly: true,
        icsUrl: 'https://calendar.google.com/calendar/ical/c.camilapalma%40gmail.com/public/basic.ics',
        embedUrl: 'https://calendar.google.com/calendar/embed?src=c.camilapalma%40gmail.com&ctz=America%2FSantiago',
        lsKey: 'ics_camila',
        permKey: 'camila'
    },
    {
        id: 'espacio-seguro',
        name: 'Espacio Seguro · Romila',
        desc: 'Trello ICS · Tareas RO',
        cal: 'espacio-seguro',
        color: '#10B981',
        icon: '🏠',
        gcalId: null,
        readonly: true,
        icsUrl: 'https://trello.com/calendar/5be8d432f8dc74493aaf53e6/69c558a7d79162569df9a98a/3b84dbc14a0b216f20c2b1ca2120a49f.ics',
        embedUrl: 'https://trello.com/b/69c558a7d79162569df9a98a/diseno-de-espacio-seguro-romila',
        lsKey: 'ics_espacio_seguro',
        permKey: 'espacio-seguro',
        filterRe: /\bRO\b|Rö/i
    },
];

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const FDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function isoOf(d) {
    const y = d.getFullYear(),
        m = d.getMonth() + 1,
        dd = d.getDate();
    return `${y}-${String(m).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
}

function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function mondayOf(d) {
    const r = new Date(d);
    r.setHours(12, 0, 0, 0);
    const day = r.getDay();
    r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
    return r;
}

// UX IMPROVEMENT: announcer accesible reutilizable.
function announce(msg) {
    const live = document.getElementById('sr-live');
    if (!live) return;
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 15);
}
let BUJO_STEP = 1;
let SYNC_ADVANCED = false;
// UX IMPROVEMENT: flujo guiado en 5 pasos para reducir carga cognitiva.
function setBujoStep(step) {
    BUJO_STEP = Math.max(1, Math.min(2, Number(step || 1)));
    document.querySelectorAll(".step-pill").forEach((el, idx) => {
        el.classList.toggle("active", idx + 1 === BUJO_STEP);
        el.setAttribute("aria-selected", idx + 1 === BUJO_STEP ? "true" : "false");
    });
    document.querySelectorAll(".step-panel").forEach((el, idx) => el.classList.toggle("active", idx + 1 === BUJO_STEP));
    announce(`Paso ${BUJO_STEP} activo en captura BuJo`);
}

function toggleLegend() {
    const panel = document.getElementById('legend-panel');
    const btn = document.getElementById('filter-toggle-btn');
    if (!panel || !btn) return;
    panel.hidden = !panel.hidden;
    btn.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    btn.classList.toggle('selected', !panel.hidden);
}

function toggleToolsMenu(event) {
    event?.stopPropagation();
    const menu = document.getElementById('tool-menu');
    const btn = document.getElementById('tools-btn');
    if (!menu || !btn) return;
    const open = !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.classList.toggle('selected', open);
}

function closeToolsMenu() {
    const menu = document.getElementById('tool-menu');
    const btn = document.getElementById('tools-btn');
    if (!menu || !btn) return;
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('selected');
}
// UX IMPROVEMENT: vista simple por defecto y vista avanzada bajo demanda.
function setSyncView(advanced) {
    SYNC_ADVANCED = !!advanced;
    document.body.classList.toggle('sync-simple', !SYNC_ADVANCED);
    document.getElementById('sync-simple-btn')?.classList.toggle('selected', !SYNC_ADVANCED);
    document.getElementById('sync-advanced-btn')?.classList.toggle('selected', SYNC_ADVANCED);
    renderCalSources();
}
const KIND_LABELS = { task: 'Tarea', event: 'Evento', note: 'Nota', habit: 'Hábito' };

function normalizeKind(kind, fallbackTitle = '') { if (['task', 'event', 'note', 'habit'].includes(kind)) return kind; if (/^(📅|⏰)/.test(fallbackTitle)) return 'event'; if (/^(📝)/.test(fallbackTitle)) return 'note'; if (/^(🔁)/.test(fallbackTitle)) return 'habit'; return 'task'; }

function sourceLabel(src) { return src === 'bujo' ? 'BuJo' : src === 'gcal' ? 'Google' : src === 'ics' ? 'ICS' : src === 'trello' ? 'Trello' : 'Manual'; }


/* ── Toast Notification System ── */
let _toastTimer = null;

function showToast(msg, type = 'info', duration = 3000) {
    let cont = document.getElementById('toast-container');
    if (!cont) { cont = document.createElement('div');
        cont.id = 'toast-container';
        cont.setAttribute('role', 'status');
        cont.setAttribute('aria-live', 'polite');
        document.body.appendChild(cont); }
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    cont.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show');
        setTimeout(() => t.remove(), 300); }, duration);
}


/* ── Auto-save debounce ── */
let _autoSaveTimer = null;

function autoSave() {
    clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(() => {
        try { saveBoard();
            showToast('Guardado automático', 'info', 1500); } catch (e) { console.warn('autosave:', e); }
    }, 1200);
}

/* ── Undo last action ── */
let _lastAction = null;

function pushUndo(type, card, prev) { _lastAction = { type, card, prev, ts: Date.now() }; }

function undo() {
    if (!_lastAction || Date.now() - _lastAction.ts > 15000) return;
    const a = _lastAction; _lastAction = null;
    if (a.type === 'done') { a.card.classList.toggle('done'); }
    else if (a.type === 'cancel') { a.card.classList.toggle('cancelled'); }
    else if (a.type === 'delete') {
        const body = document.getElementById('wb-' + a.prev.iso);
        if (body) { const empty = body.querySelector('.day-empty'); if (empty) empty.remove(); body.appendChild(a.card); updateDayCount(body.closest('.wday')); }
    }
    else if (a.type === 'edit') {
        const ci = CAL[a.prev.cal] || CAL.bujo;
        a.card.querySelector('.ct').textContent = a.prev.title;
        a.card.dataset.cal = a.prev.cal;
        a.card.style.setProperty('--cc', ci.c);
        const ctag = a.card.querySelector('.ctag'); if (ctag) { ctag.textContent = ci.l; ctag.style.color = ci.c; }
        const ctime = a.card.querySelector('.ctime'); if (ctime) ctime.textContent = a.prev.time ? '⏰ ' + a.prev.time : '⏰ Todo el día';
        const area = a.card.querySelector('.det-area'); if (area) area.value = a.prev.detail;
        if (a.prev.iso !== a.prev.newIso) {
            const oldBody = document.getElementById('wb-' + a.prev.iso);
            if (oldBody) { oldBody.appendChild(a.card); oldBody.querySelector('.day-empty')?.remove(); updateDayCount(oldBody.closest('.wday')); }
            const newBody = document.getElementById('wb-' + a.prev.newIso);
            if (newBody) updateDayCount(newBody.closest('.wday'));
        }
    }
    announce('Acción deshecha'); autoSave();
    showToast('↩ Deshecho', 'info', 1500);
}
const DRAG = { card: null, fromIso: '' };
const LONG_PRESS_MS = 520;
const LONG_PRESS_TOLERANCE = 10;
let LAST_LONG_PRESS_AT = 0;
const PRESS_STATE = { timer: null, card: null, x: 0, y: 0, active: false, opened: false };

function removePH() { document.querySelectorAll('.drop-placeholder').forEach(p => p.remove()); }

function isPressInteractiveTarget(target) { return !!target.closest('button,textarea,input,select,a,.ctag,.det-area,.sync-btn,.det-btn,.chk,.ctx-menu'); }

function clearCardPress() { if (PRESS_STATE.card) PRESS_STATE.card.classList.remove('press-hold');
    clearTimeout(PRESS_STATE.timer);
    PRESS_STATE.timer = null;
    PRESS_STATE.card = null;
    PRESS_STATE.active = false;
    PRESS_STATE.opened = false; }

function startCardPress(card, e) {
    if (!e.touches || e.touches.length !== 1 || isPressInteractiveTarget(e.target)) return;
    const touch = e.touches[0];
    clearCardPress();
    PRESS_STATE.card = card;
    PRESS_STATE.x = touch.clientX;
    PRESS_STATE.y = touch.clientY;
    PRESS_STATE.active = true;
    card.classList.add('press-hold');
    PRESS_STATE.timer = setTimeout(() => {
        if (!PRESS_STATE.active || !PRESS_STATE.card) return;
        LAST_LONG_PRESS_AT = Date.now();
        PRESS_STATE.opened = true;
        showCtxMenu({ clientX: PRESS_STATE.x, clientY: PRESS_STATE.y }, PRESS_STATE.card);
        if (navigator.vibrate) navigator.vibrate(16);
    }, LONG_PRESS_MS);
}

function moveCardPress(e) {
    if (!PRESS_STATE.active || !e.touches || !e.touches.length) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - PRESS_STATE.x);
    const dy = Math.abs(touch.clientY - PRESS_STATE.y);
    if (dx > LONG_PRESS_TOLERANCE || dy > LONG_PRESS_TOLERANCE) clearCardPress();
}

function endCardPress() { clearCardPress(); }

function setupDrop(zone) {
    zone.addEventListener('dragover', e => {
        if (!DRAG.card) return;
        e.preventDefault();
        zone.closest('.wday')?.classList.add('drag-over-col');
        removePH();
        const ph = document.createElement('div');
        ph.className = 'drop-placeholder';
        const cards = [...zone.querySelectorAll('.card:not(.dragging)')];
        const after = cards.reduce((cl, ch) => { const b = ch.getBoundingClientRect(); const off = e.clientY - b.top - b.height / 2; return (off < 0 && off > cl.off) ? { off, el: ch } : cl; }, { off: -Infinity }).el;
        after ? zone.insertBefore(ph, after) : zone.appendChild(ph);
    });
    zone.addEventListener('dragleave', e => {
        if (!zone.contains(e.relatedTarget)) {
            zone.closest('.wday')?.classList.remove('drag-over-col');
            removePH();
        }
    });
    zone.addEventListener('drop', e => {
        e.preventDefault();
        if (!DRAG.card) return;
        zone.closest('.wday')?.classList.remove('drag-over-col');
        const ph = zone.querySelector('.drop-placeholder');
        ph ? zone.insertBefore(DRAG.card, ph) : zone.appendChild(DRAG.card);
        removePH();
        zone.querySelector('.day-empty')?.remove();
        updateDayCount(zone.closest('.wday'));
        const droppedCard = DRAG.card;
        const newIso = zone.closest('[id^="wb-"]')?.id.replace('wb-','') || '';
        const oldIso = DRAG.fromIso;
        autoSave();
        if (newIso && newIso !== oldIso && canSyncBack(droppedCard)) {
            const timeStr = (droppedCard.querySelector('.ctime')?.textContent||'').replace('⏰ ','').trim();
            const time = (timeStr === 'Todo el día') ? '' : timeStr;
            const calId = getGCalIdForCal(droppedCard.dataset.cal);
            showToast('Actualizando en Google Calendar\u2026', 'info', 2000);
            patchEventInGCalAPI(droppedCard.dataset.uid, calId, { iso: newIso, time })
                .then(() => { updateEventInCache(droppedCard.dataset.uid, { iso: newIso }); cacheSyncedEvents(); showToast('\u2713 Movido en Google Calendar', 'ok', 2500); })
                .catch(err => { console.warn('sync-back move:', err); showToast('\u26a0\ufe0f No se pudo mover en Google Calendar', 'error', 3500); });
        }
    });
}

function updateDayCount(wday) { if (!wday) return; const n = wday.querySelectorAll('.card').length; const el = wday.querySelector('.day-count'); if (el) el.textContent = n + ' evento' + (n !== 1 ? 's' : ''); }

function makeCard(ev) {
    const ci = CAL[ev.cal] || CAL.bujo;
    const el = document.createElement('div');
    el.className = 'card';
    el.style.setProperty('--cc', ci.c);
    el.draggable = true;
    el.dataset.cal = ev.cal || 'bujo';
    const src = ev.source || (ev.fromCal ? 'gcal' : 'manual');
    const kind = normalizeKind(ev.kind, ev.title || '');
    el.dataset.source = src;
    el.dataset.kind = kind;
    el.dataset.uid = ev.uid || '';
    const tStr = ev.allDay ? 'Todo el día' : (ev.time || '');
    const perm = getPermForCal(ev.cal);
    const readonly = !!ev.readonly || ev.fromCal;
    const syncBtn = `<button class="sync-btn" title="Sync a calendario (Ctrl·S guarda)" aria-label="Sincronizar esta tarjeta con Google Calendar" onclick="syncToGCal(event,this)">📅</button>`;
    const detailContent = ev.detail ?
        `<div class="card-detail show"><textarea class="det-area" rows="2" onclick="event.stopPropagation()" onmousedown="event.stopPropagation()">${ev.detail}</textarea></div>` :
        `<div class="card-detail"><textarea class="det-area" rows="2" placeholder="Notas..." onclick="event.stopPropagation()" onmousedown="event.stopPropagation()" onblur="autoSave()"></textarea></div>`;
    el.innerHTML = `<div class="card-row"><div class="chk" aria-hidden="true"></div><div style="flex:1;min-width:0"><div class="ct">${ev.title}</div>${tStr?`<div class="ctime">⏰ ${tStr}</div>`:''}<div class="card-meta"><span class="ctag" style="color:${ci.c};cursor:pointer" onclick="changeCat(event,this)" title="Cambiar categoría">${ci.l}</span><span class="kind-badge">${KIND_LABELS[kind]||'Tarea'}</span><span class="src-badge ${src}${readonly?' readonly':''}">${sourceLabel(src)}</span></div></div><div class="card-actions">${syncBtn}<button class="det-btn${ev.detail?' open':''}" title="Detalles" aria-label="Editar detalles" onclick="toggleDetail(event,this)">···</button></div></div>${detailContent}`;
  el.classList.toggle('is-readonly',readonly);el.setAttribute('tabindex','0');el.setAttribute('role','group');el.setAttribute('aria-label',`${KIND_LABELS[kind]||'Tarea'}: ${ev.title}`);
  el.querySelector('.chk').addEventListener('click',e=>{e.stopPropagation();pushUndo('done',el,el.classList.contains('done'));el.classList.toggle('done');announce(el.classList.contains('done')?'Tarjeta marcada como completada':'Tarjeta marcada como pendiente');autoSave();});
  el.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();el.querySelector('.chk')?.click();}});
  el.addEventListener('dragstart',e=>{DRAG.card=el;DRAG.fromIso=el.closest('[id^="wb-"]')?.id.replace('wb-','')||'';setTimeout(()=>el.classList.add('dragging'),0);e.dataTransfer.effectAllowed='move';});
  el.addEventListener('dragend',()=>{el.classList.remove('dragging');removePH();document.querySelectorAll('.drag-over-col').forEach(z=>z.classList.remove('drag-over-col'));DRAG.card=null;});
  el.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();showCtxMenu(e,el);});
  el.addEventListener('touchstart',e=>startCardPress(el,e),{passive:true});
  el.addEventListener('touchmove',moveCardPress,{passive:true});
  el.addEventListener('touchend',endCardPress,{passive:true});
  el.addEventListener('touchcancel',endCardPress,{passive:true});
  if(ev.detail)el.querySelector('.card-detail').classList.add('show');
  return el;
}

let PERMS={};
function loadPerms(){try{PERMS=JSON.parse(localStorage.getItem('tablero_perms_ro')||'{}');}catch(e){PERMS={};}}
function savePerms(){localStorage.setItem('tablero_perms_ro',JSON.stringify(PERMS));}
function getPermForCal(calKey){
  const src=SOURCES.find(s=>s.cal===calKey);
  if(!src)return 'rw';
  const def=PERMS_DEFAULT[src.permKey]||{perm:'ro',enabled:true,adminRequired:false};
  const saved=PERMS[src.permKey]||{};
  return saved.perm||def.perm;
}
function isSourceEnabled(srcId){
  const src=SOURCES.find(s=>s.id===srcId);if(!src)return false;
  const def=PERMS_DEFAULT[src.permKey]||{enabled:true,adminRequired:false};
  if(def.adminRequired){
    const saved=PERMS[src.permKey]||{};
    return saved.enabled===true;
  }
  return true;
}
function renderPermList(){
  const cont=document.getElementById('perm-list');if(!cont)return;
  cont.innerHTML='';
  const permLabels={rw:'Lectura + Escritura',ro:'Solo lectura',admin:'Admin requerido',query:'Consulta compartida'};
  const permClass={rw:'perm-rw',ro:'perm-ro',admin:'perm-admin',query:'perm-query'};
  SOURCES.forEach(src=>{
    const def=PERMS_DEFAULT[src.permKey]||{};
    const saved=PERMS[src.permKey]||{};
    const currentPerm=saved.perm||def.perm;
    const isEnabled=saved.enabled!==undefined?saved.enabled:def.enabled;
    const div=document.createElement('div');
    div.className='src-card';div.style.setProperty('--src-c',src.color);
    div.innerHTML=`
      <div class="src-icon">${src.icon}</div>
      <div class="src-info">
        <div class="src-name">${src.name}</div>
        <div class="src-desc">${src.desc}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:5px;flex-wrap:wrap;">
          <span class="perm-badge ${permClass[currentPerm]||'perm-ro'}">${permLabels[currentPerm]||currentPerm}</span>
          ${def.adminRequired?`<label style="display:flex;align-items:center;gap:4px;font-size:.62rem;color:var(--mut);cursor:pointer;">
            <input type="checkbox" ${isEnabled?'checked':''} onchange="toggleSourceEnabled('${src.permKey}',this.checked)" style="accent-color:#a855f7;width:12px;height:12px;">
            Habilitar sync
          </label>`:''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
        ${src.readonly?`<span style="font-size:.55rem;color:var(--mut);">🔒 solo lectura</span>`:`<span style="font-size:.55rem;color:#10B981;">✏️ escritura OK</span>`}
      </div>`;
    cont.appendChild(div);
  });
}
function toggleSourceEnabled(permKey,val){
  if(!PERMS[permKey])PERMS[permKey]={};
  PERMS[permKey].enabled=val;
  savePerms();
}

let weekStart=mondayOf(new Date());
function goWeek(dir){weekStart=addDays(weekStart,dir*7);renderWeek();}
function goToday(){const n=new Date();n.setHours(12,0,0,0);weekStart=mondayOf(n);renderWeek();}
function renderWeek(){
  const wb=document.getElementById('wboard');wb.innerHTML='';
  const today=isoOf(new Date());
  const days=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const s=days[0],e=days[6];
  document.getElementById('wk-label').textContent=`${FDAYS[s.getDay()]} ${s.getDate()} — ${FDAYS[e.getDay()]} ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  const FULL_MONTHS=['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  const midWeek=addDays(weekStart,3);
  const ml=document.getElementById('month-label');if(ml)ml.textContent=`${FULL_MONTHS[midWeek.getMonth()]} ${midWeek.getFullYear()}`;
  days.forEach(d=>{
    const iso=isoOf(d);const isT=iso===today;
    const evs=EVENTS.filter(e=>e.iso===iso).sort((a,b)=>{if(a.allDay&&!b.allDay)return -1;if(!a.allDay&&b.allDay)return 1;return(a.time||'').localeCompare(b.time||'');});
    const col=document.createElement('div');col.className='wday'+(isT?' is-today':'');
    col.innerHTML=`<div class="wday-head"><div><div class="day-name">${DAYS[d.getDay()]}</div><div class="day-count">${evs.length} evento${evs.length!==1?'s':''}</div></div><div class="day-num">${d.getDate()}</div></div><div class="wday-body" id="wb-${iso}"></div>`;
    wb.appendChild(col);
    const body=col.querySelector(`#wb-${iso}`);setupDrop(body);
    if(!evs.length){body.innerHTML='<div class="day-empty">Sin eventos</div>';return;}
    evs.forEach(ev=>{
      if(ev.allDay){
        const pill=document.createElement('div');pill.className='aday-pill';pill.dataset.cal=ev.cal||'bujo';
        const ci=CAL[ev.cal];pill.style.setProperty('--cc',ci.c);pill.style.setProperty('--ccbg',ci.bg);pill.textContent=ev.title;body.appendChild(pill);
      }else{body.appendChild(makeCard(ev));}
    });
    applyFilter();
  });
  applyCardStates();
}

function openDrawer(){document.getElementById('drawer').classList.add('open');document.getElementById('overlay').classList.add('open');const btn=document.getElementById('bujo-btn');if(btn)btn.setAttribute('aria-expanded','true');setBujoStep(1);updateAIStatus();if(!getAvailableAIProviders().length){showAIFallbackNote('Configura una API key en ⚙️ Ajustes para activar análisis IA.');}else{hideAIFallbackNote();}announce('Captura de Bullet Journal abierta');}
function closeDrawer(){document.getElementById('drawer').classList.remove('open');document.getElementById('overlay').classList.remove('open');const btn=document.getElementById('bujo-btn');if(btn)btn.setAttribute('aria-expanded','false');announce('Captura de Bullet Journal cerrada');}

let bjImages=[];
const SYM_MAP={'●':'personal','○':'personal','◆':'vinculos','—':'personal','-':'personal','*':'trabajo','>':'camila','$':'fin','•':'personal','✦':'vinculos','⬡':'camila'};
const BJ_CAL={personal:{c:'#EC4899',l:'Personal'},vinculos:{c:'#7C3AED',l:'Vínculos'},camila:{c:'#10B981',l:'Camila'},trabajo:{c:'#F97316',l:'Trabajo'},fin:{c:'#FB923C',l:'Finanzas'},'espacio-seguro':{c:'#10B981',l:'Espacio Seguro'},bujo:{c:'#C084FC',l:'📓 BuJo'}};

const AI_CFG_KEY = 'tablero_ai_cfg_ro';
const AI_DEFAULTS = {
  provider: 'auto',
  profile: 'balanced',
  jsonMode: 'strict',
  maxItems: 80,
  flags: {
    normalizeSpelling: true,
    markIllegible: true,
    inferDates: true,
    inferCategory: true
  },
  providers: {
    claude: { key: '', model: 'claude-sonnet-4-6' },
    openai: { key: '', model: 'gpt-5.4' },
    gemini: { key: '', model: 'gemini-3.1-pro-preview' }
  },
  proxyUrl: ''
};

function deepMerge(base, patch){
  const out = structuredClone(base);
  for (const k in patch || {}) {
    if (typeof patch[k] === 'object' && patch[k] !== null && !Array.isArray(patch[k]) && typeof out[k] === 'object' && out[k] !== null && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], patch[k]);
    } else {
      out[k] = patch[k];
    }
  }
  return out;
}
let AI_CFG = loadAICfg();
function loadAICfg(){
  try{ return deepMerge(AI_DEFAULTS, JSON.parse(localStorage.getItem(AI_CFG_KEY) || '{}')); }
  catch{ return structuredClone(AI_DEFAULTS); }
}
function saveAICfg(){ localStorage.setItem(AI_CFG_KEY, JSON.stringify(AI_CFG)); updateAIStatus(); }
function saveAIForm(){
  AI_CFG.provider = document.getElementById('ai-provider')?.value || 'auto';
  AI_CFG.profile = document.getElementById('ai-profile')?.value || 'balanced';
  AI_CFG.jsonMode = document.getElementById('ai-json-mode')?.value || 'strict';
  AI_CFG.maxItems = Math.max(10, Math.min(200, Number(document.getElementById('ai-max-items')?.value || 80)));
  saveAICfg();
}
function saveAIAdmin(){
  // TODO SECURITY: almacenar API keys en localStorage es riesgoso ante XSS; mover secretos a backend seguro.
  AI_CFG.provider = document.getElementById('adm-ai-provider')?.value || AI_CFG.provider;
  AI_CFG.providers.claude.key = (document.getElementById('adm-claude-key')?.value || '').trim();
  AI_CFG.providers.claude.model = (document.getElementById('adm-claude-model')?.value || 'claude-sonnet-4-6').trim();
  AI_CFG.providers.openai.key = (document.getElementById('adm-openai-key')?.value || '').trim();
  AI_CFG.providers.openai.model = (document.getElementById('adm-openai-model')?.value || 'gpt-5.4').trim();
  AI_CFG.providers.gemini.key = (document.getElementById('adm-gemini-key')?.value || '').trim();
  AI_CFG.providers.gemini.model = (document.getElementById('adm-gemini-model')?.value || 'gemini-3.1-pro-preview').trim();
  AI_CFG.proxyUrl = (document.getElementById('adm-proxy-url')?.value || '').trim().replace(/\/+$/,'');
  saveAICfg();
  updateProviderCardStates();
}
let _aiAutoSaveTimer=null;
function autoSaveAIAdmin(){ clearTimeout(_aiAutoSaveTimer); _aiAutoSaveTimer=setTimeout(()=>{ saveAIAdmin(); showToast('✓ Config IA guardada','ok'); },400); }
function toggleKeyVis(btn){ const inp=btn.previousElementSibling; if(!inp) return; inp.type=inp.type==='password'?'text':'password'; btn.textContent=inp.type==='password'?'👁':'🙈'; }
function updateProviderCardStates(){
  ['claude','openai','gemini'].forEach(p=>{
    const card=document.getElementById('ai-card-'+p);
    const dot=document.getElementById('ai-dot-'+p);
    const hasKey=!!getActiveKey(p) || !!AI_CFG.proxyUrl;
    if(card) card.classList.toggle('configured', hasKey);
    if(dot){ dot.className='ai-status-dot '+(hasKey?'ok':'none'); }
  });
  const hint=document.getElementById('ai-auto-hint');
  if(hint){
    const pv=AI_CFG.provider;
    if(pv==='auto'){
      const resolved=resolveProvider();
      const available=getAvailableAIProviders();
      hint.textContent=available.length ? `Auto selecciona → ${providerLabel(resolved)}` : 'Configura al menos un proveedor';
    } else { hint.textContent=''; }
  }
}
function selectAIProvider(btn){
  document.querySelectorAll('#ai-pills .ai-pill').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const inp = document.getElementById('adm-ai-provider');
  if(inp) inp.value = btn.dataset.val;
  saveAIAdmin();
  updateProviderCardStates();
}
function hydrateAIAdmin(){
  const ids = {
    'adm-ai-provider': AI_CFG.provider,
    'adm-claude-key': AI_CFG.providers.claude.key,
    'adm-openai-key': AI_CFG.providers.openai.key,
    'adm-gemini-key': AI_CFG.providers.gemini.key,
    'adm-proxy-url': AI_CFG.proxyUrl || ''
  };
  Object.entries(ids).forEach(([id, value]) => { const el = document.getElementById(id); if(el) el.value = value; });
  // For model selects: set value or add custom option if not in list
  ['claude','openai','gemini'].forEach(p=>{
    const sel=document.getElementById('adm-'+p+'-model');
    const model=AI_CFG.providers[p]?.model||'';
    if(!sel||!model) return;
    const exists=[...sel.options].some(o=>o.value===model);
    if(!exists){ const opt=document.createElement('option'); opt.value=model; opt.textContent=model; sel.appendChild(opt); }
    sel.value=model;
  });
  const pv = AI_CFG.provider || 'auto';
  document.querySelectorAll('#ai-pills .ai-pill').forEach(b=>b.classList.toggle('active', b.dataset.val===pv));
  updateProviderCardStates();
}
function hydrateAIForm(){
  const ids = {
    'ai-provider': AI_CFG.provider,
    'ai-profile': AI_CFG.profile,
    'ai-json-mode': AI_CFG.jsonMode,
    'ai-max-items': AI_CFG.maxItems
  };
  Object.entries(ids).forEach(([id, value]) => { const el = document.getElementById(id); if(el) el.value = value; });
  document.querySelectorAll('[data-flag]').forEach(btn => {
    const flag = btn.dataset.flag;
    btn.classList.toggle('saved', !!AI_CFG.flags[flag]);
  });
}
function toggleAIFlag(flag, btn){ AI_CFG.flags[flag] = !AI_CFG.flags[flag]; btn.classList.toggle('saved', AI_CFG.flags[flag]); saveAICfg(); }
function providerLabel(p){ return p === 'claude' ? 'Claude' : p === 'openai' ? 'GPT' : p === 'gemini' ? 'Gemini' : 'Auto'; }
function resolveProvider(){
  if(AI_CFG.provider !== 'auto') return AI_CFG.provider;
  if (AI_CFG.jsonMode === 'strict' && AI_CFG.profile === 'quality') return 'openai';
  if (bjImages.length >= 3 || AI_CFG.profile === 'speed') return 'gemini';
  return 'claude';
}
function getActiveKey(provider){ return AI_CFG.providers?.[provider]?.key || ''; }
function getActiveModel(provider){ return AI_CFG.providers?.[provider]?.model || ''; }
function getAvailableAIProviders(){ if(AI_CFG.proxyUrl) return ['claude','openai','gemini']; return ['claude', 'openai', 'gemini'].filter(p => !!getActiveKey(p)); }
function getProviderCandidates(){
  const available = getAvailableAIProviders();
  if(!available.length) return [];
  const preferred = resolveProvider();
  return [preferred, ...available.filter(p => p !== preferred)];
}
function updateAIStatus(){
  const st = document.getElementById('api-key-status'); if(!st) return;
  const p = resolveProvider();
  const available = getAvailableAIProviders();
  if(!available.length){
    st.className='ai-key-status none';
    st.textContent='Sin key IA';
    return;
  }
  if(available.includes(p)){
    st.className='ai-key-status ok';
    st.textContent=`✓ Listo (${providerLabel(p)})`;
    return;
  }
  st.className='ai-key-status ok';
  st.textContent=`✓ Listo (fallback: ${providerLabel(available[0])})`;
}

const inp=document.getElementById('bj-input');
const upz=document.getElementById('upzone');
const ths=document.getElementById('thumbs');
inp.addEventListener('change',e=>handleFiles(e.target.files));
upz.addEventListener('dragover',e=>{e.preventDefault();upz.classList.add('drag');});
upz.addEventListener('dragleave',()=>upz.classList.remove('drag'));
upz.addEventListener('drop',e=>{e.preventDefault();upz.classList.remove('drag');handleFiles(e.dataTransfer.files);});
function renderThumbs(){ths.innerHTML='';bjImages.forEach((img,idx)=>{const w=document.createElement('div');w.className='thumb';w.innerHTML=`<img src="data:${img.mimeType};base64,${img.base64}"><button class="thumb-del" onclick="removeImage(${idx})">✕</button>`;ths.appendChild(w);});}
function handleFiles(files){
  [...files].forEach(f=>{
    if(!f.type.startsWith('image/'))return;
    const r=new FileReader();
    r.onload=ev=>{
      const base64=ev.target.result.split(',')[1];
      bjImages.push({base64,mimeType:f.type,name:f.name});
      renderThumbs();
      document.getElementById('ai-analyze-btn').disabled=false;
      updateAIStatus();
      updateBujoSummary();
    };
    r.readAsDataURL(f);
  });
}
function removeImage(idx){ bjImages.splice(idx,1); renderThumbs(); if(bjImages.length===0)document.getElementById('ai-analyze-btn').disabled=true; updateAIStatus(); updateBujoSummary(); }

function buildBujoPrompt(){
  const flags = AI_CFG.flags;
  return `Eres un extractor multimodal de Bullet Journal de Rö. Analiza imágenes de Bullet Journal y devuelve SOLO JSON válido. No uses markdown. No expliques nada. No agregues texto fuera del JSON.\n\nOBJETIVO\n- Extraer tareas, eventos, notas y hábitos.\n- Respetar la lógica de Bullet Journal.\n- Aplicar corrección mínima.\n- Mantener contenido incompleto o dudoso como [ilegible] si corresponde.\n\nREGLAS\n- Idioma esperado: español.\n- No inventes datos.\n- Si un texto es ambiguo, baja confidence.\n- Si la imagen muestra una semana en columnas o páginas, identifica el día o fecha de cada columna y propaga esa fecha a cada item detectado.\n- Si hay una fecha clara, usa date_text con el formato más útil posible, idealmente "YYYY-MM-DD"; si no es posible, usa algo como "Lun 9" o "14 marzo".\n- Si hay hora clara, usa time_text en formato 24h "HH:MM".\n- Si hay un símbolo o contexto laboral, clasifica "trabajo".\n- Si menciona Camila, clasifica "camila".\n- Si es terapia, salud, ejercicio, descanso o regulación, clasifica "personal".\n- Si es relación, amistad, familia elegida o coordinación con otras personas, clasifica "vinculos".\n- Si es dinero, pagos, transferencias, compras o presupuesto, clasifica "fin".\n- Lo demás: "personal".\n\nPARÁMETROS\n- normalizeSpelling: ${flags.normalizeSpelling}\n- markIllegible: ${flags.markIllegible}\n- inferDates: ${flags.inferDates}\n- inferCategory: ${flags.inferCategory}\n- maxItems: ${AI_CFG.maxItems}\n\nSCHEMA EXACTO\n{\n  "items": [\n    {\n      "text": "string",\n      "type": "personal|vinculos|camila|trabajo|fin",\n      "kind": "task|event|note|habit",\n      "symbol": "●|○|◆|>|*|$|—",\n      "date_text": "string",\n      "time_text": "string",\n      "details": "string",\n      "confidence": 0.0\n    }\n  ],\n  "summary": {\n    "warnings": ["string"]\n  }\n}\n\nRESTRICCIONES\n- Máximo ${AI_CFG.maxItems} items.\n- confidence entre 0 y 1.\n- Si no hay valor para date_text, time_text o details, usa \"\".\n- Devuelve SOLO JSON.`;
}
function extractJsonString(raw){
  const txt = String(raw || '').trim();
  const noFence = txt.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  const first = noFence.indexOf('{'); const last = noFence.lastIndexOf('}');
  if(first === -1 || last === -1 || last <= first) throw new Error('No vino JSON usable');
  return noFence.slice(first, last + 1);
}
function parseExtractionJson(raw){ const json = JSON.parse(extractJsonString(raw)); if(!json || !Array.isArray(json.items)) throw new Error('JSON sin items'); return json; }
function getOpenAIText(data){
  if(data?.output_text) return data.output_text;
  const texts=[]; (data?.output||[]).forEach(item => (item?.content||[]).forEach(part => { if(part?.type==='output_text' && part?.text) texts.push(part.text); }));
  return texts.join('\n').trim();
}
function getClaudeText(data){ return (data?.content||[]).filter(x=>x?.type==='text').map(x=>x.text).join('\n').trim(); }
function getGeminiText(data){ return (data?.candidates?.[0]?.content?.parts||[]).map(p=>p?.text||'').join('\n').trim(); }
function renderAIResult(provider, parsed){
  const target=document.getElementById('ai-result-preview'); if(!target) return;
  const warnings=parsed?.summary?.warnings||[];
  target.style.display='block';
  target.innerHTML=`<div class="ai-result"><strong>${providerLabel(provider)}</strong> · ${parsed.items.length} ítems${warnings.length ? `<br><br><strong>Warnings:</strong><br>${warnings.map(w => `• ${w}`).join('<br>')}` : ''}</div>`;
}
function showAIFallbackNote(msg='No se pudo analizar con IA. Revisa los ítems o usa texto manual.'){
  const note = document.getElementById('ai-fallback-note');
  if(!note) return;
  note.style.display = 'block';
  note.innerHTML = `<span>⚠️</span> ${msg}`;
}
function hideAIFallbackNote(){
  const note = document.getElementById('ai-fallback-note');
  if(!note) return;
  note.style.display = 'none';
}
function isQuotaErrorMessage(msg){
  const t = String(msg || '').toLowerCase();
  return (
    t.includes('quota') ||
    t.includes('insufficient_quota') ||
    t.includes('rate limit') ||
    t.includes('429') ||
    t.includes('exceeded your current quota') ||
    t.includes('credit') ||
    t.includes('billing')
  );
}
function goToAnalyze(){
  var hasImages = bjImages.length > 0;
  var hasText = (document.getElementById("paste-area")?.value || "").trim().length > 0;
  if(!hasImages && !hasText){ announce("Sube una foto o escribe texto para continuar"); return; }
  if(hasText) parsePaste();
  setBujoStep(2);
  if(hasImages && getAvailableAIProviders().length) { analyzeBujo(); }
  else if(!hasImages) { showBJItems(); announce("Texto procesado. Revisa los ítems extraídos."); }
  else { updateAIStatus(); }
}
function continueWithoutAI(){
  setBujoStep(1);
  showAIFallbackNote('Has continuado en modo manual. Vuelve al Paso 1 y usa texto manual.');
  announce('Continuaste en modo manual sin análisis IA');
}
async function callClaude(prompt){
  const model=getActiveModel('claude');
  const content=[...bjImages.map(img=>({type:'image',source:{type:'base64',media_type:img.mimeType,data:img.base64}})),{type:'text',text:prompt}];
  const payload={model,max_tokens:2200,temperature:0,messages:[{role:'user',content}]};
  if(AI_CFG.proxyUrl){
    const res=await fetch(AI_CFG.proxyUrl+'/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err?.error?.message || `Claude proxy ${res.status}`); }
    return getClaudeText(await res.json());
  }
  const apiKey=getActiveKey('claude'); if(!apiKey) throw new Error('Falta Claude API Key');
  const res=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST', headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
    body:JSON.stringify(payload)
  });
  if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err?.error?.message || `Claude HTTP ${res.status}`); }
  return getClaudeText(await res.json());
}
async function callOpenAI(prompt){
  const model=getActiveModel('openai');
  const content=[...bjImages.map(img=>({type:'input_image',image_url:`data:${img.mimeType};base64,${img.base64}`,detail:AI_CFG.profile==='quality'?'high':'auto'})),{type:'input_text',text:prompt}];
  const payload={model,max_output_tokens:2200,input:[{role:'developer',content:[{type:'input_text',text:'Devuelve únicamente JSON válido y sin markdown.'}]},{role:'user',content}]};
  if(AI_CFG.proxyUrl){
    const res=await fetch(AI_CFG.proxyUrl+'/api/openai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err?.error?.message || `OpenAI proxy ${res.status}`); }
    return getOpenAIText(await res.json());
  }
  const apiKey=getActiveKey('openai'); if(!apiKey) throw new Error('Falta OpenAI API Key');
  const res=await fetch('https://api.openai.com/v1/responses',{
    method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
    body:JSON.stringify(payload)
  });
  if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err?.error?.message || `OpenAI HTTP ${res.status}`); }
  return getOpenAIText(await res.json());
}
async function callGemini(prompt){
  const model=getActiveModel('gemini');
  const parts=[...bjImages.map(img=>({inlineData:{mimeType:img.mimeType,data:img.base64}})),{text:prompt}];
  const payload={contents:[{parts}],generationConfig:{temperature:0,topP:0.95}};
  if(AI_CFG.proxyUrl){
    payload._model=model;
    const res=await fetch(AI_CFG.proxyUrl+'/api/gemini',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err?.error?.message || `Gemini proxy ${res.status}`); }
    return getGeminiText(await res.json());
  }
  const apiKey=getActiveKey('gemini'); if(!apiKey) throw new Error('Falta Gemini API Key');
  const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
    method:'POST', headers:{'Content-Type':'application/json','x-goog-api-key':apiKey}, body:JSON.stringify(payload)
  });
  if(!res.ok){ const err=await res.json().catch(()=>({})); throw new Error(err?.error?.message || `Gemini HTTP ${res.status}`); }
  return getGeminiText(await res.json());
}
async function analyzeBujo(){
  if(!bjImages.length){ alert('Sube al menos una foto de tu BuJo.'); return; }
  saveAIForm();
  hideAIFallbackNote();
  const candidates=getProviderCandidates();
  if(!candidates.length){
    showAIFallbackNote('No hay API Key disponible. Configura en Admin o usa texto manual.');
    setBujoStep(1);
    announce('Sin API key, continuaste en modo manual');
    return;
  }
  const btn=document.getElementById('ai-analyze-btn');
  const progressWrap=document.getElementById('ai-progress-wrap');
  const progressBar=document.getElementById('ai-progress');
  const resultPreview=document.getElementById('ai-result-preview');
  btn.classList.add('loading'); btn.disabled=true; progressWrap.style.display='block'; resultPreview.style.display='none'; progressBar.style.width='16%';
  try{
    const prompt=buildBujoPrompt(); progressBar.style.width='40%';
    let raw;
    let providerUsed='';
    let lastError='';
    for(let i=0;i<candidates.length;i++){
      const provider=candidates[i];
      try{
        if(provider==='claude') raw=await callClaude(prompt);
        else if(provider==='openai') raw=await callOpenAI(prompt);
        else if(provider==='gemini') raw=await callGemini(prompt);
        else throw new Error('Proveedor no soportado');
        providerUsed=provider;
        break;
      }catch(err){
        lastError = String(err?.message || err || 'Error desconocido');
        const nextProvider = candidates[i + 1];
        if(isQuotaErrorMessage(lastError) && nextProvider){
          showAIFallbackNote(`Cuota en ${providerLabel(provider)}. Reintentando con ${providerLabel(nextProvider)}...`);
          continue;
        }
        throw err;
      }
    }
    if(!raw) throw new Error(lastError || 'No fue posible analizar con IA');
    progressBar.style.width='78%';
    const parsed=parseExtractionJson(raw);
    renderAIResult(providerUsed, parsed);
    bjList.innerHTML='';
    let added=0;
    parsed.items.forEach(item=>{
      if(!item?.text?.trim()) return;
      bjList.appendChild(makeBJItem({text:item.text.trim(),type:item.type||'personal',kind:item.kind||'task',details:item.details||'',timeText:item.time_text||'',dateText:item.date_text||'',confidence:item.confidence ?? 0}));
      added++;
    });
    progressBar.style.width="100%"; showBJItems(); updateBadge(); updateBujoSummary(); announce("Análisis completado"); announce(`Análisis completado con ${added} ítems`);
    if(!added){ showAIFallbackNote('La IA no devolvió ítems utilizables. Usa texto manual en Paso 1.'); }
    btn.classList.remove('loading'); btn.innerHTML=`<span class="btn-label" style="color:#86efac;">✓ ${added} ítems · ${providerLabel(providerUsed)}</span>`;
    setTimeout(()=>{ btn.innerHTML='<div class="spin"></div><span class="btn-label">🤖 Analizar Bullet</span>'; btn.disabled=false; },2200);
  }catch(err){
    console.error(err);
    const msg = String(err?.message || err || 'Error desconocido al analizar');
    btn.classList.remove('loading'); btn.innerHTML=`<span class="btn-label" style="color:#fca5a5;">⚠️ ${String(err.message).slice(0,60)}</span>`;
    if(isQuotaErrorMessage(msg)){
      showAIFallbackNote('Cuota agotada. Usa texto manual en Paso 1.');
      setBujoStep(1);
      announce('Cuota agotada, continuaste en modo manual');
    }else{
      showAIFallbackNote('Error de IA. Revisa tu API key o usa texto manual.');
    }
    setTimeout(()=>{ btn.innerHTML='<div class="spin"></div><span class="btn-label">🤖 Analizar Bullet</span>'; btn.disabled=false; },3000);
  }finally{
    setTimeout(()=>{ progressWrap.style.display='none'; progressBar.style.width='0%'; },1200);
  }
}

const bjList=document.getElementById('bj-list');
const bjSec=document.getElementById('bj-section');
function updateBujoSummary(){const rows=[...document.querySelectorAll('#bj-list .bj-item')];const total=rows.length;const low=rows.filter(el=>Number(el.dataset.confidence||1)<.6).length;const selected=rows.filter(el=>el.querySelector('input')?.checked).length;const t=document.getElementById('sum-total');if(t)t.textContent=String(total);const l=document.getElementById('sum-low');if(l)l.textContent=String(low);const s=document.getElementById('sum-selected');if(s)s.textContent=String(selected);}
function selectAllBJ(checked){document.querySelectorAll('#bj-list .bj-item input[type=checkbox]').forEach(chk=>{chk.checked=checked;});updateBujoSummary();}
function makeBJItem(obj){
  const ci = BJ_CAL[obj.type] || BJ_CAL.bujo;
  const el = document.createElement('div');
  el.className='bj-item'; el.dataset.type=obj.type; el.dataset.kind=obj.kind||'task'; el.dataset.detail=obj.details||''; el.dataset.time=obj.timeText||''; el.dataset.date=obj.dateText||''; el.dataset.confidence=String(obj.confidence ?? '');
  if(Number(obj.confidence ?? 1) < .6) el.classList.add('low-confidence');
  el.style.setProperty('--cc',ci.c);
  const meta=[obj.kind ? obj.kind.toUpperCase() : '', obj.timeText || '', obj.dateText || ''].filter(Boolean).join(' · ');
  el.innerHTML=`<input type="checkbox"><span class="bj-item-text">${obj.text}</span>${meta ? `<span class="bj-item-cat">${meta}</span>` : ''}<span class="bj-item-cat" style="color:${ci.c}">${ci.l}</span>`;
  el.querySelector('input')?.addEventListener('change',()=>updateBujoSummary());
  return el;
}
function updateBadge(){ const n=document.querySelectorAll('#bj-list .bj-item').length; const b=document.getElementById('bj-badge');const btn=document.getElementById('bujo-btn'); b.textContent=n;b.style.display=n>0?'flex':'none';btn.classList.toggle('has-items',n>0); }
function showBJItems(){ bjSec.style.display=bjList.children.length?'block':'none'; updateBadge(); updateBujoSummary(); }
showBJItems();
function parsePaste(){
  const txt=document.getElementById('paste-area').value.trim(); if(!txt) return;
  let added=0;
  txt.split('\n').forEach(ln=>{
    const t=ln.trim(); if(!t) return;
    const m=t.match(/^([●◆—○\-\*\>\$•\x{2726}\x{2B21}])\s+(.+)$/);
    const text=m?m[2].trim():t;
    const type=m?(SYM_MAP[m[1]]||'personal'):'personal';
    bjList.appendChild(makeBJItem({text,type,kind:'task'})); added++;
  });
  document.getElementById('paste-area').value=''; if(added){ showBJItems(); setBujoStep(2); }
}
function filterBJ(type,btn){ document.querySelectorAll('#ftags .ftag').forEach(t=>t.classList.remove('on'));btn.classList.add('on'); document.querySelectorAll('#bj-list .bj-item').forEach(el=>{el.style.display=(type==='all'||el.dataset.type===type)?'flex':'none';}); }
function normalizeHHMM(txt){ const m=String(txt||'').trim().match(/^([01]?\d|2[0-3])[:.]([0-5]\d)$/); if(!m) return ''; return `${String(m[1]).padStart(2,'0')}:${m[2]}`; }
const BUJO_WEEKDAY_INDEX = {
  lun: 0, lunes: 0,
  mar: 1, martes: 1,
  mie: 2, miercoles: 2,
  jue: 3, jueves: 3,
  vie: 4, viernes: 4,
  sab: 5, sabado: 5,
  dom: 6, domingo: 6,
};
const BUJO_MONTH_INDEX = {
  ene: 0, enero: 0,
  feb: 1, febrero: 1,
  mar: 2, marzo: 2,
  abr: 3, abril: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5,
  jul: 6, julio: 6,
  ago: 7, agosto: 7,
  sep: 8, septiembre: 8, set: 8, setiembre: 8,
  oct: 9, octubre: 9,
  nov: 10, noviembre: 10,
  dic: 11, diciembre: 11,
};
function normalizeDateToken(txt){
  return String(txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}
function isoForVisibleWeekday(idx){ return isoOf(addDays(weekStart, idx)); }
function findIsoByDayNumber(dayNumber){
  for(let i=0;i<7;i++){
    const candidate = addDays(weekStart, i);
    if(candidate.getDate() === dayNumber) return isoOf(candidate);
  }
  return '';
}
function deriveBujoIso(dateText){
  const raw = normalizeDateToken(dateText);
  if(!raw) return '';

  const isoMatch = raw.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if(isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const explicitNumeric = raw.match(/\b(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\b/);
  if(explicitNumeric){
    const day = Number(explicitNumeric[1]);
    const month = Number(explicitNumeric[2]) - 1;
    const year = explicitNumeric[3] ? Number(explicitNumeric[3].length === 2 ? `20${explicitNumeric[3]}` : explicitNumeric[3]) : weekStart.getFullYear();
    return isoOf(new Date(year, month, day, 12, 0, 0, 0));
  }

  const monthNameMatch = raw.match(/\b(\d{1,2})\s*(?:de\s+)?([a-zñ]+)\b/);
  if(monthNameMatch && BUJO_MONTH_INDEX[monthNameMatch[2]] !== undefined){
    return isoOf(new Date(weekStart.getFullYear(), BUJO_MONTH_INDEX[monthNameMatch[2]], Number(monthNameMatch[1]), 12, 0, 0, 0));
  }

  const weekdayEntry = Object.entries(BUJO_WEEKDAY_INDEX).find(([name]) => raw.match(new RegExp(`\\b${name}\\b`)));
  const dayNumberMatch = raw.match(/\b(\d{1,2})\b/);
  if(weekdayEntry && dayNumberMatch){
    const visibleIso = findIsoByDayNumber(Number(dayNumberMatch[1]));
    if(visibleIso) return visibleIso;
    return isoForVisibleWeekday(weekdayEntry[1]);
  }
  if(weekdayEntry) return isoForVisibleWeekday(weekdayEntry[1]);
  if(dayNumberMatch) return findIsoByDayNumber(Number(dayNumberMatch[1]));

  return '';
}
function addToBoard(){
  const checked=[...document.querySelectorAll('#bj-list .bj-item')].filter(el=>el.querySelector('input').checked);
  if(!checked.length){alert('Marca los ítems que quieres agregar.');return;}
  let added = 0;
  checked.forEach(el=>{
    const txt=el.querySelector('.bj-item-text').textContent;
    const calKey=el.dataset.type||'bujo';
    const kind=el.dataset.kind||'task';
    const detail=[el.dataset.detail, el.dataset.date ? `Fecha detectada: ${el.dataset.date}` : ''].filter(Boolean).join('\n');
    const time=normalizeHHMM(el.dataset.time);
    const iso=deriveBujoIso(el.dataset.date) || isoOf(weekStart);
    EVENTS.push({
      iso,
      title: txt,
      cal: calKey,
      time,
      allDay: kind === 'event' && !time,
      detail,
      fromCal:false,
      source:'bujo',
      kind,
    });
    el.remove();
    added += 1;
  });
  renderWeek(); showBJItems(); closeDrawer(); announce(`${added} ítems BuJo agregados al tablero`);
}
function clearBJ(){ bjList.innerHTML=''; document.getElementById('paste-area').value=''; ths.innerHTML=''; bjImages=[]; document.getElementById('ai-analyze-btn').disabled=true; document.getElementById('ai-result-preview').style.display='none'; showBJItems(); updateAIStatus(); setBujoStep(1); announce('Captura BuJo limpiada'); }

const HIDDEN=new Set();
const CAT_MAP={'personal':['personal'],'vinculos':['vinculos'],'camila':['camila'],'trabajo':['trabajo','fin']};
function toggleCat(keys,el){ const cats=typeof keys==='string'?[keys]:keys; const wasOff=el.classList.contains('off'); if(wasOff){cats.forEach(k=>HIDDEN.delete(k));el.classList.remove('off');el.setAttribute('aria-pressed','true');} else{cats.forEach(k=>HIDDEN.add(k));el.classList.add('off');el.setAttribute('aria-pressed','false');} applyFilter(); }
function applyFilter(){ document.querySelectorAll('.card').forEach(c=>{c.style.display=HIDDEN.has(c.dataset.cal)?'none':'';}); document.querySelectorAll('.aday-pill').forEach(p=>{p.style.display=HIDDEN.has(p.dataset.cal)?'none':'';}); }
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('#legend-panel .leg').forEach(btn=>{
    btn.addEventListener('click',()=>toggleCat(CAT_MAP[btn.dataset.cat]||[btn.dataset.cat],btn));
  });
});

function changeCat(e,tag){
  e.stopPropagation();
  if(document.querySelector('.cat-picker')){document.querySelector('.cat-picker').remove();return;}
  const card=tag.closest('.card');if(!card)return;
  const current=card.dataset.cal;
  const picker=document.createElement('div');
  picker.className='cat-picker';
  const cats=Object.entries(CAL).filter(([k])=>k!=='bujo');
  cats.forEach(([key,val])=>{
    const opt=document.createElement('button');
    opt.className='cat-opt'+(key===current?' active':'');
    opt.style.setProperty('--oc',val.c);
    opt.innerHTML=`<span class="cat-dot" style="background:${val.c}"></span>${val.l}`;
    opt.addEventListener('click',ev=>{
      ev.stopPropagation();
      card.dataset.cal=key;
      card.style.setProperty('--cc',val.c);
      tag.style.color=val.c;
      tag.textContent=val.l;
      card.querySelector('.chk').style.borderColor=val.c;
      const ctime=card.querySelector('.ctime');
      if(ctime)ctime.style.color=val.c;
      picker.remove();
      announce(`Categoría cambiada a ${val.l}`);autoSave();
    });
    picker.appendChild(opt);
  });
  tag.parentElement.appendChild(picker);
  const closeOnClick=ev=>{if(!picker.contains(ev.target)&&ev.target!==tag){picker.remove();document.removeEventListener('click',closeOnClick);}};
  setTimeout(()=>document.addEventListener('click',closeOnClick),0);
  const closeOnEsc=ev=>{if(ev.key==='Escape'){picker.remove();document.removeEventListener('keydown',closeOnEsc);document.removeEventListener('click',closeOnClick);}};
  document.addEventListener('keydown',closeOnEsc);
}

const SYNC_STATUS={}; let _cfgSrcId=null;
const SYNC_IN_FLIGHT = new Map();
const SYNC_SUCCESS_DISPLAY_MS = 1800;
const SYNC_ERROR_DISPLAY_MS = 2500;
function setSyncBtnState(btn,state){
  if(!btn)return;
  if(state==='loading'){ btn.textContent='⏳'; btn.disabled=true; return; }
  if(state==='ok'){ btn.textContent='✓'; setTimeout(()=>{btn.textContent='🔄';btn.disabled=false;},SYNC_SUCCESS_DISPLAY_MS); return; }
  if(state==='error'){ btn.textContent='⚠️'; setTimeout(()=>{btn.textContent='🔄';btn.disabled=false;},SYNC_ERROR_DISPLAY_MS); return; }
  if(state==='locked'){ btn.textContent='🔒'; setTimeout(()=>{btn.textContent='🔄';btn.disabled=false;},SYNC_ERROR_DISPLAY_MS); return; }
  if(state==='idle'){ btn.textContent='🔄'; btn.disabled=false; return; }
  btn.textContent='🔄'; btn.disabled=false;
}
function getSyncedEventDedupeKey(ev){
  if(ev.uid) return `uid:${ev.uid}`;
  const enc = v => encodeURIComponent(v||'');
  return `src:${enc(ev.source)}|sid:${enc(ev.srcId)}|iso:${enc(ev.iso)}|title:${enc(ev.title)}|time:${enc(ev.time)}|cal:${enc(ev.cal)}|allDay:${ev.allDay?1:0}`;
}
function dedupeSyncedEvents(){
  const seen = new Set();
  const out = [];
  EVENTS.forEach(ev => {
    if(!ev.fromCal){ out.push(ev); return; }
    const key = getSyncedEventDedupeKey(ev);
    if(seen.has(key)) return;
    seen.add(key);
    out.push(ev);
  });
  if(out.length!==EVENTS.length){ EVENTS.length=0; EVENTS.push(...out); }
}
function unfoldICS(t){return t.replace(/\r\n[ \t]/g,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');}
function parseICS(text,calKey,srcId){
  const evs=[];const lines=unfoldICS(text);const blocks=lines.split('BEGIN:VEVENT').slice(1);
  const now=new Date();const from=new Date(now);from.setMonth(from.getMonth()-1);const to=new Date(now);to.setMonth(to.getMonth()+4);
  blocks.forEach(blk=>{
    const end=blk.indexOf('END:VEVENT');if(end>-1)blk=blk.slice(0,end);
    const get=key=>{const m=blk.match(new RegExp(`^${key}[^:\\r\\n]*:(.+)$`,'m'));return m?m[1].trim().replace(/\\n/gi,'').replace(/\\,/g,',').replace(/\\\\/g,'\\'):null;};
    if((get('STATUS')||'').toUpperCase()==='CANCELLED')return;
    const dtRaw=get('DTSTART')||'';const summary=(get('SUMMARY')||'(sin título)').slice(0,80);const uid=get('UID')||'';
    let iso=null,time=null,allDay=false;
    const dt=dtRaw.replace(/\s/g,'');
    if(/^\d{8}T\d{6}/.test(dt)){
      const y=dt.slice(0,4),mo=dt.slice(4,6),d=dt.slice(6,8),h=dt.slice(9,11),mi=dt.slice(11,13);
      if(dt.endsWith('Z')){
        const d2=new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`);
        const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d2);
        const[datePart,timePart]=(fmt+', 00:00').split(', ');iso=datePart;time=timePart.replace(/^24:/,'00:').slice(0,5);
      }else{iso=`${y}-${mo}-${d}`;time=`${h}:${mi}`;}
    }else if(/^\d{8}$/.test(dt)){iso=`${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}`;allDay=true;}
    if(!iso)return;
    const evDate=new Date(iso);if(evDate<from||evDate>to)return;
    evs.push({iso,title:summary,cal:calKey,time,allDay,uid,fromCal:true,source:'ics',srcId:srcId||'',kind:'event',readonly:true});
  });
  return evs;
}
async function fetchTrelloCards(boardId,calKey,srcId){
  const apiKey=localStorage.getItem('trello_api_key')||'';
  const apiToken=localStorage.getItem('trello_api_token')||'';
  if(!apiKey||!apiToken)throw new Error('Configura API Key y Token de Trello en ⚙️ Admin.');
  const url=`https://api.trello.com/1/boards/${encodeURIComponent(boardId)}/cards?key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(apiToken)}&fields=name,due,desc,labels,url,idList&filter=open`;
  const resp=await fetch(url);
  if(resp.status===401||resp.status===403)throw new Error('Trello: credenciales inválidas o sin acceso al tablero.');
  if(!resp.ok)throw new Error(`Trello API ${resp.status}`);
  const cards=await resp.json();
  const now=new Date();const from=new Date(now);from.setMonth(from.getMonth()-1);const to=new Date(now);to.setMonth(to.getMonth()+4);
  return cards.filter(c=>c.due).map(card=>{
    const d=new Date(card.due);
    const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
    const[dp,tp]=(fmt+', 00:00').split(', ');
    const iso=dp;const time=tp.replace(/^24:/,'00:').slice(0,5);
    const allDay=d.getUTCHours()===12&&d.getUTCMinutes()===0&&d.getUTCSeconds()===0;
    const evDate=new Date(iso);if(evDate<from||evDate>to)return null;
    return{iso,title:(card.name||'(sin título)').slice(0,80),cal:calKey,time:allDay?undefined:time,allDay,uid:'trello-'+card.id,fromCal:true,source:'trello',srcId:srcId||'',kind:'task',readonly:true,trelloUrl:card.url||''};
  }).filter(Boolean);
}
async function syncSource(srcId,btn){
  if(SYNC_IN_FLIGHT.has(srcId)){
    setSyncBtnState(btn,'loading');
    return SYNC_IN_FLIGHT.get(srcId);
  }
  const run = (async()=>{
  const src=SOURCES.find(s=>s.id===srcId);if(!src)return;
  if(!isSourceEnabled(srcId)){ setSourceStatus(srcId,'error',0,'Deshabilitado en Permisos. Actívalo en ⚙️ → Permisos.'); setSyncBtnState(btn,'locked'); return; }
  setSyncBtnState(btn,'loading');
  updateSyncTopBtn('syncing');setSourceStatus(srcId,'loading');
  try{
    let newEvs;let syncVia='ICS';
    if(src.type==='trello'){
      newEvs=await fetchTrelloCards(src.trelloBoardId,src.cal,srcId);syncVia='Trello';
    } else if(gToken&&src.gcalId){ newEvs=await fetchGCalEvents(src.gcalId,src.cal,src.readonly,srcId); if(!newEvs)throw new Error('Token expirado — vuelve a conectar');syncVia='API'; }
    else{
      const customUrl=src.lsKey?localStorage.getItem(src.lsKey):null;
      const url=customUrl||src.icsUrl;if(!url)throw new Error('Sin URL configurada');
      let icsText=null;
      // Try direct fetch first
      try{const r=await fetch(url,{mode:'cors',cache:'no-cache'});if(!r.ok)throw new Error(`HTTP ${r.status}`);icsText=await r.text();}
      catch(corsErr){
        // Try worker proxy if configured
        const proxyUrls=[];
        if(AI_CFG.proxyUrl) proxyUrls.push(AI_CFG.proxyUrl+'/api/ics?url='+encodeURIComponent(url));
        proxyUrls.push('https://corsproxy.io/?url='+encodeURIComponent(url));
        proxyUrls.push('https://api.allorigins.win/raw?url='+encodeURIComponent(url));
        for(const proxyUrl of proxyUrls){
          try{const r2=await fetch(proxyUrl,{cache:'no-cache'});if(!r2.ok)continue;icsText=await r2.text();syncVia='ICS·proxy';break;}
          catch(e){continue;}
        }
        if(!icsText)throw new Error('CORS bloqueado y proxies fallaron. Conecta OAuth o revisa la URL.');
      }
      if(!icsText||!icsText.includes('BEGIN:VCALENDAR'))throw new Error('No es ICS válido');
      newEvs=parseICS(icsText,src.cal,srcId);
    }
    if(src.filterRe)newEvs=newEvs.filter(e=>src.filterRe.test(e.title));
    for(let i=EVENTS.length-1;i>=0;i--){
      const ev=EVENTS[i];
      if(!ev.fromCal)continue;
      if(ev.srcId===srcId||(!ev.srcId&&ev.cal===src.cal))EVENTS.splice(i,1);
    }
    EVENTS.push(...newEvs);
    dedupeSyncedEvents();
    SYNC_STATUS[srcId]={ok:true,count:newEvs.length,time:new Date(),via:syncVia};
    setSourceStatus(srcId,'ok',newEvs.length);
    cacheSyncedEvents();
    setSyncBtnState(btn,'ok'); renderWeek(); updateSyncTopBtn('synced');
  }catch(err){
    SYNC_STATUS[srcId]={ok:false,error:err.message,time:new Date()}; setSourceStatus(srcId,'error',0,err.message);
    setSyncBtnState(btn,'error'); updateSyncTopBtn('error');
  }
  })();
  SYNC_IN_FLIGHT.set(srcId,run);
  try{ await run; }finally{ SYNC_IN_FLIGHT.delete(srcId); }
}
async function syncAll(){ const btn=document.getElementById('sync-all-btn'); if(btn){btn.textContent='⏳ Sincronizando...';btn.disabled=true;} await Promise.allSettled(SOURCES.map(s=>syncSource(s.id,null))); if(btn){btn.textContent='🔄 Sincronizar Todo';btn.disabled=false;} }
function updateSyncTopBtn(state){ const b=document.getElementById('sync-topbtn');if(!b)return; b.classList.remove('syncing','synced','error'); if(state!=='idle')b.classList.add(state); b.textContent=state==='syncing'?'⏳ Sync...':state==='synced'?'✓ Synced':state==='error'?'⚠️ Sync':'🔄 Sync'; if(state!=='syncing')setTimeout(()=>{b.classList.remove('syncing','synced','error');b.textContent='🔄 Sync';},3500); }
function setSourceStatus(id,state,count=0,err=''){
  const card=document.getElementById('src-'+id);if(!card)return; const el=card.querySelector('.src-status');if(!el)return;
  const t=new Date().toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}); const st2=SYNC_STATUS[id]||{}; const viaBadge=st2.via?` <span style="font-size:.48rem;background:rgba(16,185,129,.18);color:#10B981;padding:1px 4px;border-radius:3px;">${st2.via}</span>`:'';
  if(state==='loading')el.innerHTML=`<span style="color:#a78bfa">⏳ Conectando...</span>`;
  else if(state==='ok')el.innerHTML=`<span style="color:#10B981">✓ ${count} evento${count!==1?'s':''} · ${t}</span>${viaBadge}`;
  else if(state==='error'){ const src=SOURCES.find(s=>s.id===id);const hasCfg=src&&src.lsKey; el.innerHTML=`<span style="color:#F87171">⚠️ ${err.slice(0,44)}</span>${hasCfg?` <a href="#" style="color:#FB923C;font-size:.58rem" onclick="startConfig('${id}',event)">Configurar →</a>`:''}`; }
}
function startConfig(srcId,e){ if(e)e.preventDefault(); const src=SOURCES.find(s=>s.id===srcId);if(!src||!src.lsKey)return; if(src.type==='trello'){ closeCalModal(); openAdminModal(); return; } _cfgSrcId=srcId; document.getElementById('cfg-label').textContent=`URL iCal — ${src.name}`; document.getElementById('cfg-url-input').value=localStorage.getItem(src.lsKey)||''; document.getElementById('cfg-url-input').placeholder='https://calendar.google.com/calendar/ical/...'; document.getElementById('cal-config-zone').classList.add('show'); document.getElementById('cal-main-actions').style.display='none'; setTimeout(()=>document.getElementById('cfg-url-input').focus(),80); }
function cancelConfig(){ _cfgSrcId=null; document.getElementById('cal-config-zone').classList.remove('show'); document.getElementById('cal-main-actions').style.display='flex'; }
function saveConfig(){ const url=document.getElementById('cfg-url-input').value.trim();if(!url||!_cfgSrcId)return; const src=SOURCES.find(s=>s.id===_cfgSrcId);if(src&&src.lsKey)localStorage.setItem(src.lsKey,url); cancelConfig(); syncSource(_cfgSrcId,null); }
function renderCalSources(){
  const cont=document.getElementById('cal-sources');if(!cont)return;cont.innerHTML='';
  const permLabels={rw:'R/W',ro:'Solo lectura',admin:'Admin',query:'Consulta'}; const permClass={rw:'perm-rw',ro:'perm-ro',admin:'perm-admin',query:'perm-query'};
  SOURCES.forEach(src=>{
    const st=SYNC_STATUS[src.id]; const customUrl=src.lsKey?localStorage.getItem(src.lsKey):null; const perm=getPermForCal(src.cal); const enabled=isSourceEnabled(src.id);
    let statusHtml;
    if(!enabled)statusHtml=`<span style="color:var(--mut)">🔒 Deshabilitado en permisos</span>`;
    else if(!st)statusHtml=`<span style="color:var(--mut)">Sin sincronizar</span>`;
    else if(st.ok){const t=st.time.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});statusHtml=`<span style="color:#10B981">✓ ${st.count} eventos · ${t}</span>`;}
    else{statusHtml=`<span style="color:#F87171">⚠️ ${st.error.slice(0,38)}</span>`+(src.lsKey?` <a href="#" style="color:#FB923C;font-size:.58rem" onclick="startConfig('${src.id}',event)">Config →</a>`:'');}
    const card=document.createElement('div');card.className='src-card';card.id='src-'+src.id;card.style.setProperty('--src-c',src.color);
    card.innerHTML=`<div class="src-icon">${src.icon}</div>
    <div class="src-info">
      <div class="src-name" style="display:flex;align-items:center;gap:6px;">${src.name} <span class="perm-badge ${permClass[perm]||'perm-ro'}">${permLabels[perm]||perm}</span></div>
      <div class="src-desc">${src.desc}${src.type==='trello'?' · <span style="font-size:.56rem;background:rgba(16,185,129,.18);color:#10B981;padding:1px 4px;border-radius:3px">Trello</span>':''}${customUrl?' · <span style="color:#a78bfa;font-size:.56rem">URL privada ✓</span>':''}</div>
      <div class="src-status">${statusHtml}</div>
    </div>
    <div class="src-actions">
      ${SYNC_ADVANCED&&src.embedUrl?`<button class="btn btn-g" style="padding:4px 8px;font-size:.62rem" onclick="window.open('${src.embedUrl}','_blank')">↗</button>`:''}
      ${SYNC_ADVANCED&&src.lsKey?`<button class="btn btn-g" style="padding:4px 8px;font-size:.62rem" onclick="startConfig('${src.id}',event)">⚙️</button>`:''}
      <button class="btn btn-p" style="padding:4px 10px;font-size:.64rem" onclick="syncSource('${src.id}',this)" ${enabled?'':'disabled title="Habilitar en ⚙️ Permisos"'}>🔄</button>
    </div>`;
    cont.appendChild(card);
  });
}
function openCalModal(){setSyncView(false);renderCalSources();document.getElementById('cal-modal').classList.add('open');announce('Panel de sincronización abierto en vista simple');}
function closeCalModal(){document.getElementById('cal-modal').classList.remove('open');cancelConfig();}

const GCAL_API='https://www.googleapis.com/calendar/v3';
const GCAL_SCOPES='https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';
const GCAL_CLIENT_ID='5033046467-kgd7gl4tekb4fkt90jq32rob4evmgnmn.apps.googleusercontent.com';
let gToken=null;let tokenClient=null;
function initGAuthUI(){
  const savedId=localStorage.getItem('gcal_client_id')||GCAL_CLIENT_ID;
  const zone=document.getElementById('gcal-auth-zone');if(!zone)return;
  zone.className='oauth-box disconnected';
  const isLocalhost=location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.hostname==='vientonorte.github.io';
  const originWarning=!isLocalhost?`<div style="margin-top:6px;padding:5px 7px;background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.3);border-radius:6px;font-size:.6rem;color:#fb923c;line-height:1.5">⚠️ Requiere <strong>http://localhost</strong>. Ejecuta:<br><code style="background:rgba(0,0,0,.25);padding:1px 5px;border-radius:3px;">python3 -m http.server 8080</code></div>`:`<div style="font-size:.58rem;color:#10B981;margin-top:3px">✓ Origen correcto</div>`;
  zone.innerHTML=`<div style="font-size:.65rem;color:var(--mut);margin-bottom:5px;line-height:1.5">Sync bidireccional con Google Calendar. Client ID configurado ✓</div><div class="mfield" style="margin-bottom:7px"><label>Google OAuth Client ID</label><input type="text" id="gcal-client-id" value="${savedId}" style="font-size:.6rem;opacity:.75"></div>${originWarning}<button class="btn btn-p" onclick="gSignIn()" style="width:100%;justify-content:center;margin-top:8px">🔑 Conectar con Google</button>`;
}
function gSignIn(){
  const clientId=((document.getElementById('gcal-client-id')?.value||'').trim())||GCAL_CLIENT_ID;
  if(!window.google?.accounts?.oauth2){alert('La librería GIS aún no cargó. Espera un momento.');return;}
  localStorage.setItem('gcal_client_id',clientId);
  tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:clientId,scope:GCAL_SCOPES,
    callback:resp=>{if(resp.error){console.error('GIS error:',resp);return;}gToken=resp.access_token;updateAuthConnected();syncAll();}
  });
  tokenClient.requestAccessToken({prompt:'consent'});
}
function gSignOut(){ if(gToken&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(gToken,()=>{}); gToken=null; initGAuthUI(); renderCalSources(); }
function updateAuthConnected(){ const zone=document.getElementById('gcal-auth-zone');if(!zone)return; zone.className='oauth-box'; zone.innerHTML=`<div class="oauth-connected"><div class="oauth-dot"></div><span style="font-size:.71rem;color:#10B981;font-weight:700;flex:1">Google Calendar conectado ✓</span><button class="btn btn-g" style="padding:3px 8px;font-size:.58rem" onclick="listCals()">🔍 Detectar</button><button class="btn btn-g" style="padding:3px 8px;font-size:.58rem;margin-left:3px" onclick="gSignOut()">Salir</button></div><div style="font-size:.58rem;color:var(--mut);margin-top:4px;">Sync bidireccional activo · Personal R/W · Finanzas/Camila solo lectura · Sura requiere admin</div>`; renderCalSources(); }
async function listCals(){
  if(!gToken){alert('Conecta Google Calendar primero');return;}
  try{
    const resp=await fetch(`${GCAL_API}/users/me/calendarList?maxResults=50`,{headers:{'Authorization':`Bearer ${gToken}`}});
    if(!resp.ok)throw new Error(`Error ${resp.status}`);
    const data=await resp.json(); const items=(data.items||[]); const sura=items.find(c=>/(sura|investments)/i.test(c.summary)||/(sura|investments)/i.test(c.id));
    if(sura){ const src=SOURCES.find(s=>s.id==='trabajo'); if(src&&!src.gcalId){ src.gcalId=sura.id;src.desc=sura.summary; localStorage.setItem('gcal_sura_id',sura.id); alert(`🏢 Sura detectado: "${sura.summary}"\nSe habilitará en el próximo sync (requiere permiso Admin en ⚙️ Permisos).`); renderCalSources(); } }
    const zone=document.getElementById('gcal-auth-zone');
    if(!document.getElementById('gcal-cal-list')&&zone){ const div=document.createElement('div');div.id='gcal-cal-list';div.style='margin-top:7px;font-size:.6rem;color:var(--mut)'; const names=items.map(c=>`· ${c.summary}`).join('<br>'); div.innerHTML=`<strong style="color:#a78bfa">${items.length} calendarios:</strong><br>${names}${sura?'<br><span style="color:#F97316">🏢 Sura encontrado ✓</span>':''}`; zone.appendChild(div); }
  }catch(err){alert('Error al listar calendarios: '+err.message);}
}
async function fetchGCalEvents(calId,calKey,readonly=true,srcId=''){
  if(!gToken)return null;
  const now=new Date();const from=new Date(now);from.setMonth(from.getMonth()-1);const to=new Date(now);to.setMonth(to.getMonth()+4);
  const p=new URLSearchParams({timeMin:from.toISOString(),timeMax:to.toISOString(),singleEvents:'true',orderBy:'startTime',maxResults:'500'});
  const resp=await fetch(`${GCAL_API}/calendars/${encodeURIComponent(calId)}/events?${p}`,{headers:{'Authorization':`Bearer ${gToken}`}});
  if(resp.status===401){gToken=null;gSignOut();return null;}
  if(!resp.ok)throw new Error(`GCal API ${resp.status}`);
  const data=await resp.json();
  return(data.items||[]).map(item=>{
    const start=item.start;let iso,time,allDay=false;
    if(start.date){iso=start.date;allDay=true;}
    else if(start.dateTime){ const d=new Date(start.dateTime); const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d); const[dp,tp]=(fmt+', 00:00').split(', ');iso=dp;time=tp.replace(/^24:/,'00:').slice(0,5); }
    if(!iso)return null;
    return{iso,title:(item.summary||'(sin título)').slice(0,80),cal:calKey,time,allDay,uid:item.id,fromCal:true,readonly,source:'gcal',srcId:srcId||'',kind:'event'};
  }).filter(Boolean);
}
function getGCalIdForCal(calKey){
  const src=SOURCES.find(s=>s.cal===calKey);
  return (src&&src.gcalId)?src.gcalId:'gaete.gaona@gmail.com';
}
async function syncToGCal(e,btn){
  e.stopPropagation();
  const card=btn.closest('.card'); const title=card.querySelector('.ct').textContent; const detail=card.querySelector('.det-area')?.value||''; const timeStr=(card.querySelector('.ctime')?.textContent||'').replace('⏰ ','').trim(); const parentId=card.closest('[id^="wb-"]')?.id||''; const iso=parentId.replace('wb-','')||isoOf(new Date());
  if(gToken){ btn.textContent='⏳';btn.disabled=true; try{ const targetCalId=getGCalIdForCal(card.dataset.cal); await pushEventToGCalAPI({title,iso,time:timeStr,detail,cal:card.dataset.cal},targetCalId); btn.textContent='✓';btn.style.color='#10B981'; setTimeout(()=>btn.remove(),1600); }catch(err){ btn.textContent='⚠️';btn.disabled=false;setTimeout(()=>{btn.textContent='📅';btn.style.color='';},2000);} }
  else{ showToast('Abriendo Google Calendar...','info',2000); const url='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(title)+(detail?'&details='+encodeURIComponent(detail):''); window.open(url,'_blank'); }
}

async function syncAllToGCal(){
  if(!gToken){alert('Conecta Google Calendar primero');return;}
  const cards=[...document.querySelectorAll('.card')].filter(c=>c.querySelector('.sync-btn'));
  if(!cards.length){showToast('No hay tarjetas para sincronizar.','info');return;}
  if(!confirm(`¿Sincronizar ${cards.length} tarjetas a Google Calendar?`))return;
  let ok=0,fail=0;
  for(const card of cards){
    const title=card.querySelector('.ct').textContent;
    const detail=card.querySelector('.det-area')?.value||'';
    const timeStr=(card.querySelector('.ctime')?.textContent||'').replace('⏰ ','').trim();
    const parentId=card.closest('[id^="wb-"]')?.id||'';
    const iso=parentId.replace('wb-','')||isoOf(new Date());
    const calId=getGCalIdForCal(card.dataset.cal);
    try{
      await pushEventToGCalAPI({title,iso,time:timeStr,detail,cal:card.dataset.cal},calId);
      const btn=card.querySelector('.sync-btn');
      if(btn){btn.textContent='✓';btn.style.color='#10B981';setTimeout(()=>btn.remove(),1600);}
      ok++;
    }catch(err){fail++;console.warn('Sync fail:',title,err);}
  }
  announce(`Sincronización: ${ok} exitosas${fail?`, ${fail} errores`:''}`);
  showToast(`✓ ${ok} sincronizadas${fail?` · ${fail} errores`:''}`,fail?'error':'ok',4000);
}
async function pushEventToGCalAPI(ev,calId='gaete.gaona@gmail.com'){
  if(!gToken)return false;
  let start,end;
  if(ev.allDay||!ev.time){const nd=new Date(ev.iso);nd.setDate(nd.getDate()+1);start={date:ev.iso};end={date:isoOf(nd)};}
  else{const[h,mi]=ev.time.split(':');const endH=String(parseInt(h)+1).padStart(2,'0');start={dateTime:`${ev.iso}T${h.padStart(2,'0')}:${mi||'00'}:00`,timeZone:'America/Santiago'};end={dateTime:`${ev.iso}T${endH}:${mi||'00'}:00`,timeZone:'America/Santiago'};}
  const body={summary:ev.title,start,end,description:ev.detail||''};
  const resp=await fetch(`${GCAL_API}/calendars/${encodeURIComponent(calId)}/events`,{method:'POST',headers:{'Authorization':`Bearer ${gToken}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!resp.ok)throw new Error(`Push ${resp.status}`);
  return await resp.json();
}

/* ── Sync-back helpers ── */
function canSyncBack(card){
  if(!gToken||!card.dataset.uid||card.dataset.source!=='gcal')return false;
  const src=SOURCES.find(s=>s.cal===card.dataset.cal);
  return !!(src&&!src.readonly);
}
function updateEventInCache(uid,changes){
  const ev=EVENTS.find(e=>e.uid===uid);if(!ev)return;
  if(changes.iso!==undefined)ev.iso=changes.iso;
  if(changes.time!==undefined)ev.time=changes.time;
  if(changes.title!==undefined)ev.title=changes.title;
  if(changes.detail!==undefined)ev.detail=changes.detail;
}
async function patchEventInGCalAPI(uid,calId,changes){
  if(!gToken||!uid)return false;
  const body={};
  if(changes.title!==undefined)body.summary=changes.title;
  if(changes.detail!==undefined)body.description=changes.detail;
  if(changes.iso!==undefined){
    const iso=changes.iso;const time=changes.time;
    if(!time||time==='Todo el d\u00eda'||time===''){const nd=new Date(iso);nd.setDate(nd.getDate()+1);body.start={date:iso};body.end={date:isoOf(nd)};}
    else{const[h,mi]=time.split(':');const endH=String(parseInt(h)+1).padStart(2,'0');body.start={dateTime:`${iso}T${h.padStart(2,'0')}:${mi||'00'}:00`,timeZone:'America/Santiago'};body.end={dateTime:`${iso}T${endH}:${mi||'00'}:00`,timeZone:'America/Santiago'};}
  }
  const resp=await fetch(`${GCAL_API}/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(uid)}`,{method:'PATCH',headers:{'Authorization':`Bearer ${gToken}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!resp.ok)throw new Error(`Patch ${resp.status}`);
  return await resp.json();
}

function toggleDetail(e,btn){e.stopPropagation();const card=btn.closest('.card');const panel=card.querySelector('.card-detail');const open=panel.classList.toggle('show');btn.classList.toggle('open',open);if(open)panel.querySelector('.det-area').focus();}
function openAddModal(){
  const sel=document.getElementById('add-day');sel.innerHTML='';
  Array.from({length:7},(_,i)=>addDays(weekStart,i)).forEach(d=>{const iso=isoOf(d);const opt=document.createElement('option');opt.value=iso;opt.textContent=FDAYS[d.getDay()]+' '+d.getDate();sel.appendChild(opt);});
  document.getElementById('add-title').value='';document.getElementById('add-time').value='';document.getElementById('add-detail').value='';
  document.getElementById('add-modal').classList.add('open');setTimeout(()=>document.getElementById('add-title').focus(),120);
}
function closeAddModal(){document.getElementById('add-modal').classList.remove('open');}
function submitAdd(){
  const title=document.getElementById('add-title').value.trim();if(!title){document.getElementById('add-title').focus();return;}
  const iso=document.getElementById('add-day').value;const time=document.getElementById('add-time').value; const cat=document.getElementById('add-cat').value;const detail=document.getElementById('add-detail').value.trim();
  const body=document.getElementById('wb-'+iso);
  if(body){const card=makeCard({title,cal:cat,time,detail,fromCal:false,source:'manual',kind:'task'});body.appendChild(card);body.querySelector('.day-empty')?.remove();updateDayCount(body.closest('.wday'));applyFilter();}
  closeAddModal();
}
function openAdminModal(){ renderAdmCalUrls(); renderResIcal(); renderCredentials(); renderPermList(); hydrateAIAdmin(); hydrateTrelloAdmin(); document.getElementById('admin-modal').classList.add('open'); announce('Panel de administración abierto'); }
function closeAdminModal(){document.getElementById('admin-modal').classList.remove('open');}
function switchTab(id,btn){ document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active')); document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active')); btn.classList.add('active');document.getElementById('tab-'+id).classList.add('active'); if(id==='permisos')renderPermList(); }
function toggleFaq(q){const a=q.nextElementSibling;const isOpen=q.classList.contains('open');document.querySelectorAll('.faq-q.open').forEach(x=>{x.classList.remove('open');x.nextElementSibling.classList.remove('open');});if(!isOpen){q.classList.add('open');a.classList.add('open');}}
function saveClientId(){const val=document.getElementById('adm-client-id')?.value?.trim();if(!val)return;localStorage.setItem('gcal_client_id',val);const btn=event.target;btn.textContent='✓';btn.style.color='#10B981';setTimeout(()=>{btn.textContent='💾';btn.style.color='';},1800);}
function saveTrelloCredentials(btn){const key=document.getElementById('adm-trello-key')?.value?.trim();const token=document.getElementById('adm-trello-token')?.value?.trim();if(!key||!token){alert('Ingresa API Key y Token de Trello.');return;}localStorage.setItem('trello_api_key',key);localStorage.setItem('trello_api_token',token);if(btn){btn.textContent='✓';btn.style.color='#10B981';setTimeout(()=>{btn.textContent='💾';btn.style.color='';},1800);}}
function hydrateTrelloAdmin(){const k=document.getElementById('adm-trello-key');const t=document.getElementById('adm-trello-token');if(k)k.value=localStorage.getItem('trello_api_key')||'';if(t)t.value=localStorage.getItem('trello_api_token')||'';}
function renderAdmCalUrls(){
  const cont=document.getElementById('adm-cal-urls');if(!cont)return;cont.innerHTML='';
  SOURCES.filter(src=>src.type!=='trello').forEach(src=>{ const custom=src.lsKey?localStorage.getItem(src.lsKey)||'':'';const url=custom||src.icsUrl||'';const div=document.createElement('div');div.className='mfield';div.style='margin-bottom:5px'; div.innerHTML=`<label style="display:flex;gap:5px;align-items:center"><span style="background:${src.color};width:6px;height:6px;border-radius:50%;display:inline-block"></span>${src.name}${src.gcalId?' <span style="font-size:.48rem;background:rgba(16,185,129,.18);color:#10B981;padding:1px 4px;border-radius:3px">API ✓</span>':''}</label><div style="display:flex;gap:5px;align-items:center"><input type="text" value="${url}" placeholder="URL iCal..." style="font-size:.59rem;flex:1" data-src="${src.id}">${src.lsKey?`<button class="res-copy" onclick="saveCalUrl('${src.id}',this)">💾</button>`:'<span style="font-size:.58rem;color:var(--mut)">no config</span>'}</div>`; cont.appendChild(div); });
}
function saveCalUrl(srcId,btn){const src=SOURCES.find(s=>s.id===srcId);if(!src||!src.lsKey)return;const input=btn.previousElementSibling;const url=input?.value?.trim();if(!url)return;localStorage.setItem(src.lsKey,url);btn.textContent='✓';btn.style.color='#10B981';setTimeout(()=>{btn.textContent='💾';btn.style.color='';},1800);}
function exportBoard(){const data={states:JSON.parse(localStorage.getItem('tablero_states_ro')||'{}'),extra:JSON.parse(localStorage.getItem('tablero_extra_ro')||'[]'),synced:JSON.parse(localStorage.getItem('tablero_synced_ro')||'[]'),perms:PERMS,ai:AI_CFG,exported:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`tablero-ro-${isoOf(new Date())}.json`;a.click();URL.revokeObjectURL(a.href);}
function importBoardClick(){document.getElementById('import-file').click();}
function importBoard(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const data=JSON.parse(ev.target.result);if(data.states)localStorage.setItem('tablero_states_ro',JSON.stringify(data.states));if(data.extra)localStorage.setItem('tablero_extra_ro',JSON.stringify(data.extra));if(data.synced)localStorage.setItem('tablero_synced_ro',JSON.stringify(data.synced));if(data.perms){PERMS=data.perms;savePerms();} if(data.ai){AI_CFG=deepMerge(AI_DEFAULTS,data.ai); saveAICfg(); hydrateAIForm(); hydrateAIAdmin();} loadBoard();renderWeek();closeAdminModal();alert('✓ Estado importado correctamente.');}catch(e){alert('Error al importar: '+e.message);}};r.readAsText(f);}
function clearSavedState(){if(!confirm('¿Eliminar todos los estados guardados?'))return;localStorage.removeItem('tablero_states_ro');localStorage.removeItem('tablero_extra_ro');localStorage.removeItem('tablero_synced_ro');CARD_STATES={};EXTRA_EVENTS=[];renderWeek();closeAdminModal();}
function renderResIcal(){const cont=document.getElementById('res-ical-list');if(!cont)return;cont.innerHTML='';SOURCES.forEach(src=>{const url=src.icsUrl||'';if(!url)return;const div=document.createElement('div');div.className='res-card';div.style='margin-bottom:4px;cursor:default';div.innerHTML=`<span class="res-icon" style="font-size:.9rem">${src.icon}</span><div class="res-info"><div class="res-name">${src.name}</div><div class="res-url">${url.slice(0,52)}…</div></div><button class="res-copy" onclick="copyText('${url}',this)">Copiar</button>`;cont.appendChild(div);});}
function copyText(text,btn){navigator.clipboard.writeText(text).then(()=>{const orig=btn.textContent;btn.textContent='✓';btn.style.color='#10B981';setTimeout(()=>{btn.textContent=orig;btn.style.color='';},1800);}).catch(()=>{alert('Copia manual:\n'+text);});}

let EXTRA_EVENTS=[];let CARD_STATES={};
function cardKey(iso,title,cal){return `${iso}|${title}|${cal}`;}

/* ── Sync cache: persist synced calendar events across refreshes ── */
function cacheSyncedEvents(){
  try{
    const synced=EVENTS.filter(e=>e.uid&&e.fromCal);
    localStorage.setItem('tablero_synced_ro',JSON.stringify(synced));
  }catch(e){if(e.name==='QuotaExceededError')console.warn('cacheSyncedEvents: storage full');else console.warn('cacheSyncedEvents:',e);}
}
function loadSyncedCache(){
  try{
    const cached=JSON.parse(localStorage.getItem('tablero_synced_ro')||'[]');
    cached.forEach(ev=>{if(ev.uid&&!EVENTS.find(e=>e.uid===ev.uid))EVENTS.push(ev);});
    dedupeSyncedEvents();
  }catch(e){console.warn('loadSyncedCache:',e);}
}

function saveBoard(){
  const states={};const extra=[];
  document.querySelectorAll('[id^="wb-"]').forEach(body=>{
    const iso=body.id.replace('wb-','');
    body.querySelectorAll('.card').forEach(card=>{
      const title=card.querySelector('.ct')?.textContent||'';const cal=card.dataset.cal||'bujo';
      const done=card.classList.contains('done');const detail=card.querySelector('.det-area')?.value||''; const time=(card.querySelector('.ctime')?.textContent||'').replace('⏰ ','').trim(); const hasSync=!!card.querySelector('.sync-btn'); const key=cardKey(iso,title,cal); const source=card.dataset.source||'manual'; const kind=card.dataset.kind||'task'; const cancelled=card.classList.contains('cancelled');states[key]={done,detail,cancelled}; if(source==="manual"||source==="bujo")extra.push({iso,title,cal,time,detail,fromCal:false,source,kind});
    });
  });
  CARD_STATES=states;EXTRA_EVENTS=extra; try{localStorage.setItem('tablero_states_ro',JSON.stringify(states)); localStorage.setItem('tablero_extra_ro',JSON.stringify(extra));}catch(e){if(e.name==='QuotaExceededError'){showToast('⚠️ Almacenamiento lleno. Exporta y limpia datos antiguos.','error',5000);}else{throw e;}}
  const btn=document.getElementById('save-btn'); if(btn){btn.textContent='✓ Guardado';btn.classList.add('saved');setTimeout(()=>{btn.textContent='💾 Guardar';btn.classList.remove('saved');},2200);}
  const n=Object.keys(states).length; const xn=extra.length;
  showToast(`💾 ${n} tarjetas · ${xn} manuales guardadas`,'ok',2000);
}
function loadBoard(){
  try{ CARD_STATES=JSON.parse(localStorage.getItem('tablero_states_ro')||'{}'); EXTRA_EVENTS=JSON.parse(localStorage.getItem('tablero_extra_ro')||'[]'); EXTRA_EVENTS.forEach(ev=>{if(!EVENTS.find(e=>e.iso===ev.iso&&e.title===ev.title))EVENTS.push(ev);}); loadSyncedCache(); }
  catch(e){console.warn('loadBoard:',e);} 
}
function applyCardStates(){ document.querySelectorAll('[id^="wb-"]').forEach(body=>{ const iso=body.id.replace('wb-',''); body.querySelectorAll('.card').forEach(card=>{ const title=card.querySelector('.ct')?.textContent||'';const cal=card.dataset.cal||'bujo'; const st=CARD_STATES[cardKey(iso,title,cal)];if(!st)return; if(st.done)card.classList.add('done');if(st.cancelled)card.classList.add('cancelled'); if(st.detail){const area=card.querySelector('.det-area');if(area){area.value=st.detail;card.querySelector('.card-detail')?.classList.add('show');}} }); }); }

document.addEventListener('click',e=>{ if(Date.now()-LAST_LONG_PRESS_AT<450){e.preventDefault();e.stopPropagation();return;} if(!e.target.closest('.tool-menu-wrap')) closeToolsMenu(); if(!e.target.closest('.ctx-menu')) closeCtxMenu(); },true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){closeCtxMenu();closeEditModal();closeDrawer();closeAddModal();closeCalModal();closeAdminModal();closeToolsMenu();} if((e.metaKey||e.ctrlKey)&&e.key==='s'){e.preventDefault();saveBoard();} if((e.metaKey||e.ctrlKey)&&e.key==='z'){e.preventDefault();undo();} });
/* ===== CONTEXT MENU + EDIT / DELETE / CANCEL ===== */
let CTX_CARD=null;
function showCtxMenu(e,card){
  closeCtxMenu();CTX_CARD=card;
  const menu=document.createElement('div');menu.className='ctx-menu';
  const isCan=card.classList.contains('cancelled');
  menu.innerHTML='<button class="ctx-opt" onclick="editFromCtx()">✏️ Editar</button>'
    +'<button class="ctx-opt" onclick="cancelFromCtx()">'+(isCan?'✅ Reactivar':'🚫 Cancelar')+'</button>'
    +'<button class="ctx-opt ctx-danger" onclick="deleteFromCtx()">🗑️ Eliminar</button>';
  menu.style.left=e.clientX+'px';menu.style.top=e.clientY+'px';
  document.body.appendChild(menu);
  requestAnimationFrame(()=>{const r=menu.getBoundingClientRect();if(r.right>window.innerWidth)menu.style.left=(window.innerWidth-r.width-8)+'px';if(r.bottom>window.innerHeight)menu.style.top=(window.innerHeight-r.height-8)+'px';});
}
function closeCtxMenu(){const m=document.querySelector('.ctx-menu');if(m)m.remove();CTX_CARD=null;}
function editFromCtx(){const card=CTX_CARD;closeCtxMenu();if(card)openEditModal(card);}
function cancelFromCtx(){const card=CTX_CARD;closeCtxMenu();if(!card)return;pushUndo('cancel',card,card.classList.contains('cancelled'));card.classList.toggle('cancelled');announce(card.classList.contains('cancelled')?'Evento cancelado':'Evento reactivado');autoSave();}
function deleteFromCtx(){const card=CTX_CARD;closeCtxMenu();if(!card)return;const title=card.querySelector('.ct')?.textContent||'evento';if(!confirm('¿Eliminar "'+title+'"?'))return;const parentBody=card.closest('[id^="wb-"]');const delIso=parentBody?parentBody.id.replace('wb-',''):'';pushUndo('delete',card,{iso:delIso});const wday=card.closest('.wday');card.remove();if(wday){updateDayCount(wday);const body=wday.querySelector('[id^="wb-"]');if(body&&!body.querySelector('.card')){body.innerHTML='<div class="day-empty">Sin eventos</div>';}}autoSave();announce('Evento eliminado');}

function openEditModal(card){
  const iso=card.closest('[id^="wb-"]')?.id.replace('wb-','')||'';
  const title=card.querySelector('.ct')?.textContent||'';
  const timeEl=card.querySelector('.ctime');
  const rawT=timeEl?(timeEl.textContent||'').replace('⏰ ','').trim():'';
  const time=(rawT==='Todo el día')?'':(rawT||'');
  const cal=card.dataset.cal||'personal';
  const detail=card.querySelector('.det-area')?.value||'';
  const sel=document.getElementById('edit-day');sel.innerHTML='';
  Array.from({length:7},(_,i)=>addDays(weekStart,i)).forEach(d=>{const diso=isoOf(d);const opt=document.createElement('option');opt.value=diso;opt.textContent=FDAYS[d.getDay()]+' '+d.getDate();if(diso===iso)opt.selected=true;sel.appendChild(opt);});
  document.getElementById('edit-title').value=title;
  document.getElementById('edit-time').value=time;
  document.getElementById('edit-cat').value=cal;
  document.getElementById('edit-detail').value=detail;
  const modal=document.getElementById('edit-modal');
  modal.dataset.cardIso=iso;modal.dataset.cardTitle=title;modal.dataset.cardCal=cal;
  modal.classList.add('open');
  setTimeout(()=>document.getElementById('edit-title').focus(),120);
}
function closeEditModal(){document.getElementById('edit-modal').classList.remove('open');}
function submitEdit(){
  const modal=document.getElementById('edit-modal');
  const oldIso=modal.dataset.cardIso,oldTitle=modal.dataset.cardTitle,oldCal=modal.dataset.cardCal;
  const newTitle=document.getElementById('edit-title').value.trim();
  if(!newTitle){document.getElementById('edit-title').focus();return;}
  const newIso=document.getElementById('edit-day').value;
  const newTime=document.getElementById('edit-time').value;
  const newCat=document.getElementById('edit-cat').value;
  const newDetail=document.getElementById('edit-detail').value.trim();
  const oldBody=document.getElementById('wb-'+oldIso);
  if(!oldBody){closeEditModal();return;}
  let targetCard=null;
  oldBody.querySelectorAll('.card').forEach(c=>{if(c.querySelector('.ct')?.textContent===oldTitle&&c.dataset.cal===oldCal)targetCard=c;});
  if(!targetCard){closeEditModal();return;}
  const oldTime=(targetCard.querySelector('.ctime')?.textContent||'').replace('⏰ ','').trim();
  const oldDetail=targetCard.querySelector('.det-area')?.value||'';
  pushUndo('edit',targetCard,{title:oldTitle,cal:oldCal,iso:oldIso,newIso:newIso,time:oldTime==='Todo el día'?'':oldTime,detail:oldDetail});
  const ci=CAL[newCat]||CAL.bujo;
  targetCard.querySelector('.ct').textContent=newTitle;
  targetCard.dataset.cal=newCat;
  targetCard.style.setProperty('--cc',ci.c);
  const ctag=targetCard.querySelector('.ctag');if(ctag){ctag.textContent=ci.l;ctag.style.color=ci.c;}
  const ctime=targetCard.querySelector('.ctime');
  if(newTime){if(ctime){ctime.textContent='⏰ '+newTime;}else{const ct=targetCard.querySelector('.ct');const td=document.createElement('div');td.className='ctime';td.textContent='⏰ '+newTime;ct.after(td);}}
  else if(ctime){ctime.textContent='⏰ Todo el día';}
  const area=targetCard.querySelector('.det-area');if(area)area.value=newDetail;
  if(newDetail)targetCard.querySelector('.card-detail')?.classList.add('show');
  if(newIso!==oldIso){
    const newBody=document.getElementById('wb-'+newIso);
    if(newBody){newBody.appendChild(targetCard);newBody.querySelector('.day-empty')?.remove();updateDayCount(newBody.closest('.wday'));}
    updateDayCount(oldBody.closest('.wday'));
    if(!oldBody.querySelector('.card'))oldBody.innerHTML='<div class="day-empty">Sin eventos</div>';
  }
  const oldKey=cardKey(oldIso,oldTitle,oldCal);
  if(CARD_STATES[oldKey]){const nk=cardKey(newIso,newTitle,newCat);CARD_STATES[nk]=CARD_STATES[oldKey];if(nk!==oldKey)delete CARD_STATES[oldKey];}
  if(canSyncBack(targetCard)){
    const calId=getGCalIdForCal(newCat);
    showToast('Actualizando en Google Calendar\u2026','info',2000);
    patchEventInGCalAPI(targetCard.dataset.uid,calId,{iso:newIso,time:newTime,title:newTitle,detail:newDetail})
      .then(()=>{updateEventInCache(targetCard.dataset.uid,{iso:newIso,time:newTime,title:newTitle,detail:newDetail});cacheSyncedEvents();showToast('\u2713 Actualizado en Google Calendar','ok',2500);})
      .catch(err=>{console.warn('sync-back edit:',err);showToast('\u26a0\ufe0f No se pudo actualizar en Google Calendar','error',3500);});
  }
  closeEditModal();autoSave();announce('Evento actualizado');
}

(function restoreSura(){const sid=localStorage.getItem('gcal_sura_id');if(sid){const s=SOURCES.find(x=>x.id==='trabajo');if(s&&!s.gcalId)s.gcalId=sid;}})();
loadPerms(); loadBoard(); renderWeek(); initGAuthUI(); hydrateAIForm(); hydrateAIAdmin(); updateAIStatus(); updateBujoSummary(); setSyncView(false);
/* ── Auto-sync on page load: refresh cached events in background ── */
setTimeout(()=>{syncAll().then(()=>renderWeek()).catch(err=>console.warn('Auto-sync:',err));},1500);
function renderCredentials(){
  const cont=document.getElementById('res-credentials-list');if(!cont)return;cont.innerHTML='';
  const clientId=localStorage.getItem('gcal_client_id')||GCAL_CLIENT_ID;
  const items=[
    {icon:'🔐',name:'OAuth Client ID',value:clientId},
    ...SOURCES.map(s=>({icon:s.icon,name:s.name,value:s.gcalId||s.desc||''}))
  ];
  items.forEach(item=>{
    if(!item.value)return;
    const div=document.createElement('div');div.className='res-card';div.style='cursor:default';
    div.innerHTML='<span class="res-icon">'+item.icon+'</span><div class="res-info"><div class="res-name">'+item.name+'</div><div class="res-url">'+item.value+'</div></div><button class="res-copy" onclick="copyText(\''+item.value.replace(/'/g,"\\'")+'\',this)">Copiar</button>';
    cont.appendChild(div);
  });
}
