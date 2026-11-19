import React, { useState, useEffect, Component } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {this.state.error?.message || 'A runtime error occurred in the component tree.'}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('nexthire_current_view');
                window.location.reload();
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-2 mx-auto transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, isAuthenticated, loading } = useAuth();
  
  // Restore persisted view or fallback to role-based default
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('nexthire_current_view') || 'landing';
  });

  // Keep localStorage in sync with view changes
  const handleSetCurrentView = (newView) => {
    setCurrentView(newView);
    localStorage.setItem('nexthire_current_view', newView);
  };

  // If newly authenticated and on landing/login, route to role dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const saved = localStorage.getItem('nexthire_current_view');
      if (!saved || saved === 'landing' || saved === 'login' || saved === 'register') {
        const defaultRoleView = user.role === 'candidate' 
          ? 'candidate-dashboard' 
          : (user.role === 'admin' ? 'admin-dashboard' : 'recruiter-dashboard');
        handleSetCurrentView(defaultRoleView);
      }
    }
  }, [isAuthenticated, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading NextHire AI...</p>
        </div>
      </div>
    );
  }

  // Render active view
  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginPage setCurrentView={handleSetCurrentView} />;
      case 'register':
        return <RegisterPage setCurrentView={handleSetCurrentView} />;
      case 'candidate-dashboard':
        return isAuthenticated ? (
          <CandidateDashboard setCurrentView={handleSetCurrentView} />
        ) : (
          <LoginPage setCurrentView={handleSetCurrentView} />
        );
      case 'recruiter-dashboard':
        return isAuthenticated && (user?.role === 'recruiter' || user?.role === 'admin') ? (
          <RecruiterDashboard setCurrentView={handleSetCurrentView} />
        ) : (
          <LoginPage setCurrentView={handleSetCurrentView} />
        );
      case 'admin-dashboard':
        return isAuthenticated && user?.role === 'admin' ? (
          <AdminDashboard setCurrentView={handleSetCurrentView} />
        ) : (
          <LoginPage setCurrentView={handleSetCurrentView} />
        );
      case 'landing':
      default:
        return <LandingPage setCurrentView={handleSetCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar currentView={currentView} setCurrentView={handleSetCurrentView} />
      <main className="flex-1 w-full">
        {renderView()}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
