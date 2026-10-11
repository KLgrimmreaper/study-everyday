import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { BACKGROUNDS } from '../sprites';
import { generateFlashcards } from '../gemini';
import { parseDocumentFile, ParsedFileResult } from '../parseFiles';
import { FeatherGraphic } from '../FeatherGraphic';

interface CardCountOption {
  count: number;
  label: string;
  subtitle: string;
}

const CARD_COUNT_OPTIONS: CardCountOption[] = [
  { count: 5, label: '5 Cards', subtitle: 'Quick Sprint' },
  { count: 8, label: '8 Cards', subtitle: 'Focused Quiz' },
  { count: 10, label: '10 Cards', subtitle: 'Standard' },
  { count: 15, label: '15 Cards', subtitle: 'Deep Review' },
  { count: 20, label: '20 Cards', subtitle: 'Exam Mode' },
  { count: 25, label: '25 Cards', subtitle: 'Mastery' },
];

const navLinkClass = (active: boolean) =>
  `transition-colors ${
    active
      ? 'text-white font-extrabold underline decoration-white/60 decoration-2 underline-offset-4'
      : 'text-[#143d5c] hover:text-white font-bold'
  }`;

export const SetupScreen: React.FC = () => {
  const {
    setCurrentScreen,
    selectedBackground,
    setSelectedBackground,
    selectedModel,
    setSelectedModel,
    apiKey,
    setApiKey,
    setDeck,
    setDeckSource,
  } = useGame();

  const [cardCount, setCardCount] = useState<number>(10);
  const [parsedFiles, setParsedFiles] = useState<ParsedFileResult[]>([]);
  const [userNotes, setUserNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    try {
      const results: ParsedFileResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const parsed = await parseDocumentFile(files[i]);
        results.push(parsed);
      }
      setParsedFiles((prev) => [...prev, ...results]);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error reading document file.');
    }
  };

  const handleStartStudy = async () => {
    setErrorMessage(null);

    if (!apiKey.trim()) {
      setErrorMessage('Please enter your Gemini API Key before generating questions.');
      return;
    }

    const combinedContext = parsedFiles.map((f) => f.extractedText).join('\n\n');
    if (!combinedContext.trim() && !userNotes.trim()) {
      setErrorMessage(
        'Please upload lecture notes/slides (.pdf/.pptx/.txt) or enter focus notes above.'
      );
      return;
    }

    setIsGenerating(true);

    try {
      const generatedCards = await generateFlashcards({
        apiKey,
        model: selectedModel,
        extractedContext: combinedContext,
        userNotes,
        cardCount,
      });

      if (!generatedCards || generatedCards.length === 0) {
        throw new Error(
          'Gemini returned an empty flashcard set. Please refine your notes or context.'
        );
      }

      const sourceLabel =
        parsedFiles.length > 0
          ? parsedFiles.map((f) => f.fileName).join(', ')
          : userNotes.slice(0, 35) || 'Personal Study Notes';

      setDeckSource(sourceLabel);
      setDeck({
        id: `deck-${Date.now()}`,
        title: sourceLabel,
        cards: generatedCards,
        createdAt: Date.now(),
      });

      setCurrentScreen('game');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to generate flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setParsedFiles([]);
    setUserNotes('');
    setCardCount(10);
    setErrorMessage(null);
  };

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center flex flex-col justify-between py-6 px-4 md:px-10 select-none overflow-x-hidden font-serif"
      style={{ backgroundImage: `url(${selectedBackground})` }}
    >
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      <header className="relative z-20 flex items-center justify-between w-full max-w-5xl mx-auto mb-2">
        <div className="flex items-center gap-2 bg-gradient-to-b from-[#ffffff] via-[#edf3f8] to-[#d2dfea] border-2 border-white/95 rounded-full px-6 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <span className="font-serif font-black tracking-widest text-[#1e2f3c] text-lg md:text-xl drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] uppercase">
            OPTIONS
          </span>
          <FeatherGraphic className="w-6 h-6 rotate-[-15deg]" gradientId="setup-feather" />
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
        <div className="flex flex-col md:flex-row md:items-center">
          <span className="w-full md:w-64 font-bold text-sm md:text-base text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            •Display Background
          </span>
          <div className="flex items-center gap-2 text-sm md:text-base drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            {BACKGROUNDS.map((bg, idx) => (
              <React.Fragment key={bg.id}>
                {idx > 0 && <span className="text-[#123652] font-black">/</span>}
                <button
                  type="button"
                  onClick={() => setSelectedBackground(bg.path)}
                  className={navLinkClass(selectedBackground === bg.path)}
                >
                  {bg.name.replace(/\s*\(.*\)/, '')}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center">
          <span className="w-full md:w-64 font-bold text-sm md:text-base text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            •Gemini model
          </span>
          <div className="flex items-center gap-2 text-sm md:text-base drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-2.5-flash')}
              className={navLinkClass(selectedModel === 'gemini-2.5-flash')}
            >
              Gemini 2.5 Flash
            </button>
            <span className="text-[#123652] font-black">/</span>
            <button
              type="button"
              onClick={() => setSelectedModel('gemini-flash-latest')}
              className={navLinkClass(selectedModel === 'gemini-flash-latest')}
            >
              Gemini Flash Latest
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center">
          <span className="w-full md:w-64 font-bold text-sm md:text-base text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            •Gemini API Key
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-64 md:w-80 bg-[#0c2f4d]/85 border border-[#3b7fae] shadow-[inset_1px_2px_4px_rgba(0,0,0,0.8)] text-white font-mono text-xs px-2.5 py-1 rounded-xs focus:outline-none focus:border-white focus:bg-[#0c2f4d]"
            />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#aee1ff] hover:text-white underline font-serif tracking-wide drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]"
            >
              Get a key (Google AI Studio)
            </a>
            <span className="text-[10px] text-[#cce6f8]/80 font-serif drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]">
              Saved in this tab, then sent to Google from your browser.
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center">
          <span className="w-full md:w-64 font-bold text-sm md:text-base text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            •Study Material
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer bg-gradient-to-b from-[#87a5b4] via-[#658797] to-[#456574] border-t border-[#bce0f0] border-b-2 border-r border-[#1e2f37] border-l border-[#2e4450] text-[#12222a] font-serif font-black text-xs px-3.5 py-1 rounded-xs hover:brightness-110 active:translate-y-[1px] shadow-sm">
              Upload Slides / Notes (.pdf, .pptx, .txt)...
              <input
                type="file"
                multiple
                accept=".pdf,.pptx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {parsedFiles.length > 0 ? (
              <div className="flex items-center gap-2 text-xs text-[#d8f0ff] font-serif drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]">
                <span>{parsedFiles.map((f) => f.fileName).join(', ')}</span>
                <button
                  type="button"
                  onClick={() => setParsedFiles([])}
                  className="text-[#ff9d9d] hover:text-white underline text-[11px]"
                >
                  Clear
                </button>
              </div>
            ) : (
              <span className="text-xs text-[#cce6f8]/75 font-serif italic drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]">
                Upload lecture slides, syllabus, or study notes
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-start pt-1">
          <span className="w-full md:w-64 font-bold text-sm md:text-base text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)] pt-1">
            •Exam Focus Notes
          </span>
          <textarea
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            placeholder="Optional: Specific teacher guidelines, formulas, or key definitions to focus on..."
            rows={2}
            className="w-full max-w-xl bg-[#0c2f4d]/85 border border-[#3b7fae] shadow-[inset_1px_2px_4px_rgba(0,0,0,0.8)] text-white text-xs px-2.5 py-1.5 rounded-xs focus:outline-none focus:border-white placeholder:text-cyan-200/40"
          />
        </div>

        <div className="pt-3 border-t border-[#4f92bf]/50">
          <p className="font-serif italic text-xs text-[#cce8fb] mb-2.5 drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)]">
            How many questions?
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {CARD_COUNT_OPTIONS.map((opt) => {
              const isSelected = cardCount === opt.count;
              return (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => setCardCount(opt.count)}
                  className={`group relative flex flex-col items-center justify-between p-2.5 rounded-lg border transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#ffffff]/30 border-white shadow-[0_0_14px_rgba(255,255,255,0.8)] scale-103 ring-1 ring-white/60'
                      : 'bg-[#0f3d64]/50 border-[#4a85af]/60 hover:bg-[#1c5584]/60 hover:border-white/70'
                  }`}
                >
                  <div className="h-9 flex items-center justify-center">
                    <FeatherGraphic
                      className="w-8 h-8 rotate-[-20deg]"
                      glow={isSelected}
                      gradientId={`card-feather-${opt.count}`}
                    />
                  </div>
                  <span className="text-xs font-serif font-black text-white tracking-wide truncate w-full drop-shadow-[1px_1px_1px_rgba(0,0,0,0.95)] mt-1">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-[#bde0f8] font-sans font-medium tracking-tight truncate w-full">
                    {opt.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-[#421111]/90 border border-[#ff7070] text-[#ffdddd] rounded-sm text-xs font-serif leading-relaxed shadow-md">
            ⚠ {errorMessage}
          </div>
        )}
      </main>

      <footer className="relative z-20 flex items-center justify-center gap-6 w-full max-w-5xl mx-auto mt-4">
        <button
          type="button"
          onClick={handleStartStudy}
          disabled={isGenerating}
          className="w-32 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] disabled:opacity-50 shadow-md cursor-pointer text-center"
        >
          {isGenerating ? 'Generating...' : 'OK'}
        </button>

        <button
          type="button"
          onClick={() => setCurrentScreen('menu')}
          className="w-32 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] shadow-md cursor-pointer text-center"
        >
          CANCEL
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="w-32 py-1.5 bg-gradient-to-b from-[#9cb6c3] via-[#7597a7] to-[#517282] border-t-2 border-[#d5eaf5] border-b-2 border-r-2 border-[#1c2e37] border-l border-[#2e4450] text-[#15242c] font-serif font-black text-sm tracking-widest hover:brightness-110 active:translate-y-[1px] shadow-md cursor-pointer text-center"
        >
          RESET
        </button>
      </footer>
    </div>
  );
};
