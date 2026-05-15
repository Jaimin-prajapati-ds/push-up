import { useState, type ReactNode } from 'react';
import { getAppSettings, saveAppSettings, type AppSettings } from '@/src/lib/userProfile';
import { ChevronLeft, Volume2, VolumeX, Smartphone, Zap, Eye, Timer, Trash2, ExternalLink, Gauge, Target } from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-black text-white pb-32 pt-20">
      <header className="bg-black/70 backdrop-blur-md border-b border-white/10 fixed top-0 left-0 w-full z-50 flex items-center px-4 h-16">
        <button onClick={onBack} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading text-xl italic uppercase text-white tracking-wider flex-1 text-center pr-10">SETTINGS</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 w-full flex flex-col gap-6">
        {/* Sound & Haptics */}
        <section className="flex flex-col gap-1">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">Feedback</h2>
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <ToggleRow icon={settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />} label="Sound Effects" value={settings.soundEnabled} onChange={v => updateSetting('soundEnabled', v)} />
            <ToggleRow icon={<Zap className="w-5 h-5 text-[#D4F45D]" />} label="AI Voice Coaching" value={settings.voiceEnabled || false} onChange={v => updateSetting('voiceEnabled', v)} border />
            <ToggleRow icon={<Smartphone className="w-5 h-5" />} label="Vibration" value={settings.vibrationEnabled} onChange={v => updateSetting('vibrationEnabled', v)} border />
            <ToggleRow icon={<Eye className="w-5 h-5" />} label="Keep Screen On" value={settings.keepScreenOn} onChange={v => updateSetting('keepScreenOn', v)} border />
          </div>
        </section>

        {/* Detection */}
        <section className="flex flex-col gap-1">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">Detection</h2>
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-white">AI Model</span>
                  <span className="text-[10px] text-gray-400">
                    {settings.modelType === 'thunder' ? 'Thunder (Accurate)' : 'Lightning (Fast)'}
                  </span>
                </div>
              </div>
              <select
                value={settings.modelType}
                onChange={e => updateSetting('modelType', e.target.value as 'lightning' | 'thunder')}
                className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4F45D]"
              >
                <option value="lightning">Lightning</option>
                <option value="thunder">Thunder</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-3">
                <Timer className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-white">Countdown</span>
                  <span className="text-[10px] text-gray-400">{settings.countdownSeconds}s before workout</span>
                </div>
              </div>
              <select
                value={settings.countdownSeconds}
                onChange={e => updateSetting('countdownSeconds', Number(e.target.value))}
                className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4F45D]"
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-white">Sensitivity</span>
                  <span className="text-[10px] text-gray-400">
                    {settings.confidenceThreshold === 0.3 ? 'Low (easier)' : settings.confidenceThreshold === 0.45 ? 'Medium' : 'High (precise)'}
                  </span>
                </div>
              </div>
              <select
                value={settings.confidenceThreshold}
                onChange={e => updateSetting('confidenceThreshold', Number(e.target.value))}
                className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#D4F45D]"
              >
                <option value={0.3}>Low</option>
                <option value={0.45}>Medium</option>
                <option value={0.6}>High</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-sm text-white">Angle Thresholds</span>
                  <span className="text-[10px] text-gray-400">Down {'<'} 90° | Up {'>'} 155°</span>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 bg-black/50 px-2 py-1 rounded">
                Default
              </div>
            </div>
          </div>
        </section>

        {/* Backup & Sync */}
        <section className="flex flex-col gap-1">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">Backup & Restore</h2>
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden p-4 flex flex-col gap-3">
            <p className="text-sm text-gray-400">Save your progress manually to your device to prevent data loss.</p>
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
                className="flex-1 py-2 bg-white/10 text-white rounded-lg text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-colors"
              >
                Export Data
              </button>
              <label className="flex-1 py-2 bg-white/10 text-white rounded-lg text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-colors flex items-center justify-center cursor-pointer">
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
                      } catch {
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
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">About</h2>
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <a 
              href="https://jaimin-prajapati-ds.github.io/push-up/privacy.html" 
              target="_blank" 
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 text-white">
                <Eye className="w-5 h-5" />
                <span className="text-sm">Privacy Policy</span>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
            <div className="p-4 flex items-center justify-between border-t border-white/10">
              <div className="flex items-center gap-3 text-white">
                <Smartphone className="w-5 h-5" />
                <span className="text-sm">Version</span>
              </div>
              <span className="text-[10px] text-gray-400">2.4.0</span>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="flex flex-col gap-1">
          <h2 className="text-[10px] font-bold text-red-500 uppercase tracking-widest px-1 mb-2">Danger Zone</h2>
          <div className="bg-[#111] border border-red-500/20 rounded-xl overflow-hidden">
            {!showReset ? (
              <button onClick={() => setShowReset(true)} className="p-4 flex items-center gap-3 w-full hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-500">Reset All Data</span>
              </button>
            ) : (
              <div className="p-4 flex flex-col gap-3">
                <p className="text-sm text-red-500">This will delete ALL your workout history and profile data. This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowReset(false)} className="flex-1 py-2 bg-white/10 text-white rounded-lg text-[10px] uppercase tracking-widest">Cancel</button>
                  <button onClick={handleReset} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-[10px] uppercase tracking-widest">Delete Everything</button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ToggleRow({ icon, label, value, onChange, border }: { icon: ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; border?: boolean }) {
  return (
    <div className={`p-4 flex items-center justify-between ${border ? 'border-t border-white/10' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-gray-400">{icon}</span>
        <span className="text-sm text-white">{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full transition-colors relative ${value ? 'bg-[#D4F45D]' : 'bg-white/20'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
