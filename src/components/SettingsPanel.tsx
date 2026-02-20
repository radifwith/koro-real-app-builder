import { X, Moon, Sun, Zap, Volume2, Globe, Trash2, Shield, LogOut, ExternalLink } from "lucide-react";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIVACY_URL = "https://www.termsfeed.com/live/27c8a172-0ab3-4366-beaf-f910b091110b";

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themeOptions: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "neon", label: "Neon", icon: Zap },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-0 top-0 bottom-0 w-72 z-50 glass-card animate-slide-in-left border-r border-border/50">
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg btn-glow glass-card-hover flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Theme Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Theme</label>
            <div className="flex gap-2">
              {themeOptions.map((t) => {
                const Icon = t.icon;
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all duration-200 btn-glow border ${
                      isActive
                        ? "mode-tab-active border-primary/50"
                        : "glass-card-hover border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`w-5 h-5 icon-glow ${isActive ? "text-primary" : ""}`} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <SettingsItem icon={Volume2} label="Voice" value="On" />
            <SettingsItem icon={Globe} label="Language" value="English" />
            <SettingsItem icon={Trash2} label="Clear History" />
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
              <SettingsItem icon={Shield} label="Privacy Policy" trailing={<ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />} />
            </a>
            <SettingsItem icon={LogOut} label="Logout" danger />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-xs text-muted-foreground/50">Raxzen AI v1.2.0</p>
        </div>
      </div>
    </>
  );
};

const SettingsItem = ({
  icon: Icon,
  label,
  value,
  danger,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  danger?: boolean;
  trailing?: React.ReactNode;
}) => (
  <button
    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg btn-glow glass-card-hover transition-all duration-120 ${
      danger ? "text-destructive" : "text-foreground"
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 icon-glow" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {trailing || (value && <span className="text-xs text-muted-foreground">{value}</span>)}
  </button>
);

export default SettingsPanel;
