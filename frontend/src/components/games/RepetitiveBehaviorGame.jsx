import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCameraSession from '../../hooks/useCameraSession';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Free Play Activity - "Repetitive Behavior Observation"
 * 
 * PURPOSE: Observe natural repetitive behaviors/stimming
 * 
 * HOW IT WORKS:
 * 1. Calm environment with floating shapes
 * 2. Minimal Rory presence (quiet corner)
 * 3. Gentle music/sounds
 * 4. Child can move freely
 * 5. System observes: wrist/head oscillation, repetitive patterns
 * 
 * NO INSTRUCTIONS - Most natural observation period
 */

const RepetitiveBehaviorGame = ({ childName, sessionId, onComplete }) => {
  const [gameState, setGameState] = useState('intro');
  const [result, setResult] = useState(null);
  const [duration, setDuration] = useState(40); // Longer duration for natural behavior
  const [timeRemaining, setTimeRemaining] = useState(duration);
  
  const {
    videoRef,
    canvasRef,
    startSession,
    stopSession,
    startFrameCapture,
    stopFrameCapture,
    error
  } = useCameraSession();

  const ML_SERVICE_URL = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';

  const startGame = async () => {
    const success = await startSession();
    if (success) {
      setGameState('playing');
      collectFrames();
      
      // Countdown timer
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            completeGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const collectFrames = () => {
    const frames = [];

    startFrameCapture((frameData) => {
      frames.push(frameData);

      if (frames.length >= 10) {
        sendFrameBatch(frames.splice(0, 10));
      }
    }, 200);
  };

  const sendFrameBatch = async (frames) => {
    try {
      await axios.post(`${ML_SERVICE_URL}/analyze/repetitive-batch`, {
        sessionId,
        frames
      });
    } catch (error) {
      console.error('Error sending frames:', error);
    }
  };

  const completeGame = async () => {
    stopFrameCapture();
    setGameState('processing');

    try {
      const response = await axios.get(`${ML_SERVICE_URL}/analyze/repetitive-result/${sessionId}`);
      setResult(response.data);
      setGameState('complete');
      
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error) {
      console.error('Error getting results:', error);
      toast.error('Unable to process results');
    } finally {
      stopSession();
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
      stopFrameCapture();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <AnimatePresence>
          {gameState === 'intro' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="bg-white rounded-3xl shadow-xl p-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  🎈 Free Play Time
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Time for {childName} to relax and play freely!
                </p>
                
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 mb-8">
                  <p className="text-gray-700">
                    <span className="font-semibold">Instructions:</span><br />
                    Let {childName} move and play naturally.<br />
                    No specific actions needed - just be comfortable!<br />
                    Floating shapes will appear for visual interest.
                  </p>
                </div>

                <button
                  onClick={startGame}
                  className="bg-purple-500 hover:bg-purple-600 text-white text-xl font-bold py-4 px-12 rounded-full transition-colors shadow-lg"
                >
                  Start Free Play
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameState === 'playing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-8"
            >
              {/* Play Area with Floating Objects */}
              <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Floating shapes for visual interest */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-12 h-12 rounded-full"
                    style={{
                      background: ['#FFB6C1', '#87CEEB', '#FFE5B4', '#98FB98'][i % 4],
                      opacity: 0.3
                    }}
                    animate={{
                      x: [
                        Math.random() * 400,
                        Math.random() * 400,
                        Math.random() * 400
                      ],
                      y: [
                        Math.random() * 400,
                        Math.random() * 400,
                        Math.random() * 400
                      ]
                    }}
                    transition={{
                      duration: 8 + i * 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  />
                ))}

                {/* Tiny Rory in corner (minimal presence) */}
                <div className="absolute top-4 left-4 opacity-30">
                  <motion.svg
                    width="60"
                    height="75"
                    viewBox="0 0 100 125"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <circle cx="50" cy="50" r="30" fill="#FFE5B4" />
                    <circle cx="40" cy="45" r="3" fill="#333" />
                    <circle cx="60" cy="45" r="3" fill="#333" />
                    <path d="M 40 60 Q 50 70 60 60" stroke="#FF6B6B" strokeWidth="2" fill="none" />
                    <ellipse cx="50" cy="95" rx="25" ry="20" fill="#87CEEB" />
                  </motion.svg>
                </div>

                <div className="z-10 text-center">
                  <div className="text-6xl mb-4">🎈</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {timeRemaining}s
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Play freely!
                  </div>
                </div>
              </div>

              {/* Camera View */}
              <div className="bg-gray-900 rounded-3xl shadow-xl p-8 flex flex-col">
                <div className="text-white text-sm mb-4 text-center">
                  Camera View
                </div>
                <div className="relative flex-1 bg-black rounded-2xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover mirror"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-purple-500 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-semibold">OBSERVING</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameState === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="bg-white rounded-3xl shadow-xl p-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Processing Results...
                </h3>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  Activity Complete!
                </h3>
                
                <div className="bg-purple-50 rounded-2xl p-6 mb-6">
                  <div className="text-left space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Repetitive Behavior:</span>
                      <span className="font-semibold text-gray-800">{result.interpretation}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600">
                  All activities complete! Processing final results...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepetitiveBehaviorGame;
