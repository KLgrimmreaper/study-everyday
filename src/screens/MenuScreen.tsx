import React from 'react';
import { useGame } from '../GameContext';

export const MainMenu: React.FC = () => {
  const { setCurrentScreen } = useGame();

  const handleExit = () => {
    if (window.confirm('Close Study Everyday?')) {
      window.close();
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f4f2ee] flex flex-col items-center justify-center gap-16 md:gap-24 py-12 px-4 select-none overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#d3d7de_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center w-full">
        <p className="tracking-[0.35em] text-xs font-semibold text-[#5a6578] uppercase mb-4">
          A STUDY VISUAL NOVEL
        </p>

        <div className="relative flex justify-center items-center my-3 w-full max-w-5xl aspect-[1242/513]">
          <img
            src="/menulogo/study-everyday-logo-v2.svg"
            alt="Study Everyday"
            className="w-full h-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] pointer-events-none"
          />
        </div>

        <div className="w-full max-w-md my-4">
          <div className="border-t-[1.5px] border-b-[1.5px] border-[#203a5b] py-1.5">
            <p className="font-serif italic text-sm text-[#203a5b] text-center tracking-widest">
              ~ Down the Study Hole ~
            </p>
          </div>
        </div>

        <p className="font-serif italic text-sm text-slate-600 mt-1">
          A quiet route through the things you need to remember.
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 md:gap-4 w-full max-w-xs">
        <button
          onClick={() => setCurrentScreen('setup')}
          className="group relative w-48 min-h-[44px] py-2 text-center text-xl font-serif text-[#2a374a] transition-all hover:text-[#1349a0] hover:scale-105 active:scale-95 focus:outline-none"
        >
          <span className="relative z-10">Start</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#1349a0] transition-all duration-300 group-hover:w-20" />
        </button>

        <button
          onClick={() => setCurrentScreen('load')}
          className="group relative w-48 min-h-[44px] py-2 text-center text-xl font-serif text-[#2a374a] transition-all hover:text-[#1349a0] hover:scale-105 active:scale-95 focus:outline-none"
        >
          <span className="relative z-10">Load</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#1349a0] transition-all duration-300 group-hover:w-20" />
        </button>

        <button
          onClick={handleExit}
          className="group relative w-48 min-h-[44px] py-2 text-center text-xl font-serif text-[#2a374a] transition-all hover:text-[#b43232] hover:scale-105 active:scale-95 focus:outline-none"
        >
          <span className="relative z-10">Exit</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#b43232] transition-all duration-300 group-hover:w-20" />
        </button>
      </div>
    </div>
  );
};
