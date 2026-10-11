import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { FeatherGraphic } from '../FeatherGraphic';

export const SummaryScreen: React.FC = () => {
  const {
    streakState,
    restartWithSameDeck,
    resetGame,
    answeredRecords,
    selectedBackground,
    setCurrentScreen,
    deckSource,
  } = useGame();

  const [filter, setFilter] = useState<'all' | 'missed' | 'correct'>('all');

  const total = streakState.totalCorrect + streakState.totalIncorrect;
  const percentage = total > 0 ? Math.round((streakState.totalCorrect / total) * 100) : 0;

  const filteredRecords = answeredRecords.filter((rec) => {
    if (filter === 'missed') return !rec.grading.isCorrect;
    if (filter === 'correct') return rec.grading.isCorrect;
    return true;
  });

  const filterBtnClass = (active: boolean) =>
    `transition-colors cursor-pointer ${
      active
        ? 'text-white font-extrabold underline decoration-white/60 decoration-2 underline-offset-4'
        : 'text-[#143d5c] hover:text-white font-bold'
    }`;

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center flex flex-col justify-between py-6 px-4 md:px-10 select-none overflow-x-hidden font-serif"
      style={{ backgroundImage: `url(${selectedBackground})` }}
    >
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      <header className="relative z-20 flex items-center justify-between w-full max-w-5xl mx-auto mb-2">
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#ffffff] via-[#edf3f8] to-[#d2dfea] border-2 border-white/95 rounded-full px-6 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <span className="font-serif font-black tracking-widest text-[#1e2f3c] text-lg md:text-xl drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] uppercase">
            SUMMARY
          </span>
          <FeatherGraphic className="w-6 h-6 rotate-[-15deg]" gradientId="summary-feather" />
        </div>

        <div className="flex flex-col items-end">
          <h1 className="font-serif italic font-black text-2xl md:text-4xl tracking-tight text-white drop-shadow-[2px_2px_0_#145b9e] drop-shadow-[4px_4px_6px_rgba(0,0,0,0.8)]">
            <span className="text-[#e2f1fd]">Study</span> Everyday
          </h1>
          <div className="bg-[#0b1c2b]/85 border border-[#386c96] px-3 py-0.5 rounded-full mt-0.5 shadow-md">
            <p className="font-serif italic text-[10px] md:text-xs text-[#a2d1f7] tracking-wider">
              ~Down the Study Hole~
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-20 w-full max-w-5xl mx-auto my-auto bg-[#1b6ca8]/50 backdrop-blur-[2px] border-2 border-[#b8e2f8]/85 rounded-2xl shadow-[0_12px_45px_rgba(0,40,90,0.55),inset_0_1px_3px_rgba(255,255,255,0.7)] p-6 md:p-8 text-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#5aa0ce]/40 pb-3 gap-2">
          <div className="flex items-center gap-2 text-sm md:text-base drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            <span className="font-bold text-white">•Source Material:</span>
            <span className="text-[#cde8fa] italic font-semibold truncate max-w-xs md:max-w-md">
              {deckSource || 'Uploaded Notes'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            <span>
              Accuracy:{' '}
              <strong className="text-white">
                {streakState.totalCorrect}/{total}
              </strong>{' '}
              ({percentage}%)
            </span>
            <span className="text-[#133c5a] font-black">/</span>
            <span>
              Mistakes: <strong className="text-[#ffd0d0]">{streakState.totalIncorrect}</strong>
            </span>
            <span className="text-[#133c5a] font-black">/</span>
            <span>
              Best Streak:{' '}
              <strong className="text-[#ffe082]">★{streakState.highestWinStreak}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm md:text-base drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            <span className="font-bold text-white">•Review Filter:</span>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={filterBtnClass(filter === 'all')}
            >
              All Questions ({answeredRecords.length})
            </button>
            <span className="text-[#123652] font-black">/</span>
            <button
              type="button"
              onClick={() => setFilter('missed')}
              className={filterBtnClass(filter === 'missed')}
            >
              Missed Only ({streakState.totalIncorrect})
            </button>
            <span className="text-[#123652] font-black">/</span>
            <button
              type="button"
              onClick={() => setFilter('correct')}
              className={filterBtnClass(filter === 'correct')}
            >
              Mastered Only ({streakState.totalCorrect})
            </button>
          </div>

          <span className="text-xs text-[#b8e2f8]/80 font-serif italic drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            Auto-saved to Load Archive
          </span>
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 scrollbar-thin border-t border-[#4f92bf]/50 pt-3">
          {filteredRecords.length === 0 ? (
            <div className="py-10 text-center text-[#cce8fb] font-serif italic text-sm drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
              No questions found for this filter.
            </div>
          ) : (
            filteredRecords.map((record, idx) => {
              const isCorrect = record.grading.isCorrect;
              return (
                <article
                  key={record.card.id || idx}
                  className={`p-3.5 md:p-4 rounded-lg border transition-all ${
                    isCorrect
                      ? 'bg-[#104875]/70 border-[#4da2db]/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]'
                      : 'bg-[#5e1927]/60 border-[#d4657b]/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#bce0f8] drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
                        Q{String(idx + 1).padStart(2, '0')}
                      </span>
                      {record.card.sourceTopic && (
                        <span className="text-[10px] uppercase font-sans font-bold bg-[#092238]/70 border border-[#407f9e] px-2 py-0.2 rounded-xs text-[#b8e2f8]">
                          {record.card.sourceTopic}
                        </span>
                      )}
                    </div>

                    <div>
                      {isCorrect ? (
                        <span className="text-xs font-bold text-[#c7fbd5] bg-[#0f3d28]/80 border border-[#4ade80] px-2.5 py-0.5 rounded-full drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]">
                          ✓ Correct
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#ffd0d0] bg-[#4a121d]/80 border border-[#f87171] px-2.5 py-0.5 rounded-full drop-shadow-[1px_1px_1px_rgba(0,0,0,0.9)]">
                          ✗ Missed
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-serif font-bold text-sm md:text-base text-white mb-2 leading-snug drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
                    {record.card.question}
                  </h3>

                  <div className="bg-[#0b253d]/80 border border-[#3b7fae]/70 rounded-xs p-2.5 space-y-1 text-xs md:text-sm font-serif mb-2 text-[#e3f2fd]">
                    <div className="flex items-start gap-2">
                      <span className="text-[#8ec5eb] font-bold w-24 shrink-0">Your Choice:</span>
                      <span
                        className={
                          isCorrect
                            ? 'text-white font-bold'
                            : 'text-[#ff9e9e] font-semibold line-through'
                        }
                      >
                        {record.userAnswer || '(None)'}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="flex items-start gap-2 pt-1 border-t border-[#1d4f79]">
                        <span className="text-[#a7f3d0] font-bold w-24 shrink-0">
                          Correct Answer:
                        </span>
                        <span className="text-white font-bold">{record.card.answer}</span>
                      </div>
                    )}
                  </div>

                  {record.grading.feedback && (
                    <div className="bg-[#071d30]/75 border-l-3 border-[#67b5e8] px-3 py-1.5 rounded-r-xs text-xs md:text-sm font-serif italic text-[#cbe6fa] drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)] mb-1.5">
                      <strong className="not-italic text-white mr-1.5 font-bold">Kimika:</strong>
                      <span>{record.grading.feedback}</span>
                    </div>
                  )}

                  {record.card.explanation && (
                    <p className="text-[11px] md:text-xs text-[#aed4ee] font-sans leading-relaxed pt-0.5">
                      <strong className="text-white font-serif">Key Takeaway: </strong>
                      {record.card.explanation}
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>
      </main>

      <footer className="relative z-20 flex items-center justify-center gap-6 w-full max-w-5xl mx-auto mt-4">
        <button
          type="button"
          onClick={restartWithSameDeck}
          className="w-36 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-xs md:text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] shadow-md cursor-pointer text-center"
        >
          RETRY DECK
        </button>

        <button
          type="button"
          onClick={() => setCurrentScreen('load')}
          className="w-36 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-xs md:text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] shadow-md cursor-pointer text-center"
        >
          LOAD ARCHIVE
        </button>

        <button
          type="button"
          onClick={() => resetGame()}
          className="w-36 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-xs md:text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] shadow-md cursor-pointer text-center"
        >
          MAIN MENU
        </button>
      </footer>
    </div>
  );
};
