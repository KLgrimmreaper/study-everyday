import React from 'react';
import { useGame } from '../GameContext';
import { KimikaSprite } from '../KimikaSprite';
import { ObjectiveAnswerOptions } from '../ObjectiveAnswerOptions';
import { ResultFeedback } from '../ResultFeedback';

export const GameScreen: React.FC = () => {
  const { deck, currentCardIndex, phase, streakState, selectedBackground, setCurrentScreen } =
    useGame();

  const currentCard = deck?.cards[currentCardIndex];

  if (!currentCard) return null;

  const isAnswering = phase === 'asking' || phase === 'evaluating';

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col justify-between select-none">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
        style={{ backgroundImage: `url(${selectedBackground})` }}
      >
        <div className="absolute inset-0 bg-black/5" />
      </div>

      <header className="relative z-30 flex items-start p-4 md:px-8">
        <button
          onClick={() => setCurrentScreen('setup')}
          className="text-white opacity-70 hover:opacity-100 transition-opacity duration-150 select-none leading-none"
          aria-label="Back to setup"
          style={{
            fontSize: '2rem',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          ◁
        </button>
      </header>

      <KimikaSprite phase={phase} streakState={streakState} />

      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 pb-3 flex flex-col justify-end mt-auto pointer-events-none">
        <ObjectiveAnswerOptions />
      </div>

      <footer className="relative z-30 w-full max-w-4xl mx-auto px-4 pb-6 pointer-events-auto">
        <div className="bg-[#fcfbfa]/85 backdrop-blur-md border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.14)] rounded-xl p-5 md:px-7 md:py-5 text-slate-800 min-h-[140px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-serif font-bold text-slate-900 text-sm tracking-wide">
                Kimika
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                STREAK {streakState.currentWinStreak} / MISTAKES {streakState.totalIncorrect}
              </span>
            </div>

            {isAnswering ? (
              <>
                <p className="font-serif italic text-xs text-slate-500 mb-2">
                  Take a moment. Which answer feels true?
                </p>
                <div className="py-1">
                  <p className="font-serif font-bold text-base md:text-lg text-slate-900 leading-snug">
                    <span className="text-slate-400 font-mono text-sm mr-2 font-normal">
                      Q{String(currentCardIndex + 1).padStart(2, '0')}
                    </span>
                    {currentCard.question}
                  </p>
                </div>
              </>
            ) : (
              <ResultFeedback />
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
