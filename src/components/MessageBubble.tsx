import { Sparkles } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isAI = message.role === "ai";

  return (
    <div
      className={`flex gap-3 animate-fade-in-up ${isAI ? "justify-start" : "justify-end"}`}
    >
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 glow-blue mt-1">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-[15px] ${
          isAI
            ? "gradient-ai-message glass-card text-foreground rounded-tl-md"
            : "gradient-user-message glass-card text-foreground rounded-tr-md"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
