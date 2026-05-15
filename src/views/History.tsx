import React from 'react';
import { Clock, ChevronRight, Dumbbell } from 'lucide-react';
import { getHistory } from '@/src/lib/storage';

export default function History() {
  const history = getHistory().reverse(); // Show latest first

  return (
    <div className="flex flex-col min-h-screen bg-[#000] p-8 pb-32">
      <div className="mt-12 mb-10 space-y-2">
        <h1 className="text-5xl font-heading italic leading-none text-white">HISTORY</h1>
        <p className="text-[#D4F45D] font-bold text-[10px] tracking-[0.3em] uppercase opacity-60">Your Legacy</p>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-20">
            <Clock size={48} className="mb-4" />
            <p className="font-bold tracking-widest text-xs uppercase">No Workouts Yet</p>
          </div>
        ) : (
          history.map((session, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-[#D4F45D]/10 rounded-2xl flex items-center justify-center border border-[#D4F45D]/20">
                  <Dumbbell className="text-[#D4F45D]" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white leading-none mb-1">{session.totalReps} REPS</h3>
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                    {new Date(session.date).toLocaleDateString()} • {session.durationMinutes}m
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#D4F45D] transition-colors">
                <ChevronRight size={18} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
