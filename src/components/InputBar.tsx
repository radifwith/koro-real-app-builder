import { useState } from "react";
import { Send, Paperclip, Mic } from "lucide-react";
import type { AIMode } from "./ModeSelector";

interface InputBarProps {
  onSend: (text: string) => void;
  onVoiceActivate: () => void;
  activeMode: AIMode;
}

const InputBar = ({ onSend, onVoiceActivate, activeMode }: InputBarProps) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholders: Record<AIMode, string> = {
    chat: "Type a message...",
    search: "Search anything...",
    deep: "Ask for deep research...",
    image: "Describe an image...",
    study: "What do you want to study?",
    quiz: "Enter a topic for quiz...",
    code: "Ask a coding question...",
    voice: "Tap the mic to speak...",
    file: "Ask about your file...",
  };

  return (
    <div className="h-14 px-3 flex items-center gap-2 glass-card border-t border-border/50">
      <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground glass-card-hover transition-colors duration-120">
        <Paperclip className="w-5 h-5" />
      </button>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholders[activeMode]}
        className="flex-1 bg-transparent text-foreground text-[15px] placeholder:text-muted-foreground/60 outline-none"
      />

      {activeMode === "voice" || !text.trim() ? (
        <button
          onClick={onVoiceActivate}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-all duration-120 glow-blue"
        >
          <Mic className="w-5 h-5" />
        </button>
      ) : (
        <button
          onClick={handleSend}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-120 glow-blue"
        >
          <Send className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default InputBar;
