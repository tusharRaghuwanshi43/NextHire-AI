import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AiProviderSelector from '../components/AiProviderSelector';
import { ShieldCheck, Users, Server, Database, Activity, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [users, health] = await Promise.all([
        api.auth.users().catch(() => []),
        fetch('/api/health').then(r => r.json()).catch(() => null)
      ]);
      setUsersList(users || []);
      setHealthStatus(health);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Admin Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-purple-700 font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Platform Control &amp; Health Console</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor infrastructure health, MongoDB connectivity, and account privileges.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-2 transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Console</span>
        </button>
      </div>

      {/* System Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">FastAPI Backend</h3>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Status: <span className="text-emerald-700 font-semibold font-mono uppercase">{healthStatus?.status || 'Operational'}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Version: 1.0.0 &bull; Asynchronous PyMongo</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Database Store</h3>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Mode: <span className="text-cyan-700 font-semibold font-mono uppercase">{healthStatus?.database_mode || 'MongoDB Atlas'}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Collections: 12 configured schemas</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">AI Engine Routing</h3>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Engine: <span className="text-amber-700 font-semibold font-mono uppercase">{healthStatus?.gemini_api || 'Active'}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Multi-Provider AI Gateway &bull; Strict Routing</p>
        </div>

      </div>

      {/* AI Provider Configuration Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            AI Provider &amp; LLM Engine Routing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manually switch the global AI engine powering question generation, answer auditing, resume verification, and skill-gap recommendations.
          </p>
        </div>
        <AiProviderSelector compact={false} />
      </div>

      {/* User Accounts Management Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Registered Platform Users ({usersList.length})</span>
          </h2>
          <span className="text-xs text-slate-500">Role-Based Access Control</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-mono">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Company / Title</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u, idx) => (
                <tr key={u.id || idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                      u.role === 'admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : u.role === 'recruiter'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-brand-50 text-brand-700 border-brand-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{u.title || u.company || '—'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
