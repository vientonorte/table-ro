/**
 * bujo.ts — tipos del sistema Bullet Journal
 */

import type { CalKey } from './board';

export type BujoKind = 'task' | 'event' | 'note' | 'habit';

export const BUJO_KIND_LABELS: Record<BujoKind, string> = {
  task:  'Tarea',
  event: 'Evento',
  note:  'Nota',
  habit: 'Hábito',
};

/** Mapa símbolo BuJo → categoría calendario */
export const BUJO_SYM_MAP: Record<string, CalKey> = {
  '●': 'personal', '○': 'personal', '—': 'personal',
  '-': 'personal',  '•': 'personal',
  '*': 'trabajo',
  '>': 'camila',
  '$': 'fin',
  '◆': 'vinculos', '✦': 'vinculos', '⬡': 'camila',
};

export interface BujoItem {
  id: string;
  text: string;
  kind: BujoKind;
  cal: CalKey;
  /** YYYY-MM-DD — puede ser inferida o explícita */
  iso?: string;
  /** Texto de fecha tal como aparece en el BuJo */
  dateText?: string;
  checked: boolean;
  /** Si la IA marcó el texto como ilegible */
  illegible?: boolean;
}

export type BujoStep = 1 | 2 | 3;

export interface BujoState {
  isOpen: boolean;
  step: BujoStep;
  images: File[];
  /** Texto pegado manualmente */
  pasteText: string;
  items: BujoItem[];
  analyzing: boolean;
  error: string | null;
}
