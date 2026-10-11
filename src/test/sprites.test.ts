import { describe, it, expect } from 'vitest';
import { selectKimikaSprite } from '../sprites';
import { INITIAL_STREAK_STATE, recordAnswerResult } from '../streak';
import { SPRITE_MANIFEST } from '../sprites';

describe('selectKimikaSprite', () => {
  it('selects asking neutral sprite when no streak exists', () => {
    const sprite = selectKimikaSprite('asking', INITIAL_STREAK_STATE, () => 0);
    expect(sprite.category).toBe('asking');
    expect(sprite.tier).toBe('nostreak');
    expect(SPRITE_MANIFEST.asking.nostreak).toContain(sprite.path);
  });

  it('selects asking low win streak sprite when in low win streak (2-5)', () => {
    let state = INITIAL_STREAK_STATE;
    state = recordAnswerResult(state, true);
    state = recordAnswerResult(state, true); // winStreak = 2

    const sprite = selectKimikaSprite('asking', state, () => 0);
    expect(sprite.category).toBe('asking');
    expect(sprite.tier).toBe('lowstreak');
    expect(SPRITE_MANIFEST.asking.lowwinstreak).toContain(sprite.path);
  });

  it('selects asking high win streak sprite when in high win streak (6+)', () => {
    let state = INITIAL_STREAK_STATE;
    for (let i = 0; i < 6; i++) {
      state = recordAnswerResult(state, true);
    }
    const sprite = selectKimikaSprite('asking', state, () => 0);
    expect(sprite.category).toBe('asking');
    expect(sprite.tier).toBe('highstreak');
    expect(SPRITE_MANIFEST.asking.highwinstreak).toContain(sprite.path);
  });

  it('randomly selects standard correct sprite when answering correctly normally', () => {
    let state = INITIAL_STREAK_STATE;
    state = recordAnswerResult(state, true);

    const sprite = selectKimikaSprite('correct', state, () => 0);
    expect(sprite.category).toBe('correct');
    expect(SPRITE_MANIFEST.correct.standard).toContain(sprite.path);
  });

  it('selects the special high lose streak breaker ONLY when escaping high lose streak', () => {
    let state = INITIAL_STREAK_STATE;
    for (let i = 0; i < 6; i++) {
      state = recordAnswerResult(state, false);
    }
    // Now answer correctly
    state = recordAnswerResult(state, true);
    expect(state.escapedHighLoseStreak).toBe(true);

    const sprite = selectKimikaSprite('correct', state);
    expect(sprite.category).toBe('correct');
    expect(sprite.tier).toBe('breaker');
    expect(sprite.path).toBe(SPRITE_MANIFEST.correct.highlosestreakbreaker);
  });

  it('selects correct wrong sprite tier based on lose streak', () => {
    let state = INITIAL_STREAK_STATE;
    // single wrong -> nostreak
    state = recordAnswerResult(state, false);
    let sprite = selectKimikaSprite('wrong', state, () => 0);
    expect(sprite.category).toBe('wrong');
    expect(sprite.tier).toBe('nostreak');

    // 2 wrong -> lowstreak
    state = recordAnswerResult(state, false);
    sprite = selectKimikaSprite('wrong', state);
    expect(sprite.category).toBe('wrong');
    expect(sprite.tier).toBe('lowstreak');
    expect(sprite.path).toBe(SPRITE_MANIFEST.wrong.lowlosestreak[0]);

    // 6 wrong -> highstreak
    for (let i = 0; i < 4; i++) {
      state = recordAnswerResult(state, false);
    }
    sprite = selectKimikaSprite('wrong', state);
    expect(sprite.category).toBe('wrong');
    expect(sprite.tier).toBe('highstreak');
    expect(sprite.path).toBe(SPRITE_MANIFEST.wrong.highlosestreak[0]);
  });
});
