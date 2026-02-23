import { useState, useRef } from "react";
import { Send, Paperclip, Mic, X, FileText, ImageIcon } from "lucide-react";
import type { AIMode } from "./ModeSelector";

interface InputBarProps {
  onSend: (text: string) => void;
  onVoiceActivate: () => void;
  activeMode: AIMode;
}

const InputBar = ({ onSend, onVoiceActivate, activeMode }: InputBarProps) => {
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!text.trim() && !attachedFile) return;
    onSend(text.trim());
    setText("");
    setAttachedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
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

  const isImage = attachedFile?.type.startsWith("image/");

  return (
    <div className="px-3 pb-3 pt-1">
      {attachedFile && (
        <div className="mb-2 mx-1 flex items-center gap-2 px-3 py-2 rounded-xl glass-card border border-border/50 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            {isImage ? (
              <ImageIcon className="w-4 h-4 text-primary" />
            ) : (
              <FileText className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{attachedFile.name}</p>
            <p className="text-[10px] text-muted-foreground">{(attachedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={() => setAttachedFile(null)}
            className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 glass-card rounded-2xl px-3 py-2 border border-border/50">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.pptx,.zip"
          onChange={handleFileChange}
        />
        <button
          onClick={handleFileClick}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground btn-glow transition-colors duration-120"
        >
          <Paperclip className="w-5 h-5 icon-glow" />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholders[activeMode]}
          className="flex-1 bg-transparent text-foreground text-[15px] placeholder:text-muted-foreground/60 outline-none"
        />

        {activeMode === "voice" || (!text.trim() && !attachedFile) ? (
          <button
            onClick={onVoiceActivate}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 transition-all duration-120 btn-glow glow-blue"
          >
            <Mic className="w-5 h-5 icon-glow" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-120 btn-glow glow-blue"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default InputBar;
