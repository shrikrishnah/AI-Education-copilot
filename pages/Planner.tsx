import React from 'react';
import { StudyPlan } from '../types';
import { Calendar, ChevronRight, PlayCircle, Loader2, Sparkles } from 'lucide-react';

interface PlannerProps {
  plan: StudyPlan | null;
  onGenerate: () => void;
  loading: boolean;
  hasResources: boolean;
}

export const Planner: React.FC<PlannerProps> = ({ plan, onGenerate, loading, hasResources }) => {
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="mb-6 p-4 bg-brand-500/10 rounded-full">
           <Sparkles className="w-12 h-12 text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Build Your Curriculum?</h2>
        <p className="text-slate-400 max-w-md mb-8">
          Based on your {hasResources ? 'uploaded resources' : 'empty library'}, 
          Gemini will construct a logical, step-by-step 3-year roadmap.
        </p>
        
        {hasResources ? (
          <button 
            onClick={onGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
            Generate 3-Year Plan
          </button>
        ) : (
          <div className="text-amber-400 border border-amber-500/20 bg-amber-500/10 px-4 py-2 rounded-lg">
            Please upload resources first.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Your Master Plan</h2>
          <p className="text-slate-400">A dynamic 3-year roadmap adapted to your resources.</p>
        </div>
        <button onClick={onGenerate} className="text-sm text-slate-500 hover:text-white flex items-center gap-1">
          <Loader2 className="w-3 h-3" /> Regenerate
        </button>
      </header>

      <div className="space-y-12">
        {plan.years.map((year) => (
          <div key={year.year} className="relative pl-8 border-l-2 border-slate-800 space-y-6">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
            
            <div className="glass-panel p-6 rounded-xl border-l-4 border-l-brand-500">
              <h3 className="text-2xl font-bold text-white mb-1">Year {year.year}: {year.focus}</h3>
              <p className="text-slate-400 text-sm">Primary Objective</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {year.quarters.map((quarter) => (
                <div key={quarter.quarter} className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 hover:border-brand-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-3 text-brand-400 font-semibold text-sm uppercase tracking-wider">
                    <Calendar className="w-4 h-4" /> Quarter {quarter.quarter}
                  </div>
                  <h4 className="text-white font-medium mb-4">{quarter.focus}</h4>
                  
                  <div className="space-y-2">
                    {quarter.months.flatMap(m => m.topics).slice(0, 3).map((topic, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <ChevronRight className="w-3 h-3 mt-1 text-slate-600" />
                        <span className="line-clamp-1">{topic.title}</span>
                      </div>
                    ))}
                    {quarter.months.flatMap(m => m.topics).length > 3 && (
                      <div className="text-xs text-slate-600 pl-5">
                        + {quarter.months.flatMap(m => m.topics).length - 3} more topics
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
