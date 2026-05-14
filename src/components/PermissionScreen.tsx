import React, { useState, useEffect, useCallback } from 'react';
import { Camera as CameraIcon, Bell, ShieldCheck, ChevronRight, Lock, CheckCircle2, RefreshCw } from 'lucide-react';
import { Camera } from '@capacitor/camera';
import { LocalNotifications } from '@capacitor/local-notifications';
import { cn } from '@/src/lib/utils';
import { App } from '@capacitor/app';

export default function PermissionScreen({ onGranted }: { onGranted: () => void }) {
  const [cameraStatus, setCameraStatus] = useState<string>('prompt');
  const [notifStatus, setNotifStatus] = useState<string>('prompt');
  const [isChecking, setIsChecking] = useState(true);

  const checkPermissions = useCallback(async () => {
    try {
      const c = await Camera.checkPermissions();
      const n = await LocalNotifications.checkPermissions();
      
      setCameraStatus(c.camera);
      setNotifStatus(n.display);

      // AUTO-PROCEED: If camera is already granted, don't wait for button click
      if (c.camera === 'granted') {
        setTimeout(() => onGranted(), 300);
      }
    } catch (e) {
      console.error('Permission check failed', e);
    } finally {
      setIsChecking(false);
    }
  }, [onGranted]);

  useEffect(() => {
    checkPermissions();

    // Heartbeat to ensure UI stays in sync
    const interval = setInterval(checkPermissions, 1000);

    // DEEP FIX: Re-check when app returns to foreground (useful if user went to settings)
    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkPermissions();
      }
    });

    return () => {
      clearInterval(interval);
      listener.then(l => l.remove());
    };
  }, [checkPermissions]);

  const requestCamera = async () => {
    try {
      const res = await Camera.requestPermissions();
      console.log('Camera Request Result:', res.camera);
      setCameraStatus(res.camera);
      
      // DEEP FIX: Force immediate state update and check
      if (res.camera === 'granted') {
        setCameraStatus('granted');
        setTimeout(() => onGranted(), 500);
      }
    } catch (e) {
      console.error('Camera request failed', e);
    }
  };

  const requestNotifs = async () => {
    try {
      const res = await LocalNotifications.requestPermissions();
      setNotifStatus(res.display);
    } catch (e) {
      console.error(e);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
        <div className="w-10 h-10 border-4 border-[#D4F45D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allMainGranted = cameraStatus === 'granted';

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="mt-12 mb-12 space-y-4">
        <div className="w-20 h-20 bg-[#D4F45D]/10 rounded-[2rem] flex items-center justify-center border border-[#D4F45D]/20">
          <ShieldCheck className="w-12 h-12 text-[#D4F45D]" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-heading italic leading-none">SECURE</h1>
          <h2 className="text-xl font-bold tracking-[0.2em] text-[#D4F45D] opacity-80 uppercase leading-none">Permissions</h2>
        </div>
      </div>

      <div className="space-y-4">
        <PermissionCard 
          icon={<CameraIcon size={24} />}
          title="Camera Access"
          desc="Used for AI pose detection."
          status={cameraStatus}
          onClick={requestCamera}
        />
        
        <PermissionCard 
          icon={<Bell size={24} />}
          title="Notifications"
          desc="Workout reminders."
          status={notifStatus}
          onClick={requestNotifs}
        />
      </div>

      <div className="mt-auto pb-12 flex flex-col gap-4">
        {!allMainGranted && (
          <button 
            onClick={checkPermissions}
            className="flex items-center justify-center gap-2 text-[#D4F45D] text-[10px] font-black uppercase tracking-widest opacity-60 active:opacity-100"
          >
            <RefreshCw size={12} /> Sync Status
          </button>
        )}
        
        <button 
          disabled={!allMainGranted}
          onClick={onGranted}
          className={cn(
            "w-full py-6 rounded-[2rem] font-black italic uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3",
            allMainGranted 
              ? "bg-[#D4F45D] text-black shadow-[0_4px_30px_rgba(212,244,93,0.3)]" 
              : "bg-white/5 text-gray-700 border border-white/5 cursor-not-allowed"
          )}
        >
          {allMainGranted ? "CONTINUE" : "ALLOW CAMERA TO START"}
        </button>
      </div>
    </div>
  );
}

function PermissionCard({ icon, title, desc, status, onClick }: { icon: any; title: string; desc: string; status: string; onClick: () => void }) {
  const isGranted = status === 'granted';
  
  return (
    <div 
      onClick={!isGranted ? onClick : undefined}
      className={cn(
        "p-5 rounded-[2.5rem] border transition-all duration-300 active:scale-[0.98]",
        isGranted ? "bg-[#D4F45D]/10 border-[#D4F45D]/30 shadow-[0_0_20px_rgba(212,244,93,0.05)]" : "bg-white/5 border-white/10"
      )}
    >
      <div className="flex items-center gap-5">
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center",
          isGranted ? "bg-[#D4F45D] text-black" : "bg-white/10 text-gray-500"
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className={cn("font-bold text-lg leading-none mb-1", isGranted ? "text-white" : "text-gray-500")}>{title}</h3>
          <p className="text-[11px] text-gray-500 font-medium leading-tight">{desc}</p>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isGranted ? "bg-[#D4F45D]/20 text-[#D4F45D]" : "bg-white/10 text-gray-800"
        )}>
          {isGranted ? <CheckCircle2 size={18} /> : <Lock size={16} />}
        </div>
      </div>
    </div>
  );
}
