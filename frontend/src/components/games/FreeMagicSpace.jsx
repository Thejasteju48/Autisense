import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';
import axios from 'axios';
import RoryCharacter from '../RoryCharacter';

/**
 * GAME 4: "FREE MAGIC SPACE"
 * Feature: Repetitive Behavior Detection
 * 
 * Child Experience:
 * - Floating shapes
 * - Calm music (ambient sounds)
 * - NO goals, NO rules
 * - Just free play and observation
 */

const FreeMagicSpace = ({ childName, onComplete, screeningId }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [floatingShapes, setFloatingShapes] = useState([]);
  
  const webcamRef = useRef(null);
  const framesRef = useRef([]);
  const frameIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const GAME_DURATION = 50000; // 50 seconds (40-60s range) (longer for free play)
  const FRAME_RATE = 200; // ~5 FPS

  const shapeTypes = ['circle', 'star', 'square', 'triangle', 'heart'];
  const shapeColors = ['#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C', '#FFA07A'];
  const colors = [
    'from-blue-300 to-purple-300',
    'from-pink-300 to-yellow-300',
    'from-green-300 to-blue-300',
    'from-purple-300 to-pink-300',
    'from-yellow-300 to-orange-300'
  ];

  // Generate floating shapes
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      const initialShapes = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        shape: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        color: shapeColors[Math.floor(Math.random() * shapeColors.length)],
        x: Math.random() * 90,
        y: Math.random() * 90,
        size: Math.random() * 60 + 40,
        duration: Math.random() * 10 + 8,
        delay: i * 0.5
      }));
      setFloatingShapes(initialShapes);
    }
  }, [gameStarted, gameEnded]);

  // Ambient sound using Web Audio API
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      // Create ambient soundscape
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        playAmbientSound();
      } catch (error) {
        console.log('Audio not available');
      }

      return () => {
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
    }
  }, [gameStarted, gameEnded]);

  const playAmbientSound = () => {
    if (!audioContextRef.current) return;

    const context = audioContextRef.current;
    
    // Create gentle oscillator for ambient sound
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, context.currentTime); // A3 note
    
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.03, context.currentTime + 2);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + GAME_DURATION / 1000);
  };

  // Start game
  const handleStartGame = () => {
    setGameStarted(true);
    startTimeRef.current = Date.now();
    startFrameCapture();

    // Gentle welcome
    const utterance = new SpeechSynthesisUtterance('Play time!');
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    utterance.volume = 0.5;
    window.speechSynthesis.speak(utterance);

    // End game after 40 seconds
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
        }
      }
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-8 transform scale-[2]">
            <RoryCharacter state="happy" />
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 relative overflow-hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-8 transform scale-[2]">
            <RoryCharacter state="happy" />
          </motion.div>
          <p className="text-4xl font-bold text-purple-600">Beautiful!</p>
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

      {/* Floating Shapes - Free Movement */}
      {floatingShapes.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ 
            x: `${item.x}%`, 
            y: `${item.y}%`,
            scale: 0,
            opacity: 0
          }}
          animate={{ 
            x: [
              `${item.x}%`,
              `${(item.x + 20) % 100}%`,
              `${(item.x + 40) % 100}%`,
              `${item.x}%`
            ],
            y: [
              `${item.y}%`,
              `${(item.y + 15) % 100}%`,
              `${(item.y + 30) % 100}%`,
              `${item.y}%`
            ],
            scale: [0, 1, 1, 0.9, 1],
            rotate: [0, 180, 360],
            opacity: [0, 0.8, 0.8, 0.8, 0.6]
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: item.delay
          }}
          style={{
            position: 'absolute',
            width: `${item.size}px`,
            height: `${item.size}px`
          }}
          className="flex items-center justify-center"
        >
          {item.shape === 'circle' && (
            <div 
              className="w-full h-full rounded-full shadow-lg"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.shape === 'square' && (
            <div 
              className="w-full h-full rounded-lg shadow-lg"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.shape === 'triangle' && (
            <div 
              className="w-0 h-0"
              style={{
                borderLeft: `${item.size/2}px solid transparent`,
                borderRight: `${item.size/2}px solid transparent`,
                borderBottom: `${item.size}px solid ${item.color}`,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
              }}
            />
          )}
          {item.shape === 'star' && (
            <div className="relative w-full h-full">
              <svg viewBox="0 0 24 24" fill={item.color} className="w-full h-full drop-shadow-lg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          )}
          {item.shape === 'heart' && (
            <div className="relative w-full h-full">
              <svg viewBox="0 0 24 24" fill={item.color} className="w-full h-full drop-shadow-lg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          )}
        </motion.div>
      ))}

      {/* Gentle gradient waves in background */}
      {colors.map((colorGradient, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.3, 0.1],
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{
            duration: 15 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2
          }}
          className={`absolute w-96 h-96 rounded-full bg-gradient-to-br ${colorGradient} blur-3xl`}
          style={{
            left: `${i * 25}%`,
            top: `${20 + i * 15}%`
          }}
        />
      ))}

      {/* Gentle center glow */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-white/30 to-transparent rounded-full blur-3xl"
      />

      {/* Soft particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(i) * 50, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3
          }}
          style={{
            position: 'absolute',
            left: `${5 + i * 4.5}%`,
            bottom: 0,
            width: '8px',
            height: '8px',
            backgroundColor: ['#93c5fd', '#c4b5fd', '#fda4af', '#fde047'][i % 4],
            borderRadius: '50%',
            filter: 'blur(2px)'
          }}
        />
      ))}

      {/* No progress bar - free play has no time pressure feeling */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-purple-400 text-sm"
      >
        ✨
      </motion.div>
    </div>
  );
};

export default FreeMagicSpace;
