import React, { useState } from 'react';
import { useGame } from './GameContext';
import { gradeAnswer } from './gemini';
import { getKimikaExplanation, checkExactMatch } from './grading';
import { Loader2 } from 'lucide-react';

export const ObjectiveAnswerOptions: React.FC = () => {
  const {
    deck,
    currentCardIndex,
    submitAnswer,
    phase,
    setPhase,
    selectedModel,
    apiKey,
    userAnswerInput,
    setUserAnswerInput,
  } = useGame();

  const [isGrading, setIsGrading] = useState(false);

  const currentCard = deck?.cards[currentCardIndex];
  if (!currentCard) return null;

  const options =
    currentCard.options && currentCard.options.length > 0
      ? currentCard.options
      : [currentCard.answer];

  const isAnswering = phase === 'asking' || phase === 'evaluating';
  const isAnswered = phase === 'correct' || phase === 'wrong';

  const handleSelectOption = async (option: string) => {
    if (!isAnswering || isGrading) return;

    setUserAnswerInput(option);
    setIsGrading(true);
    setPhase('evaluating');

    // Options come from the model's own "answer" field, so a hit here is
    // reliable and we can skip the network entirely instead of making the
    // student wait on a round trip for something we already know.
    const exact = checkExactMatch(option, currentCard.answer);
    const localResult = exact
      ? {
          ...exact,
          // the card already carries the reason the answer is right, so show
          // that instead of a bare "correct"
          feedback: currentCard.explanation
            ? `Correct. ${currentCard.explanation}`
            : exact.feedback,
        }
      : getKimikaExplanation(option, currentCard.answer, currentCard.explanation);

    try {
      if (!apiKey.trim()) {
        submitAnswer(localResult, option);
        return;
      }

      const grading = await gradeAnswer({
        apiKey,
        model: selectedModel,
        question: currentCard.question,
        expectedAnswer: currentCard.answer,
        userAnswer: option,
        explanation: currentCard.explanation,
        // aborts the request for real, so a slow call can't resolve later and
        // overwrite the answer the student already saw
        timeoutMs: 2500,
      });
      submitAnswer(grading, option);
    } catch {
      submitAnswer(localResult, option);
    } finally {
      setIsGrading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-2 pointer-events-auto">
      {options.map((opt, idx) => {
        const isChosen = userAnswerInput === opt;
        const isCorrectOption =
          opt.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();

        let buttonStyle =
          'bg-[#fcfbfa]/90 hover:bg-white border-[#d0d5dd] hover:border-[#203a5b] text-[#2c3647] hover:shadow-md hover:translate-x-1 active:translate-x-0';

        if (isAnswering && isChosen && isGrading) {
          buttonStyle = 'bg-white/95 border-[#1550c0] text-[#1e2638] ring-2 ring-[#1550c0]/30';
        } else if (isAnswered) {
          if (isCorrectOption) {
            buttonStyle = 'bg-[#e2f1e4]/95 border-[#a3d4aa] text-[#1e4a27] font-medium shadow-xs';
          } else if (isChosen && !isCorrectOption) {
            buttonStyle = 'bg-[#fae2e2]/95 border-[#f0aaaa] text-[#702020] font-medium shadow-xs';
          } else {
            buttonStyle = 'bg-[#fcfbfa]/70 border-[#e2e5eb] text-slate-500 opacity-80';
          }
        }

        return (
          <button
            key={idx}
            disabled={!isAnswering || isGrading}
            onClick={() => handleSelectOption(opt)}
            className={`group relative w-full text-left px-5 py-2.5 rounded-lg border transition-all duration-200 text-sm tracking-wide shadow-xs flex items-center justify-between ${buttonStyle}`}
          >
            <span className="font-serif text-sm md:text-base leading-snug">{opt}</span>
            {isChosen && isGrading && (
              <Loader2 className="w-4 h-4 animate-spin text-[#1550c0] shrink-0 ml-2" />
            )}
          </button>
        );
      })}
    </div>
  );
};
