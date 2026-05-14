import { useState } from "react";
import { Play, ChevronRight, Zap, Shield, Trophy, Flame } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Step {
  title: string;
  subtitle: string;
  description: string;
  icon: any;
}

const steps: Step[] = [
  {
    title: "AI-POWERED",
    subtitle: "COUNTING",
    description: "PushChamp uses MoveNet AI to detect your body and count push-ups automatically in real-time.",
    icon: <Zap className="w-12 h-12 text-[#D4F45D]" />
  },
  {
    title: "REAL-TIME",
    subtitle: "FORM CHECK",
    description: "Get instant feedback on your posture. No more fake reps—keep your back straight and hips aligned.",
    icon: <Shield className="w-12 h-12 text-[#D4F45D]" />
  },
  {
    title: "PUSH PASS",
    subtitle: "EVOLUTION",
    description: "Unlock 50 levels of rewards, earn XP, and compete in Season 1 to become the ultimate PushChamp.",
    icon: <Trophy className="w-12 h-12 text-[#D4F45D]" />
  }
];

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onComplete();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-white p-8 justify-between">
      {/* Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4F45D]/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Header Logo */}
      <div className="flex justify-center pt-8">
        <div className="w-12 h-12 bg-[#D4F45D] flex items-center justify-center rounded-sm rotate-[-10deg] shadow-[0_0_30px_rgba(212,244,93,0.4)]">
          <span className="text-black font-black italic text-2xl">P</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex justify-center">{steps[currentStep].icon}</div>
        
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-[0.3em] text-[#D4F45D] leading-none opacity-80 uppercase">
              {steps[currentStep].title}
            </h2>
            <h1 className="text-5xl font-heading italic leading-none">
              {steps[currentStep].subtitle}
            </h1>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === currentStep ? "w-8 bg-[#D4F45D]" : "w-2 bg-white/10"
              )} 
            />
          ))}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="space-y-4 pb-8">
        <button 
          onClick={handleNext}
          className="w-full py-5 bg-[#D4F45D] text-black font-black italic uppercase tracking-widest rounded-[2rem] flex items-center justify-center gap-2 shadow-[0_4px_30px_rgba(212,244,93,0.3)] active:scale-95 transition-transform"
        >
          {currentStep === steps.length - 1 ? "GET STARTED" : "NEXT"} <ChevronRight size={20} />
        </button>
        
        <button 
          onClick={onComplete}
          className="w-full py-4 text-gray-500 font-bold text-xs uppercase tracking-widest active:opacity-60 transition-opacity"
        >
          SKIP TUTORIAL
        </button>
      </div>
    </div>
  );
}
