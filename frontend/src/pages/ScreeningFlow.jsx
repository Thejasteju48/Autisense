import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { childrenAPI, screeningAPI } from '../services/api';
import VideoInputSelector from '../components/VideoInputSelector';
import VideoRecorder from '../components/VideoRecorder';
import VideoUploader from '../components/VideoUploader';
import { PlayIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * BATCH VIDEO-BASED AUTISM SCREENING FLOW
 * 
 * Flow:
 * 1. Welcome screen with instructions
 * 2. Live video capture (5 minutes) with real-time frame analysis  
 * 3. Questionnaire for parent observations
 * 4. Processing and ML analysis
 * 5. Results display
 */

const ScreeningFlow = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  const [child, setChild] = useState(null);
  const [screeningId, setScreeningId] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome'); 
  // Steps: welcome -> video-select -> video-record/video-upload -> questionnaire -> processing -> complete
  const [loading, setLoading] = useState(true);
  const [videoData, setVideoData] = useState(null);
  const [videoInputMethod, setVideoInputMethod] = useState(null); // 'live-recording' or 'pre-recorded'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (!childId) {
      toast.error('Invalid child profile');
      navigate('/dashboard');
      return;
    }

    fetchChildDetails();
  }, [childId]);

  const fetchChildDetails = async () => {
    try {
      setLoading(true);
      
      // Load child details
      const childResponse = await childrenAPI.getOne(childId);
      setChild(childResponse.data.data.child);

      // Start screening session
      const screeningResponse = await screeningAPI.start(childId, 'Live Video');
      setScreeningId(screeningResponse.data.data.screening._id);

      setLoading(false);
    } catch (error) {
      console.error('❌ Failed to load child:', error);
      toast.error(error.response?.data?.message || 'Failed to load child profile');
      navigate('/dashboard');
    }
  };

  const handleStartAssessment = () => {
    setCurrentStep('video-select');
  };
  
  const handleVideoInputSelect = (method) => {
    setVideoInputMethod(method);
    if (method === 'live-recording') {
      setCurrentStep('video-record');
    } else {
      setCurrentStep('video-upload');
    }
  };
  
  const handleBackToSelect = () => {
    setVideoInputMethod(null);
    setCurrentStep('video-select');
  };

  const handleVideoComplete = async (data) => {
    console.log('✅ Video capture/upload complete:', {
      videoSource: data.videoSource,
      duration: data.duration,
      hasVideoData: !!data.videoData,
      videoDataKeys: data.videoData ? Object.keys(data.videoData) : []
    });
    setVideoData(data);
    setCurrentStep('questionnaire');
  };

  const handleQuestionnaireSubmit = async (questionnaireData) => {
    console.log('📋 Submitting questionnaire:', {
      responseCount: questionnaireData.responses?.length,
      age: questionnaireData.age,
      sex: questionnaireData.sex,
      jaundice: questionnaireData.jaundice,
      family_asd: questionnaireData.family_asd,
      hasVideoData: !!videoData,
      videoSource: videoData?.videoSource,
      videoDataKeys: videoData?.videoData ? Object.keys(videoData.videoData) : []
    });
    
    setCurrentStep('processing');
    try {
      // Submit questionnaire along with video data
      const videoFeaturesToSend = videoData?.videoData || {};
      console.log('📤 Sending video features to backend:', videoFeaturesToSend);
      
      const submitRes = await screeningAPI.submitQuestionnaire(screeningId, {
        responses: questionnaireData.responses,
        jaundice: questionnaireData.jaundice,
        family_asd: questionnaireData.family_asd,
        videoData: videoFeaturesToSend,
        videoSource: videoData?.videoSource || 'pre-recorded'
      });
      
      console.log('✅ Questionnaire submitted successfully:', submitRes.data);
      
      // Complete screening and get ML prediction
      const completeRes = await screeningAPI.complete(screeningId);
      
      setCurrentStep('complete');
      
      setTimeout(() => {
        navigate(`/screening/${screeningId}/results`);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error processing screening:', error);
      const errorMessage = error.response?.data?.message || 'Failed to complete screening';
      toast.error(errorMessage);
      setCurrentStep('questionnaire');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mb-4 mx-auto"></div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Screen */}
      {currentStep === 'welcome' && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-12"
          >
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Live Video Autism Screening
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Assessment for {child?.name}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Age: {child?.age} months • Gender: {child?.gender}
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-purple-900 mb-4">
                What to Expect
              </h2>
              <div className="space-y-3 text-purple-800">
                <div className="flex items-start">
                  <span className="font-bold mr-3">1.</span>
                  <div>
                    <span className="font-semibold">Live Video Recording (5 min)</span>
                    <p className="text-sm">Natural behavior observation through webcam</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-bold mr-3">2.</span>
                  <div>
                    <span className="font-semibold">Parent Questionnaire</span>
                    <p className="text-sm">Answer questions about your child's behavior</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-bold mr-3">3.</span>
                  <div>
                    <span className="font-semibold">AI Analysis</span>
                    <p className="text-sm">Automatic behavior pattern analysis</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-bold mr-3">4.</span>
                  <div>
                    <span className="font-semibold">Results & Recommendations</span>
                    <p className="text-sm">Comprehensive screening report</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <p className="text-yellow-900 text-sm">
                <strong>Important:</strong> This is a screening tool, not a diagnostic assessment. 
                Results should be discussed with a healthcare professional.
              </p>
            </div>

            <button
              onClick={handleStartAssessment}
              className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition shadow-lg flex items-center justify-center space-x-2"
            >
              <PlayIcon className="w-6 h-6" />
              <span>Begin Assessment</span>
            </button>
          </motion.div>
        </div>
      )}

      {/* Video Input Selection Screen */}
      {currentStep === 'video-select' && (
        <VideoInputSelector onSelect={handleVideoInputSelect} />
      )}

      {/* Live Video Recording Screen */}
      {currentStep === 'video-record' && (
        <div className="py-12 px-6">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Live Video Recording
            </h2>
            <p className="text-gray-600">
              Recording natural behavior for {child?.name}
            </p>
          </div>
          
          <VideoRecorder
            screeningId={screeningId}
            duration={240}
            onComplete={handleVideoComplete}
          />
          
          <div className="text-center mt-6">
            <button
              onClick={handleBackToSelect}
              className="text-gray-600 hover:text-gray-900 underline"
            >
              ← Back to selection
            </button>
          </div>
        </div>
      )}
      
      {/* Video Upload Screen */}
      {currentStep === 'video-upload' && (
        <VideoUploader
          screeningId={screeningId}
          onComplete={handleVideoComplete}
          onBack={handleBackToSelect}
        />
      )}

      {/* Questionnaire Screen */}
      {currentStep === 'questionnaire' && (
        <div className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="text-center mb-8">
                <DocumentTextIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Parent Questionnaire
                </h2>
                <p className="text-gray-600">
                  Please answer these questions based on your observations of {child?.name}
                </p>
              </div>

              <QuestionnaireForm child={child} onSubmit={handleQuestionnaireSubmit} />
            </motion.div>
          </div>
        </div>
      )}

      {/* Processing Screen */}
      {currentStep === 'processing' && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-white"
          >
            <div className="animate-pulse mb-6">
              <div className="text-6xl mb-4">🧠</div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Analyzing Results...</h2>
            <p className="text-xl mb-8">Our AI is processing the video and responses</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Complete Screen */}
      {currentStep === 'complete' && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-500 to-green-700">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="text-center text-white"
          >
            <CheckCircleIcon className="w-24 h-24 mx-auto mb-6" />
            <h2 className="text-4xl font-bold mb-4">Assessment Complete!</h2>
            <p className="text-xl">Redirecting to results...</p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// Questionnaire Form Component
const QuestionnaireForm = ({ onSubmit, child }) => {
  const [responses, setResponses] = useState({});
  const [additionalInfo, setAdditionalInfo] = useState({
    jaundice: '',
    family_asd: ''
  });
  
  // 20 Questions matching the trained model
  const questions = [
    // Questions 1-10 (Set A)
    { id: 1, text: 'Does your child respond to their name?' },
    { id: 2, text: 'Does your child turn toward you when you speak?' },
    { id: 3, text: 'Does your child try to show you things they want?' },
    { id: 4, text: 'Does your child share interest with you?' },
    { id: 5, text: 'Does your child engage in pretend play?' },
    { id: 6, text: 'Does your child look where you point?' },
    { id: 7, text: 'Does your child show empathy?' },
    { id: 8, text: 'Are your child\'s words clear?' },
    { id: 9, text: 'Does your child use nodding or gestures?' },
    { id: 10, text: 'Does your child stare blankly often?' },
    
    // Questions 11-20 (Set B - similar meaning)
    { id: 11, text: 'Does your child respond when you call for attention?' },
    { id: 12, text: 'Does your child react to sudden sounds?' },
    { id: 13, text: 'Does your child bring items to you for help?' },
    { id: 14, text: 'Does your child try to share things with you?' },
    { id: 15, text: 'Does your child imitate pretend actions?' },
    { id: 16, text: 'Does your child understand pointing gestures?' },
    { id: 17, text: 'Does your child respond emotionally to others?' },
    { id: 18, text: 'Does your child speak clearly to family members?' },
    { id: 19, text: 'Does your child use gestures during communication?' },
    { id: 20, text: 'Does your child seem withdrawn sometimes?' },
  ];

  const handleResponseChange = (questionId, answer) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all questions answered
    if (Object.keys(responses).length < questions.length) {
      toast.error('Please answer all questions');
      return;
    }

    // Validate additional info
    if (!additionalInfo.jaundice || !additionalInfo.family_asd) {
      toast.error('Please provide jaundice and family history information');
      return;
    }

    // Format for backend API (needs questionId, question, answer objects)
    const formattedResponses = questions.map(q => ({
      questionId: q.id,
      question: q.text,
      answer: responses[q.id]
    }));
    
    const questionnaireData = {
      responses: formattedResponses, // Array of {questionId, question, answer} objects
      age: child.ageInMonths, // Child age in months (from database field)
      sex: child.gender, // 'male', 'female', or 'other'
      jaundice: additionalInfo.jaundice,
      family_asd: additionalInfo.family_asd
    };

    onSubmit(questionnaireData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {questions.map((question) => (
        <div key={question.id} className="border-b border-gray-200 pb-4">
          <p className="text-gray-900 font-medium mb-3">
            {question.id}. {question.text}
          </p>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleResponseChange(question.id, true)}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                responses[question.id] === true
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => handleResponseChange(question.id, false)}
              className={`flex-1 py-3 rounded-lg font-semibold transition ${
                responses[question.id] === false
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No
            </button>
          </div>
        </div>
      ))}

      {/* Additional Information */}
      <div className="border-t-2 border-purple-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Was jaundice present at birth?
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setAdditionalInfo(prev => ({ ...prev, jaundice: 'yes' }))}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  additionalInfo.jaundice === 'yes'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setAdditionalInfo(prev => ({ ...prev, jaundice: 'no' }))}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  additionalInfo.jaundice === 'no'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Does the family have a history of autism?
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setAdditionalInfo(prev => ({ ...prev, family_asd: 'yes' }))}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  additionalInfo.family_asd === 'yes'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setAdditionalInfo(prev => ({ ...prev, family_asd: 'no' }))}
                className={`flex-1 py-3 rounded-lg font-semibold transition ${
                  additionalInfo.family_asd === 'no'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-purple-700 transition shadow-lg"
      >
        Submit Questionnaire
      </button>
    </form>
  );
};

export default ScreeningFlow;
