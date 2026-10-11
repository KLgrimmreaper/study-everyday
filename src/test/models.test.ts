import { describe, it, expect, vi, afterEach } from 'vitest';
import { gradeAnswer, generateFlashcards, PROVIDERS } from '../models';
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
      // the picker shows this under the model name, so it must not be blank
      expect(model.note.trim()).not.toBe('');
    }
  });

  it('throws for a model that is not in the list', () => {
    expect(() => modelProvider('gpt-whatever')).toThrow(/unknown model/i);
  });
});

describe('generateFlashcards', () => {
  it('asks for a big enough budget that a long deck is not cut off', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      capturedBody = JSON.parse(init.body as string);
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '[]' }, finish_reason: 'stop' }],
        }),
      });
    });

    await expect(
      generateFlashcards({
        apiKey: 'sk-test',
        model: 'deepseek-flash',
        extractedContext: 'notes',
        cardCount: 25,
      })
    ).rejects.toThrow(); // empty array is rejected, but the request still went out

    // DeepSeek counts reasoning tokens against max_tokens, so this cannot be small
    expect(capturedBody!.max_tokens).toBeGreaterThanOrEqual(16000);
    expect(capturedBody!.model).toBe('deepseek-flash');
  });

  it('does not always put the correct answer in the first slot', async () => {
    const cardJson = JSON.stringify([
      {
        question: 'Which of these is a valid PHP variable name?',
        answer: '$city',
        options: ['$city', '$city name', '$1city', 'city$'],
        explanation: 'The dollar sign comes first.',
      },
    ]);

    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: cardJson }] } }],
        }),
      })
    );

    const positions = new Set<number>();

    for (let i = 0; i < 20; i++) {
      const cards = await generateFlashcards({
        apiKey: 'fake',
        model: 'gemini-2.5-flash',
        extractedContext: 'php variables',
      });
      const card = cards[0];
      positions.add(card.options!.indexOf(card.answer));

      // the shuffle must not lose or duplicate an option
      expect(card.options).toHaveLength(4);
      expect(new Set(card.options).size).toBe(4);
      expect(card.options).toContain(card.answer);
    }

    // over 20 generations the answer should not sit in one slot every time
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('cut off replies', () => {
  function stubReply(content: string, finishReason: string): void {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: content }] }, finishReason }],
        }),
      })
    );
  }

  const options = {
    apiKey: 'fake',
    model: 'gemini-2.5-flash',
    extractedContext: 'some notes',
  };

  it('explains that the reply was cut off instead of leaking a JSON parse error', async () => {
    // a truncated array is what a maxed out token budget looks like
    stubReply('[{"question":"a","answer":"b","options":["b"', 'MAX_TOKENS');
    await expect(generateFlashcards(options)).rejects.toThrow(/ran out of room/i);
  });

  it('reports a bad reply when the model stopped for another reason', async () => {
    stubReply('this is not json at all', 'STOP');
    await expect(generateFlashcards(options)).rejects.toThrow(/not valid JSON/i);
  });
});

describe('gradeAnswer', () => {
  it('is only called for a wrong answer, and returns just the feedback text', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"feedback":"not really"}' }] } }],
        }),
      })
    );
    vi.stubGlobal('fetch', fetchSpy);

    const feedback = await gradeAnswer({
      apiKey: 'fake',
      model: 'gemini-2.5-flash',
      question: 'Which organelle makes ATP?',
      expectedAnswer: 'Mitochondria',
      userAnswer: 'the golgi body',
    });

    // a correct answer never reaches this function, so the call must happen
    expect(fetchSpy).toHaveBeenCalled();
    expect(feedback).toBe('not really');
  });

  it('builds an OpenAI-style request for deepseek with a bearer token', async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
      captured = { url, init };
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"feedback":"not quite"}' } }],
        }),
      });
    });

    const feedback = await gradeAnswer({
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
    expect(feedback).toBe('not quite');
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
