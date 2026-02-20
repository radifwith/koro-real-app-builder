import { X, Moon, Volume2, Globe, Trash2, Shield, LogOut } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-0 top-0 bottom-0 w-72 z-50 glass-card animate-slide-in-left border-r border-border/50">
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg glass-card-hover flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <SettingsItem icon={Moon} label="Theme" value="Dark" />
          <SettingsItem icon={Volume2} label="Voice" value="On" />
          <SettingsItem icon={Globe} label="Language" value="English" />
          <SettingsItem icon={Trash2} label="Clear History" />
          <SettingsItem icon={Shield} label="Privacy Policy" />
          <SettingsItem icon={LogOut} label="Logout" danger />
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-xs text-muted-foreground/50">Raxzen AI v1.1.1</p>
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
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  danger?: boolean;
}) => (
  <button
    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg glass-card-hover transition-all duration-120 ${
      danger ? "text-destructive" : "text-foreground"
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {value && <span className="text-xs text-muted-foreground">{value}</span>}
  </button>
);

export default SettingsPanel;
