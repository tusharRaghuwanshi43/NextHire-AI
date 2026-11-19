import React from 'react';
import { Sparkles, Terminal, Database, Cpu, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 mt-auto">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3 text-center md:text-left">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base">NextHire AI</span>
              <p className="text-xs text-slate-500">
                Evidence-Based Technical Claim Verification & AI Recruitment Platform
              </p>
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-1.5 shadow-2xs">
              <Terminal className="w-3.5 h-3.5 text-cyan-600" />
              <span className="font-medium">FastAPI</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-1.5 shadow-2xs">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">MongoDB Atlas</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-1.5 shadow-2xs">
              <Cpu className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-medium">Multi-AI LLMs</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-1.5 shadow-2xs">
              <CheckCircle className="w-3.5 h-3.5 text-brand-600" />
              <span className="font-medium">spaCy NLP</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 flex items-center space-x-1.5 shadow-2xs">
              <span className="text-indigo-600 font-mono font-medium">React 18</span>
            </span>
          </div>

          <div className="text-xs text-slate-400 text-center md:text-right">
            &copy; {new Date().getFullYear()} NextHire AI. Production.
          </div>
        </div>
      </div>
    </footer>
  );
}
