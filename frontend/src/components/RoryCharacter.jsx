import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

/**
 * Rory - Interactive Character for Autism Screening
 * 
 * Rory is a virtual social partner designed to:
 * - Elicit natural behaviors from children
 * - Reduce anxiety during screening
 * - Encourage spontaneous responses
 * 
 * IMPORTANT: Rory does NOT:
 * - Give points or scores
 * - Force actions
 * - Pressure the child
 */

const RoryCharacter = ({ state = 'idle', onAnimationComplete, childName }) => {
  const [expression, setExpression] = useState('happy');

  // State machine for Rory behaviors
  const roryStates = {
    idle: {
      body: { scale: 1, rotate: 0, y: 0 },
      eyes: { scale: 1 },
      mouth: 'M 40 60 Q 50 70 60 60',
      duration: 2
    },
    wave: {
      body: { scale: 1, rotate: [0, -5, 5, 0], y: 0 },
      eyes: { scale: 1 },
      mouth: 'M 40 60 Q 50 75 60 60',
      duration: 1.5
    },
    wait: {
      body: { scale: 1, rotate: 0, y: [0, -5, 0] },
      eyes: { scale: [1, 0.1, 1] },
      mouth: 'M 40 60 Q 50 70 60 60',
      duration: 3
    },
    react: {
      body: { scale: [1, 1.1, 1], rotate: 0, y: 0 },
      eyes: { scale: 1.2 },
      mouth: 'M 40 60 Q 50 80 60 60',
      duration: 1
    },
    sad: {
      body: { scale: 1, rotate: 0, y: 5 },
      eyes: { scale: 0.8 },
      mouth: 'M 40 70 Q 50 60 60 70',
      duration: 2
    },
    happy: {
      body: { scale: 1.05, rotate: 0, y: -5 },
      eyes: { scale: 1.1 },
      mouth: 'M 40 55 Q 50 80 60 55',
      duration: 1.5
    }
  };

  const currentState = roryStates[state] || roryStates.idle;

  useEffect(() => {
    if (state === 'sad') setExpression('sad');
    if (state === 'happy' || state === 'react') setExpression('happy');
  }, [state]);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Rory SVG Character */}
      <motion.svg
        width="200"
        height="250"
        viewBox="0 0 100 125"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {/* Body */}
        <motion.g
          animate={currentState.body}
          transition={{
            duration: currentState.duration,
            ease: 'easeInOut',
            repeat: state === 'wait' ? Infinity : 0
          }}
          onAnimationComplete={onAnimationComplete}
        >
          {/* Head */}
          <circle cx="50" cy="50" r="30" fill="#FFE5B4" stroke="#FFA07A" strokeWidth="2" />
          
          {/* Eyes */}
          <motion.g animate={currentState.eyes} transition={{ duration: 0.3 }}>
            <circle cx="40" cy="45" r="4" fill="#333" />
            <circle cx="60" cy="45" r="4" fill="#333" />
            {/* Eye sparkles */}
            <circle cx="41" cy="44" r="1.5" fill="white" />
            <circle cx="61" cy="44" r="1.5" fill="white" />
          </motion.g>

          {/* Mouth */}
          <motion.path
            d={currentState.mouth}
            stroke="#FF6B6B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            animate={{ d: currentState.mouth }}
            transition={{ duration: 0.5 }}
          />

          {/* Rosy cheeks */}
          <circle cx="35" cy="55" r="3" fill="#FFB6C1" opacity="0.6" />
          <circle cx="65" cy="55" r="3" fill="#FFB6C1" opacity="0.6" />

          {/* Body/Torso */}
          <ellipse cx="50" cy="95" rx="25" ry="20" fill="#87CEEB" />
          
          {/* Arms */}
          <motion.ellipse
            cx={state === 'wave' ? '25' : '30'}
            cy="90"
            rx="8"
            ry="15"
            fill="#FFE5B4"
            animate={{
              rotate: state === 'wave' ? [-20, 20, -20] : 0,
              x: state === 'wave' ? [-5, 5, -5] : 0
            }}
            transition={{
              duration: 1,
              repeat: state === 'wave' ? 3 : 0
            }}
          />
          <ellipse cx="70" cy="90" rx="8" ry="15" fill="#FFE5B4" />
        </motion.g>

        {/* Decorative elements */}
        {state === 'react' && (
          <motion.g
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
            transition={{ duration: 1 }}
          >
            <circle cx="30" cy="30" r="2" fill="#FFD700" />
            <circle cx="70" cy="30" r="2" fill="#FFD700" />
            <circle cx="50" cy="20" r="2" fill="#FFD700" />
          </motion.g>
        )}
      </motion.svg>

      {/* Speech bubble (optional) */}
      {childName && state === 'wait' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-white rounded-2xl px-6 py-3 shadow-lg relative"
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 
                          border-l-8 border-r-8 border-b-8 
                          border-l-transparent border-r-transparent border-b-white"></div>
          <p className="text-lg font-medium text-gray-700">
            Hi {childName}! 👋
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default RoryCharacter;
