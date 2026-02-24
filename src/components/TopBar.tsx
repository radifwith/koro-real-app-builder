import { Settings, Clock } from "lucide-react";
import raxzenLogo from "@/assets/raxzen-logo.png";

interface TopBarProps {
  onSettingsClick: () => void;
  onHistoryClick: () => void;
}

const TopBar = ({ onSettingsClick, onHistoryClick }: TopBarProps) => {
  return (
    <header className="h-14 flex items-center justify-between px-4 glass-card border-b border-border/50">
      <div className="flex items-center gap-2.5">
        <img src={raxzenLogo} alt="Raxzen AI" className="w-9 h-9 rounded-lg glow-blue icon-glow" />
        <h1 className="text-lg font-semibold text-foreground text-glow">Raxzen AI</h1>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onHistoryClick}
          className="w-9 h-9 rounded-lg btn-glow glass-card-hover flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-120"
        >
          <Clock className="w-5 h-5 icon-glow" />
        </button>
        <button
          onClick={onSettingsClick}
          className="w-9 h-9 rounded-lg btn-glow glass-card-hover flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-120"
        >
          <Settings className="w-5 h-5 icon-glow" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
