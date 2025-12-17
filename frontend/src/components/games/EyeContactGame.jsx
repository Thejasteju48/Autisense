import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';

const EyeContactGame = ({ onComplete }) => {
  const webcamRef = useRef(null);
  const [gameState, setGameState] = useState('intro'); // intro, playing, complete
  const [countdown, setCountdown] = useState(3);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState([]);
  const [characterPosition, setCharacterPosition] = useState('center');
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const GAME_DURATION = 30; // 30 seconds
  const CAPTURE_INTERVAL = 500; // Capture frame every 500ms

  useEffect(() => {
    if (gameState === 'playing') {
      startTimeRef.current = Date.now();
      
      // Capture frames
      intervalRef.current = setInterval(() => {
        captureFrame();
        
        // Update progress
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setProgress((elapsed / GAME_DURATION) * 100);
        
        // Change character position occasionally
        if (Math.random() > 0.7) {
          const positions = ['center', 'left', 'right'];
          setCharacterPosition(positions[Math.floor(Math.random() * positions.length)]);
        }
        
        // End game
        if (elapsed >= GAME_DURATION) {
          endGame();
        }
      }, CAPTURE_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameState]);

  const captureFrame = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setFrames(prev => [...prev, imageSrc]);
      }
    }
  };

  const startGame = () => {
    let count = 3;
    setCountdown(count);
    
    const countInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countInterval);
        setGameState('playing');
      }
    }, 1000);
  };

  const endGame = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setGameState('complete');
    
    // Send frames to parent component
    onComplete({
      frames: frames,
      duration: GAME_DURATION
    });
  };

  const getCharacterStyle = () => {
    switch (characterPosition) {
      case 'left':
        return { left: '10%', top: '30%' };
      case 'right':
        return { right: '10%', top: '30%' };
      default:
        return { left: '50%', top: '30%', transform: 'translateX(-50%)' };
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
      {/* Webcam (hidden during game) */}
      <div className="fixed top-4 right-4 z-50">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="rounded-lg border-4 border-white shadow-lg"
          width={160}
          height={120}
          mirrored={true}
        />
      </div>

      {/* Game Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        {gameState === 'intro' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-white rounded-3xl shadow-2xl max-w-2xl"
          >
            <div className="text-8xl mb-6">👀</div>
            <h1 className="text-4xl font-bold text-purple-600 mb-4">
              Look at the Character!
            </h1>
            <p className="text-2xl text-gray-700 mb-8">
              Watch the friendly character as it moves around. 
              <br />Try to look at it when it appears!
            </p>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={startGame}
              className="btn-primary text-3xl px-12 py-6 rounded-full"
            >
              Start Game! 🎮
            </motion.button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Countdown */}
            {countdown > 0 && (
              <motion.div
                key={countdown}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-40 bg-black/20"
              >
                <div className="text-9xl font-bold text-white drop-shadow-lg">
                  {countdown}
                </div>
              </motion.div>
            )}

            {/* Animated Character */}
            <AnimatePresence mode="wait">
              <motion.div
                key={characterPosition}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                style={getCharacterStyle()}
                className="absolute"
              >
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [-5, 5, -5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-9xl drop-shadow-2xl"
                >
                  😊
                </motion.div>
                
                {/* Speech bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl px-6 py-3 shadow-xl"
                >
                  <p className="text-2xl font-bold text-purple-600 whitespace-nowrap">
                    Look at me! 👋
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Progress bar */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-3/4 max-w-2xl">
              <div className="bg-white/90 rounded-full h-8 overflow-hidden shadow-lg">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Encouragement */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="fixed top-24 left-1/2 transform -translate-x-1/2 text-center"
            >
              <p className="text-3xl font-bold text-purple-600 drop-shadow-lg">
                Great job! Keep looking! 👍
              </p>
            </motion.div>
          </>
        )}

        {gameState === 'complete' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-white rounded-3xl shadow-2xl"
          >
            <div className="text-9xl mb-6">🎉</div>
            <h2 className="text-5xl font-bold text-green-600 mb-4">
              Amazing Work!
            </h2>
            <p className="text-3xl text-gray-700">
              You did a great job!
            </p>
          </motion.div>
        )}
      </div>

      {/* Stars animation */}
      {gameState === 'playing' && (
        <>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: Math.random() * 3
              }}
            >
              ⭐
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
};

export default EyeContactGame;
