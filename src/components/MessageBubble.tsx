import raxzenLogo from "@/assets/raxzen-logo.png";
import ReactMarkdown from "react-markdown";
import { Copy, Check, ThumbsUp, ThumbsDown, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageActions = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<"up" | "down" | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
      } catch {}
    } else {
      navigator.clipboard.writeText(content);
      toast.success("Copied to share!");
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Copy">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <button onClick={handleShare} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors" title="Share">
        <Share2 className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setLiked(liked === "up" ? null : "up")} className={`p-1.5 rounded-lg hover:bg-accent/50 transition-colors ${liked === "up" ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`} title="Like">
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={() => setLiked(liked === "down" ? null : "down")} className={`p-1.5 rounded-lg hover:bg-accent/50 transition-colors ${liked === "down" ? "text-red-500" : "text-muted-foreground hover:text-foreground"}`} title="Dislike">
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isAI = message.role === "ai";

  if (isAI) {
    return (
      <div className="animate-fade-in-up px-1 py-2 group">
        <div className="flex items-start gap-3">
          <img src={raxzenLogo} alt="Raxzen AI" className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 icon-glow" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary mb-1 block text-glow">Raxzen AI</span>
            <div className="prose prose-sm prose-invert max-w-none
              prose-p:text-foreground prose-p:leading-relaxed prose-p:my-1
              prose-headings:text-foreground prose-headings:font-semibold
              prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
              prose-strong:text-primary prose-strong:font-semibold
              prose-a:text-primary prose-a:underline prose-a:underline-offset-2
              prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-li:text-foreground
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono
              prose-pre:bg-muted prose-pre:rounded-xl prose-pre:border prose-pre:border-border/50
              prose-blockquote:border-primary/50 prose-blockquote:text-muted-foreground
              prose-img:rounded-xl prose-img:max-w-full prose-img:shadow-lg
            ">
              <ReactMarkdown
                components={{
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt || "Generated"} className="rounded-xl max-w-full max-h-96 object-contain shadow-lg border border-border/30" loading="lazy" />
                  ),
                  pre: ({ children }) => (
                    <div className="relative group/code my-2">
                      <pre className="p-4 text-sm overflow-x-auto scrollbar-hide rounded-xl bg-muted border border-border/50">
                        {children}
                      </pre>
                    </div>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return <code className={`${className} text-xs font-mono`} {...props}>{children}</code>;
                    }
                    return <code className="text-primary bg-muted px-1.5 py-0.5 rounded-md text-xs font-mono" {...props}>{children}</code>;
                  },
                  video: ({ children, ...props }: any) => {
                    const videoSrc = typeof children === "string" ? children : "";
                    return (
                      <video src={videoSrc} controls className="rounded-xl max-w-full max-h-96 shadow-lg border border-border/30" />
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <MessageActions content={message.content} />
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
