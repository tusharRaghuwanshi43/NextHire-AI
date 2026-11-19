import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Lock, Mail, AlertCircle, ArrowRight, UserCheck, Briefcase, ShieldCheck } from 'lucide-react';

export default function LoginPage({ setCurrentView }) {
  const { login, quickLoginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'recruiter') {
        setCurrentView('recruiter-dashboard');
      } else if (user.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('candidate-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      const user = await quickLoginAs(role);
      if (role === 'recruiter') {
        setCurrentView('recruiter-dashboard');
      } else if (role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('candidate-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-brand-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Sign In to NextHire AI</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your adaptive interview room or recruitment analytics.
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <p className="text-[11px] font-mono text-slate-500 font-semibold uppercase tracking-wider mb-2 text-center">
            Instant Demo One-Click Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('candidate')}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Candidate Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('recruiter')}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-2xs"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recruiter Demo</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Switch */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{' '}
          <button
            onClick={() => setCurrentView('register')}
            className="text-brand-600 font-semibold hover:text-brand-700 ml-1"
          >
            Create an Account
          </button>
        </div>

      </div>
    </div>
  );
}
