/**
 * sources.ts — fuentes de calendario (migrado de SOURCES en app.js)
 */

import type { Source } from '../types/board';

export const SOURCES: Source[] = [
  {
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
    permKey: 'personal',
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
    permKey: 'finanzas',
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
    permKey: 'trabajo',
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
    permKey: 'camila',
  },
];

export const PERMS_DEFAULT = {
  personal: 'rw',
  vinculos: 'rw',
  camila: 'ro',
  trabajo: 'admin',
  fin: 'ro',
} as const;
