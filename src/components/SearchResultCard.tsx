import { ExternalLink } from "lucide-react";

interface SearchResultCardProps {
  content: string;
}

const SearchResultCard = ({ content }: SearchResultCardProps) => {
  return (
    <div className="animate-fade-in-up space-y-3">
      <div className="glass-card rounded-xl p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-tight">Search Result</h3>
          <ExternalLink className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-primary/70">example.com</span>
        </div>
      </div>
    </div>
  );
};

export default SearchResultCard;
