import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { screeningAPI, childrenAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const History = () => {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [childId]);

  const fetchData = async () => {
    try {
      const [childRes, screeningsRes] = await Promise.all([
        childrenAPI.getOne(childId),
        screeningAPI.getByChild(childId),
      ]);
      setChild(childRes.data.data.child);
      setScreenings(screeningsRes.data.data.screenings);
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const chartData = screenings
    .filter(s => s.status === 'completed')
    .map(s => ({
      date: new Date(s.completedAt).toLocaleDateString(),
      score: s.finalScore,
    }))
    .reverse();

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50';
      case 'High': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div></div>;

  return (
    <div className="page-transition max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Screening History</h1>
        {child && <p className="text-gray-600">Results for {child.name}</p>}
      </div>

      {screenings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No screening history yet</p>
        </div>
      ) : (
        <>
          {chartData.length > 1 && (
            <div className="card mb-6">
              <h3 className="text-xl font-bold mb-4">Progress Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-4">
            {screenings.map((screening) => (
              <motion.div
                key={screening._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(screening.riskLevel)}`}>
                        {screening.riskLevel} Risk
                      </span>
                      <span className="text-2xl font-bold text-gray-800">{screening.finalScore?.toFixed(1) || 'N/A'}%</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Screening Date</p>
                        <p className="text-sm font-medium text-gray-700">
                          {screening.status === 'completed' 
                            ? new Date(screening.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                            : new Date(screening.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          }
                        </p>
                      </div>
                      
                      {screening.questionnaire?.score !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Questionnaire Score</p>
                          <p className="text-sm font-medium text-gray-700">
                            {(screening.questionnaire.score * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Show summary of features if available */}
                    {screening.interpretation?.summary && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {screening.interpretation.summary}
                      </p>
                    )}

                    {/* Show if video analysis was included */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className={screening.liveVideoFeatures ? 'text-green-600 font-medium' : ''}>
                        {screening.liveVideoFeatures ? '✓ Video Analysis Included' : '○ Questionnaire Only'}
                      </span>
                      {screening.interpretation?.llmAnalysis && (
                        <span className="text-purple-600 font-medium">✓ AI Analysis</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    {screening.status === 'completed' && (
                      <>
                        <button
                          onClick={() => window.location.href = `/screening/${screening._id}/results`}
                          className="btn-primary text-sm px-4 py-2"
                        >
                          View Details
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default History;
