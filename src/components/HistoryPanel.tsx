import { X, MessageSquare, Search, Brain, Image, BookOpen, HelpCircle, Code, Pin, PinOff } from "lucide-react";
import type { ChatSession } from "@/pages/Index";
import type { AIMode } from "./ModeSelector";
import { modeColors } from "./ModeSelector";

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onLoadSession: (session: ChatSession) => void;
  pinnedIds: Set<string>;
  onPinSession: (id: string) => void;
}

const modeIcons: Record<AIMode, React.ElementType> = {
  chat: MessageSquare,
  search: Search,
  deep: Brain,
  image: Image,
  study: BookOpen,
  quiz: HelpCircle,
  code: Code,
  voice: MessageSquare,
  file: MessageSquare,
};

const HistoryPanel = ({ isOpen, onClose, sessions, onLoadSession, pinnedIds, onPinSession }: HistoryPanelProps) => {
  if (!isOpen) return null;

  const pinned = sessions.filter((s) => pinnedIds.has(s.id));
  const unpinned = sessions.filter((s) => !pinnedIds.has(s.id));

  const renderSession = (session: ChatSession) => {
    const Icon = modeIcons[session.mode] || MessageSquare;
    const colors = modeColors[session.mode];
    const date = new Date(session.timestamp);
    const isPinned = pinnedIds.has(session.id);

    return (
      <div key={session.id} className="relative group/item">
        <button
          onClick={() => onLoadSession(session)}
          className="w-full text-left p-3 rounded-xl glass-card-hover btn-glow transition-all duration-200"
        >
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `hsla(${colors.hue} / 0.2)` }}
            >
              <Icon className="w-4 h-4" style={{ color: `hsl(${colors.hue})` }} />
            </div>
            <div className="flex-1 min-w-0 pr-7">
              <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)} · {date.toLocaleDateString()}
              </p>
            </div>
          </div>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPinSession(session.id); }}
          className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
            ${isPinned 
              ? "text-primary bg-primary/15" 
              : "text-muted-foreground/50 opacity-0 group-hover/item:opacity-100 hover:text-foreground hover:bg-accent/50"
            }`}
          title={isPinned ? "Unpin" : "Pin"}
        >
          {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-72 z-50 glass-card animate-slide-in-right border-l border-border/50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold text-foreground">History</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg btn-glow glass-card-hover flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No chat history yet</p>
            </div>
          ) : (
            <>
              {pinned.length > 0 && (
                <>
                  <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider px-2 pt-1 pb-1 flex items-center gap-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </p>
                  {pinned.map(renderSession)}
                  {unpinned.length > 0 && (
                    <div className="border-t border-border/20 my-2" />
                  )}
                </>
              )}
              {unpinned.map(renderSession)}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryPanel;
