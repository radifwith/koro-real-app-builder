import { useRef, useEffect } from "react";
import MessageBubble, { type Message } from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import type { AIMode } from "./ModeSelector";
import SearchResultCard from "./SearchResultCard";
import QuizCard from "./QuizCard";
import CodeBlock from "./CodeBlock";
import VoiceOverlay from "./VoiceOverlay";
import raxzenLogo from "@/assets/raxzen-logo.png";

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  activeMode: AIMode;
  voiceActive: boolean;
  onVoiceClose: () => void;
}

const modeEmptyStates: Record<AIMode, { title: string; subtitle: string }> = {
  chat: { title: "Start a Conversation", subtitle: "Ask me anything — I'm here to help" },
  search: { title: "Search the Web", subtitle: "Get real-time results from across the internet" },
  deep: { title: "Deep Research", subtitle: "In-depth analysis with detailed insights" },
  image: { title: "Create Images", subtitle: "Describe what you want to see" },
  study: { title: "Study Mode", subtitle: "Learn any topic with structured explanations" },
  quiz: { title: "Quiz Mode", subtitle: "Test your knowledge with interactive quizzes" },
  code: { title: "Code Assistant", subtitle: "Write, debug, and explain code" },
  voice: { title: "Voice Mode", subtitle: "Tap the mic to start talking" },
  file: { title: "File Analysis", subtitle: "Upload a file to get AI insights" },
};

const ChatArea = ({ messages, isTyping, activeMode, voiceActive, onVoiceClose }: ChatAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const emptyState = modeEmptyStates[activeMode];

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-hide relative">
      {voiceActive && <VoiceOverlay onClose={onVoiceClose} />}

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
          <img src={raxzenLogo} alt="Raxzen AI" className="w-20 h-20 rounded-2xl glow-blue animate-pulse" />
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1 text-glow">{emptyState.title}</h2>
            <p className="text-sm text-muted-foreground">{emptyState.subtitle}</p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          if (msg.role === "ai" && activeMode === "search") {
            return <SearchResultCard key={msg.id} content={msg.content} />;
          }
          if (msg.role === "ai" && activeMode === "quiz") {
            return <QuizCard key={msg.id} />;
          }
          if (msg.role === "ai" && activeMode === "code") {
            return <CodeBlock key={msg.id} code={msg.content} />;
          }
          return <MessageBubble key={msg.id} message={msg} />;
        })
      )}

      {isTyping && <TypingIndicator />}
    </div>
  );
};

export default ChatArea;
