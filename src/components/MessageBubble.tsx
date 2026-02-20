import raxzenLogo from "@/assets/raxzen-logo.png";

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

  if (isAI) {
    return (
      <div className="animate-fade-in-up px-1 py-2">
        <div className="flex items-start gap-3">
          <img src={raxzenLogo} alt="Raxzen AI" className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 icon-glow" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary mb-1 block text-glow">Raxzen AI</span>
            <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end animate-fade-in-up">
      <div className="max-w-[80%] rounded-2xl rounded-tr-md px-4 py-3 text-[15px] gradient-user-message glass-card text-foreground">
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
