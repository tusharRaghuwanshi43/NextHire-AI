import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sparkles, Check, ChevronDown, Cpu, AlertCircle } from 'lucide-react';

export const PROVIDER_OPTIONS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    shortName: 'Gemini',
    model: 'gemini-2.5-flash',
    badge: 'Fast & Multimodal',
    color: 'from-brand-500 to-indigo-500',
    border: 'border-brand-500/50',
    dot: 'bg-brand-500'
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o)',
    shortName: 'OpenAI',
    model: 'gpt-4o',
    badge: 'Code & Reasoning',
    color: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/50',
    dot: 'bg-emerald-500'
  },
  {
    id: 'grok',
    name: 'Grok / Groq (xAI & GroqCloud)',
    shortName: 'Grok / Groq',
    model: 'grok-2 / llama-3.3-70b',
    badge: 'Ultra Fast',
    color: 'from-amber-500 to-orange-500',
    border: 'border-amber-500/50',
    dot: 'bg-amber-500'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter AI',
    shortName: 'OpenRouter',
    model: 'Universal Gateway',
    badge: 'Multi-Model',
    color: 'from-purple-500 to-pink-500',
    border: 'border-purple-500/50',
    dot: 'bg-purple-500'
  }
];

export default function AiProviderSelector({ 
  compact = false, 
  value = null, 
  onChange = null,
  showLabel = true 
}) {
  const [activeProvider, setActiveProvider] = useState(value || 'gemini');
  const [providersData, setProvidersData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (value && value !== activeProvider) {
      setActiveProvider(value);
    }
  }, [value]);

  async function loadProviders() {
    try {
      const data = await api.settings.getAiProviders();
      if (data?.active_provider) {
        setActiveProvider(data.active_provider);
        if (onChange && !value) onChange(data.active_provider);
      }
      if (data?.providers) {
        setProvidersData(data.providers);
      }
    } catch (err) {
      console.warn('Could not load AI provider settings:', err);
    }
  }

  async function handleSelect(providerId) {
    setActiveProvider(providerId);
    setIsOpen(false);
    if (onChange) {
      onChange(providerId);
    }
    
    // Update backend setting
    setLoading(true);
    try {
      await api.settings.setAiProvider(providerId);
      // Dispatch custom event so other components stay in sync
      window.dispatchEvent(new CustomEvent('nexthire_ai_provider_changed', { detail: providerId }));
    } catch (err) {
      console.error('Failed to update active AI provider:', err);
    } finally {
      setLoading(false);
    }
  }

  // Listen to cross-component changes
  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail !== activeProvider) {
        setActiveProvider(e.detail);
      }
    };
    window.addEventListener('nexthire_ai_provider_changed', handler);
    return () => window.removeEventListener('nexthire_ai_provider_changed', handler);
  }, [activeProvider]);

  const currentOption = PROVIDER_OPTIONS.find((p) => p.id === activeProvider) || PROVIDER_OPTIONS[0];
  const backendInfo = providersData.find((p) => p.id === activeProvider);

  if (compact) {
    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-xs text-slate-700 transition shadow-xs"
          title={`Active AI Provider: ${currentOption.name}`}
        >
          <span className={`w-2 h-2 rounded-full ${currentOption.dot} animate-pulse`}></span>
          <span className="font-semibold text-[11px] text-slate-500">AI:</span>
          <span className="font-bold text-[11px] text-slate-900">{currentOption.shortName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50">
              <div className="px-3.5 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Select AI Reasoning Engine
                </span>
              </div>
              {PROVIDER_OPTIONS.map((opt) => {
                const isSelected = opt.id === activeProvider;
                const bInfo = providersData.find((p) => p.id === opt.id);
                const hasKey = bInfo ? Boolean(bInfo.is_configured ?? bInfo.has_api_key) : true;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs transition ${
                      isSelected 
                        ? 'bg-brand-50 text-brand-700 font-semibold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${opt.dot}`}></span>
                      <div>
                        <div className="text-xs font-medium text-slate-900">{opt.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{opt.model}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full detailed selector card
  return (
    <div className="space-y-3">
      {showLabel && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <label className="font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
            <Cpu className="w-4 h-4 text-brand-600" />
            <span>Select AI Engine for Interview & Audit:</span>
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            Active Engine: <strong className="text-slate-900">{currentOption.name}</strong>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {PROVIDER_OPTIONS.map((opt) => {
          const isSelected = opt.id === activeProvider;
          const bInfo = providersData.find((p) => p.id === opt.id);
          const hasKey = bInfo ? Boolean(bInfo.is_configured ?? bInfo.has_api_key) : true;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-50/70 border-brand-500 shadow-sm ring-2 ring-brand-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`}></span>
                    <span className="text-xs font-bold text-slate-900">{opt.shortName}</span>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-100 text-[10px] font-mono text-brand-700 font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-800 font-semibold">{opt.name}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{opt.model}</p>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">{opt.badge}</span>
                <span className={`font-mono font-medium ${hasKey ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {hasKey ? '● Configured' : '○ Needs Key'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
