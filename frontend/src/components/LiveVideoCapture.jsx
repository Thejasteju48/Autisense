import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { VideoCameraIcon, StopIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * LiveVideoCapture Component
 * 
 * Captures live webcam video for autism behavior analysis.
 * Sends frames to backend at regular intervals for ML processing.
 * Shows real-time video preview with visual overlays.
 */
const LiveVideoCapture = ({ 
  screeningId, 
  duration = 300, // 5 minutes default
  onComplete 
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [error, setError] = useState(null);
  const [frameCount, setFrameCount] = useState(0);

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
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Unable to access webcam. Please check permissions.');
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture frame and send to backend
  const captureFrame = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8);

    // Send to backend
    try {
      const { screeningAPI } = await import('../services/api');
      await screeningAPI.processFrame(screeningId, frameData);
      setFrameCount(prev => prev + 1);
      console.log(`📸 Frame ${frameCount + 1} captured and sent`);
    } catch (err) {
      console.error('Error sending frame:', err);
      // Continue capturing even if one frame fails
    }
  }, [screeningId, frameCount]);

  // Start recording
  const startRecording = useCallback(() => {
    setIsRecording(true);
    setTimeRemaining(duration);

    // Capture frames every 200ms (5 FPS)
    intervalRef.current = setInterval(() => {
      captureFrame();
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 200);
  }, [duration, captureFrame]);

  // Stop recording
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Notify parent component
    if (onComplete) {
      onComplete({ frameCount, duration: duration - timeRemaining });
    }
  }, [frameCount, duration, timeRemaining, onComplete]);

  // Initialize webcam on mount
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
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-purple-900 mb-3">
          Instructions for Parents
        </h3>
        <ul className="space-y-2 text-purple-800">
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            <span>Ensure the child is comfortably seated facing the screen</span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            <span>Call the child's name naturally to get their attention</span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            <span>Allow natural, free movement - do not force interactions</span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            <span>The session will run for approximately 5 minutes</span>
          </li>
        </ul>
      </motion.div>

      {/* Video Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl relative"
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
        />

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span className="font-semibold">Recording</span>
          </div>
        )}

        {/* Timer */}
        {isRecording && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg font-mono text-xl">
            {formatTime(timeRemaining)}
          </div>
        )}

        {/* Frame Counter */}
        {isRecording && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm">
            📸 {frameCount} frames captured
          </div>
        )}

        {/* Progress Bar */}
        {isRecording && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-700">
            <div
              className="h-full bg-purple-600 transition-all duration-1000"
              style={{ width: `${((duration - timeRemaining) / duration) * 100}%` }}
            />
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="flex justify-center mt-6 space-x-4">
        {!isRecording ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            className="flex items-center space-x-2 bg-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-purple-700 transition"
          >
            <VideoCameraIcon className="w-6 h-6" />
            <span>Start Recording</span>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="flex items-center space-x-2 bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-red-700 transition"
          >
            <StopIcon className="w-6 h-6" />
            <span>Stop Early</span>
          </motion.button>
        )}
      </div>

      {/* Status Messages */}
      {!isRecording && frameCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-6"
        >
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <CheckCircleIcon className="w-6 h-6" />
            <span className="font-semibold">Recording complete!</span>
          </div>
          <p className="text-gray-600 mt-2">
            Captured {frameCount} frames for analysis.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default LiveVideoCapture;
