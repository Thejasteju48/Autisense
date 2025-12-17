import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import RoryCharacter from '../RoryCharacter';

/**
 * GAME 2: "MAKE ME LAUGH"
 * Feature: Smile Frequency Detection
 * 
 * Child Experience:
 * - Rory character makes silly sounds and animations
 * - Bouncing colorful balls appear
 * - Child smiles naturally
 * - NO instruction text
 */

const MakeMeLaugh = ({ childName, onComplete, screeningId }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [roryState, setRoryState] = useState('idle');
  const [childSmiling, setChildSmiling] = useState(false);
  const [bouncingBalls, setBouncingBalls] = useState([]);
  
  const webcamRef = useRef(null);
  const framesRef = useRef([]);
  const frameIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const GAME_DURATION = 25000; // 25 seconds (20-30s range)
  const FRAME_RATE = 200; // ~5 FPS

  const roryStates = ['happy', 'wave', 'react', 'wait', 'idle'];

  const sillySounds = [
    'Hehe!',
    'Wheeeee!',
    'Yay!',
    'Woo-hoo!',
    'Peek-a-boo!'
  ];

  // Rory makes silly animations
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      let stateIndex = 0;
      const stateInterval = setInterval(() => {
        setRoryState(roryStates[stateIndex % roryStates.length]);
        stateIndex++;
        
        // Make silly sound
        if (Math.random() > 0.4) {
          const sound = sillySounds[Math.floor(Math.random() * sillySounds.length)];
          const utterance = new SpeechSynthesisUtterance(sound);
          utterance.rate = 1.2;
          utterance.pitch = 1.5;
          utterance.volume = 0.8;
          window.speechSynthesis.speak(utterance);
        }
      }, 2500); // Change state every 2.5 seconds

      return () => clearInterval(stateInterval);
    }
  }, [gameStarted, gameEnded]);

  // Start game
  const handleStartGame = () => {
    setGameStarted(true);
    startTimeRef.current = Date.now();
    startFrameCapture();

    // Initial sound
    const utterance = new SpeechSynthesisUtterance('Hehehe!');
    utterance.rate = 1.1;
    utterance.pitch = 1.6;
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

          // Check for smile
          checkSmile(imageSrc);
        }
      }
    }
  };

  // Real-time smile detection
  const checkSmile = async (frameData) => {
    try {
      const response = await axios.post('http://localhost:8000/analyze-smile', {
        frame: frameData.split(',')[1]
      });

      if (response.data.smileDetected) {
        setChildSmiling(true);
        generateBouncingBalls();
        setTimeout(() => setChildSmiling(false), 800);
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Generate bouncing balls when child smiles
  const generateBouncingBalls = () => {
    const colors = ['#FF6B9D', '#C44569', '#FFC312', '#12CBC4', '#A3CB38', '#FDA7DF'];
    const newBalls = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 80 + 10,
      y: -10,
      size: Math.random() * 30 + 20,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setBouncingBalls(prev => [...prev, ...newBalls].slice(-15));
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
        {/* Animated background elements */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-5xl"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: -100,
              rotate: 0
            }}
            animate={{
              y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 100,
              rotate: 360,
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          >
            {['😆', '🤣', '😂', '😹', '🎉', '🎈', '⭐'][Math.floor(Math.random() * 7)]}
          </motion.div>
        ))}
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.6 }}
          className="text-center relative z-10"
        >
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="text-[200px] mb-8 drop-shadow-2xl"
          >
            😄
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
            whileTap={{ scale: 0.95 }}
            animate={{
              y: [0, -12, 0],
              boxShadow: [
                '0 15px 60px rgba(255,192,203,0.7)',
                '0 20px 80px rgba(255,215,0,0.9)',
                '0 15px 60px rgba(255,192,203,0.7)'
              ]
            }}
            transition={{
              y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 2, repeat: Infinity }
            }}
            onClick={handleStartGame}
            className="bg-gradient-to-r from-pink-500 via-yellow-400 to-orange-500 text-white text-6xl font-black py-12 px-24 rounded-full shadow-2xl border-8 border-white"
          >
            START!
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 relative overflow-hidden">
        {/* Sparkle burst animation */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 20 + 10}px`,
              height: `${Math.random() * 20 + 10}px`,
              backgroundColor: ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'][Math.floor(Math.random() * 5)]
            }}
            initial={{ 
              x: (typeof window !== 'undefined' ? window.innerWidth : 1000) / 2,
              y: (typeof window !== 'undefined' ? window.innerHeight : 1000) / 2,
              scale: 0,
              opacity: 1
            }}
            animate={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0]
            }}
            transition={{
              duration: 1.5 + Math.random() * 1,
              delay: Math.random() * 0.3,
              ease: "easeOut"
            }}
          />
        ))}
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.6, duration: 0.8 }}
          className="text-center relative z-10"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="mb-8 transform scale-[2.5]"
          >
            <RoryCharacter state="happy" childName={childName} />
          </motion.div>
          <motion.p
            animate={{
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-7xl font-black text-white"
            style={{ textShadow: '4px 4px 8px rgba(0,0,0,0.3)' }}
          >
            So funny!
          </motion.p>
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

      {/* Rory Character - Making Silly Animations */}
      <div className="flex items-center justify-center h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            y: [0, -15, 0]
          }}
          transition={{
            scale: { type: "spring", duration: 0.6 },
            y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative"
        >
          {/* Rory Character */}
          <div className="transform scale-[3]">
            <RoryCharacter 
              state={roryState}
              childName={childName}
            />
          </div>

          {/* Floating sparkles around Rory */}
          <motion.div
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-16 -left-16 w-12 h-12 bg-yellow-300 rounded-full blur-sm"
          />
          
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              y: [0, -15, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute -top-16 -right-16 w-10 h-10 bg-pink-400 rounded-full blur-sm"
          />

          <motion.div
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-purple-400 rounded-full blur-sm"
          />
        </motion.div>
      </div>

      {/* Bouncing Balls - Falls when child smiles */}
      <AnimatePresence>
        {bouncingBalls.map((ball) => (
          <motion.div
            key={ball.id}
            className="absolute rounded-full shadow-2xl"
            style={{
              width: `${ball.size}px`,
              height: `${ball.size}px`,
              backgroundColor: ball.color,
              left: `${ball.x}%`,
            }}
            initial={{ 
              y: '-10%',
              opacity: 1,
              scale: 1
            }}
            animate={{ 
              y: ['0vh', '70vh', '65vh', '70vh', '68vh', '70vh', '110vh'],
              opacity: [1, 1, 1, 1, 1, 0.8, 0],
              scale: [1, 1.1, 1, 1.05, 1, 1, 0.8]
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 4,
              ease: 'easeIn',
              times: [0, 0.3, 0.4, 0.5, 0.6, 0.7, 1]
            }}
          />
        ))}
      </AnimatePresence>

      {/* Pulsing effect when smile detected */}
      <AnimatePresence>
        {childSmiling && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-yellow-300 rounded-full blur-3xl"
              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
            />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl"
            >
              😊✨
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating fun elements */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(i * 45) * 40, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3
          }}
          style={{
            position: 'absolute',
            left: `${8 + i * 12}%`,
            top: `${15 + (i % 4) * 20}%`,
            fontSize: '55px',
            opacity: 0.5
          }}
        >
          {['🎪', '🎭', '🎨', '🎪', '🌈', '🎵', '🎶', '💫'][i]}
        </motion.div>
      ))}

      {/* Progress bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: GAME_DURATION / 1000, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-pink-400 via-yellow-400 to-green-400"
      />
    </div>
  );
};

export default MakeMeLaugh;
