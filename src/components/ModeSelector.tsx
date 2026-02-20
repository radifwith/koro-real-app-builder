import {
  MessageSquare, Search, Brain, Image, BookOpen,
  HelpCircle, Code, Mic, FileText
} from "lucide-react";

export type AIMode = "chat" | "search" | "deep" | "image" | "study" | "quiz" | "code" | "voice" | "file";

interface ModeSelectorProps {
  activeMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

const modes: { id: AIMode; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "search", label: "Search", icon: Search },
  { id: "deep", label: "Deep", icon: Brain },
  { id: "image", label: "Image", icon: Image },
  { id: "study", label: "Study", icon: BookOpen },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
  { id: "code", label: "Code", icon: Code },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "file", label: "File", icon: FileText },
];

const ModeSelector = ({ activeMode, onModeChange }: ModeSelectorProps) => {
  return (
    <div className="h-12 px-3 flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-b border-border/30">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 border border-transparent ${
              isActive
                ? "mode-tab-active"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
