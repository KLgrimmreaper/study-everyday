// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, cleanup } from '@testing-library/react';
import { GameProvider, useGame } from '../GameContext';
import { GameScreen } from '../screens/GameScreen';
import { Flashcard } from '../types';

const cards: Flashcard[] = [
  {
    id: 'card-1',
    question: 'Which organelle makes ATP?',
    answer: 'Mitochondria',
    options: ['Mitochondria', 'Golgi body', 'Ribosome', 'Nucleus'],
    explanation: 'It is the powerhouse of the cell.',
  },
  {
    id: 'card-2',
    question: 'What does DNA stand for?',
    answer: 'Deoxyribonucleic acid',
    options: ['Deoxyribonucleic acid', 'Dinucleic acid', 'Ribonucleic acid', 'Deoxyribose'],
    explanation: 'The name describes the sugar and the acid.',
  },
];

let ctx: ReturnType<typeof useGame> | null = null;

const Harness: React.FC = () => {
  ctx = useGame();
  // the real app routes on currentScreen; for the test it is simpler to show
  // the game as soon as a deck exists
  return ctx.deck ? <GameScreen /> : null;
};

function setupDeck() {
  act(() => {
    ctx!.setDeck({ id: 'deck-1', title: 'Biology', cards, createdAt: Date.now() });
    ctx!.setDeckSource('lecture-notes.pdf');
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  ctx = null;
});

afterEach(() => {
  cleanup();
});

describe('playing a full session', () => {
  it('grades locally without an API key and saves the session at the end', async () => {
    render(
      <GameProvider>
        <Harness />
      </GameProvider>
    );

    setupDeck();

    // Card 1 - pick the right answer
    await screen.findByText(/Which organelle makes ATP/);
    screen.getByText('Mitochondria').closest('button')!.click();

    // correct, so it comes back straight away with the card explanation
    await waitFor(() => {
      expect(screen.getByText(/powerhouse of the cell/i)).toBeTruthy();
    });
    screen.getByText(/Continue/i).click();

    // Card 2 - pick a wrong answer
    await screen.findByText(/What does DNA stand for/);
    screen.getByText('Dinucleic acid').closest('button')!.click();

    // wrong answers have no API key, so the local Kimika line is used
    await waitFor(() => {
      expect(ctx!.streakState.totalIncorrect).toBe(1);
    });
    screen.getByText(/Continue/i).click();

    // session finished: it should have been written to localStorage
    await waitFor(() => {
      const raw = localStorage.getItem('study_everyday_saved_sessions');
      expect(raw).toBeTruthy();
      const saved = JSON.parse(raw!);
      expect(saved).toHaveLength(1);
      expect(saved[0].sourceName).toBe('lecture-notes.pdf');
      expect(saved[0].totalCards).toBe(2);
      expect(saved[0].records).toHaveLength(2);
    });

    expect(ctx!.streakState.totalCorrect).toBe(1);
    expect(ctx!.streakState.totalIncorrect).toBe(1);
    expect(ctx!.streakState.highestWinStreak).toBe(1);
  });

  it('never sends a correct answer to the network', async () => {
    let calls = 0;
    const realFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      calls += 1;
      return Promise.reject(new Error('network should not be used'));
    }) as typeof fetch;

    try {
      render(
        <GameProvider>
          <Harness />
        </GameProvider>
      );
      setupDeck();

      // no API key is set, so even a wrong answer must stay local
      await screen.findByText(/Which organelle makes ATP/);
      screen.getByText('Mitochondria').closest('button')!.click();

      await waitFor(() => {
        expect(ctx!.streakState.totalCorrect).toBe(1);
      });
      expect(calls).toBe(0);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
