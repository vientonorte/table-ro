/**
 * CalContext — fuentes de calendario, permisos, estado de sync y OAuth token.
 */

import {
  createContext, useContext, useReducer, useEffect, useCallback,
  type ReactNode,
} from 'react';
import type { Source, PermMap, SyncStatusMap } from '../types/board';
import { SOURCES, PERMS_DEFAULT } from '../data/sources';
import { useLocalStorage } from '../hooks/useLocalStorage';

// ─── acciones ────────────────────────────────────────────────────────────────

type CalAction =
  | { type: 'SET_GTOKEN'; token: string | null }
  | { type: 'SET_SYNC_STATUS'; id: string; status: { state: 'idle' | 'syncing' | 'synced' | 'error'; count?: number; error?: string } }
  | { type: 'UPDATE_SOURCE'; id: string; patch: Partial<Source> }
  | { type: 'SET_PERMS'; perms: PermMap };

interface CalState {
  sources: Source[];
  perms: PermMap;
  syncStatus: SyncStatusMap;
  /** Token OAuth de Google — solo en memoria, nunca persiste */
  gToken: string | null;
}

function reducer(state: CalState, action: CalAction): CalState {
  switch (action.type) {
    case 'SET_GTOKEN':
      return { ...state, gToken: action.token };

    case 'SET_SYNC_STATUS':
      return {
        ...state,
        syncStatus: {
          ...state.syncStatus,
          [action.id]: action.status,
        },
      };

    case 'UPDATE_SOURCE':
      return {
        ...state,
        sources: state.sources.map((s) =>
          s.id === action.id ? { ...s, ...action.patch } : s,
        ),
      };

    case 'SET_PERMS':
      return { ...state, perms: action.perms };

    default:
      return state;
  }
}

// ─── context ─────────────────────────────────────────────────────────────────

interface CalContextValue {
  state: CalState;
  dispatch: React.Dispatch<CalAction>;
  isSourceEnabled: (id: string) => boolean;
  getPermForCal: (permKey: string) => string;
  gcalClientId: string;
  setGcalClientId: (id: string) => void;
  gcalSuraId: string;
  setGcalSuraId: (id: string) => void;
}

const CalContext = createContext<CalContextValue | null>(null);

const LS_PERMS = 'tablero_perms_ro';

export function CalProvider({ children }: { children: ReactNode }) {
  const [gcalClientId, setGcalClientId] = useLocalStorage<string>('gcal_client_id', '');
  const [gcalSuraId, setGcalSuraId]     = useLocalStorage<string>('gcal_sura_id', '');

  // Restaurar gcalId de Sura si estaba guardado
  const sourcesWithSura = SOURCES.map((s) => {
    if (s.id === 'trabajo' && gcalSuraId) {
      return { ...s, gcalId: gcalSuraId };
    }
    return s;
  });

  const loadPerms = (): PermMap => {
    try {
      const raw = localStorage.getItem(LS_PERMS);
      return raw ? (JSON.parse(raw) as PermMap) : PERMS_DEFAULT;
    } catch {
      return PERMS_DEFAULT;
    }
  };

  const [state, dispatch] = useReducer(reducer, {
    sources: sourcesWithSura,
    perms: loadPerms(),
    syncStatus: {},
    gToken: null,
  });

  // Persiste permisos cuando cambian
  useEffect(() => {
    try {
      localStorage.setItem(LS_PERMS, JSON.stringify(state.perms));
    } catch {}
  }, [state.perms]);

  const isSourceEnabled = useCallback(
    (id: string): boolean => {
      const src = state.sources.find((s) => s.id === id);
      if (!src) return false;
      const perm = state.perms[src.permKey as keyof PermMap];
      return perm !== undefined && perm !== 'query';
    },
    [state.sources, state.perms],
  );

  const getPermForCal = useCallback(
    (permKey: string): string => state.perms[permKey as keyof PermMap] ?? 'ro',
    [state.perms],
  );

  return (
    <CalContext.Provider
      value={{
        state,
        dispatch,
        isSourceEnabled,
        getPermForCal,
        gcalClientId,
        setGcalClientId,
        gcalSuraId,
        setGcalSuraId,
      }}
    >
      {children}
    </CalContext.Provider>
  );
}

export function useCalContext(): CalContextValue {
  const ctx = useContext(CalContext);
  if (!ctx) throw new Error('useCalContext debe usarse dentro de <CalProvider>');
  return ctx;
}
