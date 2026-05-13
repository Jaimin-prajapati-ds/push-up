import { useState } from 'react';
import { getAppSettings, saveAppSettings, type AppSettings } from '@/src/lib/userProfile';
import { ChevronLeft, Volume2, VolumeX, Smartphone, Zap, Eye, Timer, Trash2, Instagram, ExternalLink, Star } from 'lucide-react';

export function Settings({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(getAppSettings());
  const [showReset, setShowReset] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveAppSettings({ [key]: value });
  };

  const handleReset = () => {
    localStorage.removeItem('workouts');
    localStorage.removeItem('pushchamp_profile');
    localStorage.removeItem('pushchamp_settings');
    setShowReset(false);
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 pt-20">
      <header className="bg-surface/70 backdrop-blur-md border-b border-surface-container-highest fixed top-0 left-0 w-full z-50 flex items-center px-4 h-16">
        <button onClick={onBack} className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display-lg text-headline-lg italic uppercase text-primary tracking-wider flex-1 text-center pr-10">SETTINGS</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 w-full flex flex-col gap-6">
        {/* PushChamp PRO */}
        <section className="flex flex-col gap-1">
          <h2 className="font-label-caps text-label-caps text-primary-fixed uppercase tracking-widest px-1 mb-2">Premium</h2>
          <div className="bg-gradient-to-br from-surface-container to-surface-container-high border border-primary-fixed/30 rounded-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/10 blur-3xl rounded-full -mr-10 -mt-10 transition-all group-hover:bg-primary-fixed/20" />
            <div className="p-5 flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <Star className="w-5 h-5 text-black fill-black" />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-lg text-[18px] text-primary uppercase leading-tight">PushChamp PRO</span>
                  <span className="font-body-md text-on-surface-variant text-sm">Remove all ads forever.</span>
                </div>
              </div>
              
              <button 
                onClick={async () => {
                  try {
                    // Logic to purchase via RevenueCat
                    // const { customerInfo } = await Purchases.purchasePackage(myMonthlyPackage);
                    alert("Purchasing Pro Version ($1.99) via Google Play...");
                    localStorage.setItem('pushchamp_is_pro', 'true');
                    window.location.reload();
                  } catch (e) {
                    console.log("Purchase cancelled", e);
                  }
                }}
                className="w-full py-3 bg-primary-fixed text-black rounded-lg font-headline-lg text-[16px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary-fixed-dim transition-colors"
              >
                Upgrade to Pro • $1.99/mo
              </button>
            </div>
          </div>
        </section>

        {/* Sound & Haptics */}
        <section className="flex flex-col gap-1">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest px-1 mb-2">Feedback</h2>
          <div className="bg-surface-container border border-surface-container-highest rounded-xl overflow-hidden">
            <ToggleRow icon={settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />} label="Sound Effects" value={settings.soundEnabled} onChange={v => updateSetting('soundEnabled', v)} />
            <ToggleRow icon={<Smartphone className="w-5 h-5" />} label="Vibration" value={settings.vibrationEnabled} onChange={v => updateSetting('vibrationEnabled', v)} border />
            <ToggleRow icon={<Eye className="w-5 h-5" />} label="Keep Screen On" value={settings.keepScreenOn} onChange={v => updateSetting('keepScreenOn', v)} border />
          </div>
        </section>

        {/* Detection */}
        <section className="flex flex-col gap-1">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest px-1 mb-2">Detection</h2>
          <div className="bg-surface-container border border-surface-container-highest rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-on-surface-variant" />
                <div className="flex flex-col">
                  <span className="font-body-md text-on-surface">AI Model</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant">
                    {settings.modelType === 'thunder' ? 'Thunder (Accurate)' : 'Lightning (Fast)'}
                  </span>
                </div>
              </div>
              <select
                value={settings.modelType}
                onChange={e => updateSetting('modelType', e.target.value as 'lightning' | 'thunder')}
                className="bg-surface border border-surface-variant rounded-lg px-3 py-1.5 text-on-surface text-sm focus:outline-none focus:border-primary-fixed"
              >
                <option value="lightning">Lightning</option>
                <option value="thunder">Thunder</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between border-t border-surface-container-highest">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-on-surface-variant" />
                <div className="flex flex-col">
                  <span className="font-body-md text-on-surface">Countdown</span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant">{settings.countdownSeconds}s before workout</span>
                </div>
              </div>
              <select
                value={settings.countdownSeconds}
                onChange={e => updateSetting('countdownSeconds', Number(e.target.value))}
                className="bg-surface border border-surface-variant rounded-lg px-3 py-1.5 text-on-surface text-sm focus:outline-none focus:border-primary-fixed"
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
              </select>
            </div>
          </div>
        </section>

        {/* Backup & Sync */}
        <section className="flex flex-col gap-1">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest px-1 mb-2">Backup & Restore</h2>
          <div className="bg-surface-container border border-surface-container-highest rounded-xl overflow-hidden p-4 flex flex-col gap-3">
            <p className="font-body-md text-on-surface-variant text-sm">Save your progress manually to your device to prevent data loss.</p>
            <div className="flex gap-3 mt-1">
              <button 
                onClick={() => {
                  const data = {
                    workouts: localStorage.getItem('workouts'),
                    profile: localStorage.getItem('pushchamp_profile'),
                    settings: localStorage.getItem('pushchamp_settings')
                  };
                  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pushchamp_backup_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 py-2 bg-surface-container-high text-on-surface rounded-lg font-label-caps text-label-caps uppercase tracking-widest border border-surface-container-highest hover:bg-surface-variant transition-colors"
              >
                Export Data
              </button>
              <label className="flex-1 py-2 bg-surface-container-high text-on-surface rounded-lg font-label-caps text-label-caps uppercase tracking-widest border border-surface-container-highest hover:bg-surface-variant transition-colors flex items-center justify-center cursor-pointer">
                <span>Import Data</span>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const data = JSON.parse(e.target?.result as string);
                        if (data.workouts) localStorage.setItem('workouts', data.workouts);
                        if (data.profile) localStorage.setItem('pushchamp_profile', data.profile);
                        if (data.settings) localStorage.setItem('pushchamp_settings', data.settings);
                        alert("Data imported successfully! The app will now reload.");
                        window.location.reload();
                      } catch (error) {
                        alert("Invalid backup file.");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        </section>

        {/* Developer */}
        <section className="flex flex-col gap-1">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest px-1 mb-2">About</h2>
          <div className="bg-surface-container border border-surface-container-highest rounded-xl overflow-hidden">
            <a href="https://instagram.com/jai._.min2" target="_blank" rel="noopener noreferrer" className="p-4 flex items-center justify-between hover:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-pink-500" />
                <div className="flex flex-col">
                  <span className="font-body-md text-on-surface">Developer</span>
                  <span className="font-label-caps text-label-caps text-primary-fixed">@jai._.min2</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-on-surface-variant" />
            </a>
            <div className="p-4 flex items-center justify-between border-t border-surface-container-highest">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-on-surface-variant" />
                <span className="font-body-md text-on-surface">Version</span>
              </div>
              <span className="font-label-caps text-label-caps text-on-surface-variant">1.0.0</span>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="flex flex-col gap-1">
          <h2 className="font-label-caps text-label-caps text-red-500 uppercase tracking-widest px-1 mb-2">Danger Zone</h2>
          <div className="bg-surface-container border border-red-500/20 rounded-xl overflow-hidden">
            {!showReset ? (
              <button onClick={() => setShowReset(true)} className="p-4 flex items-center gap-3 w-full hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="font-body-md text-red-500">Reset All Data</span>
              </button>
            ) : (
              <div className="p-4 flex flex-col gap-3">
                <p className="font-body-md text-red-500">This will delete ALL your workout history and profile data. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowReset(false)} className="flex-1 py-2 bg-surface-container-high text-on-surface rounded-lg font-label-caps text-label-caps uppercase tracking-widest">Cancel</button>
                  <button onClick={handleReset} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-label-caps text-label-caps uppercase tracking-widest">Delete Everything</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ToggleRow({ icon, label, value, onChange, border }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; border?: boolean }) {
  return (
    <div className={`p-4 flex items-center justify-between ${border ? 'border-t border-surface-container-highest' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-on-surface-variant">{icon}</span>
        <span className="font-body-md text-on-surface">{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full transition-colors relative ${value ? 'bg-primary-fixed' : 'bg-surface-container-highest'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
