import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  FileUp, 
  FileText, 
  CheckCircle, 
  Clock, 
  Play, 
  ArrowRight, 
  Download, 
  Sparkles, 
  Award, 
  Cpu, 
  ShieldCheck, 
  BookOpen, 
  Layers, 
  RefreshCw,
  AlertTriangle,
  Send,
  Mic,
  MicOff,
  User,
  Calendar,
  Compass,
  Terminal,
  BarChart3
} from 'lucide-react';
import AiProviderSelector from '../components/AiProviderSelector';
import ScoreBadge from '../components/ScoreBadge';
import ScoreRadarChart from '../components/ScoreRadarChart';
import ClaimVerificationCard from '../components/ClaimVerificationCard';
import RoadmapTimeline from '../components/RoadmapTimeline';

export default function CandidateDashboard() {
  const { user } = useAuth();

  // Active Tab state: 'overview' | 'resume' | 'interview' | 'results'
  const [activeTab, setActiveTab] = useState('overview');

  // Resume state
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Interview state
  const [interviews, setInterviews] = useState([]);
  const [activeInterview, setActiveInterview] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [interviewStarting, setInterviewStarting] = useState(false);
  const [interviewError, setInterviewError] = useState('');
  const [selectedAiProvider, setSelectedAiProvider] = useState('gemini');
  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Evaluation & Results state
  const [evaluation, setEvaluation] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [skillGap, setSkillGap] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Load existing candidate data on mount
  useEffect(() => {
    loadCandidateData();
  }, []);

  // Timer for active interview
  useEffect(() => {
    let interval = null;
    if (activeTab === 'interview' && currentQuestion) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTab, currentQuestion]);

  async function loadCandidateData() {
    try {
      const myResume = await api.resumes.getMyResume();
      if (myResume) {
        setResume(myResume);
      }
      const myInterviews = await api.interviews.getMyInterviews();
      if (myInterviews && myInterviews.length > 0) {
        setInterviews(myInterviews);
        // If latest interview has evaluation, load it
        const latest = myInterviews[0];
        const latestId = latest.id || latest._id;
        if (latest.status === 'completed' || latest.status === 'evaluated') {
          loadInterviewResults(latestId);
        }
      }
    } catch (err) {
      console.warn('Error loading candidate profile data:', err);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const uploaded = await api.resumes.upload(file);
      setResume(uploaded);
      setActiveTab('resume');
    } catch (err) {
      setUploadError(err.message || 'Failed to upload and parse resume.');
    } finally {
      setUploading(false);
    }
  }

  async function handleStartInterview() {
    if (!resume) {
      alert('Please upload your resume before starting an adaptive interview.');
      return;
    }

    const resumeId = resume.id || resume._id;
    if (!resumeId) {
      alert('Resume ID not found. Please re-upload your resume.');
      return;
    }

    setInterviewStarting(true);
    setInterviewError('');
    try {
      const session = await api.interviews.start({
        resume_id: resumeId,
        target_role: user?.title || 'Software Engineer',
        total_questions: 4,
        ai_provider: selectedAiProvider
      });

      const sessionId = session?.id || session?._id;
      setActiveInterview(session);
      
      // Fetch initial question
      const firstQ = await api.interviews.getNextQuestion(sessionId);
      if (firstQ && firstQ.question_id) {
        setCurrentQuestion(firstQ);
        setActiveTab('interview');
      } else if (firstQ && firstQ.status === 'completed') {
        await loadInterviewResults(sessionId);
        setActiveTab('results');
      } else {
        throw new Error('Interview initiated, but first question payload was invalid.');
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setInterviewError(err.message || 'Failed to initialize adaptive interview.');
      alert(`Interview launch notice: ${err.message}`);
    } finally {
      setInterviewStarting(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!answerText.trim()) {
      alert('Please provide your response before advancing.');
      return;
    }

    const interviewId = activeInterview?.id || activeInterview?._id;
    if (!interviewId || !currentQuestion?.question_id) {
      alert('Active interview session or question is missing.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      const result = await api.interviews.submitAnswer(interviewId, {
        question_id: currentQuestion.question_id,
        answer_text: answerText,
        time_taken_seconds: timerSeconds
      });

      setAnswerText('');
      setTimerSeconds(0);

      if (result.is_completed) {
        // Interview finished, load results
        await loadInterviewResults(interviewId);
        setActiveTab('results');
      } else {
        // Advance to next question
        const nextQ = await api.interviews.getNextQuestion(interviewId);
        if (nextQ.status === 'completed' || !nextQ.question_id) {
          await loadInterviewResults(interviewId);
          setActiveTab('results');
        } else {
          setCurrentQuestion(nextQ);
        }
      }
    } catch (err) {
      alert(`Error submitting answer: ${err.message}`);
    } finally {
      setSubmittingAnswer(false);
    }
  }

  async function loadInterviewResults(interviewId) {
    setLoadingResults(true);
    try {
      const [evalRes, verifRes, skillGapRes] = await Promise.all([
        api.evaluations.getResults(interviewId).catch(() => null),
        api.evaluations.getVerifications(interviewId).catch(() => ({ verifications: [] })),
        api.evaluations.getSkillGap(interviewId).catch(() => null),
      ]);
      setEvaluation(evalRes);
      setVerifications(verifRes?.verifications || []);
      setSkillGap(skillGapRes);
    } catch (err) {
      console.error('Error fetching evaluation results:', err);
    } finally {
      setLoadingResults(false);
    }
  }

  async function handleDownloadReport(interviewId) {
    setDownloadingPdf(true);
    try {
      const blob = await api.reports.downloadPdf(interviewId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NextHire_Evaluation_${user?.name?.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Failed to download PDF report: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  }

  // Formatting seconds into MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Profile Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-md shadow-brand-500/20 shrink-0">
            {user?.name?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{user?.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-semibold">
                Candidate
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {user?.title || 'Software Engineer'} &bull; {user?.email}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {resume ? (
            <button
              onClick={handleStartInterview}
              disabled={submittingAnswer || interviewStarting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {interviewStarting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Questions...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Adaptive Interview</span>
                </>
              )}
            </button>
          ) : (
            <label className="cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-sm flex items-center justify-center space-x-2 transition">
              <FileUp className="w-4 h-4" />
              <span>Upload Resume (PDF/DOCX)</span>
              <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* AI Reasoning Engine Selector Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
        <AiProviderSelector 
          compact={false}
          value={selectedAiProvider}
          onChange={setSelectedAiProvider}
        />
      </div>

      {/* Error Banner if Interview Launch failed */}
      {interviewError && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{interviewError}</span>
          </div>
          <button 
            onClick={() => setInterviewError('')}
            className="text-rose-700 hover:text-rose-900 ml-3 underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Interview Generation Loading Modal Overlay */}
      {interviewStarting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center mx-auto shadow-md shadow-brand-500/25">
              <Cpu className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Synthesizing Adaptive Interview</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              NextHire AI is cross-referencing your resume claims and projects with{' '}
              <strong className="text-brand-600 uppercase font-mono">{selectedAiProvider}</strong> to construct tailored technical defense questions...
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-brand-600 to-emerald-500 h-2 w-full animate-pulse"></div>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Please wait a few seconds...</p>
          </div>
        </div>
      )}

      {/* Navigation Subtabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Compass },
          { id: 'resume', label: 'Resume & Claims', icon: FileText, badge: resume ? 'Parsed' : null },
          { id: 'interview', label: 'AI Interview Room', icon: Cpu, badge: currentQuestion ? 'Live' : null },
          { id: 'results', label: 'Evaluation & Roadmap', icon: Award, badge: evaluation ? `${evaluation.overall_score}%` : null },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center space-x-2 shrink-0 ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Resume Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Resume Status
                </span>
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-600" />
                </div>
              </div>
              {resume ? (
                <div>
                  <p className="text-lg font-bold text-slate-900 truncate">{resume.file_name || 'Uploaded Resume'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {resume.parsed_data?.skills?.length || 0} Skills &bull; {resume.parsed_data?.claims?.length || 0} Claims Extracted
                  </p>
                  <button
                    onClick={() => setActiveTab('resume')}
                    className="mt-4 text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                  >
                    <span>Inspect extracted claims</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-700">No resume analyzed yet.</p>
                  <label className="mt-4 inline-flex items-center space-x-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
                    <FileUp className="w-4 h-4" />
                    <span>Upload your resume to begin</span>
                    <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Interview Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Interview Sessions
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 font-mono">
                {interviews.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Completed technical evaluations
              </p>
              <button
                onClick={() => setActiveTab('interview')}
                className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
              >
                <span>Go to active interview room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Evaluation Score Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                  Latest Score
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              {evaluation ? (
                <div>
                  <div className="flex items-center space-x-2">
                    <ScoreBadge score={evaluation.overall_score} size="lg" />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Certified Weighted Deterministic Rating
                  </p>
                  <button
                    onClick={() => setActiveTab('results')}
                    className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                  >
                    <span>View full audit dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-slate-700">No evaluation results yet.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Take an adaptive interview to generate your score.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Quick Launch Card */}
          <div className="bg-gradient-to-r from-brand-50 via-indigo-50 to-blue-50 border border-brand-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-brand-200 text-brand-700 text-xs font-semibold mb-2 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deterministic Recruiter Pipeline</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Ready to verify your claimed engineering skills?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                The AI interviewer will investigate your architectural decisions, data structures, and production benchmarks.
              </p>
            </div>
            <button
              onClick={handleStartInterview}
              disabled={!resume || submittingAnswer || interviewStarting}
              className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50 shrink-0"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Begin Technical Evaluation</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: RESUME & CLAIMS */}
      {activeTab === 'resume' && (
        <div className="space-y-6">
          {resume ? (
            <div className="space-y-6">
              
              {/* Parsed Candidate Profile Details */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Extracted Candidate Details</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Parsed with PyMuPDF &amp; spaCy NLP token classification.</p>
                  </div>
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition">
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Re-upload New File</span>
                    <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Candidate Name:</span>
                    <p className="text-sm font-bold text-slate-900">{resume.parsed_data?.candidate_name || user?.name || 'Not Detected'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Email Address:</span>
                    <p className="text-sm font-bold text-slate-900">{resume.parsed_data?.email || user?.email || 'Not Detected'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Phone Number:</span>
                    <p className="text-sm font-bold text-slate-900">{resume.parsed_data?.phone || 'Not Specified'}</p>
                  </div>
                </div>

                {resume.parsed_data?.summary && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <span className="text-slate-400 text-xs block mb-1">Executive Summary:</span>
                    <p className="text-xs text-slate-700 italic bg-slate-50 p-3.5 rounded-xl border border-slate-200">{resume.parsed_data.summary}</p>
                  </div>
                )}
              </div>

              {/* Skills Categorized */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Identified Technical Skills ({resume.parsed_data?.skills?.length || 0})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resume.parsed_data?.skills?.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center space-x-2 font-medium"
                    >
                      <span className="text-slate-900 font-semibold">{skill.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                        {skill.proficiency || skill.category}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Extracted Projects */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Resume Projects Analyzed</span>
                </h3>
                <div className="space-y-4">
                  {resume.parsed_data?.projects?.map((proj, pIdx) => (
                    <div key={pIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                        {proj.role && <span className="text-xs text-slate-500 font-medium">{proj.role}</span>}
                      </div>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{proj.description}</p>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {proj.technologies.map((t, tIdx) => (
                            <span key={tIdx} className="text-[10px] bg-white px-2 py-0.5 rounded-md text-cyan-700 border border-slate-200 font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Isolated Resume Claims */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-brand-600" />
                      <span>Isolated High-Stakes Technical Claims ({resume.parsed_data?.claims?.length || 0})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Statements claiming architectural decisions, performance benchmarks, and scalability metrics.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {resume.parsed_data?.claims?.map((claim, cIdx) => (
                    <div key={cIdx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                            {claim.category || 'Technical Claim'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Impact: {claim.impact_level || 'Medium'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium italic">
                          &ldquo;{claim.claim_text}&rdquo;
                        </p>
                      </div>
                      <button
                        onClick={handleStartInterview}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold shrink-0 transition shadow-2xs"
                      >
                        Verify in Interview
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
              <FileUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No Resume Uploaded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Upload your resume in PDF or DOCX format to parse your skills and technical claims automatically.
              </p>
              <label className="cursor-pointer px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition">
                <span>Select Resume File</span>
                <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI INTERVIEW ROOM */}
      {activeTab === 'interview' && (
        <div className="space-y-6">
          {currentQuestion ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-md relative overflow-hidden">
              
              {/* Question header info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div className="flex items-center space-x-3">
                  <span className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center font-mono font-bold text-xs text-brand-700">
                    Q{currentQuestion.question_index}
                  </span>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                      Adaptive Question {currentQuestion.question_index} of {currentQuestion.total_questions}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-slate-900 capitalize">
                        Target Topic: {currentQuestion.target_skill_or_topic}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold border ${
                        currentQuestion.difficulty === 'advanced'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : currentQuestion.difficulty === 'intermediate'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time timer */}
                <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Time: {formatTime(timerSeconds)}</span>
                </div>
              </div>

              {/* Question Text */}
              <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-600 font-bold block mb-2">
                  Technical Problem / Claim Investigation:
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQuestion.question_text}
                </p>
                {currentQuestion.related_project && (
                  <p className="text-xs text-indigo-700 mt-2 font-medium">
                    &bull; Related to your stated project: <strong>{currentQuestion.related_project}</strong>
                  </p>
                )}
              </div>

              {/* Answer submission textarea */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <span>Your Technical Explanation &amp; Architecture Defense:</span>
                  </label>
                  
                  {/* Speech input simulator toggle */}
                  <button
                    type="button"
                    onClick={() => setIsRecording(!isRecording)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium border transition ${
                      isRecording 
                        ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isRecording ? <Mic className="w-3.5 h-3.5 text-rose-600" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{isRecording ? 'Listening...' : 'Voice Dictation'}</span>
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Explain your technical decisions, algorithms, data structures, trade-offs, and empirical results in detail..."
                  className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition font-sans leading-relaxed"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 pt-2">
                  <p className="italic">
                    Tip: Cite specific libraries, metric benchmarks, and concurrency or caching strategies.
                  </p>
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={submittingAnswer || !answerText.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-sm flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    {submittingAnswer ? (
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    ) : (
                      <>
                        <span>{currentQuestion.is_last_question ? 'Submit & Finalize Audit' : 'Submit & Proceed'}</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
              <Cpu className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Interview Ready</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Ready to verify your skills? NextHire AI will generate personalized technical questions based on your resume using <strong className="text-brand-600 font-mono uppercase">{selectedAiProvider}</strong>.
              </p>
              <button
                onClick={handleStartInterview}
                disabled={!resume || submittingAnswer || interviewStarting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 inline-flex items-center space-x-2"
              >
                {interviewStarting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Questions...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Adaptive Interview Now</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EVALUATION & REPORT LAB REPORT */}
      {activeTab === 'results' && (
        <div className="space-y-8">
          {loadingResults ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-700 font-semibold">Running Multi-Tier Deterministic Scoring &amp; Verification...</p>
            </div>
          ) : evaluation ? (
            <div className="space-y-8">
              
              {/* Score Dossier Header Banner */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-brand-600 font-semibold">
                    Certified Technical Audit Dossier
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                    Interview Evaluation &amp; Evidence Audit
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deterministic calculation: Accuracy (40%), Depth (25%), Consistency (20%), Communication (10%), Confidence (5%).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <ScoreBadge score={evaluation.overall_score} size="xl" />
                  <button
                    onClick={() => handleDownloadReport(activeInterview?.id || activeInterview?._id || interviews[0]?.id || interviews[0]?._id)}
                    disabled={downloadingPdf}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center space-x-2 transition disabled:opacity-50"
                  >
                    {downloadingPdf ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Dossier'}</span>
                  </button>
                </div>
              </div>

              {/* 5-Dimension Detailed Breakdown & Radar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Score Table */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-brand-600" />
                    <span>Deterministic Scoring Breakdown</span>
                  </h3>

                  <div className="space-y-3">
                    {[
                      { name: 'Technical Accuracy', weight: '40%', score: evaluation.average_components?.technical_accuracy || 0 },
                      { name: 'Technical Depth', weight: '25%', score: evaluation.average_components?.technical_depth || 0 },
                      { name: 'Resume Consistency', weight: '20%', score: evaluation.average_components?.resume_consistency || 0 },
                      { name: 'Communication Clarity', weight: '10%', score: evaluation.average_components?.communication || 0 },
                      { name: 'Confidence & Justification', weight: '5%', score: evaluation.average_components?.confidence || 0 },
                    ].map((row, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{row.name}</span>
                          <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200 font-semibold">
                            {row.weight}
                          </span>
                        </div>
                        <div className="text-right font-mono text-xs font-bold text-emerald-600">
                          {row.score} / 100
                        </div>
                      </div>
                    ))}
                  </div>

                  {evaluation.executive_summary && (
                    <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block mb-1">Executive Summary:</strong>
                      {evaluation.executive_summary}
                    </div>
                  )}
                </div>

                {/* Radar Visualizer */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">
                    Competency Geometry Radar
                  </h3>
                  <ScoreRadarChart components={evaluation.average_components} />
                </div>

              </div>

              {/* Evidence-Based Claim Verification Cards */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-brand-600" />
                      <span>Evidence-Based Resume Claim Audits ({verifications.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Empirical cross-examination of interview statements against resume achievements.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {verifications && verifications.length > 0 ? (
                    verifications.map((claim, vIdx) => (
                      <ClaimVerificationCard key={vIdx} claim={claim} />
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4">No claim audits recorded for this interview session.</p>
                  )}
                </div>
              </div>

              {/* Skill-Gap Analysis & 4-Week Learning Roadmap */}
              {skillGap && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-cyan-600" />
                        <span>Skill-Gap Analysis &amp; Personalized 4-Week Growth Roadmap</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Targeted curriculum synthesized based on observed technical boundaries.
                      </p>
                    </div>
                  </div>

                  {/* Strong vs Weak Skills */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
                      <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center space-x-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Demonstrated Strong Skills</span>
                      </h4>
                      <div className="space-y-2">
                        {skillGap.strong_skills?.map((sk, idx) => (
                          <div key={idx} className="text-xs text-slate-800 flex items-center justify-between">
                            <span>{sk.skill_name}</span>
                            <span className="font-mono text-emerald-700 font-semibold">{sk.proficiency_level}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                      <h4 className="text-xs font-bold text-amber-800 mb-2 flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Development Target Areas</span>
                      </h4>
                      <div className="space-y-2">
                        {skillGap.weak_skills?.map((sk, idx) => (
                          <div key={idx} className="text-xs text-slate-800 flex items-center justify-between">
                            <span>{sk.skill_name}</span>
                            <span className="font-mono text-amber-700 font-semibold">{sk.proficiency_level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Learning Roadmap Timeline */}
                  <RoadmapTimeline roadmap={skillGap.learning_roadmap} />
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
              <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No Evaluation Results</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Complete your adaptive interview to generate your certified evaluation score and downloadable ReportLab PDF.
              </p>
              <button
                onClick={() => setActiveTab('interview')}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
              >
                Go to Interview Room
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
