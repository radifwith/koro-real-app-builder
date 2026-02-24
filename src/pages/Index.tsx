import { useState, useCallback, useEffect } from "react";
import TopBar from "@/components/TopBar";
import ModeSelector, { type AIMode, modeColors } from "@/components/ModeSelector";
import ChatArea from "@/components/ChatArea";
import InputBar from "@/components/InputBar";
import SettingsPanel from "@/components/SettingsPanel";
import HistoryPanel from "@/components/HistoryPanel";
import type { Message } from "@/components/MessageBubble";

const demoResponses: Record<AIMode, string> = {
  chat: "Hello! I'm Raxzen AI, your multi-modal assistant. I can help you with questions, research, coding, image generation, and much more. How can I help you today?",
  search: "Here are the top results I found for your query. I've searched across multiple sources to bring you the most relevant information.",
  deep: "## Deep Research Analysis\n\nBased on my comprehensive analysis across multiple sources:\n\n• **Key Finding 1**: The data strongly suggests a positive correlation.\n• **Key Finding 2**: Recent studies from 2026 confirm earlier hypotheses.\n• **Key Finding 3**: Further investigation recommended in specific sub-domains.\n\nWould you like me to elaborate on any of these points?",
  image: "I've generated the image based on your description. Here's what I created — you can download it or ask me to regenerate with different parameters.",
  study: "## Topic Overview\n\nLet me break this down into structured learning sections:\n\n**1. Introduction**\nThis concept forms the foundation of modern computing.\n\n**2. Key Principles**\nThere are three core principles you need to understand.\n\n**3. Applications**\nReal-world applications span across industries.\n\nWould you like to dive deeper into any section?",
  quiz: "Let's test your knowledge! Here's your first question:",
  code: 'function fibonacci(n: number): number {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}\n\n// Example usage:\nconsole.log(fibonacci(10)); // Output: 55',
  voice: "I heard you! Processing your voice input now...",
  file: "I've analyzed your file. Here's a summary:\n\n• **Type**: PDF Document\n• **Pages**: 12\n• **Key Topics**: AI Architecture, API Integration\n• **Summary**: The document outlines a comprehensive system design...\n\nWould you like me to explain any specific section?",
};

export interface ChatSession {
  id: string;
  title: string;
  mode: AIMode;
  messages: Message[];
  timestamp: Date;
}

const Index = () => {
  const [activeMode, setActiveMode] = useState<AIMode>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem("raxzen-history");
    return saved ? JSON.parse(saved) : [];
  });

  // Apply mode-specific colors as CSS variables
  useEffect(() => {
    const colors = modeColors[activeMode];
    document.documentElement.style.setProperty("--glow-primary", colors.glow);
    document.documentElement.style.setProperty("--glow-secondary", colors.accent);
    document.documentElement.style.setProperty("--ring", colors.hue);
  }, [activeMode]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("raxzen-history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const handleModeChange = useCallback((mode: AIMode) => {
    // Save current chat if it has messages
    if (messages.length > 0) {
      const session: ChatSession = {
        id: Date.now().toString(),
        title: messages[0]?.content.slice(0, 40) || "New Chat",
        mode: activeMode,
        messages,
        timestamp: new Date(),
      };
      setChatHistory((prev) => [session, ...prev].slice(0, 50));
    }
    setActiveMode(mode);
    setMessages([]);
    setIsTyping(false);
    if (mode === "voice") {
      setVoiceActive(true);
    }
  }, [messages, activeMode]);

  const handleSend = useCallback((text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: demoResponses[activeMode],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  }, [activeMode]);

  const handleLoadSession = useCallback((session: ChatSession) => {
    setActiveMode(session.mode);
    setMessages(session.messages);
    setHistoryOpen(false);
  }, []);

  const handleClearHistory = useCallback(() => {
    setChatHistory([]);
    localStorage.removeItem("raxzen-history");
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col gradient-bg overflow-hidden">
      <TopBar
        onSettingsClick={() => setSettingsOpen(true)}
        onHistoryClick={() => setHistoryOpen(true)}
      />
      <ModeSelector activeMode={activeMode} onModeChange={handleModeChange} />
      <ChatArea
        messages={messages}
        isTyping={isTyping}
        activeMode={activeMode}
        voiceActive={voiceActive}
        onVoiceClose={() => setVoiceActive(false)}
      />
      <InputBar
        onSend={handleSend}
        onVoiceActivate={() => setVoiceActive(true)}
        activeMode={activeMode}
      />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onClearHistory={handleClearHistory}
      />
      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={chatHistory}
        onLoadSession={handleLoadSession}
      />
    </div>
  );
};

export default Index;
