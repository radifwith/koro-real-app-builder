import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

const QuizCard = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const correctAnswer = 2;

  const options = [
    "Machine Learning",
    "Deep Learning",
    "Artificial Intelligence",
    "Neural Networks",
  ];

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[30%] rounded-full bg-primary glow-blue transition-all duration-300" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">03 / 10</span>
      </div>

      <div className="glass-card rounded-xl p-4">
        <p className="text-sm font-medium text-foreground mb-4">
          What is the broadest term that encompasses all forms of computer-based intelligence?
        </p>
        <div className="space-y-2">
          {options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === correctAnswer;
            const showResult = selected !== null;

            let optionClass = "glass-card-hover";
            if (showResult && isCorrect) optionClass = "bg-success/15 border-success/40";
            else if (showResult && isSelected && !isCorrect) optionClass = "bg-destructive/15 border-destructive/40";

            return (
              <button
                key={i}
                onClick={() => selected === null && setSelected(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground border transition-all duration-150 ${optionClass}`}
              >
                <span className="w-6 h-6 rounded-full border border-border/50 flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-left">{opt}</span>
                {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-success" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizCard;
