import React, { useEffect } from 'react';
import { useGame } from './GameContext';
import { ArrowRight } from 'lucide-react';

export const ResultFeedback: React.FC = () => {
  const { phase, lastGrading, nextCard, streakState } = useGame();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((phase === 'correct' || phase === 'wrong') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        nextCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, nextCard]);

  if (phase !== 'correct' && phase !== 'wrong') return null;

  return (
    <div className="pt-2 animate-in fade-in duration-300">
      <div className="text-slate-800 text-sm md:text-base font-serif leading-relaxed space-y-2">
        <p className="italic">{lastGrading?.feedback}</p>
        {streakState.escapedHighLoseStreak && (
          <p className="text-xs text-amber-800 font-sans font-semibold tracking-wide">
            ✦ High lose streak broken! Kimika gives an approving nod.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end pt-3">
        <button
          onClick={nextCard}
          autoFocus
          className="group flex items-center gap-2 text-xs font-serif text-[#1e2638] hover:text-[#1550c0] font-semibold transition-colors focus:outline-none"
        >
          <span>Continue</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          <span className="text-[10px] text-slate-400 font-sans font-normal ml-1">
            [Space / Enter]
          </span>
        </button>
      </div>
    </div>
  );
};
