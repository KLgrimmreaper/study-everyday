import { Flashcard, GradingResult } from './types';
import { checkExactMatch } from './grading';
import { DEFAULT_MODEL, Provider, modelProvider } from './streak';

export const PROMPTS = {
  generateCardsSystem: `You are helping a student make multiple-choice study flashcards from lecture material.

Each card MUST have:
- "question": a clear question
- "answer": the exact correct option string
- "options": exactly 4 distinct choices, including the correct answer
- "explanation": a short reason the answer is correct
- "sourceTopic": the topic the question came from

Return ONLY a JSON array:
[
  {
    "question": "string",
    "answer": "string",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "explanation": "string",
    "sourceTopic": "string"
  }
]
No markdown, no extra text.`,

  gradeAnswerSystem: `You are Kimika Tachibana from Wonderful Everyday (Subarashiki Hibi), acting as a sharp but caring study partner.
Speak in first person, like visual novel dialogue. Do not sound like a generic grader.

Return ONLY JSON:
{
  "isCorrect": boolean,
  "score": number,
  "feedback": "string"
}

feedback should be 1-2 short sentences (under 40 words).`,
};

export function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

export interface GenerateCardsOptions {
  apiKey: string;
  model: string;
  extractedContext: string;
  userNotes?: string;
  cardCount?: number;
}

export interface GradeAnswerOptions {
  apiKey: string;
  model: string;
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  explanation?: string;
  timeoutMs?: number;
}

interface ProviderInfo {
  label: string;
  keyPlaceholder: string;
  keyLink: string;
  keyLinkText: string;
  keyNote: string;
}

export const PROVIDERS: Record<Provider, ProviderInfo> = {
  gemini: {
    label: 'Google Gemini',
    keyPlaceholder: 'AIzaSy...',
    keyLink: 'https://aistudio.google.com/app/apikey',
    keyLinkText: 'Get a key (Google AI Studio)',
    keyNote: 'Saved in this tab, then sent to Google from your browser.',
  },
  deepseek: {
    label: 'DeepSeek',
    keyPlaceholder: 'sk-...',
    keyLink: 'https://platform.deepseek.com/api_keys',
    keyLinkText: 'Get a key (DeepSeek Platform)',
    keyNote: 'Saved in this tab, then sent to DeepSeek from your browser.',
  },
};

function buildRequest(
  provider: Provider,
  apiKey: string,
  model: string,
  systemInstruction: string,
  userPrompt: string,
  extra?: { maxTokens?: number; disableThinking?: boolean }
): { url: string; init: RequestInit } {
  if (provider === 'deepseek') {
    return {
      url: 'https://api.deepseek.com/chat/completions',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          ...(extra?.maxTokens ? { max_tokens: extra.maxTokens } : {}),
          ...(extra?.disableThinking ? { thinking: { type: 'disabled' } } : {}),
        }),
      },
    };
  }

  const generationConfig: Record<string, unknown> = {
    responseMimeType: 'application/json',
    temperature: 0.2,
  };

  if (extra?.maxTokens) {
    generationConfig.maxOutputTokens = extra.maxTokens;
  }

  // Gemini 2.5 Flash uses "thinking" by default, which can take 15-30s.
  // thinkingBudget: 0 turns that off so grading stays quick.
  if (extra?.disableThinking) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\n---\n${userPrompt}` }],
          },
        ],
        generationConfig,
      }),
    },
  };
}

function readResponseText(provider: Provider, data: unknown): string | undefined {
  const payload = data as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    choices?: { message?: { content?: string } }[];
  };

  if (provider === 'deepseek') {
    return payload?.choices?.[0]?.message?.content;
  }
  return payload?.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function callModel(
  apiKey: string,
  model: string,
  systemInstruction: string,
  userPrompt: string,
  extra?: { maxTokens?: number; disableThinking?: boolean; timeoutMs?: number }
): Promise<string> {
  const modelId = model.replace(/^models\//, '') || DEFAULT_MODEL;
  const provider = modelProvider(modelId);
  const { url, init } = buildRequest(
    provider,
    apiKey,
    modelId,
    systemInstruction,
    userPrompt,
    extra
  );

  let res: Response;
  const controller = new AbortController();
  const timeoutId = extra?.timeoutMs
    ? setTimeout(() => controller.abort(), extra.timeoutMs)
    : undefined;

  try {
    res = await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    // aborting actually cancels the request instead of letting it finish in
    // the background and waste the API quota
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('The model took too long to respond.');
    }
    throw err;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }

  const providerLabel = PROVIDERS[provider].label;

  if (!res.ok) {
    const errorText = await res.text();
    let errorMsg = `${providerLabel} API error (${res.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson?.error?.message) {
        errorMsg = errorJson.error.message;
      }
    } catch {
      // keep the status message
    }

    if (res.status === 401 || res.status === 403) {
      throw new Error(`${errorMsg}. Check that your ${providerLabel} API key is correct.`);
    }
    if (res.status === 429) {
      throw new Error(`${providerLabel} rate limit hit. Wait a bit and try again.`);
    }
    if (res.status === 400 && /model/i.test(errorMsg)) {
      throw new Error(`${errorMsg}. Check that this model is still available.`);
    }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  const text = readResponseText(provider, data);
  if (!text) {
    // DeepSeek's JSON mode is documented to occasionally return empty content
    throw new Error(`${providerLabel} returned an empty response. Try again.`);
  }
  return text;
}

function parseCard(item: Record<string, unknown>, index: number): Flashcard | null {
  const question = String(item.question || '').trim();
  const answer = String(item.answer || '').trim();
  const options = Array.isArray(item.options)
    ? item.options.map((opt) => String(opt).trim()).filter((opt) => opt.length > 0)
    : [];

  if (!question || !answer || options.length === 0) {
    return null;
  }

  const answerInOptions = options.some((opt) => opt.toLowerCase() === answer.toLowerCase());
  if (!answerInOptions) {
    return null;
  }

  return {
    id: `card-${Date.now()}-${index}`,
    question,
    answer,
    options,
    explanation: item.explanation ? String(item.explanation) : undefined,
    sourceTopic: item.sourceTopic ? String(item.sourceTopic) : undefined,
  };
}

export async function generateFlashcards(options: GenerateCardsOptions): Promise<Flashcard[]> {
  const count = options.cardCount || 10;
  const userPrompt = `Generate approximately ${count} flashcards based on this material:
${options.userNotes ? `\nStudent notes / focus areas:\n${options.userNotes}\n` : ''}
Extracted material:
${options.extractedContext.slice(0, 50000)}`;

  const rawJson = await callModel(
    options.apiKey,
    options.model || DEFAULT_MODEL,
    PROMPTS.generateCardsSystem,
    userPrompt,
    { maxTokens: 3500 }
  );

  const parsed = JSON.parse(cleanJsonResponse(rawJson));
  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array of flashcards back from the model.');
  }

  const cards = parsed
    .map((item: Record<string, unknown>, index: number) => parseCard(item, index))
    .filter((card): card is Flashcard => card !== null);

  if (cards.length === 0) {
    throw new Error('No complete flashcards came back. Try again or add more notes.');
  }

  return cards;
}

export async function gradeAnswer(options: GradeAnswerOptions): Promise<GradingResult> {
  const exactResult = checkExactMatch(options.userAnswer, options.expectedAnswer);
  if (exactResult !== null) {
    return exactResult;
  }

  const userPrompt = `Flashcard Question: "${options.question}"
Correct Answer: "${options.expectedAnswer}"
Student chose: "${options.userAnswer}"
${options.explanation ? `Background: "${options.explanation}"` : ''}

Give exactly 1 concise sentence (under 25 words) in Kimika's voice.`;

  const rawJson = await callModel(
    options.apiKey,
    options.model || DEFAULT_MODEL,
    PROMPTS.gradeAnswerSystem,
    userPrompt,
    {
      maxTokens: 100,
      disableThinking: true,
      timeoutMs: options.timeoutMs,
    }
  );

  const parsed = JSON.parse(cleanJsonResponse(rawJson));
  return {
    isCorrect: Boolean(parsed.isCorrect),
    score: Number(parsed.score ?? 0),
    feedback: String(parsed.feedback || `Not quite. The answer is ${options.expectedAnswer}.`),
    suggestedImprovement: parsed.suggestedImprovement
      ? String(parsed.suggestedImprovement)
      : undefined,
  };
}
