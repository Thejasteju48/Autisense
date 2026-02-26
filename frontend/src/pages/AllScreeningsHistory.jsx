import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { screeningAPI, childrenAPI } from '../services/api';
import { 
  CalendarIcon, 
  ClockIcon, 
  DocumentArrowDownIcon,
  EyeIcon,
  ChartBarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const AllScreeningsHistory = () => {
  const [screenings, setScreenings] = useState([]);
  const [children, setChildren] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, low, moderate, high
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, child
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all screenings and children in parallel
      const [screeningsRes, childrenRes] = await Promise.all([
        screeningAPI.getAllUserScreenings(),
        childrenAPI.getAll()
      ]);

      setScreenings(screeningsRes.data.data.screenings || []);
      
      // Create a map of children for quick lookup
      const childrenMap = {};
      (childrenRes.data.data.children || []).forEach(child => {
        childrenMap[child._id] = child;
      });
      setChildren(childrenMap);
    } catch (error) {
      console.error('Failed to load screening history:', error);
      toast.error('Failed to load screening history');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskBadgeColor = (level) => {
    switch (level) {
      case 'Low': return 'bg-green-500';
      case 'Moderate': return 'bg-yellow-500';
      case 'High': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Filter screenings
  const filteredScreenings = screenings.filter(screening => {
    if (filter === 'all') return true;
    return screening.riskLevel?.toLowerCase() === filter;
  });

  // Sort screenings
  const sortedScreenings = [...filteredScreenings].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt);
    } else if (sortBy === 'oldest') {
      return new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt);
    } else if (sortBy === 'child') {
      // Child is already populated by backend
      const childA = a.child?.name || '';
      const childB = b.child?.name || '';
      return childA.localeCompare(childB);
    }
    return 0;
  });

  // Statistics
  const stats = {
    total: screenings.length,
    low: screenings.filter(s => s.riskLevel === 'Low').length,
    moderate: screenings.filter(s => s.riskLevel === 'Moderate').length,
    high: screenings.filter(s => s.riskLevel === 'High').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="page-transition max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Screening History</h1>
        <p className="text-gray-600">All screening assessments across all children</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Total Screenings</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <ChartBarIcon className="w-12 h-12 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Low Risk</p>
              <p className="text-3xl font-bold">{stats.low}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Moderate Risk</p>
              <p className="text-3xl font-bold">{stats.moderate}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">High Risk</p>
              <p className="text-3xl font-bold">{stats.high}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Sorting */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Risk Level</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('low')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'low'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Low ({stats.low})
              </button>
              <button
                onClick={() => setFilter('moderate')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'moderate'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Moderate ({stats.moderate})
              </button>
              <button
                onClick={() => setFilter('high')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'high'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                High ({stats.high})
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="child">By Child Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Screenings List */}
      {sortedScreenings.length === 0 ? (
        <div className="card text-center py-12">
          <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No screenings found</p>
          <p className="text-gray-400 text-sm">
            {filter !== 'all' ? 'Try changing the filter' : 'Start a new screening assessment'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedScreenings.map((screening, index) => {
            // Child is already populated by backend, use it directly
            const child = screening.child || {};
            const completionDate = new Date(screening.completedAt || screening.createdAt);

            return (
              <motion.div
                key={screening._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card hover:shadow-xl transition-all duration-300 border-l-4 ${
                  screening.riskLevel === 'High' ? 'border-l-red-500' :
                  screening.riskLevel === 'Moderate' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Left Section: Child Info & Risk */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Child Avatar */}
                      <div className="flex-shrink-0">
                        {child.profileImage ? (
                          <img
                            src={child.profileImage}
                            alt={child.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <UserIcon className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Child Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{child.name || 'Unknown Child'}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getRiskColor(screening.riskLevel)}`}>
                            {screening.riskLevel} Risk
                          </span>
                        </div>

                        {/* Date and Time */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{completionDate.toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>{completionDate.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}</span>
                          </div>
                        </div>

                        {/* Score Details */}
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-500">Final Score</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {screening.finalScore?.toFixed(1) || 'N/A'}%
                            </p>
                          </div>

                          {screening.questionnaire?.score !== undefined && (
                            <div>
                              <p className="text-xs text-gray-500">Questionnaire</p>
                              <p className="text-lg font-semibold text-gray-700">
                                {(screening.questionnaire.score * 100).toFixed(0)}%
                              </p>
                            </div>
                          )}

                          {screening.liveVideoFeatures?.eyeContactRatio !== undefined && (
                            <div>
                              <p className="text-xs text-gray-500">Eye Contact</p>
                              <p className="text-lg font-semibold text-gray-700">
                                {(screening.liveVideoFeatures.eyeContactRatio * 100).toFixed(0)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <button
                      onClick={() => navigate(`/screening/${screening._id}/results`)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                    >
                      <EyeIcon className="w-5 h-5" />
                      View Details
                    </button>
                  </div>
                </div>

                {/* Summary Preview */}
                {screening.interpretation?.summary && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {screening.interpretation.summary}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllScreeningsHistory;
