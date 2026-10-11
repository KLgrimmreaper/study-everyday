import { StreakTier } from './streak';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  options?: string[]; // 4 multiple choice options including the correct answer
  explanation?: string;
  sourceTopic?: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  cards: Flashcard[];
  createdAt: number;
}

export interface GradingResult {
  isCorrect: boolean;
  score: number; // 0 to 100
  feedback: string;
  matchedKeywords?: string[];
  suggestedImprovement?: string;
}

export type GamePhase = 'asking' | 'evaluating' | 'correct' | 'wrong' | 'summary';

export interface StreakState {
  currentWinStreak: number;
  currentLoseStreak: number;
  highestWinStreak: number;
  highestLoseStreak: number;
  totalCorrect: number;
  totalIncorrect: number;
  lastAnswerWasCorrect: boolean | null;
  escapedHighLoseStreak: boolean;
}

export interface KimikaSpriteInfo {
  path: string;
  category: 'asking' | 'correct' | 'wrong';
  tier: StreakTier | 'breaker';
  description: string;
}

export interface AnsweredQuestionRecord {
  card: Flashcard;
  userAnswer: string;
  grading: GradingResult;
}

export interface SavedStudySession {
  id: string;
  timestamp: number;
  formattedDate: string;
  sourceName: string;
  deckTitle: string;
  totalCards: number;
  totalCorrect: number;
  totalIncorrect: number;
  highestWinStreak: number;
  records: AnsweredQuestionRecord[];
  background: string;
}
