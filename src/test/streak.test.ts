import { describe, it, expect } from 'vitest';
import { INITIAL_STREAK_STATE, recordAnswerResult } from '../streak';
import { STREAK_CONFIG, getStreakTier } from '../streak';

describe('StreakTracker and Config', () => {
  it('correctly maps streak thresholds', () => {
    expect(getStreakTier(0)).toBe('nostreak');
    expect(getStreakTier(1)).toBe('nostreak');
    expect(getStreakTier(2)).toBe('lowstreak');
    expect(getStreakTier(5)).toBe('lowstreak');
    expect(getStreakTier(6)).toBe('highstreak');
    expect(getStreakTier(10)).toBe('highstreak');
  });

  it('increments win streak on correct answers and resets lose streak', () => {
    let state = INITIAL_STREAK_STATE;

    state = recordAnswerResult(state, true);
    expect(state.currentWinStreak).toBe(1);
    expect(state.currentLoseStreak).toBe(0);
    expect(state.totalCorrect).toBe(1);
    expect(state.escapedHighLoseStreak).toBe(false);

    state = recordAnswerResult(state, true);
    expect(state.currentWinStreak).toBe(2);
    expect(state.highestWinStreak).toBe(2);
  });

  it('increments lose streak on incorrect answers and resets win streak', () => {
    let state = INITIAL_STREAK_STATE;
    state = recordAnswerResult(state, true);
    state = recordAnswerResult(state, true);
    expect(state.currentWinStreak).toBe(2);

    state = recordAnswerResult(state, false);
    expect(state.currentWinStreak).toBe(0);
    expect(state.currentLoseStreak).toBe(1);
    expect(state.highestWinStreak).toBe(2);
  });

  it('detects high lose streak break (special breaker case)', () => {
    let state = INITIAL_STREAK_STATE;

    // Build high lose streak (6 consecutive misses)
    for (let i = 0; i < STREAK_CONFIG.HIGH_STREAK_MIN; i++) {
      state = recordAnswerResult(state, false);
    }
    expect(state.currentLoseStreak).toBe(6);
    expect(getStreakTier(state.currentLoseStreak)).toBe('highstreak');

    // Escapes high lose streak with a correct answer!
    state = recordAnswerResult(state, true);
    expect(state.escapedHighLoseStreak).toBe(true);
    expect(state.currentWinStreak).toBe(1);
    expect(state.currentLoseStreak).toBe(0);

    // Next correct answer should NOT have escapedHighLoseStreak = true
    state = recordAnswerResult(state, true);
    expect(state.escapedHighLoseStreak).toBe(false);
  });
});
