import { useState, useCallback, useRef, useEffect } from 'react';

export interface SmoothKeypoint {
  x: number;
  y: number;
  score: number;
  name?: string;
}

interface PoseDetector {
  estimatePoses: (input: HTMLVideoElement, config?: { maxPoses?: number; flipHorizontal?: boolean }) => Promise<any[]>;
  dispose: () => void;
}

export interface BodyAnalysis {
  leftArm: { angle: number; confidence: number; stage: 'up' | 'down' | 'unknown' };
  rightArm: { angle: number; confidence: number; stage: 'up' | 'down' | 'unknown' };
  bodyAngle: number;
  backStraight: boolean;
  hipsLowered: boolean;
  avgAngle: number;
  visibility: {
    shoulders: boolean;
    elbows: boolean;
    wrists: boolean;
    hips: boolean;
    knees: boolean;
    ankles: boolean;
  };
}

function calculateAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

const SMOOTHING_FACTOR = 0.6;

function smoothValue(prev: number, current: number, factor = SMOOTHING_FACTOR): number {
  if (prev === 0) return current;
  return prev * factor + current * (1 - factor);
}

export const usePoseDetection = () => {
  const [detector, setDetector] = useState<PoseDetector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const detectorRef = useRef<PoseDetector | null>(null);
  const smoothedAnglesRef = useRef({ left: 180, right: 180, body: 180 });
  const prevKeypointsRef = useRef<Map<string, SmoothKeypoint>>(new Map());

  useEffect(() => {
    const initDetector = async () => {
      try {
        const [poseDetection, tf] = await Promise.all([
          import('@tensorflow-models/pose-detection'),
          import('@tensorflow/tfjs'),
        ]);
        await import('@tensorflow/tfjs-backend-webgl');
        await import('@tensorflow/tfjs-backend-cpu');

        await tf.ready();
        await tf.setBackend('webgl');

        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          multiPoseMaxDetections: 1,
          minPoseScore: 0.01,
        };

        const newDetector = await poseDetection.createDetector(model, detectorConfig);
        detectorRef.current = newDetector as unknown as PoseDetector;
        setDetector(detectorRef.current);
        setIsReady(true);
      } catch (err) {
        console.error("TFJS Init Error:", err);
        try {
          const tf = await import('@tensorflow/tfjs');
          await import('@tensorflow/tfjs-backend-cpu');
          await tf.ready();
          await tf.setBackend('cpu');
        } catch {}
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
      const poses = await detectorRef.current.estimatePoses(video, {
        maxPoses: 1,
        flipHorizontal: false
      });
      return poses && poses.length > 0 ? poses[0] : null;
    } catch (e) {
      return null;
    }
  }, []);

  const analyzePose = useCallback((pose: any, confidenceThreshold = 0.4): BodyAnalysis | null => {
    if (!pose || !pose.keypoints) return null;

    const keypoints = pose.keypoints;
    const findKP = (name: string) => keypoints.find((kp: any) => kp.name === name);

    const lS = findKP('left_shoulder');
    const lE = findKP('left_elbow');
    const lW = findKP('left_wrist');
    const lH = findKP('left_hip');
    const lK = findKP('left_knee');
    const lA = findKP('left_ankle');

    const rS = findKP('right_shoulder');
    const rE = findKP('right_elbow');
    const rW = findKP('right_wrist');
    const rH = findKP('right_hip');
    const rK = findKP('right_knee');
    const rA = findKP('right_ankle');

    const visibility = {
      shoulders: (lS?.score || 0) > confidenceThreshold || (rS?.score || 0) > confidenceThreshold,
      elbows: (lE?.score || 0) > confidenceThreshold || (rE?.score || 0) > confidenceThreshold,
      wrists: (lW?.score || 0) > confidenceThreshold || (rW?.score || 0) > confidenceThreshold,
      hips: (lH?.score || 0) > confidenceThreshold || (rH?.score || 0) > confidenceThreshold,
      knees: (lK?.score || 0) > confidenceThreshold || (rK?.score || 0) > confidenceThreshold,
      ankles: (lA?.score || 0) > confidenceThreshold || (rA?.score || 0) > confidenceThreshold,
    };

    let leftAngle = 180, rightAngle = 180;
    let leftConf = 0, rightConf = 0;

    if (lS && lE && lW && lS.score > 0.3 && lE.score > 0.3 && lW.score > 0.3) {
      leftAngle = calculateAngle(lS, lE, lW);
      leftConf = (lS.score + lE.score + lW.score) / 3;
    }
    if (rS && rE && rW && rS.score > 0.3 && rE.score > 0.3 && rW.score > 0.3) {
      rightAngle = calculateAngle(rS, rE, rW);
      rightConf = (rS.score + rE.score + rW.score) / 3;
    }

    smoothedAnglesRef.current.left = smoothValue(smoothedAnglesRef.current.left, leftAngle);
    smoothedAnglesRef.current.right = smoothValue(smoothedAnglesRef.current.right, rightAngle);

    const smoothedLeft = smoothedAnglesRef.current.left;
    const smoothedRight = smoothedAnglesRef.current.right;

    const hasLeft = leftConf > 0;
    const hasRight = rightConf > 0;

    let avgAngle: number;
    if (hasLeft && hasRight) {
      avgAngle = (smoothedLeft + smoothedRight) / 2;
    } else if (hasLeft) {
      avgAngle = smoothedLeft;
    } else if (hasRight) {
      avgAngle = smoothedRight;
    } else {
      avgAngle = 180;
    }

    const leftStage = leftConf > 0.3 ? (smoothedLeft < 90 ? 'down' : smoothedLeft > 155 ? 'up' : 'unknown') : 'unknown';
    const rightStage = rightConf > 0.3 ? (smoothedRight < 90 ? 'down' : smoothedRight > 155 ? 'up' : 'unknown') : 'unknown';

    let bodyAngle = 180;
    let backStraight = true;
    let hipsLowered = true;

    const S = (lS?.score || 0) > (rS?.score || 0) ? lS : rS;
    const H = (lH?.score || 0) > (rH?.score || 0) ? lH : rH;
    const K = (lK?.score || 0) > (rK?.score || 0) ? lK : rK;

    if (S && H && K && S.score > 0.3 && H.score > 0.3 && K.score > 0.3) {
      bodyAngle = calculateAngle(S, H, K);
      smoothedAnglesRef.current.body = smoothValue(smoothedAnglesRef.current.body, bodyAngle);
      backStraight = smoothedAnglesRef.current.body >= 150;
      hipsLowered = !(H.y < S.y - 30);
    }

    return {
      leftArm: { angle: smoothedLeft, confidence: leftConf, stage: leftStage },
      rightArm: { angle: smoothedRight, confidence: rightConf, stage: rightStage },
      bodyAngle: smoothedAnglesRef.current.body,
      backStraight,
      hipsLowered,
      avgAngle,
      visibility,
    };
  }, []);

  return {
    isReady,
    processFrame,
    analyzePose,
    detector: detectorRef.current
  };
};
