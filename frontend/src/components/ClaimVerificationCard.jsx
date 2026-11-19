import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Shield, Info } from 'lucide-react';

export default function ClaimVerificationCard({ claim }) {
  const {
    claim_text,
    status = 'unverified',
    confidence_score = 0,
    supporting_evidence = [],
    contradictory_evidence = [],
    explanation = ''
  } = claim;

  const statusConfig = {
    strongly_verified: {
      label: 'Strongly Verified',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: CheckCircle2,
      desc: 'Candidate articulated concrete architecture, tools, and quantifiable outcomes.'
    },
    partially_verified: {
      label: 'Partially Verified',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      icon: AlertTriangle,
      desc: 'Demonstrated conceptual knowledge, but with minor gaps in operational depth.'
    },
    questionable: {
      label: 'Questionable',
      color: 'text-orange-700 bg-orange-50 border-orange-200',
      icon: HelpCircle,
      desc: 'Explanations were generic or evaded specific technical justification.'
    },
    contradicted: {
      label: 'Contradicted',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      icon: XCircle,
      desc: 'Interview responses directly conflicted with technical principles claimed.'
    },
    unverified: {
      label: 'Unverified',
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      icon: Info,
      desc: 'Not yet examined in interview.'
    }
  }[status] || {
    label: status.replace('_', ' '),
    color: 'text-slate-600 bg-slate-100 border-slate-200',
    icon: Info,
    desc: ''
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition hover:shadow-md hover:border-slate-300">
      
      {/* Header: Claim & Status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1">
            Audited Resume Statement
          </span>
          <p className="text-sm font-semibold text-slate-900 leading-relaxed">
            &ldquo;{claim_text}&rdquo;
          </p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusConfig.label}</span>
          </span>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {confidence_score}% Conf.
          </span>
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="mt-3.5 text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <span className="font-semibold text-slate-900 block mb-0.5">Auditor Assessment:</span>
          {explanation}
        </div>
      )}

      {/* Evidence Sections */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Supporting Evidence */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5">
          <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Supporting Evidence</span>
          </div>
          {supporting_evidence && supporting_evidence.length > 0 ? (
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              {supporting_evidence.map((item, idx) => (
                <li key={idx} className="leading-tight">{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">No direct positive verification points cited.</p>
          )}
        </div>

        {/* Contradictory Evidence */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3.5">
          <div className="flex items-center space-x-1.5 text-rose-800 font-semibold mb-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Contradictory / Missing Points</span>
          </div>
          {contradictory_evidence && contradictory_evidence.length > 0 ? (
            <ul className="space-y-1 text-slate-700 list-disc list-inside">
              {contradictory_evidence.map((item, idx) => (
                <li key={idx} className="leading-tight">{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">No contradictory statements identified.</p>
          )}
        </div>
      </div>

    </div>
  );
}
