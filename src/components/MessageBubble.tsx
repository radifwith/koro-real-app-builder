import raxzenLogo from "@/assets/raxzen-logo.png";
import ReactMarkdown from "react-markdown";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded-md glass-card opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isAI = message.role === "ai";

  if (isAI) {
    return (
      <div className="animate-fade-in-up px-1 py-2">
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
                    <div className="relative group my-2">
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
                  // Handle <video> tags from the response
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
