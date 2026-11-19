import React from 'react';

export default function ScoreBadge({ score, size = 'md' }) {
  const numeric = typeof score === 'number' ? score : parseFloat(score) || 0;

  let colorClasses = 'bg-rose-50 border-rose-200 text-rose-800';
  let dotColor = 'bg-rose-500';

  if (numeric >= 80) {
    colorClasses = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    dotColor = 'bg-emerald-500';
  } else if (numeric >= 65) {
    colorClasses = 'bg-amber-50 border-amber-200 text-amber-800';
    dotColor = 'bg-amber-500';
  }

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3.5 py-1 font-semibold',
    lg: 'text-lg px-4 py-1.5 font-bold',
    xl: 'text-2xl px-5 py-2 font-extrabold'
  }[size] || 'text-sm px-3.5 py-1';

  return (
    <span className={`inline-flex items-center space-x-2 rounded-full border shadow-2xs ${colorClasses} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
      <span>{numeric.toFixed(1)} / 100</span>
    </span>
  );
}
