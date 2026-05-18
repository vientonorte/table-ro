/**
 * BujoContext — estado del wizard Bullet Journal (3 pasos).
 */

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { BujoState, BujoStep, BujoItem } from '../types/bujo';

// ─── acciones ────────────────────────────────────────────────────────────────

type BujoAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'SET_STEP'; step: BujoStep }
  | { type: 'SET_IMAGES'; images: File[] }
  | { type: 'SET_PASTE'; text: string }
  | { type: 'SET_ITEMS'; items: BujoItem[] }
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'SET_ANALYZING'; analyzing: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR' };

const INITIAL: BujoState = {
  isOpen: false,
  step: 1,
  images: [],
  pasteText: '',
  items: [],
  analyzing: false,
  error: null,
};

function reducer(state: BujoState, action: BujoAction): BujoState {
  switch (action.type) {
    case 'OPEN':
      return { ...state, isOpen: true, step: 1 };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'SET_STEP':
      return { ...state, step: action.step };
    case 'SET_IMAGES':
      return { ...state, images: action.images };
    case 'SET_PASTE':
      return { ...state, pasteText: action.text };
    case 'SET_ITEMS':
      return { ...state, items: action.items, step: 2 };
    case 'TOGGLE_ITEM':
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id ? { ...it, checked: !it.checked } : it,
        ),
      };
    case 'SET_ANALYZING':
      return { ...state, analyzing: action.analyzing };
    case 'SET_ERROR':
      return { ...state, error: action.error, analyzing: false };
    case 'CLEAR':
      return INITIAL;
    default:
      return state;
  }
}

// ─── context ─────────────────────────────────────────────────────────────────

interface BujoContextValue {
  state: BujoState;
  dispatch: React.Dispatch<BujoAction>;
  checkedItems: BujoItem[];
}

const BujoContext = createContext<BujoContextValue | null>(null);

export function BujoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const checkedItems = state.items.filter((it) => it.checked);

  return (
    <BujoContext.Provider value={{ state, dispatch, checkedItems }}>
      {children}
    </BujoContext.Provider>
  );
}

export function useBujoContext(): BujoContextValue {
  const ctx = useContext(BujoContext);
  if (!ctx) throw new Error('useBujoContext debe usarse dentro de <BujoProvider>');
  return ctx;
}
