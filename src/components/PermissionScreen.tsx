// @ts-ignore
import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Camera } from '@capacitor/camera';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function PermissionScreen({ onGranted }: { onGranted: () => void }) {
  const [status, setStatus] = useState<'checking' | 'granted' | 'denied'>('checking');

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await (Camera as any).getPermissions();
        if (result.camera === 'granted') {
          setStatus('granted');
          onGranted();
        } else {
          const request = await (Camera as any).requestPermissions();
          if (request.camera === 'granted') {
            setStatus('granted');
            onGranted();
          } else {
            setStatus('denied');
          }
        }
      } catch (e) {
        console.error('Permission check error', e);
        setStatus('denied');
      }
    };
    checkPermission();
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <p className="text-on-surface">Checking camera permission...</p>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface">
        <AlertCircle className="w-12 h-12 text-primary" />
        <h2 className="mt-4 text-xl font-semibold text-primary">Camera Permission Required</h2>
        <p className="mt-2 text-center text-on-surface-variant">
          To start a workout, the app needs access to your camera for pose detection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-fixed text-black rounded-lg hover:bg-primary-fixed-dim"
        >
          Retry Permission
        </button>
      </div>
    );
  }

  return null;
}
