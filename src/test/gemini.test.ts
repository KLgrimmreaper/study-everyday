import { describe, it, expect, vi, afterEach } from 'vitest';
import { gradeAnswer, PROVIDERS } from '../gemini';
import { AI_MODELS, modelProvider } from '../streak';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('provider routing', () => {
  it('maps every configured model to a provider that has settings', () => {
    for (const model of AI_MODELS) {
      const provider = modelProvider(model.id);
      expect(provider).toBe(model.provider);
      expect(PROVIDERS[provider].label).toBeTruthy();
      expect(PROVIDERS[provider].keyLink).toMatch(/^https:\/\//);
    }
  });

  it('throws for a model that is not in the list', () => {
    expect(() => modelProvider('gpt-whatever')).toThrow(/unknown model/i);
  });
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

  it('builds an OpenAI-style request for deepseek with a bearer token', async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      captured = { url, init };
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"isCorrect":false,"score":0,"feedback":"nope"}' } }],
        }),
      });
    });

    const result = await gradeAnswer({
      apiKey: 'sk-test-key',
      model: 'deepseek-flash',
      question: 'Which organelle makes ATP?',
      expectedAnswer: 'Mitochondria',
      userAnswer: 'the golgi body', // forces the network path
    });

    expect(captured).not.toBeNull();
    const { url, init } = captured!;

    // endpoint, not the Gemini one
    expect(url).toBe('https://api.deepseek.com/chat/completions');

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-test-key');

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe('deepseek-flash');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[1].content).toContain('golgi body');

    // and the response is read from choices[], not candidates[]
    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toBe('nope');
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
