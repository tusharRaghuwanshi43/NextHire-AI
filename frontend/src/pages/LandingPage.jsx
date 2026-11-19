import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  BarChart3, 
  FileCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  Terminal,
  Zap,
  UserCheck,
  TrendingUp,
  Download
} from 'lucide-react';
import ScoreBadge from '../components/ScoreBadge';
import ScoreRadarChart from '../components/ScoreRadarChart';

export default function LandingPage({ setCurrentView }) {
  const { quickLoginAs } = useAuth();
  const [activeTab, setActiveTab] = useState('candidate');

  const demoComponents = {
    technical_accuracy: 88,
    technical_depth: 82,
    resume_consistency: 90,
    communication: 85,
    confidence: 80
  };

  return (
    <div className="w-full space-y-20 pb-20">
      
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-10 overflow-hidden">
        {/* Soft background ambient gradient */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-brand-100/70 via-indigo-100/50 to-purple-100/40 blur-[130px] pointer-events-none rounded-full"></div>

        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-brand-200 text-brand-700 text-xs font-semibold mb-8 shadow-xs">
            <Sparkles className="w-4 h-4 text-brand-600 animate-spin-slow" />
            <span>Next-Gen Technical Verification & AI Interview Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-5xl mx-auto leading-tight">
            Stop Guessing. <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Verify Resume Claims
            </span> with Adaptive AI Interviews.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            NextHire AI parses engineering resumes, isolates high-stakes claims, conducts personalized 
            adaptive technical interviews, and delivers evidence-based evaluations with deterministic scoring.
          </p>

          {/* Action buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <button
              onClick={async () => {
                await quickLoginAs('candidate');
                setCurrentView('candidate-dashboard');
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-base shadow-md shadow-brand-500/20 flex items-center justify-center space-x-2 transition group"
            >
              <span>Test as Candidate</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={async () => {
                await quickLoginAs('recruiter');
                setCurrentView('recruiter-dashboard');
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-base shadow-xs flex items-center justify-center space-x-2 transition"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Explore Recruiter Console</span>
            </button>
          </div>

          {/* Trust stats strip */}
          <div className="mt-14 pt-10 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-white/60 p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
              <p className="text-2xl font-bold text-slate-900 font-mono">40 / 25 / 20</p>
              <p className="text-xs text-slate-500 mt-1">Weighted Scoring Formula</p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
              <p className="text-2xl font-bold text-emerald-600 font-mono">100%</p>
              <p className="text-xs text-slate-500 mt-1">Evidence-Based Auditing</p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
              <p className="text-2xl font-bold text-brand-600 font-mono">&lt; 3 mins</p>
              <p className="text-xs text-slate-500 mt-1">Automated Resume Parse</p>
            </div>
            <div className="bg-white/60 p-4 rounded-2xl border border-slate-200/60 shadow-2xs">
              <p className="text-2xl font-bold text-indigo-600 font-mono">ReportLab</p>
              <p className="text-xs text-slate-500 mt-1">1-Click PDF Dossier</p>
            </div>
          </div>

        </div>
      </section>

      {/* INTERACTIVE PREVIEW DEMO CARD */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-md relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-brand-600 font-semibold">
                Live Engine Preview
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Deterministic Evaluation & Claim Verification
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-500 font-medium">Candidate: Alex Mercer</span>
              <ScoreBadge score={85.5} size="md" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Interactive Score Breakdown Table */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-brand-600" />
                <span>Deterministic 5-Dimension Scoring Engine</span>
              </h3>

              <div className="space-y-2.5">
                {[
                  { name: 'Technical Accuracy', weight: '40%', score: 88, desc: 'Factual correctness & algorithmic rigor' },
                  { name: 'Technical Depth', weight: '25%', score: 82, desc: 'Internal mechanics & architecture trade-offs' },
                  { name: 'Resume Consistency', weight: '20%', score: 90, desc: 'Alignment with claimed projects & impact' },
                  { name: 'Communication', weight: '10%', score: 85, desc: 'Structure, clarity, and conciseness' },
                  { name: 'Confidence', weight: '5%', score: 80, desc: 'Decisive explanation without evasion' },
                ].map((row, idx) => (
                  <div key={idx} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between transition hover:bg-slate-50">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{row.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-semibold">
                          {row.weight}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{row.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-emerald-600">{row.score} / 100</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sample Verified Claim */}
              <div className="mt-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Audited Resume Claim: Strongly Verified</span>
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">88.5% Confidence</span>
                </div>
                <p className="text-xs text-slate-800 italic mt-1.5">
                  &ldquo;Architected microservices with FastAPI and MongoDB Atlas serving 250k daily active users.&rdquo;
                </p>
                <p className="text-[11px] text-slate-600 mt-2">
                  <strong className="text-slate-900">Auditor Evidence:</strong> Candidate articulated write-through cache invalidation, connection pool tuning, and horizontal pod autoscaling under load.
                </p>
              </div>

            </div>

            {/* Right: Radar Chart Visualization */}
            <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200 rounded-3xl p-6 flex flex-col items-center">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-mono">
                Candidate Competency Radar
              </h4>
              <ScoreRadarChart components={demoComponents} />
              <div className="w-full pt-4 mt-2 border-t border-slate-200 text-center">
                <p className="text-xs text-slate-600">
                  Overall Weighted Score: <strong className="text-slate-900 text-base">85.5 / 100</strong>
                </p>
                <span className="inline-block mt-2 text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                  Recommended for Senior Tech Lead Round
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-wider text-brand-600 font-semibold">
            Next-Gen Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            Engineered For Rigorous Verification
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Every feature is built with real backend functionality, asynchronous database drivers, and multi-tier AI evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs transition hover:shadow-md hover:border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center mb-5 text-brand-600">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Deep Resume Parsing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extracts candidate metadata, categorized technical skills, and high-impact resume statements with PyMuPDF, python-docx, and spaCy NLP token classification.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs transition hover:shadow-md hover:border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center mb-5 text-indigo-600">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Adaptive AI Interviews</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates Basic, Intermediate, and Advanced questions based on stated skills. Questions dynamically adapt based on candidate performance to probe real depth.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs transition hover:shadow-md hover:border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Evidence-Based Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cross-examines interview answers against extracted resume claims. Generates confidence scores, supporting facts, contradictory flags, and comprehensive explanations.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs transition hover:shadow-md hover:border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-5 text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Skill-Gap & Roadmap Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pinpoints strong vs weak skills, flags misunderstood concepts, and synthesizes a personalized 4-week learning roadmap with curated resources.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs transition hover:shadow-md hover:border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-5 text-purple-600">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Candidate Comparison</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multi-candidate side-by-side comparison with dimension radar plots, ranking tables, and hiring pipeline analytics.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs transition hover:shadow-md hover:border-slate-300">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center mb-5 text-cyan-600">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Executive PDF Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Produces downloadable, multi-page PDF evaluation dossiers with formatted tables, weighted scores, and claim verification audits ready for executive presentation.
            </p>
          </div>

        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-b from-white to-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-14 shadow-md relative">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Ready to Experience NextHire AI?
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
            Test the entire pipeline in seconds. Upload a resume, take an adaptive technical interview, and inspect the verified evaluation report.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={async () => {
                await quickLoginAs('candidate');
                setCurrentView('candidate-dashboard');
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-sm transition"
            >
              Start Candidate Interview Demo
            </button>
            <button
              onClick={async () => {
                await quickLoginAs('recruiter');
                setCurrentView('recruiter-dashboard');
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm shadow-xs transition"
            >
              Open Recruiter Dashboard
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
