import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { Button, Input } from '../components/ui';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <SparklesIcon className="h-16 w-16 text-purple-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-purple-200">Sign in to continue to screening</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Login/Register Tabs */}
          <div className="flex mb-6 bg-purple-50 rounded-lg p-1">
            <button className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md font-medium shadow-md">
              Login
            </button>
            <Link to="/register" className="flex-1">
              <button className="w-full px-4 py-2 text-purple-700 hover:bg-purple-100 rounded-md font-medium transition-all">
                Register
              </button>
            </Link>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-purple-600 hover:text-purple-700 font-semibold">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-purple-100 rounded-lg border border-purple-300">
          <p className="text-sm text-purple-800 font-medium text-center">
            Early screening can make a significant difference in your child's development
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
