// ------------------------------------------------------------
import { getStreakTier } from './streak';
import { GamePhase, KimikaSpriteInfo, StreakState } from './types';

export interface SpriteManifest {
  asking: {
    nostreak: string[];
    lowwinstreak: string[];
    highwinstreak: string[];
    lowlosestreak: string[];
    highlosestreak: string[];
  };
  correct: {
    standard: string[];
    highlosestreakbreaker: string;
  };
  wrong: {
    nostreak: string[];
    lowlosestreak: string[];
    highlosestreak: string[];
  };
}

export const SPRITE_MANIFEST: SpriteManifest = {
  asking: {
    nostreak: [
      '/sprites/kimika_asking/kimika_asking_nostreak/Kimika_asking_relaxed_nostreak.png',
      '/sprites/kimika_asking/kimika_asking_nostreak/Kimika_asking_wondering_nostreak.png',
    ],
    lowwinstreak: [
      '/sprites/kimika_asking/kimika_asking_winstreak/kimika_asking_lowwinstreak/Kimika_asking_relaxed_lowwinstreak.png',
      '/sprites/kimika_asking/kimika_asking_winstreak/kimika_asking_lowwinstreak/Kimika_asking_wondering_lowwinstreak.png',
    ],
    highwinstreak: [
      '/sprites/kimika_asking/kimika_asking_winstreak/kimika_asking_highwinstreak/Kimika_asking_relaxed_highwinstreak.png',
      '/sprites/kimika_asking/kimika_asking_winstreak/kimika_asking_highwinstreak/Kimika_asking_wondering_highwinstreak.png',
    ],
    lowlosestreak: [
      '/sprites/kimika_asking/kimika_asking_losestreak/kimika_asking_lowlosestreak/Kimika_asking_relaxed_lowlosestreak.png',
    ],
    highlosestreak: [
      '/sprites/kimika_asking/kimika_asking_losestreak/kimika_asking_highlosestreak/Kimika_asking_relaxed_highlosestreak.png',
    ],
  },
  correct: {
    standard: [
      '/sprites/Kimika_correct/kimika_correct_relaxed.png',
      '/sprites/Kimika_correct/kimika_correct_relaxed1.png',
      '/sprites/Kimika_correct/kimika_correct_wondering.png',
    ],
    highlosestreakbreaker:
      '/sprites/Kimika_correct/Kimika_correct_highlosestreakbreaker/kimika_correct_relaxed4.png',
  },
  wrong: {
    nostreak: [
      '/sprites/kimika_wrong/kimika_wrong_nostreak/kimika_wrong_relaxed.png',
      '/sprites/kimika_wrong/kimika_wrong_nostreak/kimika_wrong_relaxed2.png',
      '/sprites/kimika_wrong/kimika_wrong_nostreak/kimika_wrong_relaxed4.png',
      '/sprites/kimika_wrong/kimika_wrong_nostreak/kimika_wrong_relaxed5.png',
      '/sprites/kimika_wrong/kimika_wrong_nostreak/kimika_wrong_wondering4.png',
      '/sprites/kimika_wrong/kimika_wrong_nostreak/kimika_wrong_wondering5.png',
      '/sprites/kimika_wrong/kimika_wrong_nostreak/kimika_wrong_wondering6.png',
      '/sprites/kimika_wrong/kimika_wrong_nostreak/kimika_wrong_wondering7.png',
    ],
    lowlosestreak: [
      '/sprites/kimika_wrong/kimika_wrong_lowlosestreak/Kimika_wrong_wondering_lowlosestreak.png',
    ],
    highlosestreak: [
      '/sprites/kimika_wrong/kimika_wrong_highlosestreak/Kimika_wrong_wondering_highlosestreak.png',
    ],
  },
};

export const BACKGROUNDS = [
  { id: 'classroom', name: 'Classroom 1 (Daytime)', path: '/background/classroom.png' },
  { id: 'classroom2', name: 'Classroom 2 (Afternoon)', path: '/background/classroom2.png' },
  { id: 'rooftop', name: 'Rooftop (Sky View)', path: '/background/rooftop.png' },
] as const;

// ------------------------------------------------------------
export function selectKimikaSprite(
  phase: GamePhase,
  streakState: StreakState,
  randomFn: () => number = Math.random
): KimikaSpriteInfo {
  const pick = <T>(items: T[]): T => {
    const idx = Math.floor(randomFn() * items.length);
    return items[idx];
  };

  if (phase === 'correct') {
    // Only used when the player just broke a high lose streak
    if (streakState.escapedHighLoseStreak) {
      return {
        path: SPRITE_MANIFEST.correct.highlosestreakbreaker,
        category: 'correct',
        tier: 'breaker',
        description: 'Baton breaker: Kimika proudly celebrates escaping the high lose streak!',
      };
    }

    const selected = pick(SPRITE_MANIFEST.correct.standard);
    return {
      path: selected,
      category: 'correct',
      tier: 'nostreak',
      description: 'Joyful Kimika congratulating on correct answer',
    };
  }

  if (phase === 'wrong') {
    const loseTier = getStreakTier(streakState.currentLoseStreak);

    if (loseTier === 'highstreak') {
      return {
        path: SPRITE_MANIFEST.wrong.highlosestreak[0],
        category: 'wrong',
        tier: 'highstreak',
        description: 'Baton stern glare: high lose streak warning',
      };
    }

    if (loseTier === 'lowstreak') {
      return {
        path: SPRITE_MANIFEST.wrong.lowlosestreak[0],
        category: 'wrong',
        tier: 'lowstreak',
        description: 'Annoyed look: low lose streak',
      };
    }

    const selected = pick(SPRITE_MANIFEST.wrong.nostreak);
    return {
      path: selected,
      category: 'wrong',
      tier: 'nostreak',
      description: 'Surprised / puzzled expression on wrong answer',
    };
  }

  if (streakState.currentWinStreak > 0) {
    const winTier = getStreakTier(streakState.currentWinStreak);
    if (winTier === 'highstreak') {
      return {
        path: pick(SPRITE_MANIFEST.asking.highwinstreak),
        category: 'asking',
        tier: 'highstreak',
        description: 'Excited Kimika asking question during high win streak',
      };
    }
    if (winTier === 'lowstreak') {
      return {
        path: pick(SPRITE_MANIFEST.asking.lowwinstreak),
        category: 'asking',
        tier: 'lowstreak',
        description: 'Encouraging Kimika asking question during low win streak',
      };
    }
  }

  if (streakState.currentLoseStreak > 0) {
    const loseTier = getStreakTier(streakState.currentLoseStreak);
    if (loseTier === 'highstreak') {
      return {
        path: pick(SPRITE_MANIFEST.asking.highlosestreak),
        category: 'asking',
        tier: 'highstreak',
        description: 'Focused Kimika watching carefully during high lose streak',
      };
    }
    if (loseTier === 'lowstreak') {
      return {
        path: pick(SPRITE_MANIFEST.asking.lowlosestreak),
        category: 'asking',
        tier: 'lowstreak',
        description: 'Concerned Kimika asking question during low lose streak',
      };
    }
  }

  return {
    path: pick(SPRITE_MANIFEST.asking.nostreak),
    category: 'asking',
    tier: 'nostreak',
    description: 'Neutral asking pose',
  };
}
