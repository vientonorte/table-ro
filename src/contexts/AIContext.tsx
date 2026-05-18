/**
 * AIContext — configuración de proveedores IA y proveedor activo resuelto.
 */

import {
  createContext, useContext, useReducer, useEffect, useCallback,
  type ReactNode,
} from 'react';
import type { AICfg, AIProvider } from '../types/ai';
import { AI_DEFAULTS } from '../types/ai';

// ─── deepMerge (migrado de app.js) ───────────────────────────────────────────

function deepMerge<T extends object>(base: T, patch: Partial<T>): T {
  const out: T = structuredClone(base);
  for (const k in patch) {
    const pv = patch[k];
    const bv = out[k];
    if (
      pv !== null &&
      typeof pv === 'object' &&
      !Array.isArray(pv) &&
      bv !== null &&
      typeof bv === 'object' &&
      !Array.isArray(bv)
    ) {
      (out as Record<string, unknown>)[k] = deepMerge(
        bv as object,
        pv as Partial<object>,
      );
    } else if (pv !== undefined) {
      (out as Record<string, unknown>)[k] = pv;
    }
  }
  return out;
}

// ─── acciones ────────────────────────────────────────────────────────────────

type AIAction =
  | { type: 'SET_CFG'; cfg: AICfg }
  | { type: 'PATCH_CFG'; patch: Partial<AICfg> }
  | { type: 'SET_KEY'; provider: AIProvider; key: string }
  | { type: 'SET_MODEL'; provider: AIProvider; model: string };

interface AIState {
  cfg: AICfg;
}

function reducer(state: AIState, action: AIAction): AIState {
  switch (action.type) {
    case 'SET_CFG':
      return { cfg: action.cfg };
    case 'PATCH_CFG':
      return { cfg: deepMerge(state.cfg, action.patch) };
    case 'SET_KEY':
      return {
        cfg: {
          ...state.cfg,
          providers: {
            ...state.cfg.providers,
            [action.provider]: { ...state.cfg.providers[action.provider], key: action.key },
          },
        },
      };
    case 'SET_MODEL':
      return {
        cfg: {
          ...state.cfg,
          providers: {
            ...state.cfg.providers,
            [action.provider]: { ...state.cfg.providers[action.provider], model: action.model },
          },
        },
      };
    default:
      return state;
  }
}

// ─── context ─────────────────────────────────────────────────────────────────

interface AIContextValue {
  state: AIState;
  dispatch: React.Dispatch<AIAction>;
  /** Proveedor activo resuelto: el primero con key configurada, o undefined */
  resolvedProvider: AIProvider | undefined;
  /** API key del proveedor resuelto */
  resolvedKey: string;
  saveCfg: () => void;
}

const AIContext = createContext<AIContextValue | null>(null);

const LS_AI_CFG = 'tablero_ai_cfg_ro';

export function AIProvider({ children }: { children: ReactNode }) {
  const loadCfg = (): AICfg => {
    try {
      const raw = localStorage.getItem(LS_AI_CFG);
      return raw ? deepMerge(AI_DEFAULTS, JSON.parse(raw) as Partial<AICfg>) : AI_DEFAULTS;
    } catch {
      return AI_DEFAULTS;
    }
  };

  const [state, dispatch] = useReducer(reducer, { cfg: loadCfg() });

  const saveCfg = useCallback(() => {
    try {
      localStorage.setItem(LS_AI_CFG, JSON.stringify(state.cfg));
    } catch {}
  }, [state.cfg]);

  // Auto-guarda cuando cambia la configuración
  useEffect(() => {
    saveCfg();
  }, [saveCfg]);

  const PROVIDER_ORDER: AIProvider[] = ['claude', 'openai', 'gemini'];

  const resolvedProvider: AIProvider | undefined =
    state.cfg.provider === 'auto'
      ? PROVIDER_ORDER.find((p) => state.cfg.providers[p].key.trim() !== '')
      : (state.cfg.provider as AIProvider | undefined);

  const resolvedKey = resolvedProvider
    ? state.cfg.providers[resolvedProvider].key
    : '';

  return (
    <AIContext.Provider value={{ state, dispatch, resolvedProvider, resolvedKey, saveCfg }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAIContext(): AIContextValue {
  const ctx = useContext(AIContext);
  if (!ctx) throw new Error('useAIContext debe usarse dentro de <AIProvider>');
  return ctx;
}
