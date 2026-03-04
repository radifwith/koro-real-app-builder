import { useState } from "react";
import { CheckCircle, XCircle, Sparkles } from "lucide-react";

interface QuizCardProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

const QuizCard = ({ question, options, correctIndex, explanation }: QuizCardProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const showResult = selected !== null;

  return (
    <div className="animate-fade-in-up space-y-3">
      <div className="glass-card rounded-xl p-4 border border-border/50">
        <div className="flex items-start gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-foreground leading-relaxed">{question}</p>
        </div>
        <div className="space-y-2">
          {options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === correctIndex;

            let optionClass = "glass-card-hover border-border/30 hover:border-primary/40";
            if (showResult && isCorrect) optionClass = "bg-green-500/15 border-green-500/50";
            else if (showResult && isSelected && !isCorrect) optionClass = "bg-red-500/15 border-red-500/50";
            else if (showResult) optionClass = "opacity-50 border-border/20";

            return (
              <button
                key={i}
                onClick={() => !showResult && setSelected(i)}
                disabled={showResult}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground border transition-all duration-200 ${optionClass}`}
              >
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
                  showResult && isCorrect ? "border-green-500 text-green-500 bg-green-500/20" :
                  showResult && isSelected && !isCorrect ? "border-red-500 text-red-500 bg-red-500/20" :
                  "border-border/50 text-muted-foreground"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-left">{opt}</span>
                {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            );
          })}
        </div>
        {showResult && explanation && (
          <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in-up">
            <p className="text-xs text-foreground/80 leading-relaxed">
              <span className="font-semibold text-primary">Explanation:</span> {explanation}
            </p>
          </div>
        )}
        {showResult && (
          <p className={`text-xs font-semibold mt-3 ${selected === correctIndex ? "text-green-500" : "text-red-500"}`}>
            {selected === correctIndex ? "✅ Correct!" : `❌ Wrong! Correct answer: ${String.fromCharCode(65 + correctIndex)}) ${options[correctIndex]}`}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizCard;
