import { useEffect, useRef, useState, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';

/**
 * Hook that detects when the user is in a proper standing pose before starting the workout.
 * Returns `isReady` (true when the pose is detected) and a `readyScore` (0‑1 confidence).
 */
export function useReadyPose(
  videoRef: React.RefObject<HTMLVideoElement>,
  isPaused: boolean,
  drawSkeleton: (poses: poseDetection.Pose[]) => void,
) {
  const [model, setModel] = useState<poseDetection.PoseDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [readyScore, setReadyScore] = useState(0);

  // Load MoveNet detector once
  useEffect(() => {
    const initModel = async () => {
      try {
        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
        setModel(detector);
      } catch (e) {
        console.error('Failed to load Pose Detection model', e);
      }
    };
    initModel();
  }, []);

  const checkStanding = useCallback(async (poses: poseDetection.Pose[]) => {
    if (!poses.length) return false;
    const p = poses[0];
    const leftKnee = p.keypoints.find(k => k.name === 'left_knee');
    const rightKnee = p.keypoints.find(k => k.name === 'right_knee');
    const leftAnkle = p.keypoints.find(k => k.name === 'left_ankle');
    const rightAnkle = p.keypoints.find(k => k.name === 'right_ankle');
    const nose = p.keypoints.find(k => k.name === 'nose');
    if (!leftKnee || !rightKnee || !leftAnkle || !rightAnkle || !nose) return false;

    const kneeDiff = Math.abs(leftKnee.y - rightKnee.y);
    const ankleDist = Math.abs(leftAnkle.x - rightAnkle.x);
    const torsoUpright = nose.y < leftKnee.y && nose.y < rightKnee.y;
    const score = kneeDiff < 30 && ankleDist > 100 && torsoUpright ? 1 : 0;
    setReadyScore(score);
    return score === 1;
  }, []);

  // Main detection loop
  useEffect(() => {
    if (!model || isPaused || !videoRef.current) return;
    let animId: number;
    const loop = async () => {
      const poses = await model.estimatePoses(videoRef.current as HTMLVideoElement);
      drawSkeleton(poses);
      const ready = await checkStanding(poses);
      setIsReady(ready);
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [model, isPaused, videoRef, drawSkeleton, checkStanding]);

  return { isReady, readyScore };
}
