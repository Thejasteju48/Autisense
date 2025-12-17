import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import RoryCharacter from '../RoryCharacter';

/**
 * GAME 2: "FRIEND WAVES GOODBYE"
 * Feature: Gesture Usage Detection
 * 
 * Child Experience:
 * - Character waves slowly
 * - Bubbles float across screen
 * - Child naturally waves or reaches
 * - NO instruction text
 */

const FriendWavesGoodbye = ({ childName, onComplete, screeningId }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [characterWaving, setCharacterWaving] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [childGestureDetected, setChildGestureDetected] = useState(false);
  
  const webcamRef = useRef(null);
  const framesRef = useRef([]);
  const frameIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const GAME_DURATION = 30000; // 30 seconds
  const FRAME_RATE = 200; // ~5 FPS

  // Character waving animation
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      const waveInterval = setInterval(() => {
        setCharacterWaving(true);
        setTimeout(() => setCharacterWaving(false), 1500);
      }, 3000); // Wave every 3 seconds

      return () => clearInterval(waveInterval);
    }
  }, [gameStarted, gameEnded]);

  // Generate floating bubbles
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      const bubbleInterval = setInterval(() => {
        generateBubble();
      }, 1500);

      return () => clearInterval(bubbleInterval);
    }
  }, [gameStarted, gameEnded]);

  const generateBubble = () => {
    const newBubble = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10,
      y: 110, // Start below screen
      size: Math.random() * 60 + 40,
      speed: Math.random() * 3 + 2
    };
    setBubbles(prev => [...prev, newBubble].slice(-12)); // Keep max 12 bubbles
  };

  // Start game
  const handleStartGame = () => {
    setGameStarted(true);
    startTimeRef.current = Date.now();
    startFrameCapture();

    // Say goodbye
    const utterance = new SpeechSynthesisUtterance('Bye bye!');
    utterance.rate = 0.9;
    utterance.pitch = 1.4;
    utterance.volume = 0.7;
    window.speechSynthesis.speak(utterance);

    // End game after 30 seconds
    setTimeout(() => {
      endGame();
    }, GAME_DURATION);
  };

  // Capture frames
  const startFrameCapture = () => {
    frameIntervalRef.current = setInterval(() => {
      captureFrame();
    }, FRAME_RATE);
  };

  const captureFrame = () => {
    if (webcamRef.current && gameStarted && !gameEnded) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc && imageSrc.includes(',')) {
        const base64Data = imageSrc.split(',')[1];
        if (base64Data && base64Data.length > 100) {
          framesRef.current.push({
            frame: base64Data,
            timestamp: Date.now() - startTimeRef.current
          });

          // Real-time gesture detection for visual feedback
          checkGesture(imageSrc);
        }
      }
    }
  };

  // Check for gesture in real-time
  const checkGesture = async (frameData) => {
    try {
      const response = await axios.post('http://localhost:8000/analyze-gesture', {
        frame: frameData.split(',')[1]
      });

      if (response.data.gestureDetected) {
        setChildGestureDetected(true);
        // Sparkle effect when child waves
        setTimeout(() => setChildGestureDetected(false), 500);
      }
    } catch (error) {
      // Silent fail
    }
  };

  // End game
  const endGame = () => {
    setGameEnded(true);
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    // Pass frames to parent component
    setTimeout(() => {
      onComplete(framesRef.current);
    }, 2000);
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 relative overflow-hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mb-8 transform scale-[2]">
            <RoryCharacter state="wave" />
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-2xl font-bold py-6 px-12 rounded-full shadow-2xl"
          >
            Start Playing!
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 1.5 }}
            className="mb-8 transform scale-[2]">
            <RoryCharacter state="wave" />
          </motion.div>
          <p className="text-4xl font-bold text-orange-600">See you!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 overflow-hidden">
      
      {/* Webcam (hidden) */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        className="absolute top-4 right-4 w-1 h-1 opacity-0"
        mirrored={true}
      />

      {/* Character - Waving */}
      <div className="flex items-center justify-center h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            y: [0, -15, 0]
          }}
          transition={{
            scale: { type: "spring", duration: 0.8 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative"
        >
          {/* Rory Character waving */}
          <div className="transform scale-[3] relative">
            <RoryCharacter 
              state={characterWaving ? "wave" : "idle"}
              childName={childName}
            />
          </div>
        </motion.div>
      </div>

      {/* Floating Bubbles */}
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            initial={{ 
              x: `${bubble.x}%`, 
              y: '110vh',
              scale: 0,
              opacity: 0
            }}
            animate={{ 
              y: '-20vh',
              scale: 1,
              opacity: [0, 0.7, 0.7, 0],
              x: `${bubble.x + Math.sin(Date.now() * 0.001) * 10}%`
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 8 / bubble.speed,
              ease: 'easeOut'
            }}
            style={{
              position: 'absolute',
              width: `${bubble.size}px`,
              height: `${bubble.size}px`
            }}
            className="pointer-events-none"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-200/40 to-purple-200/40 backdrop-blur-sm border-2 border-white/50 shadow-lg" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Visual feedback when child waves */}
      <AnimatePresence>
        {childGestureDetected && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 rounded-full bg-yellow-300"
                style={{
                  width: '20px',
                  height: '20px'
                }}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{ 
                  scale: 2,
                  x: Math.cos((i * Math.PI * 2) / 8) * 100,
                  y: Math.sin((i * Math.PI * 2) / 8) * 100,
                  opacity: 0
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Ambient floating hearts */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            x: [0, Math.sin(i) * 30, 0],
            rotate: [0, 15, -15, 0]
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
          style={{
            position: 'absolute',
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            fontSize: '50px',
            opacity: 0.4
          }}
        >
          {['💛', '🧡', '💖', '💜'][i % 4]}
        </motion.div>
      ))}

      {/* Progress bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: GAME_DURATION / 1000, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400"
      />
    </div>
  );
};

export default FriendWavesGoodbye;
