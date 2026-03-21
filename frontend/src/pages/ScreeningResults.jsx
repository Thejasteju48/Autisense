import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { screeningAPI, centersAPI } from '../services/api';

// Progress Ring Component
const ProgressRing = ({ percentage = 0, color = 'blue', size = 100, strokeWidth = 8 }) => {
  const normalizedRadius = (size - strokeWidth) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colorMap = {
    green: '#16a34a',
    blue: '#2563eb',
    red: '#dc2626',
    yellow: '#eab308'
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={size} width={size} className="transform -rotate-90">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={colorMap[color] || colorMap['blue']}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: colorMap[color] || colorMap['blue'] }}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

const ScreeningResults = () => {
  const { screeningId } = useParams();
  const [screening, setScreening] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [centers, setCenters] = useState([]);
  const [centersLoading, setCentersLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, [screeningId]);

  const fetchResults = async () => {
    try {
      const response = await screeningAPI.getOne(screeningId);
      console.log('===== SCREENING RESULTS LOADED =====');
      console.log('Full Screening Data:', response.data.data.screening);
      console.log('Questionnaire Score:', response.data.data.screening.mlQuestionnaireScore);
      console.log('Video Score:', response.data.data.screening.videoScore);
      console.log('Combined Score:', response.data.data.screening.finalScore);
      console.log('Risk Level:', response.data.data.screening.riskLevel);
      const screeningData = response.data.data.screening;
      setScreening(screeningData);

      const city = screeningData?.user?.city;
      const state = screeningData?.user?.state;
      const country = screeningData?.user?.country;

      if (city) {
        setCentersLoading(true);
        try {
          const centersResponse = await centersAPI.getNearby({ city, state, country });
          setCenters(centersResponse?.data?.data?.centers || []);
        } catch (centerError) {
          console.error('Failed to load nearby centers:', centerError);
          setCenters([]);
        } finally {
          setCentersLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setReportLoading(true);
    try {
      const response = await screeningAPI.downloadReport(screeningId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const childName = screening?.child?.name || 'child';
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `autism-screening-report-${childName}-${dateStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setReportLoading(false);
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

  const getRiskBgColor = (level) => {
    switch (level) {
      case 'Low': return '#f0fdf4';
      case 'Moderate': return '#fffbeb';
      case 'High': return '#fef2f2';
      default: return '#f3f4f6';
    }
  };

  const getRiskTextColor = (level) => {
    switch (level) {
      case 'Low': return '#15803d';
      case 'Moderate': return '#713f12';
      case 'High': return '#991b1b';
      default: return '#374151';
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
    <div className="page-transition max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card mb-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pb-6 border-b">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Autisense Screening Report</p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Assessment Results</h1>
              <p className="text-sm text-gray-600 mt-2">Completed: {new Date(screening.completedAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/dashboard')} className="btn-secondary">← Back to Dashboard</button>
            </div>
          </div>

          {/* Three-Column Score Display */}
          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            {/* Questionnaire Score */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }} 
              className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-8 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-green-700 font-bold mb-6">📋 Questionnaire</p>
              <div className="flex justify-center mb-6">
                <ProgressRing percentage={Math.round(screening.mlQuestionnaireScore || 0)} color="green" size={120} strokeWidth={10} />
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent mb-1">
                  {Math.round(screening.mlQuestionnaireScore || 0)}
                </p>
                <p className="text-sm font-semibold text-green-700 mb-3">Out of 100</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  M-CHAT-R™<br/>20-item Assessment
                </p>
              </div>
            </motion.div>

            {/* Video Analysis Score */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }} 
              className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 shadow-sm hover:shadow-md transition-all"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-blue-700 font-bold mb-6">🎥 Video Analysis</p>
              <div className="flex justify-center mb-6">
                <ProgressRing percentage={Math.round(screening.videoScore || 0)} color="blue" size={120} strokeWidth={10} />
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">
                  {Math.round(screening.videoScore || 0)}
                </p>
                <p className="text-sm font-semibold text-blue-700 mb-3">Out of 100</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  6 Behavioral<br/>Markers Analyzed
                </p>
              </div>
            </motion.div>

            {/* Combined Risk Score */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.3 }}
              className="rounded-2xl border-2 p-8 shadow-sm hover:shadow-md transition-all"
              style={{ 
                borderColor: screening.riskLevel === 'High' ? '#dc2626' : screening.riskLevel === 'Moderate' ? '#eab308' : '#16a34a',
                backgroundColor: getRiskBgColor(screening.riskLevel)
              }}
            >
              <p className="text-sm uppercase tracking-[0.2em] font-bold mb-6" style={{ color: getRiskTextColor(screening.riskLevel) }}>
                ⚠️ Combined Risk Score
              </p>
              <div className="flex justify-center mb-6">
                <ProgressRing 
                  percentage={Math.round(screening.finalScore || 0)} 
                  color={screening.riskLevel === 'High' ? 'red' : screening.riskLevel === 'Moderate' ? 'yellow' : 'green'} 
                  size={120} 
                  strokeWidth={10} 
                />
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center rounded-full bg-gradient-to-r ${getRiskColor(screening.riskLevel)} px-4 py-2 text-white font-bold text-sm mb-4`}>
                  {screening.riskLevel} Risk
                </div>
                <p className="text-5xl font-bold mb-1" style={{ color: getRiskTextColor(screening.riskLevel) }}>
                  {Math.round(screening.finalScore || 0)}
                </p>
                <p className="text-sm font-semibold mb-3" style={{ color: getRiskTextColor(screening.riskLevel) }}>Out of 100</p>
                <p className="text-xs text-gray-600">
                  50% Questionnaire<br/>
                  + 50% Video Analysis
                </p>
              </div>
            </motion.div>
          </div>

          {/* Risk Level Classification */}
          <div className="rounded-xl border-l-4 mb-10 overflow-hidden" style={{ borderLeftColor: getRiskTextColor(screening.riskLevel) }}>
            <div className="p-8" style={{ backgroundColor: getRiskBgColor(screening.riskLevel) }}>
              <div className="flex items-start gap-4">
                <div className="text-4xl">
                  {screening.riskLevel === 'High' ? '🔴' : screening.riskLevel === 'Moderate' ? '🟡' : '🟢'}
                </div>
                <div className="flex-1">
                  <p className="text-sm uppercase tracking-[0.2em] font-bold mb-2" style={{ color: getRiskTextColor(screening.riskLevel) }}>
                    Risk Level Classification
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-3">
                    {screening.riskLevel} Risk ({screening.finalScore.toFixed(1)}/100)
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-800">
                      {screening.riskLevel === 'High' 
                        ? '⚠️ High risk score indicates multiple autism markers are present. Professional evaluation and further diagnostic assessment by a qualified healthcare provider is STRONGLY RECOMMENDED immediately.'
                        : screening.riskLevel === 'Moderate'
                        ? '⚠️ Moderate risk score suggests some autism markers may be present. Professional assessment with a developmental pediatrician or autism specialist is RECOMMENDED for confirmation and early intervention planning.'
                        : '✅ Low risk score indicates minimal autism markers detected. Continue regular developmental monitoring with your pediatrician and routine health checkups.'}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Next Steps:</strong> {
                        screening.riskLevel === 'High'
                          ? 'Schedule a comprehensive diagnostic evaluation with a qualified autism specialist as soon as possible. Early intervention can significantly improve developmental outcomes.'
                          : screening.riskLevel === 'Moderate'
                          ? 'Consult with your pediatrician to discuss results. Consider referral to developmental specialist if concerns persist.'
                          : 'Maintain regular health monitoring. Share results with pediatrician for continuity of care.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Features Breakdown */}
          {screening.liveVideoFeatures && (
            <div className="mb-10">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Behavior Analysis</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">6 Behavioral Markers - Video Findings</h3>
              <div className="grid lg:grid-cols-2 gap-4">
                {[
                  { label: '👀 Eye Contact', key: 'eyeContact', color: 'blue' },
                  { label: '🤕 Head Stimming', key: 'headStimming', color: 'yellow' },
                  { label: '✋ Hand Stimming', key: 'handStimming', color: 'orange' },
                  { label: '🤲 Hand Gesture', key: 'handGesture', color: 'green' },
                  { label: '🔄 Social Reciprocity', key: 'socialReciprocity', color: 'indigo' },
                  { label: '😊 Emotion Variation', key: 'emotionVariation', color: 'purple' }
                ].map((feature, idx) => (
                  <div key={idx} className={`rounded-xl border-2 border-${feature.color}-100 bg-${feature.color}-50/70 p-6`}>
                    <p className="text-sm font-semibold text-gray-900 mb-3">{feature.label}</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {screening.liveVideoFeatures[feature.key] || 'Unknown'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questionnaire Details */}
          {screening.questionnaire && (
            <div className="mb-10">
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Assessment Details</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Questionnaire Information</h3>
              <div className="rounded-xl border-2 border-green-200 bg-green-50/70 p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Questions Answered</p>
                    <p className="text-4xl font-bold text-gray-900">{screening.questionnaire.responses?.length || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Out of 20</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Questionnaire Score</p>
                    <p className="text-4xl font-bold text-green-700">{Math.round(screening.mlQuestionnaireScore || 0)}%</p>
                    <p className="text-sm text-gray-600 mt-1">ML Model Assessment</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interpretation Summary */}
          {screening.interpretation && (
            <div className="mb-10 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
              <p className="text-sm uppercase tracking-[0.2em] text-blue-700 font-bold mb-3">📝 Clinical Summary</p>
              <h3 className="text-xl font-bold text-blue-900 mb-4">Assessment Overview</h3>
              <p className="text-gray-800 leading-relaxed text-lg">{screening.interpretation.summary}</p>
            </div>
          )}

          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Location-Based Support</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Nearby Autism-Related Centers</h3>

            {centersLoading ? (
              <div className="rounded-xl border-2 border-purple-200 bg-purple-50/70 p-6 text-purple-800">
                Fetching nearby centers from OpenStreetMap...
              </div>
            ) : centers.length > 0 ? (
              <div className="grid gap-4">
                {centers.map((center, index) => (
                  <div key={`${center.name}-${index}`} className="rounded-xl border-2 border-purple-200 bg-purple-50/40 p-6">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{center.name}</p>
                        <p className="text-sm text-gray-700 mt-1">{center.address}</p>
                      </div>
                      <a
                        href={center.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        View on Map
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6 text-gray-700">
                No nearby centers found for the saved location.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-8 border-t mt-10">
            <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1 sm:flex-none">
              ← View History
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={reportLoading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex-1 sm:flex-none justify-center"
            >
              {reportLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Generating Report…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                  </svg>
                  Download Medical Report
                </>
              )}
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1 sm:flex-none">
              Start New Screening →
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ScreeningResults;
