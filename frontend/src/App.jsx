import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChildProfile from './pages/ChildProfile';
import AddChild from './pages/AddChild';
import Screening from './pages/Screening';
import InteractiveScreening from './pages/InteractiveScreening';
import ScreeningFlow from './pages/ScreeningFlow';
import ScreeningResults from './pages/ScreeningResults';
import Games from './pages/Games';
import History from './pages/History';
import TestEyeContact from './pages/TestEyeContact';
import TestGame1 from './pages/TestGame1';

// Layout
import Layout from './components/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      
      {/* Test routes - No auth required */}
      <Route path="/test-eye-contact" element={<TestEyeContact />} />
      <Route path="/test-game1" element={<TestGame1 />} />

      {/* Protected routes */}
      <Route element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="children/add" element={<AddChild />} />
        <Route path="children/:id" element={<ChildProfile />} />
        <Route path="screening/:childId" element={<ScreeningFlow />} />
        <Route path="screening-interactive/:childId" element={<InteractiveScreening />} />
        <Route path="screening-old/:childId" element={<Screening />} />
        <Route path="screening/:screeningId/results" element={<ScreeningResults />} />
        <Route path="games/:childId" element={<Games />} />
        <Route path="history/:childId" element={<History />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
    </Routes>
  );
}

export default App;
