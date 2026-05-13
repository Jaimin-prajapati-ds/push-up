/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './views/Dashboard';
import { Workout } from './views/Workout';
import { History } from './views/History';
import { Summary } from './views/Summary';
import { Profile } from './views/Profile';
import { Settings } from './views/Settings';
import { Onboarding } from './views/Onboarding';
import { hasCompletedOnboarding } from './lib/userProfile';
import { initializeAdMob } from './lib/admob';
import { initializePurchases } from './lib/subscription';
import { Capacitor } from '@capacitor/core';
import { setupDailyReminder } from './lib/notifications';
import { SplashScreen } from '@capacitor/splash-screen';

type ViewType = "dashboard" | "workout" | "history" | "summary" | "profile" | "settings";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [lastWorkout, setLastWorkout] = useState<{reps: number, durationSeconds: number}>({reps: 0, durationSeconds: 0});
  const [showOnboarding, setShowOnboarding] = useState(!hasCompletedOnboarding());

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide({ fadeOutDuration: 500 });
      setupDailyReminder();
    }

    initializeAdMob();
    
    initializePurchases();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard onStartWorkout={() => setCurrentView("workout")} onOpenSettings={() => setCurrentView("settings")} />;
      case "workout":
        return <Workout onStop={(reps, durationSeconds) => {
          setLastWorkout({ reps, durationSeconds });
          setCurrentView("summary");
        }} />;
      case "summary":
        return <Summary 
          reps={lastWorkout.reps} 
          durationSeconds={lastWorkout.durationSeconds} 
          onDone={() => setCurrentView("dashboard")} 
        />;
      case "history":
        return <History onOpenSettings={() => setCurrentView("settings")} />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings onBack={() => setCurrentView("dashboard")} />;
      default:
        return <Dashboard onStartWorkout={() => setCurrentView("workout")} onOpenSettings={() => setCurrentView("settings")} />;
    }
  };

  return (
    <>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      {renderView()}
      {currentView !== "workout" && currentView !== "summary" && currentView !== "settings" && (
        <Navigation 
          currentView={currentView as any} 
          onChangeView={setCurrentView as any} 
        />
      )}
    </>
  );
}
