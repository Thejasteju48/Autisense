import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  VideoCameraIcon, 
  StopIcon, 
  CheckCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

/**
 * Video Recorder Component - Batch Processing Architecture
 * 
 * WORKFLOW:
 * 1. Frontend records complete video
 * 2. After recording stops, upload video file to backend
 * 3. Backend sends video to ML service
 * 4. ML service extracts frames at ~10 FPS
 * 5. ML processes frames through all feature extractors
 * 6. Returns comprehensive behavioral analysis
 * 
 * ADVANTAGES:
 * - No real-time streaming overhead
 * - Better frame extraction quality
 * - Simpler error handling
 * - Works like standalone Python scripts
 */

const VideoRecorder = ({ 
  screeningId, 
  duration = 180, // 3 minutes default
  onComplete 
}) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  
  const [selectedDuration, setSelectedDuration] = useState(duration);
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
  const MIN_DURATION = 60; // 1 minute recommended
  const MAX_DURATION = 300; // 5 minutes recommended
  
  // Duration options in seconds
  const DURATION_OPTIONS = [
    { value: 60, label: '1 minute' },
    { value: 120, label: '2 minutes' },
    { value: 180, label: '3 minutes (Recommended)' },
    { value: 240, label: '4 minutes' },
    { value: 300, label: '5 minutes' }
  ];

  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      console.log('✓ Webcam started');
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Failed to access webcam. Please ensure camera permissions are granted.');
    }
  }, []);

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('Webcam not initialized');
      return;
    }

    recordedChunksRef.current = [];
    setTimeElapsed(0);
    setTimeRemaining(selectedDuration);
    setError(null);

    // Create MediaRecorder
    const options = { mimeType: 'video/webm;codecs=vp9' };
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    } catch (e) {
      console.warn('VP9 not supported, falling back to VP8');
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    }

    // Collect video chunks
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    // Handle recording stop
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      console.log(`✓ Recording complete: ${blob.size} bytes`);
    };

    // Start recording
    mediaRecorderRef.current.start(1000); // Collect data every 1 second
    setIsRecording(true);

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        
        // Auto-stop at selected duration
        if (newTime >= selectedDuration) {
          console.log('⏱️ Maximum duration reached, auto-stopping recording');
          stopRecording();
        }
        
        return newTime;
      });
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    console.log(`📹 Recording started - Duration: ${selectedDuration}s`);
  }, [selectedDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setIsRecording(false);
    console.log(`⏹️  Recording stopped - Duration: ${timeElapsed}s`);
  }, [timeElapsed]);

  // Upload and process video
  const processVideo = useCallback(async () => {
    if (!recordedBlob) {
      setError('No video recorded');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('video', recordedBlob, `screening_${screeningId}_${Date.now()}.webm`);
      formData.append('screeningId', screeningId);
      formData.append('duration', timeElapsed.toString());
      formData.append('videoSource', 'live-recording');

      console.log('📤 Uploading live recorded video to backend...');

      // Upload video
      const response = await axios.post(
        `${BACKEND_URL}/api/screenings/${screeningId}/video`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      console.log('✓ Video processed successfully:', response.data);

      // Call onComplete with results
      if (onComplete) {
        onComplete({
          videoSource: 'live-recording',
          duration: timeElapsed,
          videoData: response.data.features || {}
        });
      }

      setIsProcessing(false);
    } catch (err) {
      console.error('Error processing video:', err);
      setError(`Failed to process video: ${err.response?.data?.message || err.message}`);
      setIsProcessing(false);
    }
  }, [recordedBlob, timeElapsed, screeningId, BACKEND_URL, onComplete]);

  // Initialize webcam on mount
  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [startWebcam, stopWebcam]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Duration Selector - Show only before recording starts */}
      {!isRecording && !recordedBlob && (
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Recording Duration
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedDuration(option.value);
                  setTimeRemaining(option.value);
                }}
                className={`
                  px-4 py-3 rounded-lg font-medium transition-all
                  ${selectedDuration === option.value
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            💡 We recommend 1-3 minutes for accurate behavioral analysis
          </p>
        </div>
      )}
      
      {/* Video Preview */}
      <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          className="w-full h-auto"
          playsInline
          muted
        />
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span className="font-bold">REC</span>
          </div>
        )}
        
        {/* Timer */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-full text-2xl font-mono font-bold">
            {isRecording ? formatTime(timeElapsed) : formatTime(timeRemaining)}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {recordedBlob && !isProcessing && (
        <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-medium">
            ✓ Video recorded successfully ({(recordedBlob.size / 1024 / 1024).toFixed(2)} MB)
          </p>
          <p className="text-green-700 text-sm mt-1">
            Duration: {formatTime(timeElapsed)} | Ready to process
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="mt-6 flex justify-center space-x-4">
        {!isRecording && !recordedBlob && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            className="flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <VideoCameraIcon className="w-6 h-6" />
            <span>Start Recording</span>
          </motion.button>
        )}

        {isRecording && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="flex items-center space-x-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <StopIcon className="w-6 h-6" />
            <span>Stop Recording</span>
          </motion.button>
        )}

        {recordedBlob && !isProcessing && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={processVideo}
            className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            <CloudArrowUpIcon className="w-6 h-6" />
            <span>Process Video</span>
          </motion.button>
        )}

        {isProcessing && (
          <div className="flex items-center space-x-3 bg-blue-50 border-2 border-blue-200 px-8 py-4 rounded-xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="text-blue-800 font-bold">
              {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Processing frames...'}
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">
          📹 Recording Instructions
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>• <strong>Recommended Duration:</strong> 1-5 minutes</li>
          <li>• <strong>Selected Duration:</strong> {formatTime(duration)}</li>
          <li>• Position child's face clearly in the frame</li>
          <li>• Ensure good lighting and stable camera</li>
          <li>• Video will be processed after recording completes</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoRecorder;
