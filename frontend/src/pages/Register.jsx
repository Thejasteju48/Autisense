import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { SparklesIcon, UserIcon, HeartIcon } from '@heroicons/react/24/solid';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    parentFirstName: '',
    parentLastName: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        parentFirstName: formData.parentFirstName,
        parentLastName: formData.parentLastName,
        phoneNumber: formData.phoneNumber,
      });
      toast.success('Account created! Add your child to start screening');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="max-w-2xl w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <SparklesIcon className="h-16 w-16 text-purple-300 mx-auto mb-4" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Start Your Journey
          </h1>
          <p className="text-purple-200">
            Create your parent account - it takes less than a minute
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Login/Register Tabs */}
          <div className="flex mb-6 bg-purple-50 rounded-lg p-1">
            <Link to="/login" className="flex-1">
              <button className="w-full px-4 py-2 text-purple-700 hover:bg-purple-100 rounded-md font-medium transition-all">
                Login
              </button>
            </Link>
            <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md font-medium shadow-md">
              Register
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Account Setup */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Create Your Parent Account</h3>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Parent Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="parentFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="parentFirstName"
                    name="parentFirstName"
                    value={formData.parentFirstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label htmlFor="parentLastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="parentLastName"
                    name="parentLastName"
                    value={formData.parentLastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-purple-900 font-medium">Next Step: Add Your Child</p>
                  <p className="text-xs text-purple-700 mt-1">After registration, you'll create your child's profile to start the autism screening process.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
