import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import RoryCharacter from '../RoryCharacter';

/**
 * GAME 1: "CALLING FRIEND" — Eye Contact
 * 
 * Child Experience:
 * - Friendly cartoon face appears full-screen
 * - Cartoon calls child's name using audio
 * - Cartoon blinks, smiles, slightly moves
 * - NO text, NO buttons
 * 
 * Behavior Elicited: Natural face attention, eye gaze toward screen
 * Feature Extracted: Eye Contact Ratio (0-1)
 * Duration: 30-40 seconds
 */

const MagicFriendMirror = ({ childName, onComplete, screeningId }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [lookingAtScreen, setLookingAtScreen] = useState(false);
  const [roryState, setRoryState] = useState('idle');
  const [sparkles, setSparkles] = useState([]);
  
  const webcamRef = useRef(null);
  const framesRef = useRef([]);
  const frameIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const GAME_DURATION = 35000; // 35 seconds (30-40s range)
  const FRAME_RATE = 200; // Capture every 200ms (~5 FPS)
  const gameTimeoutRef = useRef(null);
  const voicesLoadedRef = useRef(false);

  // Load voices when component mounts
  useEffect(() => {
    if (window.speechSynthesis) {
      // Load voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          voicesLoadedRef.current = true;
          console.log('✓ Speech voices loaded:', voices.length);
        }
      };
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      loadVoices();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (gameTimeoutRef.current) {
        clearTimeout(gameTimeoutRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Rory animation sequence - keeps changing states to engage child
  useEffect(() => {
    if (gameStarted && !gameEnded) {
      const states = ['wave', 'happy', 'react', 'wait', 'idle'];
      let stateIndex = 0;
      
      const stateInterval = setInterval(() => {
        setRoryState(states[stateIndex % states.length]);
        stateIndex++;
      }, 3000); // Change state every 3 seconds

      return () => clearInterval(stateInterval);
    }
  }, [gameStarted, gameEnded]);



  // Say child's name every 5 seconds throughout the game
  useEffect(() => {
    if (gameStarted && !gameEnded && childName) {
      console.log('🔊 Starting audio sequence for:', childName);
      
      const phrases = [
        `${childName}!`,
        `Hey ${childName}!`,
        `${childName}, look here!`,
        `Hi ${childName}!`
      ];
      
      let phraseIndex = 0;
      let intervalId = null;
      
      // Speak a phrase
      const speakPhrase = (phrase) => {
        console.log('🔊 Attempting to speak:', phrase);
        
        if (!window.speechSynthesis) {
          console.error('❌ Speech synthesis not supported');
          return;
        }
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Small delay to ensure cancellation completes
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(phrase);
          utterance.rate = 0.9;
          utterance.pitch = 1.2;
          utterance.volume = 1.0;
          utterance.lang = 'en-US';
          
          utterance.onstart = () => console.log('✅ Speech started:', phrase);
          utterance.onend = () => console.log('✅ Speech ended:', phrase);
          utterance.onerror = (e) => console.error('❌ Speech error:', e);
          
          window.speechSynthesis.speak(utterance);
        }, 50);
      };
      
      // Call name immediately
      speakPhrase(phrases[0]);
      phraseIndex = 1;
      
      // Call name every 5 seconds
      intervalId = setInterval(() => {
        speakPhrase(phrases[phraseIndex % phrases.length]);
        phraseIndex++;
      }, 5000);
      
      const timeouts = [intervalId];
      
      return () => {
        timeouts.forEach(t => clearInterval(t));
        window.speechSynthesis.cancel();
      };
    }
  }, [gameStarted, gameEnded, childName]);

  // Start game
  const handleStartGame = () => {
    console.log('🎮 Game 1 (Calling Friend) starting for:', childName);
    
    // CRITICAL: Initialize speech synthesis with user interaction
    if (window.speechSynthesis) {
      // Cancel any pending speech
      window.speechSynthesis.cancel();
      
      // Get available voices (this helps initialize the API)
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      // Speak immediately on user click
      const testUtterance = new SpeechSynthesisUtterance(`${childName}!`);
      testUtterance.volume = 1.0;
      testUtterance.rate = 0.9;
      testUtterance.pitch = 1.2;
      
      testUtterance.onstart = () => console.log('✅ Audio test started');
      testUtterance.onend = () => console.log('✅ Audio test completed');
      testUtterance.onerror = (e) => console.error('❌ Audio error:', e);
      
      window.speechSynthesis.speak(testUtterance);
      
      console.log('✓ Speech synthesis initialized');
    } else {
      console.error('❌ Speech synthesis NOT available');
      alert('Speech synthesis is not supported in your browser');
    }
    
    setGameStarted(true);
    startTimeRef.current = Date.now();
    startFrameCapture();

    // End game after 35 seconds
    gameTimeoutRef.current = setTimeout(() => {
      endGame();
    }, GAME_DURATION);
  };

  // Capture frames at ~5 FPS
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
        if (base64Data && base64Data.length > 100) { // Validate we have actual image data
          framesRef.current.push({
            frame: base64Data,
            timestamp: Date.now() - startTimeRef.current
          });

          // Generate sparkles randomly to keep engagement (no ML needed during game)
          if (Math.random() > 0.4) {
            generateSparkles();
          }
        }
      }
    }
  };

  // Generate sparkles when child looks at screen
  const generateSparkles = () => {
    const newSparkles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 80 + 10, // 10-90%
      y: Math.random() * 80 + 10,
      size: Math.random() * 20 + 15
    }));
    setSparkles(prev => [...prev, ...newSparkles].slice(-15)); // Keep max 15 sparkles
  };

  // End game and send data
  const endGame = () => {
    if (gameEnded) return; // Prevent multiple calls
    
    console.log('🎮 Game 1 ending...');
    setGameEnded(true);
    
    // Stop frame capture
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Validate and pass frames to parent component
    setTimeout(() => {
      const validFrames = framesRef.current.filter(f => f.frame && f.frame.length > 100);
      console.log(`✓ Game 1 complete: ${validFrames.length} valid frames collected`);
      console.log('📊 Sample frame check:', validFrames[0] ? 'Valid' : 'Invalid');
      
      if (validFrames.length === 0) {
        console.error('❌ No valid frames captured!');
        console.error('Camera ref:', webcamRef.current ? 'Present' : 'Missing');
        // Still complete, backend will handle empty frames
      }
      
      console.log('✓ Calling onComplete with frames');
      onComplete(validFrames);
    }, 2000);
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-5xl"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                y: -100,
                rotate: 0,
                opacity: 0.8
              }}
              animate={{
                y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 100,
                rotate: 360,
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 8 + Math.random() * 8,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
              className="rounded-full shadow-lg"
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: ['#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
          
          {/* Colorful background blobs */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 180, 360],
              x: [0, 100, 0],
              y: [0, 50, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-20 w-64 h-64 bg-yellow-400 rounded-full opacity-30 blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              rotate: [360, 180, 0],
              x: [0, -100, 0],
              y: [0, -50, 0]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 right-20 w-72 h-72 bg-green-400 rounded-full opacity-30 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1.2, bounce: 0.6 }}
          className="text-center relative z-10"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8 transform scale-[3] filter drop-shadow-2xl"
          >
            <RoryCharacter state="wave" />
          </motion.div>
          
          <motion.h1
            animate={{ 
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-8xl font-black mb-12 text-white"
            style={{ 
              textShadow: '6px 6px 12px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.5)' 
            }}
          >
            Let's Play! 🎮
          </motion.h1>
          
          <motion.button
            whileHover={{ scale: 1.15, rotate: [0, -8, 8, 0] }}
            whileTap={{ scale: 0.95 }}
            animate={{
              y: [0, -15, 0],
              boxShadow: [
                '0 15px 60px rgba(255,215,0,0.7)',
                '0 20px 80px rgba(255,105,180,0.9)',
                '0 15px 60px rgba(138,43,226,0.7)',
                '0 20px 80px rgba(255,215,0,0.9)'
              ]
            }}
            transition={{
              y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 2.5, repeat: Infinity }
            }}
            onClick={handleStartGame}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-6xl font-black py-12 px-24 rounded-full shadow-2xl border-8 border-white transform hover:border-pink-300"
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
        {/* Confetti effect */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            initial={{ 
              x: (typeof window !== 'undefined' ? window.innerWidth : 1000) / 2,
              y: -50,
              rotate: 0,
              opacity: 1
            }}
            animate={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 50,
              rotate: Math.random() * 720,
              opacity: 0
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 0.5,
              ease: "easeOut"
            }}
            className="rounded-full shadow-lg"
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C'][Math.floor(Math.random() * 6)]
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
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="text-[200px] mb-8 drop-shadow-2xl"
          >
            ⭐
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
            Great job! 🎉
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 overflow-hidden">
      {/* Animated background stars */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute text-5xl"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            rotate: 0,
            scale: 0.5
          }}
          animate={{
            rotate: 360,
            scale: [0.5, 1.2, 0.5],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        >
          {['⭐', '✨', '💫', '🌟'][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
      
      {/* Webcam (hidden from child) */}
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        className="absolute top-4 right-4 w-1 h-1 opacity-0"
        mirrored={true}
      />

      {/* Main Content Area */}
      <div className="flex items-center justify-center h-screen">
        {/* Rory Character calling child's name */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
          className="relative"
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <RoryCharacter 
              state={roryState} 
              childName={childName}
            />
          </motion.div>
          
          {/* Speech bubble calling child's name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: [0, -15, 0],
              scale: [1, 1.08, 1]
            }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-28 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-full px-12 py-6 shadow-2xl border-6 border-white"
          >
            <p className="text-6xl font-black text-white text-center drop-shadow-lg">
              {childName || 'Friend'}! 👋
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Sparkles - Colorful engagement feedback */}
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ scale: 0, opacity: 1, rotate: 0 }}
            animate={{ 
              scale: [0, 1.5, 0], 
              opacity: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            style={{
              position: 'absolute',
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              fontSize: `${sparkle.size + 10}px`
            }}
          >
            {['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)]}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Ambient floating elements */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: '60px',
            opacity: 0.3
          }}
        >
          {['⭐', '💫', '🌟', '✨'][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}

      {/* Progress indicator (subtle, bottom) */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: GAME_DURATION / 1000, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400"
      />
    </div>
  );
};

export default MagicFriendMirror;
