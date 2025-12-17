import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { childrenAPI } from '../services/api';

const ChildProfile = () => {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChild();
  }, [id]);

  const fetchChild = async () => {
    try {
      const response = await childrenAPI.getOne(id);
      setChild(response.data.data.child);
    } catch (error) {
      toast.error('Failed to load child profile');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary-500"></div></div>;
  }

  return (
    <div className="page-transition max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card">
          <div className="flex items-center space-x-4 mb-6">
            {child.profileImage ? (
              <img src={child.profileImage} alt={child.name} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-purple-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {child.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{child.name}</h1>
              <p className="text-gray-600">{Math.floor(child.ageInMonths / 12)} years {child.ageInMonths % 12} months old</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Nickname:</span> {child.nickname || 'N/A'}</div>
            <div><span className="font-semibold">Gender:</span> {child.gender}</div>
            <div><span className="font-semibold">Age:</span> {child.ageInMonths} months</div>
            <div><span className="font-semibold">Added:</span> {new Date(child.createdAt).toLocaleDateString()}</div>
          </div>
          {child.notes && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{child.notes}</p>
            </div>
          )}
          <div className="mt-6 flex space-x-4">
            <button onClick={() => navigate(`/screening/${child._id}`)} className="btn-primary">Start Screening</button>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back to Dashboard</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChildProfile;
