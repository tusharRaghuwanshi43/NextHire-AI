import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

export default function ScoreRadarChart({ components, type = 'radar', showWeightedComparison = true }) {
  if (!components) {
    return <div className="text-slate-400 text-sm py-8 text-center">Score metrics not available.</div>;
  }

  const data = [
    {
      subject: 'Tech Accuracy',
      weight: '40%',
      score: components.technical_accuracy || 0,
      weighted: Number(((components.technical_accuracy || 0) * 0.4).toFixed(1)),
      max: 100,
    },
    {
      subject: 'Tech Depth',
      weight: '25%',
      score: components.technical_depth || 0,
      weighted: Number(((components.technical_depth || 0) * 0.25).toFixed(1)),
      max: 100,
    },
    {
      subject: 'Resume Consistency',
      weight: '20%',
      score: components.resume_consistency || 0,
      weighted: Number(((components.resume_consistency || 0) * 0.2).toFixed(1)),
      max: 100,
    },
    {
      subject: 'Communication',
      weight: '10%',
      score: components.communication || 0,
      weighted: Number(((components.communication || 0) * 0.1).toFixed(1)),
      max: 100,
    },
    {
      subject: 'Confidence',
      weight: '5%',
      score: components.confidence || 0,
      weighted: Number(((components.confidence || 0) * 0.05).toFixed(1)),
      max: 100,
    },
  ];

  if (type === 'bar') {
    return (
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
            <YAxis dataKey="subject" type="category" stroke="#64748b" width={110} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value, name) => [`${value} / 100`, 'Dimension Score']}
            />
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.score >= 80 ? '#10b981' : entry.score >= 65 ? '#f59e0b' : '#ef4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            stroke="#94a3b8" 
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#2563eb"
            fill="#3b82f6"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
