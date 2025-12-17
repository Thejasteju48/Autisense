import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Camera Session Hook for Live Interaction
 * 
 * CRITICAL PRIVACY RULES:
 * - Camera is active ONLY during interaction sessions
 * - NO video recording
 * - NO frame storage
 * - Frames sent live to ML service for immediate processing
 * - Camera stops immediately after session
 */

const useCameraSession = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  /**
   * Start camera session
   */
  const startSession = useCallback(async () => {
    try {
      setError(null);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please allow camera permissions.');
      return false;
    }
  }, []);

  /**
   * Stop camera session
   */
  const stopSession = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsActive(false);
  }, []);

  /**
   * Capture current frame as base64
   */
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  /**
   * Send frames at interval to ML service
   * @param {Function} onFrame - Callback with frame data
   * @param {number} intervalMs - Milliseconds between frames (default 200ms = 5 fps)
   */
  const startFrameCapture = useCallback((onFrame, intervalMs = 200) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame && onFrame) {
        onFrame(frame);
      }
    }, intervalMs);
  }, [captureFrame]);

  /**
   * Stop frame capture
   */
  const stopFrameCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    isActive,
    error,
    videoRef,
    canvasRef,
    startSession,
    stopSession,
    captureFrame,
    startFrameCapture,
    stopFrameCapture
  };
};

export default useCameraSession;
