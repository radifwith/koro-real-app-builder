import {
  MessageSquare, Search, Brain, Image, BookOpen,
  HelpCircle, Code
} from "lucide-react";

export type AIMode = "chat" | "search" | "deep" | "image" | "study" | "quiz" | "code" | "voice" | "file";

export const modeColors: Record<AIMode, { hue: string; glow: string; accent: string }> = {
  chat: { hue: "217 91% 60%", glow: "217 91% 60%", accent: "271 81% 56%" },       // Blue + Purple
  search: { hue: "190 95% 50%", glow: "190 95% 50%", accent: "200 100% 60%" },     // Cyan
  deep: { hue: "271 81% 56%", glow: "271 81% 56%", accent: "290 90% 60%" },        // Purple
  image: { hue: "340 82% 55%", glow: "340 82% 55%", accent: "320 90% 60%" },       // Pink/Rose
  study: { hue: "142 71% 45%", glow: "142 71% 45%", accent: "160 80% 50%" },       // Green
  quiz: { hue: "38 92% 55%", glow: "38 92% 55%", accent: "45 100% 60%" },          // Gold
  code: { hue: "217 91% 60%", glow: "160 100% 50%", accent: "190 95% 50%" },       // Blue + Neon Green
  voice: { hue: "217 91% 60%", glow: "217 91% 60%", accent: "271 81% 56%" },
  file: { hue: "217 91% 60%", glow: "217 91% 60%", accent: "271 81% 56%" },
};

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
        const colors = modeColors[mode.id];
        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[15px] font-semibold whitespace-nowrap shrink-0 transition-all duration-200 border border-transparent btn-glow ${
              isActive
                ? "border-current/40"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
            style={isActive ? {
              background: `hsla(${colors.hue} / 0.2)`,
              borderColor: `hsla(${colors.hue} / 0.5)`,
              color: `hsl(${colors.hue})`,
              boxShadow: `0 0 15px hsla(${colors.glow} / 0.25)`,
            } : undefined}
          >
            <Icon
              className={`w-5 h-5 icon-glow`}
              style={isActive ? { color: `hsl(${colors.hue})` } : undefined}
            />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
};

export default ModeSelector;
