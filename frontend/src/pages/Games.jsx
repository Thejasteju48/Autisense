import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { gamesAPI, childrenAPI } from '../services/api';

const GAMES = [
  {
    id: 'eye-contact',
    name: 'Follow the Friend',
    description: 'Help the character look at different objects',
    color: 'bg-gradient-to-br from-pink-400 to-pink-600',
    icon: '👀',
  },
  {
    id: 'imitation',
    name: 'Copy the Dance',
    description: 'Copy the fun movements',
    color: 'bg-gradient-to-br from-blue-400 to-blue-600',
    icon: '💃',
  },
  {
    id: 'emotion-matching',
    name: 'Happy Faces',
    description: 'Match the emotions',
    color: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    icon: '😊',
  },
  {
    id: 'gesture-mimic',
    name: 'Wave Hello',
    description: 'Show different gestures',
    color: 'bg-gradient-to-br from-green-400 to-green-600',
    icon: '👋',
  },
];

const Games = () => {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetchChild();
  }, [childId]);

  const fetchChild = async () => {
    try {
      const response = await childrenAPI.getOne(childId);
      setChild(response.data.data.child);
    } catch (error) {
      toast.error('Failed to load child');
    }
  };

  const startGame = (game) => {
    setSelectedGame(game);
    setPlaying(true);
    setScore(0);
  };

  const endGame = async () => {
    try {
      await gamesAPI.recordSession({
        childId,
        gameType: selectedGame.id,
        gameName: selectedGame.name,
        performance: {
          score,
          accuracy: 80,
          completionRate: 100,
          timeSpent: 120,
          attempts: 1,
          correctResponses: 8,
          incorrectResponses: 2,
        },
        observations: {
          engagementLevel: 'high',
        },
        duration: 120,
      });
      toast.success('Game session recorded!');
    } catch (error) {
      toast.error('Failed to record session');
    }
    setPlaying(false);
    setSelectedGame(null);
  };

  if (playing && selectedGame) {
    return (
      <div className="page-transition min-h-screen flex items-center justify-center">
        <div className={`${selectedGame.color} rounded-3xl p-12 text-white shadow-2xl max-w-2xl w-full`}>
          <div className="text-center">
            <div className="text-8xl mb-6 animate-bounce-slow">{selectedGame.icon}</div>
            <h2 className="text-4xl font-bold mb-4">{selectedGame.name}</h2>
            <p className="text-xl mb-8">Score: {score}</p>
            <div className="space-y-4">
              <button onClick={() => setScore(score + 10)} className="w-full bg-white text-gray-800 font-bold py-4 px-8 rounded-xl text-xl hover:scale-105 transition-all">
                Play Action
              </button>
              <button onClick={endGame} className="w-full bg-white/20 backdrop-blur text-white font-bold py-4 px-8 rounded-xl hover:bg-white/30 transition-all">
                End Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Fun Games</h1>
        {child && <p className="text-gray-600">Games for {child.name}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {GAMES.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="game-card"
            style={{ background: `linear-gradient(135deg, ${game.color.replace('bg-gradient-to-br ', '').split(' ').join(', ')})` }}
          >
            <div className="text-center text-white">
              <div className="text-6xl mb-4 animate-bounce-slow">{game.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{game.name}</h3>
              <p className="mb-6 opacity-90">{game.description}</p>
              <button
                onClick={() => startGame(game)}
                className="bg-white text-gray-800 font-bold py-3 px-8 rounded-xl hover:scale-105 transition-all shadow-lg"
              >
                Play Now
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Games;
