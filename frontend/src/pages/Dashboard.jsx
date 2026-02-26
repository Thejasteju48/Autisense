import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { childrenAPI, screeningAPI } from '../services/api';
import { PlusIcon, PlayIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Button, PageHeader } from '../components/ui';

const Dashboard = () => {
  const [children, setChildren] = useState([]);
  const [latestScreenings, setLatestScreenings] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await childrenAPI.getAll();
      const childrenData = response.data.data.children;
      setChildren(childrenData);

      // Fetch latest screening for each child
      const screenings = {};
      for (const child of childrenData) {
        try {
          const screeningRes = await screeningAPI.getLatest(child._id);
          screenings[child._id] = screeningRes.data.data.screening;
        } catch (error) {
          // No screening found for this child
          screenings[child._id] = null;
        }
      }
      setLatestScreenings(screenings);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="page-transition max-w-6xl mx-auto">
      <PageHeader 
        title="Dashboard"
        subtitle="Manage your children's profiles and screenings"
      />

      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          <Link to="/children/add">
            <Button icon={PlusIcon}>Add New Child</Button>
          </Link>
          <Link to="/all-history">
            <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium">
              <ChartBarIcon className="w-5 h-5" />
              <span>View All Screening History</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Children List */}
      {children.length === 0 ? (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border-2 border-purple-200 py-12 px-6 shadow-md">
          <SparklesIcon className="h-16 w-16 text-purple-600 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Welcome! Let's Get Started</h3>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto text-center">
            To begin the autism screening, please add your child's profile. This helps us personalize the assessment and track progress over time.
          </p>
          
          {/* Steps */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</span>
                  <h4 className="font-semibold text-gray-900">Add Child Profile</h4>
                </div>
                <p className="text-sm text-gray-600 ml-8">Enter basic info: name, age (12-72 months), gender</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</span>
                  <h4 className="font-semibold text-gray-900">Video Assessment</h4>
                </div>
                <p className="text-sm text-gray-600 ml-8">Recorded video analysis (2-4 minutes)</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">3</span>
                  <h4 className="font-semibold text-gray-900">Get Results</h4>
                </div>
                <p className="text-sm text-gray-600 ml-8">View screening report with insights</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to="/children/add">
              <Button className="px-8 py-4 text-lg">Add Child Profile</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {children.map((child) => (
            <div key={child._id} className="child-card">
              {/* Child Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {child.profileImage ? (
                    <img
                      src={child.profileImage}
                      alt={child.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {child.nickname || child.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {Math.floor(child.ageInMonths / 12)} years {child.ageInMonths % 12} months
                    </p>
                  </div>
                </div>
              </div>

              {/* Latest Screening Result */}
              {latestScreenings[child._id] ? (
                <div className={`rounded-xl p-4 border-2 mb-4 ${getRiskLevelColor(latestScreenings[child._id].riskLevel)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Latest Screening</span>
                    <span className="text-xs">
                      {new Date(latestScreenings[child._id].completedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        {latestScreenings[child._id].riskLevel} Risk
                      </span>
                      <span className="text-sm font-semibold">
                        Final: {latestScreenings[child._id].finalScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs space-y-1 pt-2 border-t border-current border-opacity-20">
                      <div className="flex justify-between">
                        <span>📋 Questionnaire Score:</span>
                        <span className="font-semibold">{(latestScreenings[child._id].mlQuestionnaireScore || 0).toFixed(1)}%</span>
                      </div>
                      {latestScreenings[child._id].interpretation?.videoBehaviorScore !== undefined && (
                        <div className="flex justify-between">
                          <span>🎬 Video Analysis Score:</span>
                          <span className="font-semibold">{latestScreenings[child._id].interpretation.videoBehaviorScore.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-4 border-2 border-dashed border-purple-300 mb-4 bg-purple-50">
                  <p className="text-sm text-purple-900 font-medium text-center mb-2">Ready to Screen</p>
                  <p className="text-xs text-purple-700 text-center">Upload recorded video for analysis</p>
                </div>
              )}

              {/* Primary Action Button */}
              {!latestScreenings[child._id] ? (
                <button
                  onClick={() => navigate(`/screening/${child._id}`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center mb-3"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  <span>Start Screening</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/screening/${child._id}`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center mb-3"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  <span>New Screening</span>
                </button>
              )}

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                {latestScreenings[child._id] && (
                  <button
                    onClick={() => navigate(`/history/${child._id}`)}
                    className="flex flex-col items-center p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-200"
                  >
                    <ChartBarIcon className="h-5 w-5 text-indigo-600 mb-1" />
                    <span className="text-xs font-medium text-indigo-600">View History</span>
                  </button>
                )}
                
                <Link
                  to={`/children/${child._id}`}
                  className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
                >
                  <svg className="h-5 w-5 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">View Profile</span>
                </Link>
              </div>

              {/* View Profile Link */}
              <Link
                to={`/children/${child._id}`}
                className="block mt-4 text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View Profile →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 bg-white rounded-lg p-6 shadow-lg border-2 border-purple-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3">About Early Screening</h3>
        <p className="text-gray-700 mb-4">
          Early autism screening can help identify developmental differences at an early age, 
          allowing for timely intervention and support. Our professional screening system uses 
          recorded video behavior analysis with AI to detect 6 key behavioral indicators, 
          combined with clinical questionnaires for comprehensive assessment.
        </p>
        <p className="text-sm text-gray-600 italic">
          ⚠️ Important: This tool is for screening purposes only and is NOT a diagnostic tool. 
          Please consult with healthcare professionals for any concerns.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
