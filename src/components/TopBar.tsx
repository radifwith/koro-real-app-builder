import { Settings, Sparkles } from "lucide-react";

interface TopBarProps {
  onSettingsClick: () => void;
}

const TopBar = ({ onSettingsClick }: TopBarProps) => {
  return (
    <header className="h-14 flex items-center justify-between px-4 glass-card border-b border-border/50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-blue">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-foreground text-glow">Raxzen AI</h1>
      </div>
      <button
        onClick={onSettingsClick}
        className="w-9 h-9 rounded-lg glass-card-hover flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-120"
      >
        <Settings className="w-5 h-5" />
      </button>
    </header>
  );
};

export default TopBar;
