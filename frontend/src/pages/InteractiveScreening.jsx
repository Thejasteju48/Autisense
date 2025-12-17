import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { childrenAPI } from '../services/api';
import axios from 'axios';

// Import game components
import EyeContactGameV2 from '../components/games/EyeContactGameV2';
import GestureGameV2 from '../components/games/GestureGameV2';
import SmileGameV2 from '../components/games/SmileGameV2';
import RepetitiveBehaviorGame from '../components/games/RepetitiveBehaviorGame';

/**
 * New Interactive Screening Flow with Rory
 * 
 * REPLACES: Video upload approach
 * IMPLEMENTS: Live interaction-based feature extraction
 * 
 * FLOW:
 * 1. Introduction & camera permission
 * 2. Eye Contact Game (30s)
 * 3. Gesture Game (30s)
 * 4. Smile Game (30s)
 * 5. Free Play / Repetitive Behavior (40s)
 * 6. Questionnaire
 * 7. Final Results
 */

const InteractiveScreening = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  const [child, setChild] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentStep, setCurrentStep] = useState('intro'); // intro, eye-contact, gesture, smile, repetitive, questionnaire, results
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({
    eyeContact: null,
    gesture: null,
    smile: null,
    repetitive: null
  });
  const [questionnaireResponses, setQuestionnaireResponses] = useState({});
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Questionnaire questions
  const questions = [
    { id: 1, question: 'Does the child make eye contact during conversations?' },
    { id: 2, question: 'Does the child respond to their name when called?' },
    { id: 3, question: 'Does the child show interest in other children?' },
    { id: 4, question: 'Does the child engage in pretend play?' },
    { id: 5, question: 'Does the child point to show interest in something?' },
    { id: 6, question: 'Does the child have repetitive movements or behaviors?' },
    { id: 7, question: 'Does the child have difficulty with changes in routine?' },
    { id: 8, question: 'Does the child have unusual reactions to sounds or textures?' }
  ];

  /**
   * Load child data and create session
   */
  useEffect(() => {
    const initializeScreening = async () => {
      try {
        // Get child data
        const childResponse = await childrenAPI.getOne(childId);
        setChild(childResponse.data.data.child);

        // Create screening session
        const sessionResponse = await axios.post(`${API_URL}/screenings/start`, 
          { childId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        setSessionId(sessionResponse.data.data.screening._id);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing screening:', error);
        toast.error('Failed to start screening');
        navigate('/dashboard');
      }
    };

    initializeScreening();
  }, [childId]);

  /**
   * Handle game completion
   */
  const handleGameComplete = (gameType, result) => {
    setResults(prev => ({ ...prev, [gameType]: result }));
    
    // Move to next step
    const stepFlow = {
      'eye-contact': 'gesture',
      'gesture': 'smile',
      'smile': 'repetitive',
      'repetitive': 'questionnaire'
    };
    
    setTimeout(() => {
      setCurrentStep(stepFlow[currentStep]);
    }, 2000);
  };

  /**
   * Handle questionnaire submission
   */
  const handleQuestionnaireSubmit = async () => {
    if (Object.keys(questionnaireResponses).length < questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    setLoading(true);

    try {
      // Submit questionnaire
      const responseArray = Object.entries(questionnaireResponses).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer
      }));

      await axios.post(
        `${API_URL}/screenings/${sessionId}/questionnaire`,
        { responses: responseArray },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Complete screening and get final results
      await axios.post(
        `${API_URL}/screenings/${sessionId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      setCurrentStep('results');
      toast.success('Screening completed!');
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      toast.error('Failed to complete screening');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start interactive games
   */
  const startInteractiveGames = () => {
    setCurrentStep('eye-contact');
  };

  if (loading && !child) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      
      {/* Introduction Screen */}
      <AnimatePresence>
        {currentStep === 'intro' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-8"
          >
            <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-12">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-6">
                  🎮 Interactive Autism Screening
                </h1>
                
                <div className="mb-8">
                  <p className="text-xl text-gray-700 mb-2">
                    Screening for: <span className="font-bold text-blue-600">{child?.name}</span>
                  </p>
                  <p className="text-gray-600">
                    Age: {child?.age} years | Gender: {child?.gender}
                  </p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 text-left">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">📋 What to Expect:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span><strong>Eye Contact Game</strong> - Rory will try to get {child?.name}'s attention (30s)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">2.</span>
                      <span><strong>Gesture Game</strong> - Rory will wave and interact (30s)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">3.</span>
                      <span><strong>Smile Game</strong> - Help cheer up Rory (30s)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold">4.</span>
                      <span><strong>Free Play</strong> - Natural movement observation (40s)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-pink-600 font-bold">5.</span>
                      <span><strong>Questionnaire</strong> - Quick parent questions</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8">
                  <p className="text-gray-800">
                    <strong className="text-yellow-700">⚠️ Important:</strong><br />
                    • Camera access is required<br />
                    • All processing happens live - no videos are stored<br />
                    • Let {child?.name} respond naturally - no pressure!<br />
                    • Total time: About 5-7 minutes
                  </p>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-8">
                  <p className="text-sm text-gray-700">
                    <strong>Privacy Notice:</strong> This is a screening support tool, not a medical diagnosis. 
                    No video recordings are made. Only computed metrics are stored.
                  </p>
                </div>

                <button
                  onClick={startInteractiveGames}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-2xl font-bold py-5 px-16 rounded-full transition-all shadow-lg transform hover:scale-105"
                >
                  Start Screening 🚀
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Components */}
      {currentStep === 'eye-contact' && (
        <EyeContactGameV2
          childName={child?.name}
          sessionId={sessionId}
          onComplete={(result) => handleGameComplete('eyeContact', result)}
        />
      )}

      {currentStep === 'gesture' && (
        <GestureGameV2
          childName={child?.name}
          sessionId={sessionId}
          onComplete={(result) => handleGameComplete('gesture', result)}
        />
      )}

      {currentStep === 'smile' && (
        <SmileGameV2
          childName={child?.name}
          sessionId={sessionId}
          onComplete={(result) => handleGameComplete('smile', result)}
        />
      )}

      {currentStep === 'repetitive' && (
        <RepetitiveBehaviorGame
          childName={child?.name}
          sessionId={sessionId}
          onComplete={(result) => handleGameComplete('repetitive', result)}
        />
      )}

      {/* Questionnaire */}
      <AnimatePresence>
        {currentStep === 'questionnaire' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center p-8"
          >
            <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                📝 Parent Questionnaire
              </h2>
              
              <p className="text-center text-gray-600 mb-8">
                Please answer these questions about {child?.name}'s typical behavior
              </p>

              <div className="space-y-6">
                {questions.map((q) => (
                  <div key={q.id} className="bg-gray-50 rounded-2xl p-6">
                    <p className="text-gray-800 font-medium mb-4">{q.question}</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setQuestionnaireResponses({ ...questionnaireResponses, [q.id]: true })}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          questionnaireResponses[q.id] === true
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setQuestionnaireResponses({ ...questionnaireResponses, [q.id]: false })}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          questionnaireResponses[q.id] === false
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleQuestionnaireSubmit}
                disabled={loading || Object.keys(questionnaireResponses).length < questions.length}
                className="w-full mt-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl font-bold py-4 rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Complete Screening'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {currentStep === 'results' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen flex items-center justify-center p-8"
          >
            <div className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
              <div className="text-7xl mb-6">🎉</div>
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Screening Complete!
              </h2>
              
              <p className="text-xl text-gray-600 mb-8">
                Results are being generated for {child?.name}
              </p>

              <button
                onClick={() => navigate(`/screening/${sessionId}/results`)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-xl font-bold py-4 px-12 rounded-full transition-all shadow-lg"
              >
                View Results
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveScreening;
