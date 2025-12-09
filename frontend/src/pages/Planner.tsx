import React from 'react';
import { StudyPlan } from '../types';
import { Loader2, PlayCircle } from 'lucide-react';

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
        <h2 className="text-2xl font-bold text-white mb-4">Curriculum Builder</h2>
        <button 
          onClick={onGenerate} 
          disabled={loading || !hasResources}
          className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
          Generate 3-Year Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {plan.years.map((year) => (
        <div key={year.year} className="space-y-4">
          <h3 className="text-2xl font-bold text-white">Year {year.year}: {year.focus}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {year.quarters.map((q) => (
              <div key={q.quarter} className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h4 className="text-blue-400 font-bold mb-2">Q{q.quarter}</h4>
                <p className="text-white text-sm mb-2">{q.focus}</p>
                <ul className="text-xs text-slate-400 list-disc ml-4">
                  {q.months.flatMap(m => m.topics).map(t => <li key={t.id}>{t.title}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};