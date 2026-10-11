import { describe, it, expect } from 'vitest';
import { checkExactMatch, normalizeAnswer } from '../grading';

describe('Grading utils', () => {
  it('normalizes answers properly', () => {
    expect(normalizeAnswer('  Hello, World!  ')).toBe('hello world');
    expect(normalizeAnswer("It's a test.")).toBe('its a test');
  });

  it('treats hyphenated and spaced variants as different strings', () => {
    expect(normalizeAnswer('T-cell')).toBe('t-cell');
    // "T cell" and "T-cell" are not the same string, so this is left to the model
    expect(checkExactMatch('T cell', 'T-cell')).toBeNull();
  });

  it('keeps symbols that carry meaning instead of stripping them', () => {
    // real bug: "city$" and "$city" both normalised to "city", so the wrong
    // answer to "which is a valid PHP variable name?" was marked correct
    expect(checkExactMatch('city$', '$city')).toBeNull();
    expect(checkExactMatch('$city', '$1city')).toBeNull();
    expect(normalizeAnswer('city$')).toBe('city$');
    expect(normalizeAnswer('$city')).toBe('$city');

    // the same class of mistake for other subjects
    expect(checkExactMatch('50', '50%')).toBeNull();
    expect(checkExactMatch('a', 'a*')).toBeNull();
    expect(checkExactMatch('x', 'x^2')).toBeNull();
    expect(checkExactMatch('cityname', 'city_name')).toBeNull();
  });

  it('still ignores ordinary punctuation and spacing', () => {
    expect(checkExactMatch('$city.', '$city')?.isCorrect).toBe(true);
    expect(checkExactMatch('  $City  ', '$city')?.isCorrect).toBe(true);
  });

  it('detects exact matches', () => {
    const res = checkExactMatch('Mitochondria', 'mitochondria');
    expect(res).not.toBeNull();
    expect(res?.isCorrect).toBe(true);
    expect(res?.score).toBe(100);
  });

  it('detects matches with punctuation or slight whitespace', () => {
    const res = checkExactMatch('  Photosynthesis! ', 'photosynthesis');
    expect(res).not.toBeNull();
    expect(res?.isCorrect).toBe(true);
  });

  it('returns null when answer is not an exact match to allow AI grading', () => {
    const res = checkExactMatch(
      'It produces energy for cells via ATP synthesis',
      'The powerhouse of the cell that generates ATP'
    );
    expect(res).toBeNull();
  });

  it('handles empty answers gracefully', () => {
    const res = checkExactMatch('', 'Any answer');
    expect(res).not.toBeNull();
    expect(res?.isCorrect).toBe(false);
  });
});
