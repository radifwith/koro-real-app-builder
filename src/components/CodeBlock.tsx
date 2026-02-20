import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CodeBlockProps {
  code: string;
}

const CodeBlock = ({ code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
          <span className="text-xs font-medium text-muted-foreground">Code</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="p-4 text-sm text-foreground/90 overflow-x-auto scrollbar-hide">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
