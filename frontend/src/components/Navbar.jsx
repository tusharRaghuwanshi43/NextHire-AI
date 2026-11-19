import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AiProviderSelector from './AiProviderSelector';
import { 
  Sparkles, 
  LogOut, 
  User, 
  Briefcase, 
  ShieldCheck, 
  FileText,
  Layers,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ currentView, setCurrentView }) {
  const { user, isAuthenticated, logout, quickLoginAs } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={() => navigateTo('landing')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-brand-500/20 group-hover:shadow-brand-500/30 transition">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-600 group-hover:scale-110 transition" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                NextHire<span className="text-brand-600 ml-0.5">AI</span>
              </span>
              {/* <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700">
                Major Project
              </span> */}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1.5">
            <button
              onClick={() => navigateTo('landing')}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition ${
                currentView === 'landing' 
                  ? 'text-brand-700 bg-brand-50 font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>

            {isAuthenticated && user?.role === 'candidate' && (
              <button
                onClick={() => navigateTo('candidate-dashboard')}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition flex items-center space-x-1.5 ${
                  currentView === 'candidate-dashboard' 
                    ? 'text-brand-700 bg-brand-50 border border-brand-200 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Candidate Portal</span>
              </button>
            )}

            {isAuthenticated && (user?.role === 'recruiter' || user?.role === 'admin') && (
              <button
                onClick={() => navigateTo('recruiter-dashboard')}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition flex items-center space-x-1.5 ${
                  currentView === 'recruiter-dashboard' 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Recruiter Console</span>
              </button>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin-dashboard')}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition flex items-center space-x-1.5 ${
                  currentView === 'admin-dashboard' 
                    ? 'text-purple-700 bg-purple-50 border border-purple-200 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* User / Auth Controls & AI Provider */}
          <div className="flex items-center space-x-2.5">
            {/* AI Engine Selection Dropdown */}
            <AiProviderSelector compact={true} />

            {/* Desktop Auth Section */}
            {isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-3 pl-2 border-l border-slate-200">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">{user?.name}</span>
                  <span className="text-[11px] text-brand-600 capitalize font-medium flex items-center justify-end space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{user?.role}</span>
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                {/* Fast demo role switchers */}
                <div className="hidden xl:flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-lg p-1 text-xs">
                  <span className="text-slate-500 px-2 font-mono text-[11px]">Instant Demo:</span>
                  <button
                    onClick={async () => {
                      await quickLoginAs('candidate');
                      navigateTo('candidate-dashboard');
                    }}
                    className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-white rounded transition font-medium"
                  >
                    Candidate
                  </button>
                  <button
                    onClick={async () => {
                      await quickLoginAs('recruiter');
                      navigateTo('recruiter-dashboard');
                    }}
                    className="px-2.5 py-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded transition font-medium"
                  >
                    Recruiter
                  </button>
                </div>

                <button
                  onClick={() => navigateTo('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-sm transition"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="space-y-1">
            <button
              onClick={() => navigateTo('landing')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                currentView === 'landing' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              Overview
            </button>

            {isAuthenticated && user?.role === 'candidate' && (
              <button
                onClick={() => navigateTo('candidate-dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition ${
                  currentView === 'candidate-dashboard' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4 text-brand-600" />
                <span>Candidate Portal</span>
              </button>
            )}

            {isAuthenticated && (user?.role === 'recruiter' || user?.role === 'admin') && (
              <button
                onClick={() => navigateTo('recruiter-dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition ${
                  currentView === 'recruiter-dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Recruiter Console</span>
              </button>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin-dashboard')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition ${
                  currentView === 'admin-dashboard' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin Console</span>
              </button>
            )}
          </div>

          {/* Mobile Auth and Demo Switchers */}
          <div className="pt-3 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{user?.role} &bull; {user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
                  Instant Demo Login:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={async () => {
                      await quickLoginAs('candidate');
                      navigateTo('candidate-dashboard');
                    }}
                    className="w-full py-2 text-center text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 border border-brand-200"
                  >
                    Candidate Demo
                  </button>
                  <button
                    onClick={async () => {
                      await quickLoginAs('recruiter');
                      navigateTo('recruiter-dashboard');
                    }}
                    className="w-full py-2 text-center text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    Recruiter Demo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => navigateTo('login')}
                    className="w-full py-2.5 text-center text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigateTo('register')}
                    className="w-full py-2.5 text-center text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-500 shadow-sm"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
