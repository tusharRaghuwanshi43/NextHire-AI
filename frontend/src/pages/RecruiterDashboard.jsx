import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Users, 
  FileCheck2, 
  CheckCircle, 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown, 
  Eye, 
  Layers, 
  BarChart2, 
  ShieldCheck, 
  X,
  Sparkles,
  Award,
  RefreshCw
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ScoreBadge from '../components/ScoreBadge';
import ScoreRadarChart from '../components/ScoreRadarChart';
import ClaimVerificationCard from '../components/ClaimVerificationCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RecruiterDashboard() {
  const { user } = useAuth();

  // State
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('');

  // Candidate Comparison
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Deep Dive Candidate Detail Modal
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [statsData, candidatesData, analyticsData] = await Promise.all([
        api.recruiter.getStats().catch(() => null),
        api.recruiter.getCandidates().catch(() => []),
        api.recruiter.getAnalytics().catch(() => null),
      ]);
      setStats(statsData);
      setCandidates(candidatesData || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching recruiter dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilter() {
    setLoading(true);
    try {
      const filtered = await api.recruiter.getCandidates(
        searchQuery,
        minScoreFilter ? parseFloat(minScoreFilter) : undefined
      );
      setCandidates(filtered || []);
    } catch (err) {
      console.error('Filter error:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleSelectForComparison = (interviewId) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(interviewId)) {
        return prev.filter((id) => id !== interviewId);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 candidates simultaneously.');
        return prev;
      }
      return [...prev, interviewId];
    });
  };

  async function runComparison() {
    if (selectedForComparison.length < 2) {
      alert('Select at least 2 candidates to generate side-by-side comparison.');
      return;
    }

    setComparing(true);
    try {
      const res = await api.recruiter.compareCandidates(selectedForComparison);
      setComparisonResults(res?.comparison || []);
    } catch (err) {
      alert(`Error comparing candidates: ${err.message}`);
    } finally {
      setComparing(false);
    }
  }

  async function viewCandidateDeepDive(candidateId) {
    setLoadingDetail(true);
    try {
      const detail = await api.recruiter.getCandidateDetail(candidateId);
      setSelectedCandidateDetail(detail);
    } catch (err) {
      alert(`Error loading candidate audit: ${err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleDownloadCandidatePdf(interviewId, candidateName) {
    setDownloadingPdf(true);
    try {
      const blob = await api.reports.downloadPdf(interviewId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NextHire_Audit_${candidateName?.replace(/\s+/g, '_') || 'Candidate'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Failed to download candidate report: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Recruiter Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              Recruiter Intelligence Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Candidate Evaluation &amp; Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Deterministic technical audits, evidence-based claim verification, and side-by-side competency comparisons.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-2 transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* METRIC HIGHLIGHTS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Candidates"
          value={stats?.total_candidates || 0}
          subtitle="Registered engineers"
          icon={Users}
          color="brand"
        />
        <MetricCard
          title="Resumes Analyzed"
          value={stats?.resumes_analyzed || 0}
          subtitle="PyMuPDF & spaCy parsed"
          icon={FileCheck2}
          color="emerald"
        />
        <MetricCard
          title="Interviews Completed"
          value={stats?.completed_interviews || 0}
          subtitle="Adaptive technical audits"
          icon={CheckCircle}
          color="purple"
        />
        <MetricCard
          title="Average Weighted Score"
          value={stats?.average_score ? `${stats.average_score}%` : '0.0%'}
          subtitle="Deterministic 5-dim average"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* SEARCH, FILTER & COMPARISON TOOL BAR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Search input & score filter */}
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name or email..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium shrink-0">Min Score:</span>
            <input
              type="number"
              min="0"
              max="100"
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(e.target.value)}
              placeholder="e.g. 75"
              className="w-20 bg-white border border-slate-300 rounded-xl px-2.5 py-2.5 text-xs text-slate-900 text-center focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          <button
            onClick={handleFilter}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition shadow-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
        </div>

        {/* Comparison Trigger */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {selectedForComparison.length > 0 && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {selectedForComparison.length} selected
            </span>
          )}
          <button
            onClick={runComparison}
            disabled={selectedForComparison.length < 2 || comparing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm transition disabled:opacity-40"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Compare Selected ({selectedForComparison.length})</span>
          </button>
        </div>

      </div>

      {/* CANDIDATE RANKINGS TABLE */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Award className="w-4 h-4 text-brand-600" />
            <span>Ranked Candidates ({candidates.length})</span>
          </h2>
          <span className="text-xs text-slate-500">
            Ordered by Weighted Audit Score (Descending)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-mono">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Compare</th>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Target Role</th>
                <th className="py-3.5 px-4">Identified Skills</th>
                <th className="py-3.5 px-4 text-center">Audit Score</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.length > 0 ? (
                candidates.map((cand, idx) => {
                  const isSelected = selectedForComparison.includes(cand.interview_id);
                  return (
                    <tr 
                      key={cand.interview_id || idx} 
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-brand-50/40' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectForComparison(cand.interview_id)}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{cand.candidate_name}</p>
                        <p className="text-[11px] text-slate-500">{cand.candidate_email}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {cand.target_role}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {cand.top_skills && cand.top_skills.length > 0 ? (
                            cand.top_skills.slice(0, 3).map((s, sIdx) => (
                              <span key={sIdx} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-700 font-medium">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic">None logged</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cand.final_score !== null && cand.final_score !== undefined ? (
                          <ScoreBadge score={cand.final_score} size="sm" />
                        ) : (
                          <span className="text-slate-400 font-mono">In Progress</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => viewCandidateDeepDive(cand.candidate_id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center space-x-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-600" />
                          <span>Audit</span>
                        </button>
                        {cand.final_score && (
                          <button
                            onClick={() => handleDownloadCandidatePdf(cand.interview_id, cand.candidate_name)}
                            disabled={downloadingPdf}
                            className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-xs font-semibold inline-flex items-center space-x-1 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No candidates found matching the query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANDIDATE SIDE-BY-SIDE COMPARISON MODAL / SECTION */}
      {comparisonResults && comparisonResults.length > 0 && (
        <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 shadow-xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                Side-By-Side Technical Benchmark
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Multi-Candidate Comparative Analysis ({comparisonResults.length} Candidates)
              </h3>
            </div>
            <button
              onClick={() => setComparisonResults(null)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {comparisonResults.map((cand, cIdx) => (
              <div key={cIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="pb-3 border-b border-slate-200">
                  <h4 className="text-base font-bold text-slate-900 truncate">{cand.candidate_name}</h4>
                  <p className="text-xs text-slate-500">{cand.target_role}</p>
                  <div className="mt-2">
                    <ScoreBadge score={cand.overall_score} size="md" />
                  </div>
                </div>

                {/* Dimension scores */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Tech Accuracy (40%):</span>
                    <strong className="font-mono text-emerald-700">{cand.technical_accuracy}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Tech Depth (25%):</span>
                    <strong className="font-mono text-emerald-700">{cand.technical_depth}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Consistency (20%):</span>
                    <strong className="font-mono text-emerald-700">{cand.resume_consistency}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Communication (10%):</span>
                    <strong className="font-mono text-emerald-700">{cand.communication}%</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Confidence (5%):</span>
                    <strong className="font-mono text-emerald-700">{cand.confidence}%</strong>
                  </div>
                </div>

                {/* Strengths */}
                {cand.strengths && cand.strengths.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-[11px]">
                    <span className="font-semibold text-emerald-800 block mb-1">Key Strengths:</span>
                    <ul className="text-slate-600 list-disc list-inside space-y-0.5">
                      {cand.strengths.slice(0, 2).map((s, idx) => (
                        <li key={idx} className="truncate">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIPELINE SCORE DISTRIBUTION & ANALYTICS CHARTS */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Score Distribution */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-brand-600" />
              <span>Score Distribution Across Candidates</span>
            </h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.score_distribution || []}>
                  <XAxis dataKey="range" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dimension Mastery Averages */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Dimension Averages Across Tested Pool</span>
            </h3>
            <div className="space-y-4 pt-2">
              {analytics.dimension_metrics?.map((dim, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{dim.dimension}</span>
                    <span className="font-mono text-emerald-700">{dim.average}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-600 to-emerald-500 rounded-full"
                      style={{ width: `${dim.average}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* CANDIDATE DEEP DIVE MODAL */}
      {selectedCandidateDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-brand-600 font-semibold">
                  Audited Candidate Deep-Dive
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {selectedCandidateDetail.candidate?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedCandidateDetail.candidate?.email} &bull; {selectedCandidateDetail.candidate?.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidateDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score pill & PDF button */}
            {selectedCandidateDetail.evaluation && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-5 rounded-2xl border border-slate-200 gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Final Weighted Assessment Score:</span>
                  <div className="mt-1">
                    <ScoreBadge score={selectedCandidateDetail.evaluation.overall_score} size="lg" />
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadCandidatePdf(
                    selectedCandidateDetail.evaluation.interview_id,
                    selectedCandidateDetail.candidate?.name
                  )}
                  disabled={downloadingPdf}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full ReportLab PDF</span>
                </button>
              </div>
            )}

            {/* Audited Claims */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Resume Claims ({selectedCandidateDetail.claims?.length || 0})</span>
              </h4>
              <div className="space-y-3">
                {selectedCandidateDetail.claims && selectedCandidateDetail.claims.length > 0 ? (
                  selectedCandidateDetail.claims.map((cl, idx) => (
                    <ClaimVerificationCard key={idx} claim={cl} />
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No claims audited for this candidate yet.</p>
                )}
              </div>
            </div>

            {/* Close button */}
            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedCandidateDetail(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Close Audit View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
