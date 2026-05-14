import React from 'react';
import { User, Settings, Shield, Award, LogOut, ChevronRight, Zap, Target } from 'lucide-react';
import { getLifetimeStats, getTotalLifetimeReps, getUserLevel } from '@/src/lib/storage';
import { getUserProfile } from '@/src/lib/userProfile';

export default function Profile({ onOpenSettings }: { onOpenSettings: () => void }) {
  const stats = getLifetimeStats();
  const totalReps = getTotalLifetimeReps();
  const userLevel = getUserLevel(totalReps);
  const profile = getUserProfile();

  return (
    <div className="flex flex-col min-h-screen bg-[#000] p-8 pb-32">
      {/* Header */}
      <div className="mt-12 flex items-center justify-between mb-12">
        <div className="space-y-1">
          <h1 className="text-5xl font-heading italic leading-none text-white uppercase">{profile.name || "CHAMP"}</h1>
          <p className="text-[#D4F45D] font-bold text-[10px] tracking-[0.3em] uppercase opacity-60">Elite Member</p>
        </div>
        <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center overflow-hidden">
          <User className="text-white/20" size={40} />
        </div>
      </div>

      {/* Level Stats */}
      <div className="bg-[#D4F45D] p-8 rounded-[3rem] mb-8 shadow-[0_20px_50px_rgba(212,244,93,0.2)]">
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 bg-black rounded-2xl">
            <Award className="text-[#D4F45D]" size={24} />
          </div>
          <span className="text-black font-black italic text-xl tracking-tighter">LVL {userLevel.levelNumber}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-black/60 font-bold text-[10px] tracking-widest uppercase">XP Progress</span>
            <span className="text-black font-black italic text-sm">{totalReps} / {userLevel.nextLevelReps} REPS</span>
          </div>
          <div className="h-3 w-full bg-black/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black rounded-full transition-all duration-1000" 
              style={{ width: `${(totalReps / userLevel.nextLevelReps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <ProfileStat label="Total Reps" value={totalReps} icon={<Zap size={16} />} />
        <ProfileStat label="Workouts" value={stats.totalWorkouts} icon={<Target size={16} />} />
      </div>

      {/* Menu Options */}
      <div className="space-y-3">
        <MenuOption icon={<Settings />} title="App Settings" onClick={onOpenSettings} />
        <MenuOption icon={<Shield />} title="Privacy & Security" />
        <MenuOption icon={<Award />} title="My Achievements" color="#D4F45D" />
        <div className="pt-4">
          <button className="w-full py-5 rounded-[2rem] bg-white/5 border border-white/5 text-red-500 font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-3">
            <LogOut size={16} /> SIGN OUT
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, value, icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem]">
      <div className="text-[#D4F45D] mb-3 opacity-60">{icon}</div>
      <p className="text-2xl font-heading italic text-white leading-none mb-1">{value}</p>
      <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest leading-none">{label}</p>
    </div>
  );
}

function MenuOption({ icon, title, onClick, color }: { icon: any; title: string; onClick?: () => void; color?: string }) {
  return (
    <button 
      onClick={onClick}
      className="w-full p-6 bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between group active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-5">
        <div style={{ color: color || 'white' }} className="opacity-40 group-hover:opacity-100 transition-opacity">
          {React.cloneElement(icon as React.ReactElement, { size: 20 } as any)}
        </div>
        <span className="font-bold text-sm text-white/80 group-hover:text-white transition-colors">{title}</span>
      </div>
      <ChevronRight size={18} className="text-white/10 group-hover:text-[#D4F45D] transition-colors" />
    </button>
  );
}
