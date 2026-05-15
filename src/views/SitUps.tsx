import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function SitUps({ onStop }: { onStop: (reps: number, durationSeconds: number) => void }) {
  const [reps, setReps] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  const startTimer = () => {
    setRunning(true);
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  };

  const stopWorkout = () => {
    setRunning(false);
    onStop(reps, seconds);
  };

  // Placeholder UI – replace with actual pose detection logic
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface p-4">
      <h2 className="text-2xl font-bold text-primary mb-4">Sit‑Ups
        {running && <span className="ml-2 text-sm text-on-surface-variant">(Recording…)</span>}
      </h2>
      <div className="text-xl mb-4">Reps: {reps}</div>
      <div className="text-xl mb-4">Time: {seconds}s</div>
      <button
        onClick={() => setReps((r) => r + 1)}
        className="px-4 py-2 bg-primary-fixed text-black rounded-lg mb-2 hover:bg-primary-fixed-dim"
        disabled={!running}
      >
        Add Rep
      </button>
      {!running ? (
        <button
          onClick={startTimer}
          className="px-4 py-2 bg-primary-fixed text-black rounded-lg hover:bg-primary-fixed-dim"
        >
          Start Sit‑Ups
        </button>
      ) : (
        <button
          onClick={stopWorkout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Finish
        </button>
      )}
    </div>
  );
}
