import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

interface SmoothedKeypoint {
  x: number;
  y: number;
  score: number;
  name: string;
}

const SMOOTHING_FACTOR = 0.6;
const MIN_REP_INTERVAL_MS = 500;
const MILESTONE_REPS = [10, 25, 50, 75, 100, 150, 200];

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isPaused: boolean,
  onPose?: (poses: poseDetection.Pose[]) => void,
  onRep?: (count: number) => void,
  onMilestone?: (count: number) => void
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [reps, setReps] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string>('');
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number>(0);
  const onPoseRef = useRef(onPose);
  const onRepRef = useRef(onRep);
  const onMilestoneRef = useRef(onMilestone);
  
  const isDownRef = useRef<boolean>(false);
  const lastRepTimeRef = useRef<number>(0);
  const repsRef = useRef<number>(0);
  const smoothedKeypointsRef = useRef<Map<string, SmoothedKeypoint>>(new Map());

  useEffect(() => {
    onPoseRef.current = onPose;
  }, [onPose]);

  useEffect(() => {
    onRepRef.current = onRep;
  }, [onRep]);

  useEffect(() => {
    onMilestoneRef.current = onMilestone;
  }, [onMilestone]);

  // Exponential Moving Average smoothing for keypoints
  const smoothKeypoint = useCallback((kp: poseDetection.Keypoint): SmoothedKeypoint => {
    const name = kp.name || '';
    const existing = smoothedKeypointsRef.current.get(name);
    
    if (!existing || (kp.score && kp.score < 0.2)) {
      const smoothed = { x: kp.x, y: kp.y, score: kp.score || 0, name };
      smoothedKeypointsRef.current.set(name, smoothed);
      return smoothed;
    }

    const smoothed = {
      x: SMOOTHING_FACTOR * kp.x + (1 - SMOOTHING_FACTOR) * existing.x,
      y: SMOOTHING_FACTOR * kp.y + (1 - SMOOTHING_FACTOR) * existing.y,
      score: kp.score || 0,
      name,
    };
    smoothedKeypointsRef.current.set(name, smoothed);
    return smoothed;
  }, []);

  const calculateAngle = useCallback((A: SmoothedKeypoint, B: SmoothedKeypoint, C: SmoothedKeypoint): number => {
    const radians = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) {
      angle = 360.0 - angle;
    }
    return angle;
  }, []);

  // Validate user is in a pushup-like position
  const validatePushupPosition = useCallback((smoothedMap: Map<string, SmoothedKeypoint>, minConf: number): boolean => {
    const leftShoulder = smoothedMap.get('left_shoulder');
    const rightShoulder = smoothedMap.get('right_shoulder');
    const leftHip = smoothedMap.get('left_hip');
    const rightHip = smoothedMap.get('right_hip');

    // At minimum, we need shoulders visible
    const shoulderOk = (leftShoulder && leftShoulder.score > minConf) || 
                       (rightShoulder && rightShoulder.score > minConf);
    
    if (!shoulderOk) return false;

    // If hips are visible, check body alignment (should be roughly horizontal)
    if (leftHip && leftHip.score > minConf && leftShoulder && leftShoulder.score > minConf) {
      const verticalDiff = Math.abs(leftShoulder.y - leftHip.y);
      const horizontalDiff = Math.abs(leftShoulder.x - leftHip.x);
      // Body should be more horizontal than vertical for pushup position
      if (horizontalDiff > 0 && verticalDiff / horizontalDiff > 2.5) {
        setFormFeedback('LIE FLAT — BODY TOO UPRIGHT');
        return false;
      }
    }
    if (rightHip && rightHip.score > minConf && rightShoulder && rightShoulder.score > minConf) {
      const verticalDiff = Math.abs(rightShoulder.y - rightHip.y);
      const horizontalDiff = Math.abs(rightShoulder.x - rightHip.x);
      if (horizontalDiff > 0 && verticalDiff / horizontalDiff > 2.5) {
        setFormFeedback('LIE FLAT — BODY TOO UPRIGHT');
        return false;
      }
    }

    return true;
  }, []);

  useEffect(() => {
    async function init() {
      await tf.ready();
      
      // Get model type from settings
      let modelType = poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING;
      try {
        const settings = localStorage.getItem('pushchamp_settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          if (parsed.modelType === 'thunder') {
            modelType = poseDetection.movenet.modelType.SINGLEPOSE_THUNDER;
          }
        }
      } catch {}

      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType }
      );
      detectorRef.current = detector;
      setIsLoaded(true);
    }
    init();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !videoRef.current) return;

    const video = videoRef.current;

    // Get confidence threshold from settings
    let minConfidence = 0.45;
    try {
      const settings = localStorage.getItem('pushchamp_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.confidenceThreshold) {
          minConfidence = parsed.confidenceThreshold;
        }
      }
    } catch {}

    const detectPose = async () => {
      if (isPaused) {
        requestRef.current = requestAnimationFrame(detectPose);
        return;
      }

      if (detectorRef.current && video.readyState === 4) {
        const poses = await detectorRef.current.estimatePoses(video);
        
        if (poses.length > 0) {
          const pose = poses[0];
          
          // Smooth all keypoints
          const smoothedMap = new Map<string, SmoothedKeypoint>();
          pose.keypoints.forEach(kp => {
            const smoothed = smoothKeypoint(kp);
            smoothedMap.set(smoothed.name, smoothed);
          });

          // Get arm keypoints (smoothed)
          const leftShoulder = smoothedMap.get('left_shoulder');
          const leftElbow = smoothedMap.get('left_elbow');
          const leftWrist = smoothedMap.get('left_wrist');
          const rightShoulder = smoothedMap.get('right_shoulder');
          const rightElbow = smoothedMap.get('right_elbow');
          const rightWrist = smoothedMap.get('right_wrist');

          let currentAngle: number | null = null;
          let currentVisible = false;

          // Prefer the side with higher average confidence
          const leftAvgScore = ((leftShoulder?.score || 0) + (leftElbow?.score || 0) + (leftWrist?.score || 0)) / 3;
          const rightAvgScore = ((rightShoulder?.score || 0) + (rightElbow?.score || 0) + (rightWrist?.score || 0)) / 3;

          if (leftAvgScore > minConfidence && leftAvgScore >= rightAvgScore) {
            currentAngle = calculateAngle(leftShoulder!, leftElbow!, leftWrist!);
            currentVisible = true;
          } else if (rightAvgScore > minConfidence) {
            currentAngle = calculateAngle(rightShoulder!, rightElbow!, rightWrist!);
            currentVisible = true;
          }

          // Validate pushup position
          if (currentVisible) {
            const isValidPosition = validatePushupPosition(smoothedMap, minConfidence);
            if (!isValidPosition) {
              // Still show as visible but don't count reps
              setIsVisible(true);
              if (onPoseRef.current) onPoseRef.current(poses);
              requestRef.current = requestAnimationFrame(detectPose);
              return;
            }
            setFormFeedback('');
          }

          setIsVisible(currentVisible);

          if (currentVisible && currentAngle !== null) {
            const now = Date.now();

            // Down: elbow angle < 90°
            if (currentAngle < 90) {
              if (!isDownRef.current) {
                setIsDown(true);
                isDownRef.current = true;
              }
            } 
            // Up: elbow angle > 150° + debounce
            else if (currentAngle > 150) {
              if (isDownRef.current && (now - lastRepTimeRef.current >= MIN_REP_INTERVAL_MS)) {
                setIsDown(false);
                isDownRef.current = false;
                lastRepTimeRef.current = now;
                
                const newReps = repsRef.current + 1;
                repsRef.current = newReps;
                setReps(newReps);
                
                // Notify rep callback
                if (onRepRef.current) onRepRef.current(newReps);
                
                // Check milestones
                if (MILESTONE_REPS.includes(newReps) && onMilestoneRef.current) {
                  onMilestoneRef.current(newReps);
                }
              }
            }
          }
        } else {
          setIsVisible(false);
        }
        
        if (onPoseRef.current) {
          onPoseRef.current(poses);
        }
      }
      requestRef.current = requestAnimationFrame(detectPose);
    };

    detectPose();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isLoaded, videoRef, isPaused, smoothKeypoint, calculateAngle, validatePushupPosition]);

  return { isLoaded, reps, setReps, isDown, isVisible, formFeedback };
}
