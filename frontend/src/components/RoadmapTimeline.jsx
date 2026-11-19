import React from 'react';
import { Calendar, Target, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

export default function RoadmapTimeline({ roadmap }) {
  if (!roadmap || roadmap.length === 0) {
    return <p className="text-slate-400 text-sm py-4">No learning roadmap data available.</p>;
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-8 my-4">
      {roadmap.map((milestone, index) => {
        const {
          week_or_phase = `Phase ${index + 1}`,
          focus_topic = 'Technical Mastery',
          action_items = [],
          resources = []
        } = milestone;

        return (
          <div key={index} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-[31px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition">
              <span className="w-2 h-2 rounded-full bg-brand-600"></span>
            </div>

            {/* Content card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition hover:shadow-md hover:border-slate-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 w-fit">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{week_or_phase}</span>
                </span>
                <span className="text-xs text-slate-600 font-medium flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Focus: <strong className="text-slate-900">{focus_topic}</strong></span>
                </span>
              </div>

              {/* Action Items */}
              {action_items && action_items.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Action Items:</span>
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {action_items.map((action, aIdx) => (
                      <li key={aIdx} className="flex items-start space-x-2">
                        <span className="text-brand-600 font-bold">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resources */}
              {resources && resources.length > 0 && (
                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1 mr-1">
                    <BookOpen className="w-3 h-3 text-cyan-600" />
                    <span>Curated Resources:</span>
                  </span>
                  {resources.map((res, rIdx) => (
                    <span 
                      key={rIdx} 
                      className="text-[11px] bg-slate-100 px-2.5 py-0.5 rounded-md text-slate-700 border border-slate-200 font-medium"
                    >
                      {res}
                    </span>
                  ))}
                </div>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
}
