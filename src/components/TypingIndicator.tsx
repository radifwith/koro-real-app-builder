const TypingIndicator = () => {
  return (
    <div className="flex gap-3 justify-start animate-fade-in-up">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 glow-blue mt-1">
        <div className="w-4 h-4 rounded-full bg-primary/60" />
      </div>
      <div className="glass-card gradient-ai-message rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary/70 animate-bounce-dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
