import { GradingResult } from './types';

export function normalizeAnswer(text: string): string {
  // Only typographic punctuation is ignored. Characters that carry meaning in a
  // subject - $ % ^ & * = - are kept, because dropping them made different
  // answers compare equal. "city$" and "$city" both used to normalise to
  // "city", so a wrong PHP answer was graded as correct.
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,/#!;:?`~()"'’]/g, '')
    .replace(/\s+/g, ' ');
}

export function checkExactMatch(userAnswer: string, expectedAnswer: string): GradingResult | null {
  const normUser = normalizeAnswer(userAnswer);
  const normExpected = normalizeAnswer(expectedAnswer);

  if (normUser.length === 0) {
    return {
      isCorrect: false,
      score: 0,
      feedback: 'No answer provided.',
    };
  }

  if (normUser === normExpected) {
    return {
      isCorrect: true,
      score: 100,
      feedback: 'Spot on! Exact match.',
    };
  }

  // Treat "foo / bar" or "foo, bar" as more than one accepted answer
  const alternatives = expectedAnswer
    .split(/[,/|]/)
    .map((opt) => normalizeAnswer(opt))
    .filter((opt) => opt.length > 0);

  if (alternatives.some((alt) => alt === normUser)) {
    return {
      isCorrect: true,
      score: 100,
      feedback: 'Spot on! Accepted alternative match.',
    };
  }

  return null;
}

export function getKimikaExplanation(
  userOption: string,
  expectedAnswer: string,
  explanation?: string
): GradingResult {
  const isCorrect = userOption.trim().toLowerCase() === expectedAnswer.trim().toLowerCase();

  if (isCorrect) {
    const praiseLines = [
      `"Exactly right. You didn't hesitate at all, did you? ${explanation || 'The logic behind it holds together cleanly.'}"`,
      `"Spot on. You grasped the true concept right away. ${explanation || 'Just as we reviewed.'}"`,
      `"Correct. It seems you see right through the question to its core. ${explanation || ''}"`,
    ];
    const pickedPraise = praiseLines[Math.floor(Math.random() * praiseLines.length)];
    return {
      isCorrect: true,
      score: 100,
      feedback: pickedPraise,
    };
  } else {
    const failureLines = [
      `"You chose '${userOption}', but that's not quite where the answer lies. The correct answer is '${expectedAnswer}'. ${explanation || 'Take another look at the fundamental definitions—they form the world we are studying.'}"`,
      `"Hmm... '${userOption}' might seem tempting on the surface, but it misidentifies the premise. It should be '${expectedAnswer}'. ${explanation || 'Remember how each piece connects to the whole.'}"`,
      `"Not '${userOption}'... you let your focus slip just a bit. '${expectedAnswer}' is the truth here. ${explanation || 'Do not worry—rebuilding our understanding from the errors is where learning begins.'}"`,
    ];
    const pickedFail = failureLines[Math.floor(Math.random() * failureLines.length)];
    return {
      isCorrect: false,
      score: 0,
      feedback: pickedFail,
    };
  }
}
