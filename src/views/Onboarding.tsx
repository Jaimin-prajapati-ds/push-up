import { useState } from 'react';
import { completeOnboarding, saveUserProfile } from '@/src/lib/userProfile';
import { ChevronRight, Camera, Smartphone, Dumbbell, Zap } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Zap,
    title: 'AI-POWERED COUNTING',
    description: 'PushChamp uses MoveNet AI to detect your body and count push-ups automatically in real-time.',
    tip: 'No manual counting — just push.',
  },
  {
    icon: Smartphone,
    title: 'PHONE PLACEMENT',
    description: 'Place your phone on the floor, leaning against a water bottle or wall. The front camera should face you from the side.',
    tip: 'Side angle = best accuracy.',
  },
  {
    icon: Camera,
    title: 'CAMERA ACCESS',
    description: 'PushChamp needs your front camera to detect your body. All processing happens ON your device — no data leaves your phone.',
    tip: 'Your privacy is 100% protected.',
  },
  {
    icon: Dumbbell,
    title: 'SET YOUR WEIGHT',
    description: 'Enter your weight for accurate calorie and volume calculations.',
    tip: 'You can change this anytime in Profile.',
    hasWeightInput: true,
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [weight, setWeight] = useState(70);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  const handleNext = () => {
    if (isLast) {
      saveUserProfile({ weightKg: weight });
      completeOnboarding();
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-between p-6">
      {/* Progress dots */}
      <div className="flex items-center gap-2 pt-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary-fixed' : i < step ? 'w-4 bg-primary-fixed/50' : 'w-4 bg-surface-container-highest'}`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-col items-center text-center gap-6 max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-surface-container border border-primary-fixed/30 flex items-center justify-center shadow-[0_0_30px_rgba(195,244,0,0.15)]">
          <Icon className="w-10 h-10 text-primary-fixed" />
        </div>
        
        <h2 className="font-display-lg text-display-lg text-primary uppercase leading-tight">{current.title}</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">{current.description}</p>
        
        <div className="bg-surface-container border border-primary-fixed/20 rounded-xl px-4 py-2">
          <span className="font-label-caps text-label-caps text-primary-fixed uppercase tracking-widest">💡 {current.tip}</span>
        </div>

        {current.hasWeightInput && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <div className="flex items-center gap-4">
              <button onClick={() => setWeight(w => Math.max(30, w - 1))} className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-xl font-bold active:scale-90 transition-transform">−</button>
              <div className="flex items-baseline gap-1">
                <span className="font-stats-xl text-stats-xl text-primary-container">{weight}</span>
                <span className="font-body-md text-on-surface-variant">kg</span>
              </div>
              <button onClick={() => setWeight(w => Math.min(200, w + 1))} className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center text-xl font-bold active:scale-90 transition-transform">+</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="w-full max-w-sm flex flex-col gap-3 pb-4">
        <button
          onClick={handleNext}
          className="w-full bg-primary-container text-black font-display-lg text-headline-lg uppercase py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(195,244,0,0.2)] active:scale-95 transition-transform leading-none"
        >
          {isLast ? 'START PUSHING' : 'NEXT'}
          <ChevronRight className="w-6 h-6" />
        </button>
        {!isLast && (
          <button
            onClick={() => { completeOnboarding(); onComplete(); }}
            className="w-full text-on-surface-variant font-label-caps text-label-caps uppercase tracking-widest py-3 hover:text-primary transition-colors"
          >
            Skip Tutorial
          </button>
        )}
      </div>
    </div>
  );
}
