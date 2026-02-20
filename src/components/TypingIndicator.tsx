import raxzenLogo from "@/assets/raxzen-logo.png";

const TypingIndicator = () => {
  return (
    <div className="animate-fade-in-up px-1 py-2">
      <div className="flex items-start gap-3">
        <img src={raxzenLogo} alt="Raxzen AI" className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1">
          <span className="text-xs font-semibold text-primary mb-2 block text-glow">Raxzen AI</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/70 animate-bounce-dot"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-sm shimmer-text font-medium">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
