/**
 * board.ts — tipos del dominio principal de Tablero Rö
 */

export type CalKey = 'personal' | 'vinculos' | 'camila' | 'trabajo' | 'fin' | 'bujo';

export type EventSource = 'static' | 'extra' | 'gcal' | 'ics' | 'bujo';

export interface BoardEvent {
  /** Clave única: `${iso}|${title}|${cal}` */
  id: string;
  /** YYYY-MM-DD */
  iso: string;
  title: string;
  cal: CalKey;
  /** HH:MM — undefined si allDay */
  time?: string;
  allDay?: boolean;
  source?: EventSource;
  /** gcalEventId para sync bidireccional */
  gcalId?: string;
}

export interface CardState {
  done?: boolean;
  cancelled?: boolean;
  /** Texto libre en el área de detalle */
  detail?: string;
}

export type CardStateMap = Record<string, CardState>;

export type PermLevel = 'rw' | 'ro' | 'admin' | 'query';

export type PermMap = Partial<Record<CalKey, PermLevel>>;

export interface Source {
  id: string;
  name: string;
  desc: string;
  cal: CalKey;
  color: string;
  icon: string;
  gcalId: string | null;
  readonly: boolean;
  icsUrl: string;
  embedUrl: string | null;
  /** clave de localStorage para URL iCal personalizada */
  lsKey: string;
  permKey: string;
}

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncStatus {
  state: SyncState;
  count?: number;
  error?: string;
}

export type SyncStatusMap = Record<string, SyncStatus>;

export interface UndoEntry {
  type: 'delete' | 'cancel' | 'done' | 'move';
  eventId: string;
  prevState: CardState;
  prevIso?: string;
  ts: number;
}

/** Colores de categoría — referencia visual */
export const CAL_COLORS: Record<CalKey, string> = {
  personal: '#EC4899',
  vinculos: '#7C3AED',
  camila:   '#10B981',
  trabajo:  '#F97316',
  fin:      '#FB923C',
  bujo:     '#C084FC',
};

export const CAL_LABELS: Record<CalKey, string> = {
  personal: 'Personal',
  vinculos: 'Vínculos',
  camila:   'Camila',
  trabajo:  'Trabajo',
  fin:      'Finanzas',
  bujo:     'BuJo',
};

export const DAYS_SHORT  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
export const DAYS_FULL   = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
export const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as const;
