/**
 * BoardContext — estado central del tablero semanal.
 *
 * Gestiona: eventos (estáticos + extra), estados de cards,
 * navegación semanal, filtros de categoría y undo.
 */

import {
  createContext, useContext, useReducer, useEffect, useCallback,
  type ReactNode,
} from 'react';
import type { BoardEvent, CardState, CardStateMap, CalKey, UndoEntry } from '../types/board';
import { STATIC_EVENTS } from '../data/events';

// ─── helpers de fecha ────────────────────────────────────────────────────────

export function isoOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function mondayOf(d: Date): Date {
  const r = new Date(d);
  r.setHours(12, 0, 0, 0);
  const day = r.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day;
  r.setDate(r.getDate() + diff);
  return r;
}

export function cardKey(iso: string, title: string, cal: string): string {
  return `${iso}|${title}|${cal}`;
}

// ─── tipos de estado ─────────────────────────────────────────────────────────

interface BoardState {
  weekStart: Date;
  /** Todos los eventos: estáticos + extra (localStorage) + gcal/ics */
  events: BoardEvent[];
  cardStates: CardStateMap;
  /** Categorías ocultas en el filtro */
  hidden: Set<CalKey>;
  lastUndo: UndoEntry | null;
}

// ─── acciones ────────────────────────────────────────────────────────────────

type BoardAction =
  | { type: 'GO_WEEK'; dir: -1 | 1 }
  | { type: 'GO_TODAY' }
  | { type: 'SET_EXTRA_EVENTS'; events: BoardEvent[] }
  | { type: 'ADD_EVENT'; event: BoardEvent }
  | { type: 'REMOVE_EVENT'; id: string }
  | { type: 'MOVE_EVENT'; id: string; iso: string }
  | { type: 'UPDATE_EVENT'; event: BoardEvent }
  | { type: 'MERGE_REMOTE'; events: BoardEvent[] }
  | { type: 'SET_CARD_STATE'; id: string; patch: Partial<CardState> }
  | { type: 'LOAD_CARD_STATES'; states: CardStateMap }
  | { type: 'TOGGLE_CAT'; key: CalKey }
  | { type: 'PUSH_UNDO'; entry: UndoEntry }
  | { type: 'CLEAR_UNDO' };

function reducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'GO_WEEK':
      return { ...state, weekStart: addDays(state.weekStart, action.dir * 7) };

    case 'GO_TODAY': {
      const n = new Date();
      n.setHours(12, 0, 0, 0);
      return { ...state, weekStart: mondayOf(n) };
    }

    case 'SET_EXTRA_EVENTS': {
      // Reemplaza los eventos de source=extra
      const withoutExtra = state.events.filter((e) => e.source !== 'extra');
      return { ...state, events: [...withoutExtra, ...action.events] };
    }

    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.event] };

    case 'REMOVE_EVENT':
      return { ...state, events: state.events.filter((e) => e.id !== action.id) };

    case 'MOVE_EVENT': {
      return {
        ...state,
        events: state.events.map((e) =>
          e.id === action.id
            ? { ...e, iso: action.iso, id: cardKey(action.iso, e.title, e.cal) }
            : e,
        ),
      };
    }

    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map((e) => (e.id === action.event.id ? action.event : e)),
      };

    case 'MERGE_REMOTE': {
      // Agrega/actualiza eventos de fuentes remotas (gcal, ics)
      const withoutRemote = state.events.filter(
        (e) => e.source !== 'gcal' && e.source !== 'ics',
      );
      return { ...state, events: [...withoutRemote, ...action.events] };
    }

    case 'SET_CARD_STATE': {
      const prev = state.cardStates[action.id] ?? {};
      return {
        ...state,
        cardStates: { ...state.cardStates, [action.id]: { ...prev, ...action.patch } },
      };
    }

    case 'LOAD_CARD_STATES':
      return { ...state, cardStates: action.states };

    case 'TOGGLE_CAT': {
      const h = new Set(state.hidden);
      h.has(action.key) ? h.delete(action.key) : h.add(action.key);
      return { ...state, hidden: h };
    }

    case 'PUSH_UNDO':
      return { ...state, lastUndo: action.entry };

    case 'CLEAR_UNDO':
      return { ...state, lastUndo: null };

    default:
      return state;
  }
}

// ─── context ─────────────────────────────────────────────────────────────────

interface BoardContextValue {
  state: BoardState;
  dispatch: React.Dispatch<BoardAction>;
  /** Persiste estado actual en localStorage */
  saveBoard: () => void;
  /** Aplica undo si existe */
  undo: () => void;
  /** Eventos visibles de la semana activa */
  weekEvents: (iso: string) => BoardEvent[];
}

const BoardContext = createContext<BoardContextValue | null>(null);

const LS_STATES = 'tablero_states_ro';
const LS_EXTRA  = 'tablero_extra_ro';

export function BoardProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  const [state, dispatch] = useReducer(reducer, {
    weekStart: mondayOf(now),
    events: STATIC_EVENTS,
    cardStates: {},
    hidden: new Set<CalKey>(),
    lastUndo: null,
  });

  // Carga inicial desde localStorage
  useEffect(() => {
    try {
      const rawStates = localStorage.getItem(LS_STATES);
      if (rawStates) {
        dispatch({ type: 'LOAD_CARD_STATES', states: JSON.parse(rawStates) as CardStateMap });
      }
      const rawExtra = localStorage.getItem(LS_EXTRA);
      if (rawExtra) {
        const extra = JSON.parse(rawExtra) as BoardEvent[];
        dispatch({ type: 'SET_EXTRA_EVENTS', events: extra.map((e) => ({ ...e, source: 'extra' as const })) });
      }
    } catch {
      // silencioso — datos corruptos, se empieza limpio
    }
  }, []);

  const saveBoard = useCallback(() => {
    try {
      const extra = state.events.filter((e) => e.source === 'extra' || e.source === 'bujo');
      localStorage.setItem(LS_STATES, JSON.stringify(state.cardStates));
      localStorage.setItem(LS_EXTRA, JSON.stringify(extra));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('[BoardContext] QuotaExceededError al guardar');
      }
    }
  }, [state.cardStates, state.events]);

  // Ctrl+S → guardar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveBoard();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveBoard]);

  const undo = useCallback(() => {
    if (!state.lastUndo) return;
    const { eventId, prevState, type, prevIso } = state.lastUndo;
    if (type === 'delete' && prevIso) {
      // El evento ya no existe en state.events — no se puede restaurar sin guardarlo
      // En S2 se implementará con snapshot completo del evento
    } else {
      dispatch({ type: 'SET_CARD_STATE', id: eventId, patch: prevState });
    }
    dispatch({ type: 'CLEAR_UNDO' });
  }, [state.lastUndo]);

  const weekEvents = useCallback(
    (iso: string) => state.events.filter((e) => e.iso === iso && !state.hidden.has(e.cal)),
    [state.events, state.hidden],
  );

  return (
    <BoardContext.Provider value={{ state, dispatch, saveBoard, undo, weekEvents }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext(): BoardContextValue {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error('useBoardContext debe usarse dentro de <BoardProvider>');
  return ctx;
}
