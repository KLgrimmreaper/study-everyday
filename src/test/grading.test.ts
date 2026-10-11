import { describe, it, expect } from 'vitest';
import { checkExactMatch, normalizeAnswer } from '../grading';

describe('Grading utils', () => {
  it('normalizes answers properly', () => {
    expect(normalizeAnswer('  Hello, World!  ')).toBe('hello world');
    expect(normalizeAnswer("It's a test.")).toBe('its a test');
  });

  it('strips hyphens and defers spaced/hyphenated variants to AI grading', () => {
    expect(normalizeAnswer('T-cell')).toBe('tcell');
    // "T cell" and "T-cell" are not the same string, so this is left to Gemini
    expect(checkExactMatch('T cell', 'T-cell')).toBeNull();
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
