import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SparklesIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <SparklesIcon className="h-8 w-8 text-purple-200" />
            <span className="text-xl font-bold text-white">
              Autisense
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                isActive('/dashboard')
                  ? 'bg-white/20 text-white' 
                  : 'text-purple-100 hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            
            {user ? (
              <>
                {/* User Menu */}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-purple-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 bg-purple-200 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {user?.name}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-lg transition-all text-sm font-medium"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="px-4 py-2 text-purple-100 hover:text-white font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link to="/register"
                  className="px-6 py-2 bg-white hover:bg-purple-50 text-purple-700 font-bold rounded-lg transition-all shadow-md"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
