import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import RoryCharacter from '../RoryCharacter';

/**
 * GAME 5: "COPY THE FRIEND" — Imitation Ability
 * 
 * Child Experience:
 * - Rory performs ONE simple action at a time (wave, happy, react)
 * - Rory pauses and smiles
 * - No instruction, no text
 * - NO buttons
 * 
 * Behavior Observed: Does child imitate within time window?
 * Feature Extracted: Imitation Score
 * Duration: 3-4 attempts
 */

const CopyTheFriend = ({ childName, onComplete, screeningId }) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(0);
  const [showingAction, setShowingAction] = useState(false);
  const [waitingForImitation, setWaitingForImitation] = useState(false);
  
  const webcamRef = useRef(null);
  const framesRef = useRef([]);
  const frameIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  const FRAME_RATE = 200; // ~5 FPS
  const TOTAL_ATTEMPTS = 4;
  
  const actions = [
    { name: 'wave', roryState: 'wave', instruction: 'waving' },
    { name: 'happy', roryState: 'happy', instruction: 'being happy' },
    { name: 'react', roryState: 'react', instruction: 'reacting' },
    { name: 'wave2', roryState: 'wave', instruction: 'waving again' }
  ];

  // Start game
  const handleStartGame = () => {
    setGameStarted(true);
    startTimeRef.current = Date.now();
    startFrameCapture();
    
    // Start first action after 2 seconds
    setTimeout(() => {
      performNextAction();
    }, 2000);
  };

  // Perform next action
  const performNextAction = () => {
    if (attemptNumber >= TOTAL_ATTEMPTS) {
      endGame();
      return;
    }

    const action = actions[attemptNumber];
    setCurrentAction(action);
    setShowingAction(true);
    setWaitingForImitation(false);

    // Say action using audio
    const utterance = new SpeechSynthesisUtterance(`Watch me!`);
    utterance.rate = 0.8;
    utterance.pitch = 1.3;
    utterance.volume = 0.7;
    window.speechSynthesis.speak(utterance);

    // Show action for 3 seconds
    setTimeout(() => {
      setShowingAction(false);
      setWaitingForImitation(true);

      // Wait for child imitation (5 seconds)
      setTimeout(() => {
        setWaitingForImitation(false);
        setAttemptNumber(prev => prev + 1);

        // Pause before next action
        setTimeout(() => {
          performNextAction();
        }, 2000);
      }, 5000);
    }, 3000);
  };

  // Frame capture
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
            timestamp: Date.now() - startTimeRef.current,
            action: currentAction?.name || 'idle',
            phase: waitingForImitation ? 'imitation' : 'demonstration'
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

    // Pass frames to parent
    setTimeout(() => {
      onComplete(framesRef.current);
    }, 2000);
  };

  // Get animation style based on action
  const getActionAnimation = (action) => {
    if (!action) return {};
    
    switch (action.name) {
      case 'clap':
        return {
          scale: [1, 0.9, 1],
          rotate: [0, -5, 5, 0]
        };
      case 'raiseHands':
        return {
          y: [0, -30, 0]
        };
      case 'nod':
        return {
          y: [0, 10, 0]
        };
      case 'wave':
        return {
          rotate: [0, 15, -15, 0]
        };
      default:
        return {};
    }
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
            transition={{ duration: 2, repeat: Infinity }}
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 relative overflow-hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="mb-8 transform scale-[2]">
            <RoryCharacter state="happy" childName={childName} />
          </motion.div>
          <p className="text-4xl font-bold text-green-600">Amazing!</p>
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

      {/* Main Character */}
      <div className="flex items-center justify-center h-screen">
        <AnimatePresence mode="wait">
          {showingAction && currentAction && (
            <motion.div
              key={`action-${attemptNumber}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                scale: { type: "spring", duration: 0.5 }
              }}
              className="transform scale-[3] filter drop-shadow-2xl"
            >
              <RoryCharacter state={currentAction.roryState} childName={childName} />
            </motion.div>
          )}

          {waitingForImitation && (
            <motion.div
              key="waiting"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="transform scale-[3] filter drop-shadow-2xl"
            >
              <RoryCharacter state="idle" childName={childName} />
            </motion.div>
          )}

          {!showingAction && !waitingForImitation && (
            <motion.div
              key="idle"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[280px] filter drop-shadow-2xl"
            >
              👫
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: '50px',
            opacity: 0.4
          }}
        >
          ✨
        </motion.div>
      ))}

      {/* Progress dots */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-4">
        {[...Array(TOTAL_ATTEMPTS)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              i < attemptNumber 
                ? 'bg-green-400 scale-110' 
                : i === attemptNumber 
                ? 'bg-blue-400 scale-125 animate-pulse' 
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default CopyTheFriend;
