import React, { useMemo } from 'react';
import { GamePhase, StreakState } from './types';
import { selectKimikaSprite } from './sprites';

interface KimikaSpriteProps {
  phase: GamePhase;
  streakState: StreakState;
}

export const KimikaSprite: React.FC<KimikaSpriteProps> = ({ phase, streakState }) => {
  const spriteInfo = useMemo(() => {
    return selectKimikaSprite(phase, streakState);
  }, [phase, streakState]);

  // When an answer is submitted (correct or wrong), Kimika rises up vertically slightly (VN reaction jump)
  const isReacting = phase === 'correct' || phase === 'wrong';

  return (
    <div
      className={`absolute bottom-[6vh] md:bottom-[8vh] left-1/2 -translate-x-1/2 pointer-events-none select-none transition-transform duration-500 ease-out z-10 ${
        isReacting ? '-translate-y-4' : 'translate-y-0'
      }`}
      style={{
        width: 'auto',
        height: '88vh',
      }}
    >
      <img
        src={spriteInfo.path}
        alt={spriteInfo.description}
        className="h-full w-auto max-w-none object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)]"
      />
    </div>
  );
};
