import React, { createContext, useContext, useState } from 'react';
import { FlashcardDeck, GradingResult } from './types';
import { GamePhase, StreakState, AnsweredQuestionRecord, SavedStudySession } from './types';
import { INITIAL_STREAK_STATE, recordAnswerResult } from './streak';
import { DEFAULT_MODEL, Provider, modelProvider } from './streak';
import { getApiKey, setApiKey as storeApiKey } from './apiKeys';
import { BACKGROUNDS } from './sprites';
import { saveStudySession, formatSessionDate } from './storage';

export type ScreenType = 'menu' | 'setup' | 'game' | 'summary' | 'load';

interface GameContextType {
  currentScreen: ScreenType;
  setCurrentScreen: (screen: ScreenType) => void;

  selectedBackground: string;
  setSelectedBackground: (bg: string) => void;

  selectedModel: string;
  setSelectedModel: (model: string) => void;
  provider: Provider;
  apiKey: string;
  setApiKey: (key: string) => void;

  deck: FlashcardDeck | null;
  setDeck: (deck: FlashcardDeck | null) => void;
  deckSource: string;
  setDeckSource: (s: string) => void;
  currentCardIndex: number;
  setCurrentCardIndex: (index: number) => void;

  phase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  streakState: StreakState;
  lastGrading: GradingResult | null;
  userAnswerInput: string;
  setUserAnswerInput: (val: string) => void;
  answeredRecords: AnsweredQuestionRecord[];

  submitAnswer: (grading: GradingResult, actualUserAnswer: string) => void;
  nextCard: () => void;
  resetGame: () => void;
  restartWithSameDeck: () => void;
  loadSavedSession: (session: SavedStudySession) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('menu');
  const [selectedBackground, setSelectedBackground] = useState<string>(BACKGROUNDS[0].path);

  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const provider = modelProvider(selectedModel);

  // each provider gets its own stored key, so switching models does not make
  // you paste the other one in again
  const [apiKey, setApiKeyState] = useState<string>(() => getApiKey(modelProvider(DEFAULT_MODEL)));

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    storeApiKey(provider, key);
  };

  const changeModel = (model: string) => {
    setSelectedModel(model);
    setApiKeyState(getApiKey(modelProvider(model)));
  };

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [deckSource, setDeckSource] = useState<string>('');
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [phase, setPhase] = useState<GamePhase>('asking');
  const [streakState, setStreakState] = useState<StreakState>(INITIAL_STREAK_STATE);
  const [lastGrading, setLastGrading] = useState<GradingResult | null>(null);
  const [userAnswerInput, setUserAnswerInput] = useState<string>('');
  const [answeredRecords, setAnsweredRecords] = useState<AnsweredQuestionRecord[]>([]);

  const submitAnswer = (grading: GradingResult, actualUserAnswer: string) => {
    setLastGrading(grading);
    setStreakState((prev) => recordAnswerResult(prev, grading.isCorrect));
    if (deck && deck.cards[currentCardIndex]) {
      setAnsweredRecords((prev) => [
        ...prev,
        {
          card: deck.cards[currentCardIndex],
          userAnswer: actualUserAnswer,
          grading,
        },
      ]);
    }
    setPhase(grading.isCorrect ? 'correct' : 'wrong');
  };

  const nextCard = () => {
    if (!deck) return;
    if (currentCardIndex + 1 < deck.cards.length) {
      setCurrentCardIndex((prev) => prev + 1);
      setUserAnswerInput('');
      setLastGrading(null);
      setPhase('asking');
    } else {
      const sessionRecord: SavedStudySession = {
        id: `session-${Date.now()}`,
        timestamp: Date.now(),
        formattedDate: formatSessionDate(new Date()),
        sourceName: deckSource || deck.title || 'Study Material',
        deckTitle: deck.title || 'Study Session',
        totalCards: deck.cards.length,
        totalCorrect: streakState.totalCorrect,
        totalIncorrect: streakState.totalIncorrect,
        highestWinStreak: streakState.highestWinStreak,
        records: answeredRecords,
        background: selectedBackground,
      };
      saveStudySession(sessionRecord);

      setPhase('summary');
      setCurrentScreen('summary');
    }
  };

  const resetGame = () => {
    setDeck(null);
    setDeckSource('');
    setCurrentCardIndex(0);
    setPhase('asking');
    setStreakState(INITIAL_STREAK_STATE);
    setLastGrading(null);
    setUserAnswerInput('');
    setAnsweredRecords([]);
    setCurrentScreen('menu');
  };

  const restartWithSameDeck = () => {
    setCurrentCardIndex(0);
    setPhase('asking');
    setStreakState(INITIAL_STREAK_STATE);
    setLastGrading(null);
    setUserAnswerInput('');
    setAnsweredRecords([]);
    setCurrentScreen('game');
  };

  const loadSavedSession = (session: SavedStudySession) => {
    setDeck({
      id: session.id,
      title: session.deckTitle,
      cards: session.records.map((r) => r.card),
      createdAt: session.timestamp,
    });
    setDeckSource(session.sourceName);
    setAnsweredRecords(session.records);
    setStreakState({
      currentWinStreak: 0,
      currentLoseStreak: 0,
      highestWinStreak: session.highestWinStreak,
      highestLoseStreak: 0,
      totalCorrect: session.totalCorrect,
      totalIncorrect: session.totalIncorrect,
      lastAnswerWasCorrect: null,
      escapedHighLoseStreak: false,
    });
    setSelectedBackground(session.background);
    setPhase('summary');
    setCurrentScreen('summary');
  };

  return (
    <GameContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        selectedBackground,
        setSelectedBackground,
        selectedModel,
        setSelectedModel: changeModel,
        provider,
        apiKey,
        setApiKey,
        deck,
        setDeck,
        deckSource,
        setDeckSource,
        currentCardIndex,
        setCurrentCardIndex,
        phase,
        setPhase,
        streakState,
        lastGrading,
        userAnswerInput,
        setUserAnswerInput,
        answeredRecords,
        submitAnswer,
        nextCard,
        resetGame,
        restartWithSameDeck,
        loadSavedSession,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// The provider and its hook live together on purpose - splitting them would
// mean two files to keep in sync for no real gain.
// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
