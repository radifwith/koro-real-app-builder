import {
  MessageSquare, Search, Brain, Image, BookOpen,
  HelpCircle, Code
} from "lucide-react";

export type AIMode = "chat" | "search" | "deep" | "image" | "study" | "quiz" | "code" | "voice" | "file";

interface ModeSelectorProps {
  activeMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

const modes: { id: AIMode; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "search", label: "Search", icon: Search },
  { id: "deep", label: "Deep Research", icon: Brain },
  { id: "image", label: "Image", icon: Image },
  { id: "study", label: "Study", icon: BookOpen },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
  { id: "code", label: "Code", icon: Code },
];

const ModeSelector = ({ activeMode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="h-14 px-3 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-border/30">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[15px] font-semibold whitespace-nowrap shrink-0 transition-all duration-200 border border-transparent btn-glow ${
              isActive
                ? "mode-tab-active border-primary/40"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Icon className={`w-5 h-5 icon-glow ${isActive ? "text-primary" : ""}`} />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
