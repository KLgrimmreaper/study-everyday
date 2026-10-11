import { describe, it, expect, vi, afterEach } from 'vitest';
import { gradeAnswer } from '../gemini';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('gradeAnswer', () => {
  it('answers an exact match without calling the API at all', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await gradeAnswer({
      apiKey: 'fake',
      model: 'gemini-2.5-flash',
      question: 'Which organelle makes ATP?',
      expectedAnswer: 'Mitochondria',
      userAnswer: 'mitochondria',
    });

    expect(result.isCorrect).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('aborts the request when it runs past the timeout', async () => {
    vi.useFakeTimers();

    let aborted = false;

    // behaves like a real fetch: hangs, and *rejects* when the signal aborts
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      const signal = init.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          aborted = true;
          const err = new Error('The operation was aborted.');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const pending = gradeAnswer({
      apiKey: 'fake',
      model: 'gemini-2.5-flash',
      question: 'Which organelle makes ATP?',
      expectedAnswer: 'Mitochondria',
      userAnswer: 'the golgi body', // no exact match, so it goes to the network
      timeoutMs: 2500,
    });

    // stop the rejection being treated as unhandled before we assert on it
    const settled = vi.fn();
    pending.catch(settled);

    await vi.advanceTimersByTimeAsync(2500);

    expect(aborted).toBe(true);
    await expect(pending).rejects.toThrow(/took too long/i);
    expect(settled).toHaveBeenCalled();
  });
});
