import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoryCharacter from '../RoryCharacter';
import useCameraSession from '../../hooks/useCameraSession';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Gesture Game - "Wave Back to Rory"
 * 
 * PURPOSE: Observe natural gesture usage
 * 
 * HOW IT WORKS:
 * 1. Rory waves slowly
 * 2. Rory stops and waits
 * 3. Rory tilts head (curiosity)
 * 4. If child waves -> Rory reacts positively
 * 5. If child doesn't wave -> Rory still smiles (no pressure)
 * 
 * MEASURES: Gesture frequency, spontaneous imitation
 */

const GestureGameV2 = ({ childName, sessionId, onComplete }) => {
  const [gameState, setGameState] = useState('intro');
  const [roryState, setRoryState] = useState('idle');
  const [gesturesDetected, setGesturesDetected] = useState(0);
  const [result, setResult] = useState(null);
  const [duration, setDuration] = useState(30);
  
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
      runRorySequence();
      collectFrames();
      
      setTimeout(() => {
        completeGame();
      }, duration * 1000);
    }
  };

  const runRorySequence = () => {
    const sequence = [
      { state: 'wave', duration: 2500 },
      { state: 'wait', duration: 3000 },
      { state: 'wave', duration: 2500 },
      { state: 'wait', duration: 3000 },
      { state: 'react', duration: 1500 },
      { state: 'idle', duration: 2000 }
    ];

    let delay = 0;
    sequence.forEach(step => {
      setTimeout(() => setRoryState(step.state), delay);
      delay += step.duration;
    });

    const totalDuration = sequence.reduce((sum, step) => sum + step.duration, 0);
    const repeatInterval = setInterval(() => {
      delay = 0;
      sequence.forEach(step => {
        setTimeout(() => setRoryState(step.state), delay);
        delay += step.duration;
      });
    }, totalDuration);

    return () => clearInterval(repeatInterval);
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
      const response = await axios.post(`${ML_SERVICE_URL}/analyze/gesture-batch`, {
        sessionId,
        frames
      });

      // Update gesture count if detected
      if (response.data.gestureDetected) {
        setGesturesDetected(prev => prev + 1);
        setRoryState('react'); // Rory reacts to gesture
      }
    } catch (error) {
      console.error('Error sending frames:', error);
    }
  };

  const completeGame = async () => {
    stopFrameCapture();
    setGameState('processing');

    try {
      const response = await axios.get(`${ML_SERVICE_URL}/analyze/gesture-result/${sessionId}`);
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-8">
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
                  👋 Wave at Rory Game
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Rory loves waving! Let's see if {childName} waves back.
                </p>
                
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
                  <p className="text-gray-700">
                    <span className="font-semibold">Instructions:</span><br />
                    Rory will wave at {childName}.<br />
                    Let {childName} respond naturally - waving back, pointing, or just watching are all okay!
                  </p>
                </div>

                <button
                  onClick={startGame}
                  className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-12 rounded-full transition-colors shadow-lg"
                >
                  Start Game
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
              <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center">
                <RoryCharacter 
                  state={roryState} 
                  childName={childName}
                />
                
                <div className="mt-6 w-full space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Gestures Detected</div>
                    <div className="text-3xl font-bold text-green-600">{gesturesDetected}</div>
                  </div>
                </div>
              </div>

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
                  
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-semibold">ANALYZING</span>
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto mb-6"></div>
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
                  Game Complete!
                </h3>
                
                <div className="bg-green-50 rounded-2xl p-6 mb-6">
                  <div className="text-left space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Gesture Frequency:</span>
                      <span className="text-2xl font-bold text-green-600">{gesturesDetected}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Interpretation:</span>
                      <span className="font-semibold text-gray-800">{result.interpretation}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600">
                  Moving to next activity...
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

export default GestureGameV2;
