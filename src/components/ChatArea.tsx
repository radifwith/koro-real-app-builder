import { useRef, useEffect } from "react";
import MessageBubble, { type Message } from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import type { AIMode } from "./ModeSelector";
import VoiceOverlay from "./VoiceOverlay";
import raxzenLogo from "@/assets/raxzen-logo.png";

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  activeMode: AIMode;
  voiceActive: boolean;
  onVoiceClose: () => void;
  onSuggestionClick?: (text: string) => void;
}

const modeEmptyStates: Record<AIMode, { title: string; subtitle: string; emoji: string }> = {
  chat: { title: "Start a Conversation", subtitle: "Ask me anything — I'm here to help", emoji: "💬" },
  search: { title: "Search the Web", subtitle: "Get real-time results from across the internet", emoji: "🔍" },
  deep: { title: "Deep Research", subtitle: "In-depth analysis with detailed insights", emoji: "🧠" },
  image: { title: "Create Images", subtitle: "Describe what you want to see", emoji: "🎨" },
  study: { title: "Study Mode", subtitle: "Learn any topic with structured explanations", emoji: "📚" },
  quiz: { title: "Quiz Mode", subtitle: "Test your knowledge with interactive quizzes", emoji: "❓" },
  code: { title: "Code Assistant", subtitle: "Write, debug, and explain code", emoji: "💻" },
  voice: { title: "Voice Mode", subtitle: "Tap the mic to start talking", emoji: "🎙️" },
  file: { title: "File Analysis", subtitle: "Upload a file to get AI insights", emoji: "📄" },
};

const modeSuggestions: Partial<Record<AIMode, string[]>> = {
  chat: ["Explain quantum computing", "Write a poem", "Help me study", "Tell me a joke"],
  image: ["A sunset over mountains", "Cute cat illustration", "Cyberpunk city at night", "Abstract art wallpaper"],
  code: ["React todo app", "Python sort algorithm", "Fix my CSS layout", "Build a REST API"],
  search: ["Latest tech news", "Best programming languages 2025", "How does AI work?"],
  deep: ["Compare React vs Vue", "History of the internet", "Climate change analysis"],
  study: ["Learn JavaScript basics", "Explain calculus", "Biology cell structure"],
  quiz: ["Quiz me on science", "Test my history knowledge", "Programming quiz"],
  file: ["Analyze my CSV data", "Summarize this PDF", "Review this code file"],
};

const ChatArea = ({ messages, isTyping, activeMode, voiceActive, onVoiceClose, onSuggestionClick }: ChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const emptyState = modeEmptyStates[activeMode];
  const suggestions = modeSuggestions[activeMode] || [];

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-hide relative">
      {voiceActive && <VoiceOverlay onClose={onVoiceClose} />}

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center gap-5">
          <div className="relative">
            <img src={raxzenLogo} alt="Raxzen AI" className="w-20 h-20 rounded-2xl glow-blue" />
            <span className="absolute -bottom-1 -right-1 text-2xl">{emptyState.emoji}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1 text-glow">{emptyState.title}</h2>
            <p className="text-sm text-muted-foreground max-w-xs">{emptyState.subtitle}</p>
          </div>
          {suggestions.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2 max-w-xs w-full">
              {suggestions.map((text) => (
                <SuggestionChip key={text} text={text} onClick={() => onSuggestionClick?.(text)} />
              ))}
            </div>
          )}
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))
      )}

      {isTyping && <TypingIndicator />}
    </div>
  );
};

const SuggestionChip = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-3 py-2 rounded-xl text-xs text-muted-foreground glass-card-hover border border-border/30 hover:text-foreground hover:border-primary/30 transition-all duration-200 truncate"
  >
    {text}
  </button>
);

export default ChatArea;
