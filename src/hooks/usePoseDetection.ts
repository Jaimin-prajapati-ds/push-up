import { useState, useCallback, useRef, useEffect } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';

export interface SmoothedKeypoint {
  x: number;
  y: number;
  score: number;
  name?: string;
}

export const usePoseDetection = () => {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);

  useEffect(() => {
    const initDetector = async () => {
      try {
        await tf.ready();
        // Force WebGL for speed, fallback to CPU
        await tf.setBackend('webgl');
        
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          multiPoseMaxDetections: 1,
          minPoseScore: 0.01, // ULTRA SENSITIVE: Catch any human presence
        };
        
        const newDetector = await poseDetection.createDetector(model, detectorConfig);
        detectorRef.current = newDetector;
        setDetector(newDetector);
        setIsReady(true);
      } catch (err) {
        console.error("TFJS Init Error:", err);
        // Fallback to CPU if WebGL fails
        await tf.setBackend('cpu');
        setIsReady(true);
      }
    };
    initDetector();

    return () => {
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
    };
  }, []);

  const processFrame = useCallback(async (video: HTMLVideoElement) => {
    if (!detectorRef.current) return null;
    
    try {
      // High-speed estimation with lower confidence per point
      const poses = await detectorRef.current.estimatePoses(video, {
        maxPoses: 1,
        flipHorizontal: false
      });
      
      return poses && poses.length > 0 ? poses[0] : null;
    } catch (e) {
      return null;
    }
  }, []);

  const validatePushupPosition = useCallback((pose: poseDetection.Pose): { isValid: boolean; feedback: string } => {
    const keypoints = pose.keypoints;
    const minConf = 0.05; // EXTREMELY AGGRESSIVE: Show joints even if barely visible

    const findKP = (name: string) => keypoints.find(kp => kp.name === name && (kp.score ?? 0) > minConf);
    
    const lS = findKP('left_shoulder');
    const rS = findKP('right_shoulder');
    const lH = findKP('left_hip');
    const rH = findKP('right_hip');

    // Feedback based on whatever is visible
    if (!lS && !rS) return { isValid: false, feedback: "MOVE INTO VIEW" };
    
    // Check for "Down" position depth
    if (lS && lH) {
      const hipHeight = lH.y;
      const shoulderHeight = lS.y;
      if (hipHeight < shoulderHeight - 50) return { isValid: false, feedback: "LOWER HIPS" };
    }

    return { isValid: true, feedback: "" };
  }, []);

  return {
    isReady,
    processFrame,
    validatePushupPosition,
    detector: detectorRef.current
  };
};
