import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoryCharacter from '../RoryCharacter';
import useCameraSession from '../../hooks/useCameraSession';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * Smile Game - "Make Rory Happy"
 * 
 * PURPOSE: Measure emotional reciprocity
 * 
 * HOW IT WORKS:
 * 1. Rory looks sad
 * 2. Rory sighs
 * 3. Rory looks at child
 * 4. If child smiles -> Rory becomes happy (confetti!)
 * 5. If child doesn't smile -> Rory still recovers (no pressure)
 */

const SmileGameV2 = ({ childName, sessionId, onComplete }) => {
  const [gameState, setGameState] = useState('intro');
  const [roryState, setRoryState] = useState('sad');
  const [smilesDetected, setSmilesDetected] = useState(0);
  const [result, setResult] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
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
      { state: 'sad', duration: 3000 },
      { state: 'wait', duration: 2000 },
      { state: 'sad', duration: 3000 },
      { state: 'wait', duration: 2000 }
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
      const response = await axios.post(`${ML_SERVICE_URL}/analyze/smile-batch`, {
        sessionId,
        frames
      });

      if (response.data.smileDetected) {
        setSmilesDetected(prev => prev + 1);
        setRoryState('happy');
        setShowConfetti(true);
        
        setTimeout(() => {
          setShowConfetti(false);
          setRoryState('sad');
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending frames:', error);
    }
  };

  const completeGame = async () => {
    stopFrameCapture();
    setGameState('processing');

    try {
      const response = await axios.get(`${ML_SERVICE_URL}/analyze/smile-result/${sessionId}`);
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
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 p-8">
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
                  😊 Make Rory Happy Game
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Oh no! Rory is feeling sad. Can {childName} cheer Rory up?
                </p>
                
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
                  <p className="text-gray-700">
                    <span className="font-semibold">Instructions:</span><br />
                    Rory will look sad and needs cheering up!<br />
                    Let {childName} respond naturally with smiles, sounds, or expressions.
                  </p>
                </div>

                <button
                  onClick={startGame}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-xl font-bold py-4 px-12 rounded-full transition-colors shadow-lg"
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
              <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <RoryCharacter 
                  state={roryState} 
                  childName={childName}
                />
                
                {/* Confetti animation */}
                {showConfetti && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                        initial={{
                          x: '50%',
                          y: '50%',
                          scale: 0
                        }}
                        animate={{
                          x: `${Math.random() * 100}%`,
                          y: `${Math.random() * 100}%`,
                          scale: [0, 1, 0]
                        }}
                        transition={{ duration: 1, delay: i * 0.05 }}
                      />
                    ))}
                  </motion.div>
                )}
                
                <div className="mt-6 w-full space-y-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Smiles Detected</div>
                    <div className="text-3xl font-bold text-yellow-600">{smilesDetected}</div>
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
                  
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-yellow-500 px-3 py-1 rounded-full">
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
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mx-auto mb-6"></div>
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
                
                <div className="bg-yellow-50 rounded-2xl p-6 mb-6">
                  <div className="text-left space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Smile Frequency:</span>
                      <span className="text-2xl font-bold text-yellow-600">{smilesDetected}</span>
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

export default SmileGameV2;
