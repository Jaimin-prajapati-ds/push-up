import { useState } from 'react';
import { getUserProfile, saveUserProfile, type UserProfile } from '@/src/lib/userProfile';
import { getLifetimeStats } from '@/src/lib/storage';
import { Instagram, Trophy, Dumbbell, Calendar, ChevronRight, Shield, ExternalLink, User, Heart } from 'lucide-react';

export function Profile() {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [editing, setEditing] = useState(false);
  const lifetime = getLifetimeStats();

  const handleSave = () => {
    saveUserProfile(profile);
    setEditing(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 pt-20">
      <header className="bg-surface/70 backdrop-blur-md border-b border-surface-container-highest fixed top-0 left-0 w-full z-50 flex justify-center items-center px-4 h-16">
        <h1 className="font-display-lg text-headline-lg italic uppercase text-primary tracking-wider">PROFILE</h1>
      </header>

      <main className="max-w-lg mx-auto px-5 w-full flex flex-col gap-6">
        {/* Avatar & Name */}
        <section className="flex flex-col items-center gap-4 py-4">
          <div className="w-24 h-24 rounded-full bg-surface-container-high border-2 border-primary-fixed flex items-center justify-center shadow-[0_0_20px_rgba(195,244,0,0.2)]">
            <User className="w-12 h-12 text-primary-fixed" />
          </div>
          {editing ? (
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your Name"
              className="bg-surface-container border border-surface-container-highest rounded-lg px-4 py-2 text-center text-on-surface font-headline-lg text-headline-lg-mobile uppercase focus:outline-none focus:border-primary-fixed w-full max-w-xs"
            />
          ) : (
            <h2 className="font-headline-lg text-headline-lg text-primary uppercase">
              {profile.name || 'Set Your Name'}
            </h2>
          )}
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className="font-label-caps text-label-caps text-primary-fixed uppercase tracking-widest border border-primary-fixed/30 px-4 py-1.5 rounded-full hover:bg-surface-container transition-colors"
          >
            {editing ? 'Save' : 'Edit Profile'}
          </button>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container border border-surface-container-highest rounded-xl p-4 flex flex-col items-center gap-1">
            <Trophy className="w-5 h-5 text-primary-fixed" />
            <span className="font-stats-xl text-headline-lg text-primary-container">{lifetime.maxReps}</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant text-center">MAX REPS</span>
          </div>
          <div className="bg-surface-container border border-surface-container-highest rounded-xl p-4 flex flex-col items-center gap-1">
            <Dumbbell className="w-5 h-5 text-primary-fixed" />
            <span className="font-stats-xl text-headline-lg text-primary-container">{lifetime.totalWorkouts}</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant text-center">WORKOUTS</span>
          </div>
          <div className="bg-surface-container border border-surface-container-highest rounded-xl p-4 flex flex-col items-center gap-1">
            <Calendar className="w-5 h-5 text-primary-fixed" />
            <span className="font-label-caps text-[11px] text-primary-container leading-tight mt-1">{lifetime.lastWorkoutDate}</span>
            <span className="font-label-caps text-label-caps text-on-surface-variant text-center">LAST</span>
          </div>
        </section>

        {/* Body Info (for accurate calories) */}
        {editing && (
          <section className="bg-surface-container border border-surface-container-highest rounded-xl p-4 flex flex-col gap-4">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Body Info (for accurate calories)</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Weight (kg)</label>
                <input type="number" value={profile.weightKg} onChange={e => setProfile({ ...profile, weightKg: Number(e.target.value) })} className="bg-surface border border-surface-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary-fixed" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Height (cm)</label>
                <input type="number" value={profile.heightCm} onChange={e => setProfile({ ...profile, heightCm: Number(e.target.value) })} className="bg-surface border border-surface-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary-fixed" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Age</label>
                <input type="number" value={profile.age} onChange={e => setProfile({ ...profile, age: Number(e.target.value) })} className="bg-surface border border-surface-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary-fixed" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-on-surface-variant">Weekly Goal</label>
                <input type="number" value={profile.weeklyGoalReps} onChange={e => setProfile({ ...profile, weeklyGoalReps: Number(e.target.value) })} className="bg-surface border border-surface-variant rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary-fixed" />
              </div>
            </div>
          </section>
        )}

        {/* Privacy Policy */}
        <section className="flex flex-col gap-2">
          <a href="#privacy" className="bg-surface-container border border-surface-container-highest rounded-xl p-4 flex items-center justify-between hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-on-surface-variant" />
              <span className="font-body-md text-on-surface">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-on-surface-variant" />
          </a>
        </section>

        {/* Developer */}
        <section className="bg-surface-container border border-surface-container-highest rounded-xl overflow-hidden">
          <div className="p-4 border-b border-surface-container-highest">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Developer</h3>
          </div>
          <a
            href="https://instagram.com/jai._.min2"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 flex items-center gap-4 hover:bg-surface-container-high transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-body-md text-on-surface font-semibold">@jai._.min2</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Follow on Instagram</span>
            </div>
            <ExternalLink className="w-5 h-5 text-on-surface-variant" />
          </a>
        </section>

        {/* App Info */}
        <section className="bg-surface-container border border-surface-container-highest rounded-xl p-4 flex flex-col items-center gap-2">
          <span className="font-display-lg text-headline-lg italic text-primary-fixed">PUSHCHAMP</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant">Version 1.0.0</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant">Made with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span className="font-label-caps text-label-caps text-on-surface-variant">by @jai._.min2</span>
          </div>
        </section>
      </main>
    </div>
  );
}
