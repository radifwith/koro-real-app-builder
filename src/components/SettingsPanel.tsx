import { useState } from "react";
import {
  X, Moon, Sun, Zap, Globe, Trash2, Shield, LogOut,
  ExternalLink, Bell, Download, Info, Star, MessageSquare,
  ChevronRight, Check
} from "lucide-react";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIVACY_URL = "https://www.termsfeed.com/live/27c8a172-0ab3-4366-beaf-f910b091110b";

const languages = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "hi", label: "हिन्दी" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "fr", label: "Français" },
];

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const { theme, setTheme } = useTheme();
  const [selectedLang, setSelectedLang] = useState("en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  if (!isOpen) return null;

  const themeOptions: { id: ThemeMode; label: string; icon: React.ElementType }[] = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "light", label: "Light", icon: Sun },
    { id: "neon", label: "Neon", icon: Zap },
  ];

  const currentLangLabel = languages.find((l) => l.code === selectedLang)?.label || "English";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-0 top-0 bottom-0 w-72 z-50 glass-card animate-slide-in-left border-r border-border/50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg btn-glow glass-card-hover flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide">
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

          {/* Language Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Language</label>
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-lg btn-glow glass-card-hover transition-all duration-120 text-foreground"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 icon-glow" />
                <span className="text-sm font-medium">{currentLangLabel}</span>
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showLangPicker ? "rotate-90" : ""}`} />
            </button>
            {showLangPicker && (
              <div className="mt-1 rounded-xl border border-border/50 glass-card overflow-hidden animate-fade-in">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setShowLangPicker(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      selectedLang === lang.code
                        ? "text-primary bg-primary/10"
                        : "text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {lang.label}
                    {selectedLang === lang.code && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Preferences</label>
            <div className="space-y-1">
              <ToggleItem
                icon={Bell}
                label="Notifications"
                enabled={notifications}
                onToggle={() => setNotifications(!notifications)}
              />
              <ToggleItem
                icon={Download}
                label="Auto-save Chats"
                enabled={autoSave}
                onToggle={() => setAutoSave(!autoSave)}
              />
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">General</label>
            <div className="space-y-1">
              <SettingsItem icon={Trash2} label="Clear History" />
              <SettingsItem icon={Star} label="Rate App" />
              <SettingsItem icon={MessageSquare} label="Send Feedback" />
              <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
                <SettingsItem icon={Shield} label="Privacy Policy" trailing={<ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />} />
              </a>
              <SettingsItem icon={Info} label="About" />
              <SettingsItem icon={LogOut} label="Logout" danger />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground/50">Raxzen AI v1.2.0</p>
        </div>
      </div>
    </>
  );
};

const ToggleItem = ({
  icon: Icon,
  label,
  enabled,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between px-3 py-3 rounded-lg btn-glow glass-card-hover transition-all duration-120 text-foreground"
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 icon-glow" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${enabled ? "bg-primary" : "bg-muted"}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${enabled ? "translate-x-4" : "translate-x-0"}`} />
    </div>
  </button>
);

const SettingsItem = ({
  icon: Icon,
  label,
  danger,
  trailing,
}: {
  icon: React.ElementType;
  label: string;
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
    {trailing || <ChevronRight className="w-4 h-4 text-muted-foreground" />}
  </button>
);

export default SettingsPanel;
