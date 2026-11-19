import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nexthire_token'));
  const [loading, setLoading] = useState(true);

  // Restore authenticated session on page refresh
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('nexthire_token');
      if (storedToken) {
        try {
          const profile = await api.auth.me();
          setUser(profile);
        } catch (err) {
          console.warn('Session expired or invalid, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('nexthire_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    localStorage.setItem('nexthire_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('nexthire_token');
    setToken(null);
    setUser(null);
  };

  // Demo helper for seamless testing of Candidate and Recruiter roles
  const quickLoginAs = async (targetRole) => {
    const email = targetRole === 'recruiter' 
      ? 'recruiter.demo@nexthire.ai' 
      : (targetRole === 'admin' ? 'admin.demo@nexthire.ai' : 'candidate.demo@nexthire.ai');
    const password = 'Password123!';
    const name = targetRole === 'recruiter' ? 'Elena Vance (Recruiter)' : (targetRole === 'admin' ? 'System Admin' : 'Alex Mercer (Candidate)');

    try {
      return await login(email, password);
    } catch (_) {
      // Auto-register demo account if not existing
      return await register({
        name,
        email,
        password,
        role: targetRole,
        title: targetRole === 'recruiter' ? 'Senior Talent Partner' : 'Full Stack Engineer',
        company: targetRole === 'recruiter' ? 'TechFlow Ventures' : undefined
      });
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    role: user?.role || null,
    loading,
    login,
    register,
    logout,
    quickLoginAs
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
