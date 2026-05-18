/**
 * ai.ts — tipos de configuración de proveedores IA
 */

export type AIProvider = 'claude' | 'openai' | 'gemini';
export type AIProviderMode = 'auto' | AIProvider;
export type AIProfile = 'balanced' | 'fast' | 'detailed';
export type AIJsonMode = 'strict' | 'loose';

export interface AIProviderCfg {
  key: string;
  model: string;
}

export interface AIFlags {
  normalizeSpelling: boolean;
  markIllegible: boolean;
  inferDates: boolean;
  inferCategory: boolean;
}

export interface AICfg {
  provider: AIProviderMode;
  profile: AIProfile;
  jsonMode: AIJsonMode;
  maxItems: number;
  flags: AIFlags;
  providers: Record<AIProvider, AIProviderCfg>;
  proxyUrl: string;
}

export const AI_DEFAULTS: AICfg = {
  provider: 'auto',
  profile: 'balanced',
  jsonMode: 'strict',
  maxItems: 80,
  flags: {
    normalizeSpelling: true,
    markIllegible: true,
    inferDates: true,
    inferCategory: true,
  },
  providers: {
    claude:  { key: '', model: 'claude-sonnet-4-6' },
    openai:  { key: '', model: 'gpt-4o' },
    gemini:  { key: '', model: 'gemini-2.0-flash' },
  },
  proxyUrl: '',
};

/** Resultado de parseo/extracción de IA */
export interface ExtractionItem {
  text: string;
  kind: 'task' | 'event' | 'note' | 'habit';
  cal: string;
  date?: string;
  illegible?: boolean;
}

export interface ExtractionResult {
  items: ExtractionItem[];
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
}
