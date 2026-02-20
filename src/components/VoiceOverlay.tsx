import { Mic, X } from "lucide-react";

interface VoiceOverlayProps {
  onClose: () => void;
}

const VoiceOverlay = ({ onClose }: VoiceOverlayProps) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-background/90 backdrop-blur-xl">
      <p className="text-sm font-medium text-primary text-glow tracking-wider uppercase">Listening...</p>

      <div className="relative">
        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-mic glow-blue">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <Mic className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />
      </div>

      <p className="text-xs text-muted-foreground">Tap below to cancel</p>

      <button
        onClick={onClose}
        className="w-14 h-14 rounded-full bg-destructive/20 border border-destructive/40 flex items-center justify-center text-destructive hover:bg-destructive/30 transition-all duration-120"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
};

export default VoiceOverlay;
