import { StreakState } from './types';

export const STREAK_CONFIG = {
  NO_STREAK_MAX: 1, // 0–1
  LOW_STREAK_MIN: 2,
  LOW_STREAK_MAX: 5, // 2–5
  HIGH_STREAK_MIN: 6, // 6+
} as const;

export type StreakTier = 'nostreak' | 'lowstreak' | 'highstreak';

export function getStreakTier(streakCount: number): StreakTier {
  if (streakCount >= STREAK_CONFIG.HIGH_STREAK_MIN) {
    return 'highstreak';
  }
  if (streakCount >= STREAK_CONFIG.LOW_STREAK_MIN) {
    return 'lowstreak';
  }
  return 'nostreak';
}

export type Provider = 'gemini' | 'deepseek';

export interface AiModel {
  id: string;
  name: string;
  note: string;
  provider: Provider;
}

export const AI_MODELS: AiModel[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    note: 'fast and cheap',
    provider: 'gemini',
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    note: 'newest Gemini Flash',
    provider: 'gemini',
  },
  {
    id: 'deepseek-flash',
    name: 'DeepSeek V4.1 Flash',
    note: 'fast and cheap',
    provider: 'deepseek',
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    note: 'slower and pricier, more accurate',
    provider: 'deepseek',
  },
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export function modelProvider(modelId: string): Provider {
  const match = AI_MODELS.find((m) => m.id === modelId);
  if (!match) {
    throw new Error(`Unknown model: ${modelId}`);
  }
  return match.provider;
}

export const INITIAL_STREAK_STATE: StreakState = {
  currentWinStreak: 0,
  currentLoseStreak: 0,
  highestWinStreak: 0,
  highestLoseStreak: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  lastAnswerWasCorrect: null,
  escapedHighLoseStreak: false,
};

// escapedHighLoseStreak is true only on the answer that breaks a high lose streak
export function recordAnswerResult(prev: StreakState, isCorrect: boolean): StreakState {
  if (isCorrect) {
    const wasInHighLoseStreak = prev.currentLoseStreak >= STREAK_CONFIG.HIGH_STREAK_MIN;
    const newWinStreak = prev.currentWinStreak + 1;

    return {
      currentWinStreak: newWinStreak,
      currentLoseStreak: 0,
      highestWinStreak: Math.max(prev.highestWinStreak, newWinStreak),
      highestLoseStreak: prev.highestLoseStreak,
      totalCorrect: prev.totalCorrect + 1,
      totalIncorrect: prev.totalIncorrect,
      lastAnswerWasCorrect: true,
      escapedHighLoseStreak: wasInHighLoseStreak,
    };
  } else {
    const newLoseStreak = prev.currentLoseStreak + 1;

    return {
      currentWinStreak: 0,
      currentLoseStreak: newLoseStreak,
      highestWinStreak: prev.highestWinStreak,
      highestLoseStreak: Math.max(prev.highestLoseStreak, newLoseStreak),
      totalCorrect: prev.totalCorrect,
      totalIncorrect: prev.totalIncorrect + 1,
      lastAnswerWasCorrect: false,
      escapedHighLoseStreak: false,
    };
  }
}
