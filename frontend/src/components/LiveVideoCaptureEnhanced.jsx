import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  VideoCameraIcon, 
  StopIcon, 
  CheckCircleIcon, 
  EyeIcon,
  HandRaisedIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

/**
 * Enhanced Live Video Capture Component
 * 
 * Features:
 * - Real-time webcam capture with landmark visualization
 * - Live behavioral indicator overlays (eye contact, gestures, expressions)
 * - Frame-by-frame processing with ML service
 * - Session-based video analysis
 * - Progress tracking and status indicators
 */

const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:8000';

const LiveVideoCapture = ({ 
  screeningId, 
  duration = 300, // 5 minutes default
  onComplete 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const sessionIdRef = useRef(`session_${Date.now()}`);
  const sessionEndedRef = useRef(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [error, setError] = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  // Real-time indicators
  const [indicators, setIndicators] = useState({
    eyeContact: false,
    gesture: false,
    expression: false,
    blinking: false
  });
  
  // Feature metrics (live updates)
  const [metrics, setMetrics] = useState({
    eyeContactRatio: 0,
    blinkRate: 0,
    gestureCount: 0
  });

  // Start ML session
  const startMLSession = useCallback(async () => {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/video/start-session`, {
        session_id: sessionIdRef.current
      });
      
      if (response.data.status === 'session_started') {
        setSessionStarted(true);
        console.log('✓ ML video session started:', sessionIdRef.current);
      }
    } catch (err) {
      console.error('Error starting ML session:', err);
    }
  }, []);

  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          startMLSession();
        };
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Unable to access webcam. Please check permissions.');
    }
  }, [startMLSession]);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Draw landmark overlays
  const drawLandmarkOverlays = useCallback((frameResult) => {
    if (!overlayCanvasRef.current || !videoRef.current) return;
    
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    // Match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear previous overlays
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw eye contact indicator
    if (frameResult.eye_contact?.eye_contact) {
      ctx.strokeStyle = '#10b981'; // Green
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height * 0.3, 40, 0, Math.PI * 2);
      ctx.stroke();
      
      // Eye icon effect
      ctx.fillStyle = '#10b98180';
      ctx.fill();
    }
    
    // Draw gesture indicator
    if (frameResult.gesture?.detected) {
      ctx.strokeStyle = '#8b5cf6'; // Purple
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(canvas.width * 0.15, canvas.height * 0.7, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw expression indicator
    if (frameResult.facial_expression?.detected) {
      ctx.strokeStyle = '#f59e0b'; // Amber
      ctx.lineWidth = 2;
      ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, 
                      canvas.width * 0.6, canvas.height * 0.6);
    }
    
  }, []);

  // Process frame with ML service
  const captureAndProcessFrame = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current || !sessionStarted) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    const timestamp = Date.now() / 1000;

    try {
      // Send to ML service for processing
      const response = await axios.post(`${ML_SERVICE_URL}/video/process-frame`, {
        session_id: sessionIdRef.current,
        frame: frameData,
        timestamp: timestamp
      });

      const result = response.data;
      
      // Update indicators
      setIndicators({
        eyeContact: result.eye_contact?.eye_contact || false,
        gesture: result.gesture?.detected || false,
        expression: result.facial_expression?.detected || false,
        blinking: result.blink?.is_blink || false
      });
      
      // Draw overlays
      drawLandmarkOverlays(result);
      
      setFrameCount(prev => prev + 1);
      
      // Update metrics every 10 frames
      if (frameCount % 10 === 0) {
        updateMetrics();
      }
      
    } catch (err) {
      console.error('Error processing frame:', err);
    }
  }, [sessionStarted, frameCount, drawLandmarkOverlays]);

  // Update live metrics
  const updateMetrics = useCallback(async () => {
    // Don't try to update if session already ended
    if (sessionEndedRef.current) return;
    
    try {
      const response = await axios.get(
        `${ML_SERVICE_URL}/video/session-status/${sessionIdRef.current}`
      );
      
      const status = response.data;
      
      setMetrics({
        eyeContactRatio: (status.features_extracted?.gaze_frames || 0) / (frameCount || 1),
        blinkRate: status.features_extracted?.blinks_detected || 0,
        gestureCount: status.features_extracted?.gestures_detected || 0
      });
      
    } catch (err) {
      // Only log if session hasn't ended (404 is expected after end)
      if (!sessionEndedRef.current) {
        console.error('Error updating metrics:', err);
      }
    }
  }, [frameCount]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!sessionStarted) {
      setError('Please wait for session to initialize...');
      return;
    }
    
    setIsRecording(true);
    setTimeRemaining(duration);
    setFrameCount(0);

    // Capture frames every 200ms (5 FPS)
    intervalRef.current = setInterval(() => {
      captureAndProcessFrame();
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 200);
  }, [duration, captureAndProcessFrame, sessionStarted]);

  // Stop recording and finalize session
  const stopRecording = useCallback(async () => {
    // Prevent duplicate calls
    if (sessionEndedRef.current) {
      console.log('Session already ended, skipping stopRecording');
      return;
    }
    
    sessionEndedRef.current = true;
    setIsRecording(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Calculate actual duration and use current frame count from state
    const actualDuration = duration - timeRemaining;
    const actualFrameCount = frameCount;
    
    console.log('Stopping recording:', { actualFrameCount, actualDuration });

    // End ML session and get summary
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/video/end-session`, {
        session_id: sessionIdRef.current,
        duration_seconds: actualDuration
      });
      
      const summary = response.data.summary;
      console.log('✓ Session summary received:', summary);
      console.log('✓ Video features extracted:', {
        eyeContact: summary.features?.eye_contact_ratio,
        blinkRate: summary.features?.blink_rate_per_minute,
        headMovement: summary.features?.head_movement_rate,
        gestures: summary.features?.gesture_frequency_per_minute,
        expressions: summary.features?.facial_expression_variability
      });
      
      // Notify parent with complete results - include full summary structure
      if (onComplete) {
        onComplete({ 
          frameCount: summary.total_frames_processed || actualFrameCount, 
          duration: summary.session_duration_seconds || actualDuration,
          videoFeatures: {
            ...summary.features,
            interpretation: summary.interpretation,
            session_duration_seconds: summary.session_duration_seconds,
            total_frames_processed: summary.total_frames_processed
          }
        });
      }
      
    } catch (err) {
      // Only log actual errors, not 404s from already ended sessions
      if (err.response?.status !== 404) {
        console.error('Error ending session:', err);
      }
      
      // Still notify parent even if summary fails - with empty features
      if (onComplete) {
        onComplete({ 
          frameCount: actualFrameCount, 
          duration: actualDuration,
          videoFeatures: {} 
        });
      }
    }
  }, [duration, timeRemaining, frameCount, onComplete]);

  // Initialize on mount
  useEffect(() => {
    startWebcam();

    return () => {
      stopWebcam();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startWebcam, stopWebcam]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <p className="text-gray-600">
          Please ensure webcam access is enabled in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Video Preview with Overlays */}
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full"
        />
        
        {/* Landmark Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Live Indicators Overlay */}
        <div className="absolute top-4 left-4 space-y-2">
          <AnimatePresence>
            {indicators.eyeContact && (
              <motion.div
                key="eye-contact"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-2 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg"
              >
                <EyeIcon className="w-5 h-5" />
                <span className="text-sm font-semibold">Eye Contact</span>
              </motion.div>
            )}
            
            {indicators.gesture && (
              <motion.div
                key="gesture"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-2 bg-purple-500 text-white px-3 py-2 rounded-lg shadow-lg"
              >
                <HandRaisedIcon className="w-5 h-5" />
                <span className="text-sm font-semibold">Gesture Detected</span>
              </motion.div>
            )}
            
            {indicators.expression && (
              <motion.div
                key="expression"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-2 bg-amber-500 text-white px-3 py-2 rounded-lg shadow-lg"
              >
                <FaceSmileIcon className="w-5 h-5" />
                <span className="text-sm font-semibold">Expression</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg"
            >
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="text-sm font-bold">RECORDING</span>
            </motion.div>
          </div>
        )}
        
        {/* Timer */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-full text-2xl font-mono font-bold">
            {formatTime(timeRemaining)}
          </div>
        </div>
        
        {/* Session Status */}
        {!sessionStarted && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p className="text-lg">Initializing session...</p>
            </div>
          </div>
        )}
      </div>

      {/* Live Metrics Dashboard */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
          <div className="flex items-center justify-between">
            <EyeIcon className="w-6 h-6 text-green-600" />
            <span className="text-2xl font-bold text-green-700">
              {(metrics.eyeContactRatio * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-green-600 mt-2">Eye Contact</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <HandRaisedIcon className="w-6 h-6 text-purple-600" />
            <span className="text-2xl font-bold text-purple-700">
              {metrics.gestureCount}
            </span>
          </div>
          <p className="text-sm text-purple-600 mt-2">Gestures</p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <VideoCameraIcon className="w-6 h-6 text-blue-600" />
            <span className="text-2xl font-bold text-blue-700">
              {frameCount}
            </span>
          </div>
          <p className="text-sm text-blue-600 mt-2">Frames</p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex justify-center space-x-4">
        {!isRecording ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            disabled={!sessionStarted}
            className="flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <VideoCameraIcon className="w-6 h-6" />
            <span>Start Recording</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="flex items-center space-x-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <StopIcon className="w-6 h-6" />
            <span>Stop Recording</span>
          </motion.button>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">
          📹 Recording Instructions
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Position the child facing the camera, about 2-3 feet away</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Ensure good lighting on the child's face</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Allow natural behavior - no need to prompt specific actions</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Green/purple indicators show detected behaviors in real-time</span>
          </li>
          <li className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Recording will automatically stop after {formatTime(duration)}</span>
          </li>
        </ul>
      </div>

      {/* Progress Bar */}
      {isRecording && (
        <div className="mt-6">
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((duration - timeRemaining) / duration) * 100}%` }}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full"
            />
          </div>
          <p className="text-center text-gray-600 mt-2">
            {Math.round(((duration - timeRemaining) / duration) * 100)}% Complete
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveVideoCapture;
