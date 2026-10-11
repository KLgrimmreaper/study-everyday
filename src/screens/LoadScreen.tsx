import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { getSavedSessions, deleteStudySession } from '../storage';
import { SavedStudySession } from '../types';
import { FeatherGraphic } from '../FeatherGraphic';

const SLOTS_PER_PAGE = 8;
const TOTAL_PAGES = 8;

export const LoadScreen: React.FC = () => {
  const { setCurrentScreen, loadSavedSession, selectedBackground } = useGame();
  const [sessions, setSessions] = useState<SavedStudySession[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);

  useEffect(() => {
    setSessions(getSavedSessions());
  }, []);

  const pageStartIndex = (currentPage - 1) * SLOTS_PER_PAGE;
  const currentSlotSession = sessions[pageStartIndex + selectedSlotIndex] || null;

  const handleLoadSelected = () => {
    if (currentSlotSession) loadSavedSession(currentSlotSession);
  };

  const handleDeleteSelected = () => {
    if (currentSlotSession) {
      if (window.confirm(`Delete saved summary for "${currentSlotSession.sourceName}"?`)) {
        deleteStudySession(currentSlotSession.id);
        setSessions(getSavedSessions());
      }
    }
  };

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center flex flex-col justify-between py-6 px-4 md:px-10 select-none overflow-x-hidden font-serif"
      style={{ backgroundImage: `url(${selectedBackground})` }}
    >
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      <header className="relative z-20 flex items-center justify-between w-full max-w-6xl mx-auto mb-3">
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#ffffff] via-[#edf3f8] to-[#d2dfea] border-2 border-white/95 rounded-full px-7 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <span className="font-serif font-black tracking-widest text-[#1e2f3c] text-xl drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] uppercase">
            LOAD
          </span>
          <FeatherGraphic className="w-6 h-6 rotate-[-15deg]" gradientId="load-feather" />
        </div>

        <div className="flex items-center gap-3 text-white font-serif font-black text-sm md:text-base drop-shadow-[1px_1px_2px_rgba(0,0,0,0.95)]">
          <span className="tracking-widest uppercase text-white/90">PAGE:</span>
          {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => {
                setCurrentPage(page);
                setSelectedSlotIndex(0);
              }}
              className={`transition-all px-1 cursor-pointer ${
                currentPage === page
                  ? 'text-white font-black text-lg underline decoration-white decoration-2 underline-offset-4 scale-110'
                  : 'text-[#8cc2eb] hover:text-white font-bold'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-20 w-full max-w-6xl mx-auto my-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-7 space-y-2.5">
          {Array.from({ length: SLOTS_PER_PAGE }).map((_, slotIdx) => {
            const session = sessions[pageStartIndex + slotIdx] || null;
            const isSelected = selectedSlotIndex === slotIdx;

            return (
              <button
                key={slotIdx}
                type="button"
                onClick={() => setSelectedSlotIndex(slotIdx)}
                className={`group relative w-full text-left transition-all rounded-full px-5 py-2 border-2 flex items-center justify-between shadow-md cursor-pointer ${
                  isSelected
                    ? 'bg-white/95 border-white ring-2 ring-white/90 shadow-[0_0_15px_rgba(255,255,255,0.85)] scale-[1.01]'
                    : 'bg-[#d2e4f3]/85 hover:bg-[#e4eff8] border-[#a5cbe5]/90 text-[#173044]'
                }`}
              >
                <div className="flex items-center gap-3 truncate w-full">
                  <span
                    className={`font-mono text-xs font-bold tracking-wider shrink-0 ${isSelected ? 'text-[#124268]' : 'text-[#1a4a70]'}`}
                  >
                    {session
                      ? `DATE: ${session.formattedDate}`
                      : 'DATE:  - - - - / - - / - -    - - : - - : - -'}
                  </span>

                  {session ? (
                    <div className="flex items-center gap-2 truncate text-xs font-serif">
                      <span className="text-[#092238] font-black truncate max-w-[180px] bg-white/70 px-2 py-0.5 rounded border border-[#9ac2dc]">
                        📄 {session.sourceName}
                      </span>
                      <span className="text-[#0e5c2b] font-bold shrink-0">
                        ({session.totalCorrect}/{session.totalCards})
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-serif text-slate-400 italic">
                      [ Empty Slot ]
                    </span>
                  )}
                </div>

                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ml-2 transition-all ${
                    isSelected ? 'bg-[#1550c0] shadow-[0_0_6px_#1550c0]' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm bg-[#165a8e]/55 backdrop-blur-sm border-4 border-white/90 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.5)] p-4 text-white flex flex-col items-center">
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-white/60 bg-[#0a2339] shadow-inner flex items-center justify-center">
              {currentSlotSession ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center filter brightness-90"
                    style={{
                      backgroundImage: `url(${currentSlotSession.background || selectedBackground})`,
                    }}
                  />
                  <img
                    src="/sprites/kimika_asking/kimika_asking_nostreak/Kimika_asking_relaxed_nostreak.png"
                    alt="Kimika"
                    className="relative z-10 h-44 w-auto object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-[#081b2c]/85 border-t border-[#3b7fae] px-3 py-1.5 flex items-center justify-between text-xs z-20">
                    <span className="font-serif italic font-bold text-white truncate max-w-[200px]">
                      {currentSlotSession.sourceName}
                    </span>
                    <span className="font-mono text-[#aee1ff] text-[10px] font-bold">
                      {currentSlotSession.totalCorrect}/{currentSlotSession.totalCards} (
                      {Math.round(
                        (currentSlotSession.totalCorrect / currentSlotSession.totalCards) * 100
                      )}
                      %)
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4 text-cyan-200/60 font-serif italic text-xs">
                  <p>No study summary recorded in this slot.</p>
                  <p className="text-[10px] text-cyan-300/40 mt-1">
                    Complete a study session to log your summaries.
                  </p>
                </div>
              )}
            </div>

            <div className="w-full mt-3 p-2.5 bg-[#092238]/75 border border-[#3b7fae]/80 rounded-lg text-xs space-y-1 font-serif">
              <div className="flex justify-between items-center text-[#cce8fb] border-b border-[#204968] pb-1">
                <span className="font-bold">Topic / Document:</span>
                <span className="text-white font-extrabold truncate max-w-[150px]">
                  {currentSlotSession ? currentSlotSession.sourceName : 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#cce8fb] pt-0.5">
                <span>Recorded Date:</span>
                <span className="text-white font-mono text-[11px]">
                  {currentSlotSession ? currentSlotSession.formattedDate : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[#cce8fb]">
                <span>Questions Logged:</span>
                <span className="text-[#8ef5a8] font-bold">
                  {currentSlotSession ? `${currentSlotSession.records.length} Cards` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-20 flex flex-col md:flex-row items-center justify-between w-full max-w-6xl mx-auto mt-4 gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setCurrentScreen('menu')}
            className="w-28 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-xs md:text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] shadow-md cursor-pointer text-center"
          >
            BACK
          </button>

          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={!currentSlotSession}
            className="w-28 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-xs md:text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] disabled:opacity-40 shadow-md cursor-pointer text-center"
          >
            DELETE
          </button>

          <button
            type="button"
            onClick={handleLoadSelected}
            disabled={!currentSlotSession}
            className="w-32 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-xs md:text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] disabled:opacity-40 shadow-md cursor-pointer text-center"
          >
            LOAD
          </button>
        </div>

        <div className="flex flex-col items-end">
          <h2 className="font-serif italic font-black text-xl md:text-3xl tracking-tight text-white drop-shadow-[2px_2px_0_#145b9e] drop-shadow-[4px_4px_6px_rgba(0,0,0,0.8)]">
            <span className="text-[#e2f1fd]">Study</span> Everyday
          </h2>
          <div className="bg-[#0b1c2b]/85 border border-[#386c96] px-3 py-0.5 rounded-full shadow-md">
            <p className="font-serif italic text-[10px] md:text-xs text-[#a2d1f7] tracking-wider">
              ~Down the Study Hole~
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
