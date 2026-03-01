import { useState, useCallback, useEffect } from "react";
import TopBar from "@/components/TopBar";
import ModeSelector, { type AIMode, modeColors } from "@/components/ModeSelector";
import ChatArea from "@/components/ChatArea";
import InputBar from "@/components/InputBar";
import SettingsPanel from "@/components/SettingsPanel";
import HistoryPanel from "@/components/HistoryPanel";
import type { Message } from "@/components/MessageBubble";
import { streamChat } from "@/lib/streamChat";
import { toast } from "sonner";

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

  const handleSend = useCallback((text: string, file?: File | null) => {
    // Build user message content
    let userContent = text;
    if (file) {
      userContent = text
        ? `[File: ${file.name}]\n\n${text}`
        : `[File: ${file.name}] Please analyze this file.`;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Build conversation history for AI
    const aiMessages = [
      ...messages.map((m) => ({
        role: m.role === "ai" ? "assistant" as const : "user" as const,
        content: m.content,
      })),
      { role: "user" as const, content: userContent },
    ];

    // If file attached, read it and include in context
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        // For text files, include content directly
        if (file.type.startsWith("text/") || file.name.match(/\.(txt|csv|json|md|js|ts|py|html|css|xml|yaml|yml|log)$/i)) {
          aiMessages[aiMessages.length - 1].content = `File: ${file.name}\n\nContent:\n${fileContent}\n\n${text || "Please analyze this file."}`;
        } else {
          aiMessages[aiMessages.length - 1].content = `File: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB)\n\n${text || "Please analyze this file."}`;
        }
        startStreaming(aiMessages);
      };
      if (file.type.startsWith("text/") || file.name.match(/\.(txt|csv|json|md|js|ts|py|html|css|xml|yaml|yml|log)$/i)) {
        reader.readAsText(file);
      } else {
        // For binary files, just send metadata
        startStreaming(aiMessages);
      }
    } else {
      startStreaming(aiMessages);
    }
  }, [messages, activeMode]);

  const startStreaming = (aiMessages: { role: "user" | "assistant"; content: string }[]) => {
    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "ai") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "ai" as const,
            content: assistantSoFar,
            timestamp: new Date(),
          },
        ];
      });
    };

    streamChat({
      messages: aiMessages,
      mode: activeMode,
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => setIsTyping(false),
      onError: (error) => {
        setIsTyping(false);
        toast.error(error);
      },
    });
  };

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
