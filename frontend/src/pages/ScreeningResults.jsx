import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { screeningAPI } from '../services/api';

const ScreeningResults = () => {
  const { screeningId } = useParams();
  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, [screeningId]);

  const fetchResults = async () => {
    try {
      const response = await screeningAPI.getOne(screeningId);
      console.log('Fetched screening:', response.data);
      console.log('mlQuestionnaireScore:', response.data.data.screening.mlQuestionnaireScore);
      console.log('finalScore:', response.data.data.screening.finalScore);
      console.log('riskLevel:', response.data.data.screening.riskLevel);
      setScreening(response.data.data.screening);
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'from-green-400 to-green-600';
      case 'Moderate': return 'from-yellow-400 to-yellow-600';
      case 'High': return 'from-red-400 to-red-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div></div>;
  
  if (!screening) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No screening data found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card mb-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Autisense Screening Report</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">Screening Results</h1>
              <p className="text-sm text-gray-600 mt-2">Completed: {new Date(screening.completedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back</button>
            </div>
          </div>

          {/* Final Score & Risk Level - Primary Display */}
          <div className="rounded-2xl border border-purple-100 bg-white/90 p-8 mb-8 shadow-sm">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Overall Risk Level</p>
                <div className={`inline-flex items-center rounded-full bg-gradient-to-r ${getRiskColor(screening.riskLevel)} px-6 py-3 text-white font-bold text-lg`}> 
                  {screening.riskLevel} Risk
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Final Score</p>
                <p className="text-5xl font-bold text-gray-900">{screening.finalScore.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Video Features (Movements Detected) */}
          {screening.liveVideoFeatures && (
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Video Analysis</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Movements & Behaviors Detected</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-2">👀 Eye Contact</p>
                  <p className="text-base font-medium text-gray-800">{screening.liveVideoFeatures.eyeContact || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-yellow-100 bg-yellow-50/70 p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-2">🤕 Head Stimming</p>
                  <p className="text-base font-medium text-gray-800">{screening.liveVideoFeatures.headStimming || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-2">✋ Hand Stimming</p>
                  <p className="text-base font-medium text-gray-800">{screening.liveVideoFeatures.handStimming || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-green-100 bg-green-50/70 p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-2">🤲 Hand Gesture</p>
                  <p className="text-base font-medium text-gray-800">{screening.liveVideoFeatures.handGesture || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-2">🔄 Social Reciprocity</p>
                  <p className="text-base font-medium text-gray-800">{screening.liveVideoFeatures.socialReciprocity || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-2">😊 Emotion Variation</p>
                  <p className="text-base font-medium text-gray-800">{screening.liveVideoFeatures.emotionVariation || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Questionnaire Score */}
          {screening.questionnaire && (
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Questionnaire Results</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Parent/Guardian Assessment</h3>
              <div className="rounded-xl border border-green-200 bg-green-50/70 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Questions Answered</p>
                    <p className="text-3xl font-bold text-gray-900">{screening.questionnaire.responses?.length || 0} of 20</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Questionnaire Score</p>
                    <p className="text-3xl font-bold text-green-700">{Math.round(screening.mlQuestionnaireScore || 0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interpretation Summary */}
          {screening.interpretation && (
            <div className="mb-8 p-6 bg-blue-50/70 rounded-xl border border-blue-200">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-600 mb-2">Summary</p>
              <h3 className="text-lg font-bold text-blue-900 mb-3">Assessment Overview</h3>
              <p className="text-gray-800 leading-relaxed">{screening.interpretation.summary}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-6 border-t">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">View History</button>
            <button onClick={() => navigate('/new-screening')} className="btn-outline">Start New Screening</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScreeningResults;
