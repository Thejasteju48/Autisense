import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChildProfile from './pages/ChildProfile';
import AddChild from './pages/AddChild';
import ScreeningFlow from './pages/ScreeningFlow';
import ScreeningResults from './pages/ScreeningResults';
import History from './pages/History';
import AllScreeningsHistory from './pages/AllScreeningsHistory';

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

      {/* Protected routes */}
      <Route element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="children/add" element={<AddChild />} />
        <Route path="children/:id" element={<ChildProfile />} />
        <Route path="screening/:childId" element={<ScreeningFlow />} />
        <Route path="screening/:screeningId/results" element={<ScreeningResults />} />
        <Route path="history/:childId" element={<History />} />
        <Route path="all-history" element={<AllScreeningsHistory />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
    </Routes>
  );
}

export default App;
