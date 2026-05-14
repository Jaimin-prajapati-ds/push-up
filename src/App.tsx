import React, { useState, useEffect } from 'react';
import { Dashboard } from './views/Dashboard';
import { Workout } from './views/Workout';
import { Summary } from './views/Summary';
import { Onboarding } from './views/Onboarding';
import PermissionScreen from './components/PermissionScreen';
import { Navigation, ViewType } from './components/Navigation';
import History from './views/History';
import Profile from './views/Profile';
import { PushPass } from './views/PushPass';
import { Settings } from './views/Settings';
import { completeOnboarding, hasCompletedOnboarding } from './lib/userProfile';
import { scheduleDailyReminder } from './lib/notifications';
import { initializeAdMob } from './lib/admob';
import { initializePurchases, isUserSubscriber } from './lib/subscription';
import { SplashScreen } from '@capacitor/splash-screen';
import { Camera } from '@capacitor/camera';
import { setAdProStatus } from './lib/admob';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
  const [lastWorkoutData, setLastWorkoutData] = useState<{ reps: number; duration: number } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initializeAdMob();
        const { showAppOpenAd } = await import('./lib/admob');
        await showAppOpenAd();
        await initializePurchases();
        await scheduleDailyReminder(); // Schedule notifications on launch
        
        const isDone = hasCompletedOnboarding();
        setOnboarded(isDone);
        
        // Check subscriber status
        const subStatus = await isUserSubscriber();
        setIsSubscriber(subStatus);
        setAdProStatus(subStatus);

        // Fix 1: Check permissions on launch
        const savedPerm = localStorage.getItem('pushchamp_cam_perm') === 'true';
        if (savedPerm) {
          setHasPermissions(true);
        } else {
          const perm = await Camera.checkPermissions();
          if (perm.camera === 'granted') {
            setHasPermissions(true);
            localStorage.setItem('pushchamp_cam_perm', 'true');
          } else {
            setHasPermissions(false);
          }
        }

        // Hide splash after logic
        setTimeout(() => {
          SplashScreen.hide();
          setIsInitializing(false);
        }, 300); // Super snappy launch
      } catch (e) {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setOnboarded(true);
  };

  const handleWorkoutStop = async (reps: number, duration: number) => {
    setLastWorkoutData({ reps, duration });
    setCurrentView('summary');
    
    // Earning: Show full-screen ad when workout ends
    try {
      const { showInterstitial } = await import('./lib/admob');
      await showInterstitial();
    } catch (e) {}
  };

  if (isInitializing) return null;

  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (hasPermissions === false || hasPermissions === null) {
    return <PermissionScreen onGranted={() => {
      setHasPermissions(true);
      localStorage.setItem('pushchamp_cam_perm', 'true');
    }} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onStartWorkout={() => setCurrentView('workout')} onOpenSettings={() => setCurrentView('settings')} />;
      case 'workout':
        return <Workout onStop={handleWorkoutStop} />;
      case 'history':
        return <History />;
      case 'profile':
        return <Profile onOpenSettings={() => setCurrentView('settings')} />;
      case 'pass':
        return <PushPass isSubscriber={isSubscriber} />;
      case 'summary':
        return <Summary 
          reps={lastWorkoutData?.reps || 0} 
          duration={lastWorkoutData?.duration || 0} 
          onClose={() => setCurrentView('dashboard')} 
        />;
      case 'settings':
        return <Settings onBack={() => setCurrentView('profile')} />;
      default:
        return <Dashboard onStartWorkout={() => setCurrentView('workout')} onOpenSettings={() => setCurrentView('settings')} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {renderView()}
      
      {/* Universal Navigation (Hidden during workout/summary) */}
      {!['workout', 'summary', 'onboarding'].includes(currentView) && (
        <Navigation currentView={currentView} onChangeView={setCurrentView} />
      )}
    </div>
  );
}
