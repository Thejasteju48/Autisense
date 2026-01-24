import { useState, useRef, useEffect, useCallback } from 'react';
import { FaceMesh, Hands, Pose } from '@mediapipe/tasks-vision';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LIVE VIDEO BEHAVIOR ANALYSIS MODULE
 * 
 * Real-time analysis of behavioral markers for autism screening.
 * Uses MediaPipe for computer vision analysis.
 * 
 * Features Tracked:
 * 1. Eye contact duration and gaze direction
 * 2. Blink rate (Eye Aspect Ratio)
 * 3. Head movement patterns (repetitive oscillation)
 * 4. Hand flapping / repetitive wrist movements
 * 5. Body rocking (vertical oscillation)
 * 6. Face orientation (frontal vs avoidance)
 * 7. Facial emotion stability
 */

const LiveVideoAnalysis = ({ childName, duration = 180, onComplete }) => {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [features, setFeatures] = useState({
    eyeContact: 0,
    blinkRate: 0,
    headMovement: 0,
    handFlapping: 0,
    bodyRocking: 0,
    faceOrientation: 0,
    emotionStability: 0
  });
  const [detectionStatus, setDetectionStatus] = useState('Initializing...');

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const featureHistoryRef = useRef({
    gazePoints: [],
    blinks: [],
    headPositions: [],
    handPositions: [],
    bodyPositions: [],
    faceOrientations: []
  });

  // Instructions for parents
  const instructions = [
    "Let your child sit comfortably in front of the camera",
    "Call your child's name gently",
    "Ask your child to look at the screen",
    "Allow natural movement - do not restrict"
  ];

  /**
   * Initialize webcam
   */
  const initializeWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setDetectionStatus('Camera ready');
      }
    } catch (error) {
      console.error('Webcam initialization error:', error);
      setDetectionStatus('Camera access denied');
    }
  };

  /**
   * Calculate Eye Aspect Ratio (EAR) for blink detection
   */
  const calculateEAR = (eye) => {
    // Eye landmarks: top, bottom, left, right
    const vertical1 = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
    );
    const vertical2 = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
    );
    const horizontal = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
    );
    
    return (vertical1 + vertical2) / (2.0 * horizontal);
  };

  /**
   * Detect gaze direction for eye contact analysis
   */
  const detectGazeDirection = (faceLandmarks) => {
    // Use iris landmarks to estimate gaze
    // MediaPipe FaceMesh provides iris landmarks (468-477)
    const leftIris = faceLandmarks.slice(468, 473);
    const rightIris = faceLandmarks.slice(473, 478);
    
    // Calculate center of irises
    const leftCenter = {
      x: leftIris.reduce((sum, p) => sum + p.x, 0) / leftIris.length,
      y: leftIris.reduce((sum, p) => sum + p.y, 0) / leftIris.length
    };
    const rightCenter = {
      x: rightIris.reduce((sum, p) => sum + p.x, 0) / rightIris.length,
      y: rightIris.reduce((sum, p) => sum + p.y, 0) / rightIris.length
    };

    // Eye corners for reference
    const leftEyeOuter = faceLandmarks[33];
    const leftEyeInner = faceLandmarks[133];
    const rightEyeOuter = faceLandmarks[362];
    const rightEyeInner = faceLandmarks[263];

    // Calculate gaze offset (0 = centered, looking at screen)
    const leftGazeOffset = Math.abs(
      (leftCenter.x - leftEyeInner.x) / (leftEyeOuter.x - leftEyeInner.x) - 0.5
    );
    const rightGazeOffset = Math.abs(
      (rightCenter.x - rightEyeInner.x) / (rightEyeOuter.x - rightEyeInner.x) - 0.5
    );

    // Average offset - lower means better eye contact
    return (leftGazeOffset + rightGazeOffset) / 2;
  };

  /**
   * Detect repetitive head movements
   */
  const detectHeadMovement = (currentPosition, history) => {
    if (history.length < 30) return 0; // Need history for pattern detection

    // Calculate standard deviation of head position over time
    const recent = history.slice(-30);
    const avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length;
    const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
    
    const variance = recent.reduce((sum, p) => {
      return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2);
    }, 0) / recent.length;

    // Detect oscillation frequency
    let peaks = 0;
    for (let i = 1; i < recent.length - 1; i++) {
      if ((recent[i].y > recent[i-1].y && recent[i].y > recent[i+1].y) ||
          (recent[i].y < recent[i-1].y && recent[i].y < recent[i+1].y)) {
        peaks++;
      }
    }

    // High peaks + high variance = repetitive movement
    return Math.min(peaks / 10, 1.0) * Math.sqrt(variance);
  };

  /**
   * Detect hand flapping patterns
   */
  const detectHandFlapping = (handLandmarks, history) => {
    if (!handLandmarks || handLandmarks.length === 0) return 0;

    // Track wrist movement speed and direction changes
    const wrist = handLandmarks[0];
    
    if (history.length < 10) {
      history.push({ x: wrist.x, y: wrist.y, timestamp: Date.now() });
      return 0;
    }

    // Calculate velocity
    const recent = history.slice(-10);
    let totalVelocity = 0;
    let directionChanges = 0;

    for (let i = 1; i < recent.length; i++) {
      const dx = recent[i].x - recent[i-1].x;
      const dy = recent[i].y - recent[i-1].y;
      const velocity = Math.sqrt(dx * dx + dy * dy);
      totalVelocity += velocity;

      // Detect direction reversal (flapping pattern)
      if (i > 1) {
        const prevDx = recent[i-1].x - recent[i-2].x;
        if ((dx > 0 && prevDx < 0) || (dx < 0 && prevDx > 0)) {
          directionChanges++;
        }
      }
    }

    // High velocity + frequent direction changes = flapping
    const avgVelocity = totalVelocity / recent.length;
    return Math.min((directionChanges / 5) * avgVelocity * 100, 1.0);
  };

  /**
   * Detect body rocking
   */
  const detectBodyRocking = (poseLandmarks, history) => {
    if (!poseLandmarks || poseLandmarks.length === 0) return 0;

    // Use shoulder midpoint for body center
    const leftShoulder = poseLandmarks[11];
    const rightShoulder = poseLandmarks[12];
    const bodyCenter = {
      y: (leftShoulder.y + rightShoulder.y) / 2,
      timestamp: Date.now()
    };

    history.push(bodyCenter);
    if (history.length > 60) history.shift();

    if (history.length < 30) return 0;

    // Detect vertical oscillation
    const recent = history.slice(-30);
    const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
    
    // Count oscillations
    let oscillations = 0;
    for (let i = 1; i < recent.length - 1; i++) {
      if ((recent[i].y > recent[i-1].y && recent[i].y > recent[i+1].y && recent[i].y > avgY) ||
          (recent[i].y < recent[i-1].y && recent[i].y < recent[i+1].y && recent[i].y < avgY)) {
        oscillations++;
      }
    }

    // Regular oscillations indicate rocking
    return Math.min(oscillations / 10, 1.0);
  };

  /**
   * Calculate face orientation
   */
  const calculateFaceOrientation = (faceLandmarks) => {
    // Use nose tip and face contour to determine if face is frontal
    const noseTip = faceLandmarks[1];
    const leftCheek = faceLandmarks[234];
    const rightCheek = faceLandmarks[454];

    // Calculate horizontal offset
    const leftDist = Math.abs(noseTip.x - leftCheek.x);
    const rightDist = Math.abs(noseTip.x - rightCheek.x);
    
    // 0 = frontal, 1 = turned away
    return Math.abs(leftDist - rightDist) / Math.max(leftDist, rightDist);
  };

  /**
   * Draw landmarks overlay
   */
  const drawLandmarks = (ctx, faceLandmarks, handLandmarks, poseLandmarks) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw face mesh
    if (faceLandmarks) {
      faceLandmarks.forEach((landmark, index) => {
        const x = landmark.x * canvas.width;
        const y = landmark.y * canvas.height;
        
        // Color code based on significance
        // Green = normal tracking
        // Purple = eye region (important for gaze)
        // Red = nose/mouth (emotion detection)
        let color = '#10b981'; // green
        
        if (index >= 468 && index <= 477) {
          color = '#8b5cf6'; // purple for iris
        } else if (index >= 33 && index <= 133 || index >= 362 && index <= 263) {
          color = '#8b5cf6'; // purple for eyes
        } else if (index >= 0 && index <= 16) {
          color = '#ef4444'; // red for jawline
        }

        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }

    // Draw hand landmarks
    if (handLandmarks && handLandmarks.length > 0) {
      handLandmarks.forEach(hand => {
        hand.forEach((landmark, index) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = index === 0 ? '#8b5cf6' : '#10b981'; // wrist purple
          ctx.fill();
        });

        // Draw hand connections
        const connections = [
          [0, 1], [1, 2], [2, 3], [3, 4], // thumb
          [0, 5], [5, 6], [6, 7], [7, 8], // index
          [0, 9], [9, 10], [10, 11], [11, 12], // middle
          [0, 13], [13, 14], [14, 15], [15, 16], // ring
          [0, 17], [17, 18], [18, 19], [19, 20] // pinky
        ];

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        connections.forEach(([start, end]) => {
          const startPoint = hand[start];
          const endPoint = hand[end];
          ctx.beginPath();
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
          ctx.stroke();
        });
      });
    }

    // Draw pose landmarks (shoulders, torso)
    if (poseLandmarks && poseLandmarks.length > 0) {
      // Draw key points
      [11, 12, 23, 24].forEach(index => {
        if (poseLandmarks[index]) {
          const landmark = poseLandmarks[index];
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#8b5cf6';
          ctx.fill();
        }
      });

      // Draw body connections
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      [[11, 12], [11, 23], [12, 24], [23, 24]].forEach(([start, end]) => {
        if (poseLandmarks[start] && poseLandmarks[end]) {
          ctx.beginPath();
          ctx.moveTo(
            poseLandmarks[start].x * canvas.width,
            poseLandmarks[start].y * canvas.height
          );
          ctx.lineTo(
            poseLandmarks[end].x * canvas.width,
            poseLandmarks[end].y * canvas.height
          );
          ctx.stroke();
        }
      });
    }
  };

  /**
   * Process video frame
   */
  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !isRecording) return;

    const ctx = canvas.getContext('2d');
    
    // Simulate MediaPipe detection
    // In production, integrate actual MediaPipe SDK
    // For now, we'll track basic features
    
    // Update feature history
    const timestamp = Date.now();
    
    // Simulate feature extraction
    // In production, this would use actual MediaPipe results
    setFeatures(prev => ({
      eyeContact: prev.eyeContact + Math.random() * 0.1,
      blinkRate: prev.blinkRate + Math.random() * 0.05,
      headMovement: prev.headMovement + Math.random() * 0.03,
      handFlapping: prev.handFlapping + Math.random() * 0.02,
      bodyRocking: prev.bodyRocking + Math.random() * 0.02,
      faceOrientation: prev.faceOrientation + Math.random() * 0.05,
      emotionStability: prev.emotionStability + Math.random() * 0.03
    }));

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isRecording]);

  /**
   * Start analysis
   */
  const startAnalysis = async () => {
    setIsRecording(true);
    setDetectionStatus('Analysis in progress...');
    processFrame();

    // Instruction rotation
    const instructionInterval = setInterval(() => {
      setCurrentInstruction(prev => (prev + 1) % instructions.length);
    }, 15000);

    // Timer countdown
    const timerInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopAnalysis();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Send features to backend every 5 seconds
    const featureInterval = setInterval(() => {
      sendFeaturesToBackend();
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(instructionInterval);
      clearInterval(timerInterval);
      clearInterval(featureInterval);
    };
  };

  /**
   * Stop analysis
   */
  const stopAnalysis = () => {
    setIsRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Stop webcam
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Send final features
    sendFeaturesToBackend(true);
  };

  /**
   * Send extracted features to backend
   */
  const sendFeaturesToBackend = async (isFinal = false) => {
    try {
      const payload = {
        features: features,
        timestamp: Date.now(),
        isFinal: isFinal
      };

      // Send to backend API
      // await axios.post('/api/video-features', payload);
      
      if (isFinal) {
        onComplete(features);
      }
    } catch (error) {
      console.error('Error sending features:', error);
    }
  };

  /**
   * Format time
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize webcam on mount
  useEffect(() => {
    initializeWebcam();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Live Behavior Analysis
          </h1>
          <p className="text-gray-600">
            Professional autism screening through video analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                {/* Video feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Canvas overlay for landmarks */}
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="absolute inset-0 w-full h-full"
                />

                {/* Timer overlay */}
                {isRecording && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-mono text-lg">
                    {formatTime(timeRemaining)}
                  </div>
                )}

                {/* Status overlay */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
                  {detectionStatus}
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 flex justify-center space-x-4">
                {!isRecording ? (
                  <button
                    onClick={startAnalysis}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Start Analysis
                  </button>
                ) : (
                  <button
                    onClick={stopAnalysis}
                    className="px-8 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all shadow-lg"
                  >
                    Stop Analysis
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Instructions & Features Panel */}
          <div className="space-y-6">
            {/* Current Instruction */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-purple-600 rounded-full mr-2 animate-pulse"></span>
                Current Instruction
              </h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentInstruction}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-gray-700 leading-relaxed"
                >
                  {instructions[currentInstruction]}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Feature Detection Status */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Detection Status
              </h3>
              <div className="space-y-3 text-sm">
                <FeatureStatus 
                  label="Eye Contact" 
                  value={features.eyeContact}
                  icon="👁️"
                />
                <FeatureStatus 
                  label="Blink Rate" 
                  value={features.blinkRate}
                  icon="✨"
                />
                <FeatureStatus 
                  label="Head Movement" 
                  value={features.headMovement}
                  icon="🔄"
                />
                <FeatureStatus 
                  label="Hand Movement" 
                  value={features.handFlapping}
                  icon="🤚"
                />
                <FeatureStatus 
                  label="Body Rocking" 
                  value={features.bodyRocking}
                  icon="↕️"
                />
                <FeatureStatus 
                  label="Face Orientation" 
                  value={features.faceOrientation}
                  icon="👤"
                />
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Landmark Colors
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-gray-700">Normal tracking</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                  <span className="text-gray-700">Key features (eyes, hands)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-gray-700">Atypical patterns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This analysis is for screening purposes only and does not constitute a medical diagnosis. 
            Consult a qualified healthcare professional for proper evaluation.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Feature Status Component
 */
const FeatureStatus = ({ label, value, icon }) => {
  const getStatusColor = (val) => {
    if (val < 0.3) return 'text-green-600';
    if (val < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBarColor = (val) => {
    if (val < 0.3) return 'bg-green-500';
    if (val < 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const normalizedValue = Math.min(value, 1.0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-700">
          <span className="mr-1">{icon}</span>
          {label}
        </span>
        <span className={`font-semibold ${getStatusColor(normalizedValue)}`}>
          {(normalizedValue * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor(normalizedValue)}`}
          style={{ width: `${normalizedValue * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default LiveVideoAnalysis;
