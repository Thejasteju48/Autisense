import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoryCharacter from '../RoryCharacter';
import useCameraSession from '../../hooks/useCameraSession';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Eye Contact Game - "Look at Rory"
 * 
 * PURPOSE: Elicit natural eye contact behavior
 * 
 * HOW IT WORKS:
 * 1. Rory appears and looks away
 * 2. Rory turns toward camera
 * 3. Rory calls child's name softly  
 * 4. Rory pauses and waits
 * 5. System observes: face orientation, eye openness, duration
 * 
 * NO PRESSURE - Child can ignore Rory, still valid data
 */

const EyeContactGameV2 = ({ childName, sessionId, onComplete }) => {
  const [gameState, setGameState] = useState('intro'); // intro, playing, processing, complete
  const [roryState, setRoryState] = useState('idle');
  const [framesCollected, setFramesCollected] = useState(0);
  const [result, setResult] = useState(null);
  const [duration, setDuration] = useState(30); // 30 seconds
  
  const {
    isActive,
    error,
    videoRef,
    canvasRef,
    startSession,
    stopSession,
    startFrameCapture,
    stopFrameCapture
  } = useCameraSession();

  const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';

  /**
   * Start the game
   */
  const startGame = async () => {
    const success = await startSession();
    if (success) {
      setGameState('playing');
      runRorySequence();
      collectFrames();
      
      // Auto-complete after duration
      setTimeout(() => {
        completeGame();
      }, duration * 1000);
    }
  };

  /**
   * Rory behavior sequence
   */
  const runRorySequence = () => {
    const sequence = [
      { state: 'idle', duration: 2000 },
      { state: 'wait', duration: 3000 },
      { state: 'wave', duration: 2000 },
      { state: 'wait', duration: 3000 },
      { state: 'react', duration: 1500 }
    ];

    let delay = 0;
    sequence.forEach(step => {
      setTimeout(() => {
        setRoryState(step.state);
      }, delay);
      delay += step.duration;
    });

    // Repeat sequence
    const totalDuration = sequence.reduce((sum, step) => sum + step.duration, 0);
    const repeatInterval = setInterval(() => {
      delay = 0;
      sequence.forEach(step => {
        setTimeout(() => {
          setRoryState(step.state);
        }, delay);
        delay += step.duration;
      });
    }, totalDuration);

    // Store interval for cleanup
    return () => clearInterval(repeatInterval);
  };

  /**
   * Collect frames and send to ML service
   */
  const collectFrames = () => {
    const frames = [];
    let count = 0;

    startFrameCapture((frameData) => {
      frames.push(frameData);
      count++;
      setFramesCollected(count);

      // Send batch every 10 frames
      if (frames.length >= 10) {
        sendFrameBatch(frames.splice(0, 10));
      }
    }, 200); // 5 frames per second
  };

  /**
   * Send frame batch to ML service
   */
  const sendFrameBatch = async (frames) => {
    try {
      await axios.post(`${ML_SERVICE_URL}/analyze/eye-contact-batch`, {
        sessionId,
        frames
      });
    } catch (error) {
      console.error('Error sending frames:', error);
    }
  };

  /**
   * Complete game and get results
   */
  const completeGame = async () => {
    stopFrameCapture();
    setGameState('processing');

    try {
      // Get final results from ML service
      const response = await axios.get(`${ML_SERVICE_URL}/analyze/eye-contact-result/${sessionId}`);
      const data = response.data;

      setResult(data);
      setGameState('complete');
      
      // Notify parent component
      if (onComplete) {
        onComplete(data);
      }
    } catch (error) {
      console.error('Error getting results:', error);
      toast.error('Unable to process results');
    } finally {
      stopSession();
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopSession();
      stopFrameCapture();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Intro Screen */}
        <AnimatePresence>
          {gameState === 'intro' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="bg-white rounded-3xl shadow-xl p-12 mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  👀 Look at Rory Game
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Rory wants to say hi! Let's see how {childName} interacts with Rory.
                </p>
                
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
                  <p className="text-gray-700">
                    <span className="font-semibold">Instructions for parent:</span><br />
                    Position your child comfortably in front of the camera.<br />
                    Rory will try to get {childName}'s attention naturally.<br />
                    Let {childName} respond naturally - no need to force anything.
                  </p>
                </div>

                <button
                  onClick={startGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold py-4 px-12 rounded-full transition-colors shadow-lg"
                >
                  Start Game
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playing Screen */}
        <AnimatePresence>
          {gameState === 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-8"
            >
              {/* Rory Side */}
              <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center">
                <RoryCharacter 
                  state={roryState} 
                  childName={childName}
                />
                
                <div className="mt-6 text-center">
                  <div className="text-sm text-gray-500 mb-2">Time Remaining</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.max(0, duration - Math.floor(framesCollected / 5))}s
                  </div>
                </div>
              </div>

              {/* Camera Side (Hidden from child, visible for parent) */}
              <div className="bg-gray-900 rounded-3xl shadow-xl p-8 flex flex-col">
                <div className="text-white text-sm mb-4 text-center">
                  Camera View (for parent only)
                </div>
                <div className="relative flex-1 bg-black rounded-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover mirror"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Recording indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-semibold">ANALYZING</span>
                  </div>

                  {/* Frame counter */}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                    Frames: {framesCollected}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing Screen */}
        <AnimatePresence>
          {gameState === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="bg-white rounded-3xl shadow-xl p-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Processing Results...
                </h3>
                <p className="text-gray-600">
                  Analyzing {childName}'s interaction with Rory
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete Screen */}
        <AnimatePresence>
          {gameState === 'complete' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="bg-white rounded-3xl shadow-xl p-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-4">
                  Game Complete!
                </h3>
                
                <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                  <div className="text-left space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Eye Contact Score:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {(result.value * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Interpretation:</span>
                      <span className="font-semibold text-gray-800">{result.interpretation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Confidence:</span>
                      <span className="font-semibold text-gray-800">
                        {(result.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">
                  Great job! Moving to the next activity...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={startGame}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default EyeContactGameV2;
