#!/usr/bin/env node
/**
 * QA smoke — table-ro static + functional (buttons)
 * Exit 0 = pass, 1 = fail
 */
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = new URL('..', import.meta.url).pathname;
const PORT = 3457;
const BASE = `http://127.0.0.1:${PORT}/index.html`;

const REQUIRED_GLOBALS = [
  'goWeek',
  'goToday',
  'openAddModal',
  'openDrawer',
  'toggleLegend',
  'toggleToolsMenu',
  'acceptConsent',
  'saveBoard',
  'openCalModal',
  'openAdminModal',
];

function fail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

function ok(msg) {
  console.log('OK:', msg);
}

// ── Static checks ──
const indexHtml = readFileSync(`${ROOT}/index.html`, 'utf8');
const appJs = readFileSync(`${ROOT}/js/app.js`, 'utf8');

if (!indexHtml.includes("script-src-attr 'unsafe-inline'")) {
  fail('CSP sin script-src-attr — los onclick inline quedan bloqueados');
}
ok('CSP incluye script-src-attr');

for (const fn of REQUIRED_GLOBALS) {
  if (!appJs.includes(`function ${fn}`)) {
    fail(`js/app.js no define function ${fn}`);
  }
}
ok(`app.js define ${REQUIRED_GLOBALS.length} handlers globales`);

if (!indexHtml.includes('js/app.js?v=1.7.9')) {
  fail('index.html no referencia app.js v1.7.9 (cache bust)');
}
ok('Cache bust app.js v1.7.9');

if (!appJs.includes('function openLocalTarget') || !appJs.includes('obsidian://open')) {
  fail('faltan deep-links locales (openLocalTarget / obsidian URI)');
}
if (!indexHtml.includes('adm-local-vault-path') || !indexHtml.includes('Local · vault')) {
  fail('Admin Local incompleto');
}
ok('Local vault/app open links');

if (!appJs.includes('function subscribeTrelloIcsToGCal')) {
  fail('falta subscribeTrelloIcsToGCal (capa A)');
}
ok('Capa A ICS→GCal one-click');

if (!indexHtml.includes('app-rail') || !indexHtml.includes('view-switch') || !indexHtml.includes('ops-embed__shell')) {
  fail('Ops journey nav incompleto (app-rail / view-switch / shell)');
}
if (!appJs.includes('function setBoardView') || !appJs.includes('OPS_EMBED_URL')) {
  fail('setBoardView / OPS_EMBED_URL missing');
}
if (!indexHtml.includes('data-view="ops"') || !indexHtml.includes('id="tab-ops"')) {
  fail('tab Ops missing');
}
ok('Ops hub journey nav (Semana | Ops)');

// Trello hub + bridge
if (!appJs.includes("type: 'trello'") && !appJs.includes('type:"trello"')) {
  fail('fuente espacio-seguro sin type trello');
}
if (!appJs.includes('function bridgeTrelloEventsToGCal')) {
  fail('falta bridgeTrelloEventsToGCal');
}
if (!appJs.includes('function syncTrelloFromAdmin')) {
  fail('falta syncTrelloFromAdmin');
}
if (!indexHtml.includes('adm-trello-bridge') || !indexHtml.includes('adm-trello-status')) {
  fail('Admin Trello incompleto (bridge/status)');
}
ok('Trello API + bridge GCal + Admin status');

// ── Functional: Playwright opcional ──
let playwright;
try {
  playwright = await import('playwright');
} catch {
  console.warn('SKIP: playwright no instalado — solo checks estáticos');
  process.exit(0);
}

const serve = spawn('npx', ['serve', '.', '-l', String(PORT)], {
  cwd: ROOT,
  stdio: 'ignore',
  shell: true,
});

await sleep(2500);

try {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();

  const cspViolations = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (t.includes('Content Security Policy') || t.includes('Refused to execute')) {
      cspViolations.push(t);
    }
  });

  await page.addInitScript(() => {
    try {
      localStorage.setItem('tablero_consent_ro', JSON.stringify({ accepted: true }));
      localStorage.setItem(
        'tablero_onboarding_ro',
        JSON.stringify({ completed: true, skipped: true, step: 5 }),
      );
    } catch (_) {}
  });

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

  const hasGoWeek = await page.evaluate(() => typeof window.goWeek === 'function');
  if (!hasGoWeek) fail('goWeek no está en window tras cargar app.js');

  const labelBefore = await page.textContent('#wk-label');
  await page.click('button.wnav.today + span + button.wnav');
  await sleep(300);
  const labelAfter = await page.textContent('#wk-label');
  if (labelBefore === labelAfter) {
    fail('goWeek(1) no cambió #wk-label — botón sin acción');
  }
  ok('Navegación semana → responde');

  await page.click('button.wnav.today');
  await sleep(200);
  ok('Botón Hoy clickeable');

  await page.click('button.sec-btn >> text=Añadir');
  await sleep(200);
  const addOpen = await page.locator('#add-modal.open').count();
  if (addOpen !== 1) fail('openAddModal no abrió #add-modal');
  ok('Modal ＋ Añadir abre');

  await page.keyboard.press('Escape');
  await sleep(150);

  const blocking = cspViolations.filter(
    (t) =>
      (t.includes('inline event handler') ||
        t.includes('inline script') ||
        t.includes('Refused to execute')) &&
      !t.includes('accounts.google.com'),
  );
  if (blocking.length) {
    fail(`Violaciones CSP en consola: ${blocking[0]}`);
  }
  ok('Sin violaciones CSP bloqueantes en consola');

  await browser.close();
  console.log('\nQA smoke: PASS');
} catch (err) {
  fail(err.message);
} finally {
  serve.kill('SIGTERM');
}