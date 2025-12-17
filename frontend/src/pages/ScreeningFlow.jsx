import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { childrenAPI, screeningAPI } from '../services/api';

// Import all 5 games
import MagicFriendMirror from '../components/games/MagicFriendMirror'; // Game 1: Eye Contact
import MakeMeLaugh from '../components/games/MakeMeLaugh'; // Game 2: Smile
import FriendWavesGoodbye from '../components/games/FriendWavesGoodbye'; // Game 3: Gesture
import FreeMagicSpace from '../components/games/FreeMagicSpace'; // Game 4: Repetitive
import CopyTheFriend from '../components/games/CopyTheFriend'; // Game 5: Imitation

/**
 * SCREENING FLOW - Orchestrates all 5 interactive games
 * 
 * Flow:
 * 1. Welcome Screen
 * 2. Game 1: Calling Friend (Eye Contact) - 35s
 * 3. Transition
 * 4. Game 2: Peek-a-Boo Surprise (Smile) - 25s
 * 5. Transition
 * 6. Game 3: Wave Back Friend (Gesture) - 30s
 * 7. Transition
 * 8. Game 4: Chase the Butterfly (Repetitive) - 50s
 * 9. Transition
 * 10. Game 5: Copy the Friend (Imitation) - 4 attempts
 * 11. Processing & Results
 * 
 * NO questionnaire during games - parent fills separately
 * STRICT: NO uploads, NO buttons for children, NO text instructions
 */

const ScreeningFlow = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  const [child, setChild] = useState(null);
  const [screeningId, setScreeningId] = useState(null);
  const [currentStage, setCurrentStage] = useState('welcome'); // welcome, game1, transition1, game2, transition2, game3, transition3, game4, transition4, game5, processing, complete
  const [allFrames, setAllFrames] = useState({
    eyeContact: [],
    smile: [],
    gesture: [],
    repetitive: [],
    imitation: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch child details
  useEffect(() => {
    fetchChildDetails();
  }, [childId]);

  const fetchChildDetails = async () => {
    try {
      const response = await childrenAPI.getOne(childId);
      const childData = response.data.data.child;
      setChild(childData);
      console.log('✓ Child loaded:', childData?.name || 'No name');
      
      // Start screening session
      const screeningResponse = await screeningAPI.start(childId);
      const newScreeningId = screeningResponse.data.data.screening._id;
      setScreeningId(newScreeningId);
      console.log('✓ Screening started:', newScreeningId);
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Failed to load child:', error);
      toast.error('Failed to load child profile');
      navigate('/dashboard');
    }
  };

  // Handle game completion
  const handleGame1Complete = (frames) => {
    console.log('✓ Game 1 completed, received', frames?.length || 0, 'frames');
    setAllFrames(prev => ({ ...prev, eyeContact: frames }));
    setCurrentStage('transition1');
    setTimeout(() => {
      console.log('→ Moving to Game 2');
      setCurrentStage('game2');
    }, 3000);
  };

  const handleGame2Complete = (frames) => {
    setAllFrames(prev => ({ ...prev, smile: frames }));
    setCurrentStage('transition2');
    setTimeout(() => setCurrentStage('game3'), 3000);
  };

  const handleGame3Complete = (frames) => {
    setAllFrames(prev => ({ ...prev, gesture: frames }));
    setCurrentStage('transition3');
    setTimeout(() => setCurrentStage('game4'), 3000);
  };

  const handleGame4Complete = (frames) => {
    setAllFrames(prev => ({ ...prev, repetitive: frames }));
    setCurrentStage('transition4');
    setTimeout(() => setCurrentStage('game5'), 3000);
  };

  const handleGame5Complete = async (frames) => {
    // Collect all frames including the current game 5 frames
    const completeFrames = {
      eyeContact: allFrames.eyeContact,
      smile: allFrames.smile,
      gesture: allFrames.gesture,
      repetitive: allFrames.repetitive,
      imitation: frames
    };
    
    setAllFrames(completeFrames);
    setCurrentStage('processing');
    
    // Send all frames to backend for processing
    try {
      // Extract just the base64 strings from frame objects
      // Games send: [{ frame: "base64...", timestamp: 123 }]
      // Backend expects: ["base64...", "base64..."]
      const extractFrames = (frameArray) => {
        if (!frameArray || frameArray.length === 0) return [];
        // Check if frames are objects with 'frame' property or just strings
        return frameArray.map(f => typeof f === 'string' ? f : f.frame);
      };
      
      const eyeContactFrames = extractFrames(completeFrames.eyeContact);
      const smileFrames = extractFrames(completeFrames.smile);
      const gestureFrames = extractFrames(completeFrames.gesture);
      const repetitiveFrames = extractFrames(completeFrames.repetitive);
      const imitationFrames = extractFrames(completeFrames.imitation);
      
      console.log('Processing frames:', {
        eyeContact: eyeContactFrames.length,
        smile: smileFrames.length,
        gesture: gestureFrames.length,
        repetitive: repetitiveFrames.length,
        imitation: imitationFrames.length
      });
      
      // Log sample frame data for debugging
      if (eyeContactFrames.length > 0) {
        const sample = eyeContactFrames[0];
        console.log('Sample frame:', {
          type: typeof sample,
          length: sample ? sample.length : 0,
          prefix: sample ? sample.substring(0, 30) : 'empty'
        });
      }
      
      // Process eye contact
      await screeningAPI.processEyeContact(screeningId, eyeContactFrames, 35);
      console.log('✓ Eye contact processed');
      
      // Process smile
      await screeningAPI.processSmile(screeningId, smileFrames, 25);
      console.log('✓ Smile processed');
      
      // Process gesture
      await screeningAPI.processGesture(screeningId, gestureFrames, 30);
      console.log('✓ Gesture processed');
      
      // Process repetitive
      await screeningAPI.processRepetitive(screeningId, repetitiveFrames, 50);
      console.log('✓ Repetitive processed');
      
      // Process imitation
      await screeningAPI.processImitation(screeningId, imitationFrames, 60);
      console.log('✓ Imitation processed');
      
      // Complete screening and get final results
      await screeningAPI.complete(screeningId);
      console.log('✓ Screening completed');
      
      // Redirect to results page
      setTimeout(() => {
        navigate(`/screening/${screeningId}/results`);
      }, 2000);
    } catch (error) {
      console.error('❌ Error completing screening:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Failed to complete screening');
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        
        {/* Welcome Screen */}
        {currentStage === 'welcome' && (
          <WelcomeScreen 
            key="welcome"
            childName={child?.name}
            onStart={() => setCurrentStage('game1')}
          />
        )}

        {/* Game 1: Calling Friend (Eye Contact) */}
        {currentStage === 'game1' && (
          <MagicFriendMirror
            key="game1"
            childName={child?.name}
            screeningId={screeningId}
            onComplete={handleGame1Complete}
          />
        )}

        {/* Transition 1 */}
        {currentStage === 'transition1' && (
          <TransitionScreen 
            key="transition1"
            message="Great job!"
            emoji="⭐"
            color="from-purple-500 via-pink-500 to-orange-400"
          />
        )}

        {/* Game 2: Peek-a-Boo Surprise (Smile) */}
        {currentStage === 'game2' && (
          <MakeMeLaugh
            key="game2"
            childName={child?.name}
            screeningId={screeningId}
            onComplete={handleGame2Complete}
          />
        )}

        {/* Transition 2 */}
        {currentStage === 'transition2' && (
          <TransitionScreen 
            key="transition2"
            message="Awesome!"
            emoji="😄🎉"
            color="from-purple-500 via-pink-500 to-orange-400"
          />
        )}

        {/* Game 3: Wave Back Friend (Gesture) */}
        {currentStage === 'game3' && (
          <FriendWavesGoodbye
            key="game3"
            childName={child?.name}
            screeningId={screeningId}
            onComplete={handleGame3Complete}
          />
        )}

        {/* Transition 3 */}
        {currentStage === 'transition3' && (
          <TransitionScreen 
            key="transition3"
            message="So fun!"
            emoji="👋✨"
            color="from-purple-500 via-pink-500 to-orange-400"
          />
        )}

        {/* Game 4: Chase the Butterfly (Repetitive) */}
        {currentStage === 'game4' && (
          <FreeMagicSpace
            key="game4"
            childName={child?.name}
            screeningId={screeningId}
            onComplete={handleGame4Complete}
          />
        )}

        {/* Transition 4 */}
        {currentStage === 'transition4' && (
          <TransitionScreen 
            key="transition4"
            message="Amazing!"
            emoji="🦋✨"
            color="from-purple-500 via-pink-500 to-orange-400"
          />
        )}

        {/* Game 5: Copy the Friend (Imitation) */}
        {currentStage === 'game5' && (
          <CopyTheFriend
            key="game5"
            childName={child?.name}
            screeningId={screeningId}
            onComplete={handleGame5Complete}
          />
        )}

        {/* Processing Screen */}
        {currentStage === 'processing' && (
          <ProcessingScreen 
            key="processing"
            childName={child?.name}
          />
        )}

        {/* Complete Screen */}
        {currentStage === 'complete' && (
          <CompleteScreen 
            key="complete"
            childName={child?.name}
          />
        )}

      </AnimatePresence>
    </div>
  );
};

// Welcome Screen Component
const WelcomeScreen = ({ childName, onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 relative overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[200px] mb-8"
        >
          🎮
        </motion.div>
        
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Hi {childName}!
        </h1>
        
        <p className="text-3xl text-gray-600 mb-12">
          Let's play some fun games! 🌟
        </p>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-3xl font-bold py-8 px-16 rounded-full shadow-2xl"
        >
          Let's Play! 🚀
        </motion.button>
      </motion.div>
      
      {/* Floating elements */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(i) * 20, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2
          }}
          style={{
            position: 'absolute',
            left: `${10 + i * 8}%`,
            top: `${20 + (i % 3) * 25}%`,
            fontSize: '60px',
            opacity: 0.4
          }}
        >
          {['⭐', '🌟', '✨', '💫', '🎈'][i % 5]}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Transition Screen Component
const TransitionScreen = ({ message, emoji, color }) => {
  // Always use the same gradient for consistency
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 relative overflow-hidden"
    >
      {/* Confetti effect */}
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-5xl"
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
            duration: 2 + Math.random() * 1.5,
            delay: Math.random() * 0.5,
            ease: "easeOut"
          }}
        >
          {['🎉', '⭐', '🎊', '💫', '🌟', '✨'][Math.floor(Math.random() * 6)]}
        </motion.div>
      ))}
      
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.6 }}
        className="text-center relative z-10"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.4, 1],
            rotate: [0, 360]
          }}
          transition={{ 
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 2, repeat: Infinity, ease: "linear" }
          }}
          className="text-[250px] mb-8 drop-shadow-2xl"
        >
          {emoji}
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            opacity: { delay: 0.3 },
            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="text-7xl font-black text-white"
          style={{ textShadow: '6px 6px 12px rgba(0,0,0,0.4)' }}
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

// Processing Screen Component
const ProcessingScreen = ({ childName }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 relative overflow-hidden"
    >
      {/* Animated background stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-6xl"
          animate={{
            rotate: 360,
            scale: [0.5, 1.2, 0.5],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
        >
          {['⭐', '✨', '💫', '🌟'][Math.floor(Math.random() * 4)]}
        </motion.div>
      ))}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity }
          }}
          className="text-[150px] mb-8"
        >
          ✨
        </motion.div>
        
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Processing Results...
        </h1>
        
        <p className="text-2xl text-gray-600">
          Analyzing {childName}'s interactions
        </p>
        
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mt-8"
        >
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Complete Screen Component
const CompleteScreen = ({ childName }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-blue-100 to-purple-100"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 2, repeat: 3 }}
          className="text-[200px] mb-8"
        >
          🏆
        </motion.div>
        
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          Amazing, {childName}!
        </h1>
        
        <p className="text-4xl text-gray-600 mb-8">
          You played all the games! 🎉
        </p>
        
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-7xl"
        >
          ⭐🌟✨
        </motion.div>
      </motion.div>

      {/* Confetti effect */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, opacity: 1 }}
          animate={{ 
            y: window.innerHeight + 100,
            x: Math.sin(i * 2) * 200,
            rotate: 360 * (i % 3)
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.1
          }}
          style={{
            position: 'absolute',
            left: `${5 + i * 3}%`,
            fontSize: '40px'
          }}
        >
          {['🎉', '🎊', '⭐', '🌟', '✨', '💫'][i % 6]}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ScreeningFlow;
