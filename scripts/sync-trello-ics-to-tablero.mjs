#!/usr/bin/env node
/**
 * Sync Trello board → table-ro import JSON (+ optional full API if env set).
 * Usage:
 *   node scripts/sync-trello-ics-to-tablero.mjs
 *   TRELLO_API_KEY=… TRELLO_TOKEN=… node scripts/sync-trello-ics-to-tablero.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BOARD_ID = '69c558a7d79162569df9a98a';
const ICS =
  'https://trello.com/calendar/5be8d432f8dc74493aaf53e6/69c558a7d79162569df9a98a/3b84dbc14a0b216f20c2b1ca2120a49f.ics';
const RO_RE = /\bRO\b|Rö|Ro\b/i;

function unfold(ics) {
  const lines = [];
  for (const line of ics.split(/\r?\n/)) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length) lines[lines.length - 1] += line.slice(1);
    else lines.push(line);
  }
  return lines;
}

function parseIcs(text) {
  const lines = unfold(text);
  const events = [];
  let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') cur = {};
    else if (line === 'END:VEVENT') {
      events.push(cur);
      cur = null;
    } else if (cur && line.includes(':')) {
      const i = line.indexOf(':');
      const k = line.slice(0, i).split(';')[0];
      cur[k] = line.slice(i + 1);
    }
  }
  return events;
}

function dtToLocal(s) {
  const d = s.endsWith('Z')
    ? new Date(
        `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`
      )
    : new Date(s);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  const [dp, tp] = (fmt + ', 00:00').split(', ');
  return { iso: dp, time: tp.replace(/^24:/, '00:').slice(0, 5) };
}

function cardFromIcs(e) {
  const desc = (e.DESCRIPTION || '').replace(/\\n/g, '\n');
  const title = (e.SUMMARY || '(sin título)').slice(0, 80);
  const m = desc.match(/https:\/\/trello\.com\/c\/[A-Za-z0-9]+/);
  const uid = e.UID || '';
  const cardId = uid.split('@')[0];
  const { iso, time } = dtToLocal(e.DTSTART);
  return {
    iso,
    title,
    detail: desc.slice(0, 800),
    cal: 'camila',
    time,
    allDay: false,
    uid: 'trello-' + cardId,
    trelloCardId: cardId,
    fromCal: true,
    source: 'trello',
    srcId: 'espacio-seguro',
    kind: 'task',
    readonly: true,
    trelloUrl: m ? m[0] : '',
    ro: RO_RE.test(title),
  };
}

async function fetchApiCards(key, token) {
  const url = `https://api.trello.com/1/boards/${BOARD_ID}/cards?key=${encodeURIComponent(key)}&token=${encodeURIComponent(token)}&fields=name,due,desc,url,closed&filter=open`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Trello API ${r.status}`);
  const cards = await r.json();
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 1);
  const to = new Date(now);
  to.setMonth(to.getMonth() + 6);
  return cards
    .filter((c) => c.due)
    .map((card) => {
      const d = new Date(card.due);
      if (d < from || d > to) return null;
      const { iso, time } = dtToLocal(
        d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
      );
      // fix: use proper ISO
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
      const [dp, tp] = (fmt + ', 00:00').split(', ');
      const title = (card.name || '').slice(0, 80);
      return {
        iso: dp,
        title,
        detail: (card.desc || '').slice(0, 800),
        cal: 'camila',
        time: tp.replace(/^24:/, '00:').slice(0, 5),
        allDay: false,
        uid: 'trello-' + card.id,
        trelloCardId: card.id,
        fromCal: true,
        source: 'trello',
        srcId: 'espacio-seguro',
        kind: 'task',
        readonly: true,
        trelloUrl: card.url || '',
        ro: RO_RE.test(title),
      };
    })
    .filter(Boolean);
}

const key = (process.env.TRELLO_API_KEY || '').trim();
const token = (process.env.TRELLO_TOKEN || process.env.TRELLO_API_TOKEN || '').trim();

let mode = 'ics';
let cards = [];
if (key && token) {
  try {
    cards = await fetchApiCards(key, token);
    mode = 'api';
  } catch (e) {
    console.warn('API failed, falling back to ICS:', e.message);
  }
}
if (!cards.length) {
  const ics = await (await fetch(ICS)).text();
  cards = parseIcs(ics).map(cardFromIcs);
  mode = 'ics';
}

const ro = cards.filter((c) => c.ro).map(({ ro, ...rest }) => rest);
const all = cards.map(({ ro, ...rest }) => rest);

const outDir = join(ROOT, 'data');
mkdirSync(outDir, { recursive: true });
const snapshot = {
  mode,
  board: BOARD_ID,
  boardName: 'Espacio Seguro · Romila',
  syncedAt: new Date().toISOString(),
  ics: ICS,
  embedUrl: 'https://trello.com/b/69c558a7d79162569df9a98a',
  count: all.length,
  countRo: ro.length,
  synced: all,
};
writeFileSync(join(outDir, 'trello-sync-latest.json'), JSON.stringify(snapshot, null, 2) + '\n');
writeFileSync(
  join(outDir, 'tablero-import-trello-ro.json'),
  JSON.stringify(
    {
      states: {},
      extra: [],
      synced: ro,
      exported: new Date().toISOString(),
      meta: { importSource: `trello-${mode}`, board: BOARD_ID },
    },
    null,
    2
  ) + '\n'
);

console.log(JSON.stringify({ mode, count: all.length, countRo: ro.length, titles: ro.map((c) => c.title) }, null, 2));
