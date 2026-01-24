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
      setScreening(response.data.data.screening);
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await screeningAPI.downloadReport(screeningId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `screening-report-${screeningId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded!');
    } catch (error) {
      toast.error('Failed to download report');
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
    <div className="page-transition max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-6">Screening Results</h1>
          
          <div className={`bg-gradient-to-r ${getRiskColor(screening.riskLevel)} rounded-2xl p-8 text-white mb-6`}>
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-2">{screening.finalScore.toFixed(1)}%</h2>
              <p className="text-xl">{screening.riskLevel} Risk Level</p>
              <p className="text-sm mt-2 opacity-90">Completed on {new Date(screening.completedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {screening.interpretation && (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">Summary</h3>
                <p className="text-gray-700">{screening.interpretation.summary}</p>
              </div>

              {screening.interpretation.llmAnalysis && (
                <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                  <div className="flex items-center mb-4">
                    <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <h3 className="text-xl font-bold text-indigo-900">AI-Enhanced Clinical Analysis</h3>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {screening.interpretation.llmAnalysis}
                  </div>
                </div>
              )}

              {screening.interpretation.componentScores && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3">Video Behavior Analysis</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2">👁️ Eye Contact</h4>
                      <p className="text-sm text-gray-700">Score: {screening.interpretation.componentScores.eye_contact.toFixed(1)}/100</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold mb-2">😊 Facial Expressions</h4>
                      <p className="text-sm text-gray-700">Score: {screening.interpretation.componentScores.facial_expression.toFixed(1)}/100</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">👋 Gestures</h4>
                      <p className="text-sm text-gray-700">Score: {screening.interpretation.componentScores.gesture_frequency.toFixed(1)}/100</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold mb-2">🔄 Repetitive Behaviors</h4>
                      <p className="text-sm text-gray-700">
                        Head: {screening.interpretation.componentScores.head_repetition.toFixed(1)}/100<br/>
                        Hand: {screening.interpretation.componentScores.hand_repetition.toFixed(1)}/100
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">👀 Eye Contact</h4>
                  <p className="text-sm text-gray-700">{screening.interpretation.eyeContactInsights}</p>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg">
                  <h4 className="font-semibold mb-2">😊 Smiles</h4>
                  <p className="text-sm text-gray-700">{screening.interpretation.smileInsights}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">👋 Gestures</h4>
                  <p className="text-sm text-gray-700">{screening.interpretation.gestureInsights}</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold mb-2">🔄 Repetitive Behaviors</h4>
                  <p className="text-sm text-gray-700">{screening.interpretation.repetitiveInsights}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold mb-2">👫 Imitation</h4>
                  <p className="text-sm text-gray-700">{screening.interpretation.imitationInsights}</p>
                </div>
              </div>

              {screening.interpretation.questionnaireInsights && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">📋 Questionnaire Insights</h4>
                  <p className="text-sm text-gray-700">{screening.interpretation.questionnaireInsights}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {screening.interpretation.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-primary-500 mr-2">✓</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <div className="flex space-x-4">
            <button onClick={downloadReport} className="btn-primary">Download PDF Report</button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back to Dashboard</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScreeningResults;
