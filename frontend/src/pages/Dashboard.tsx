import React from 'react';
import { AppState, Resource } from '../types';
import { FileText, Award, AlertTriangle, CheckCircle, Image, Globe, Link } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Command Center</h2>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/10">
          <p className="text-slate-400 text-sm">Resources</p>
          <h4 className="text-3xl font-bold text-slate-100">{state.resources.length}</h4>
        </div>
        <div className="p-6 rounded-xl border border-green-500/20 bg-green-500/10">
          <p className="text-slate-400 text-sm">Nodes</p>
          <h4 className="text-3xl font-bold text-slate-100">{state.curriculum.length}</h4>
        </div>
      </div>
      <section>
        <h3 className="text-xl font-semibold text-white mb-4">Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.resources.map(r => (
            <div key={r.id} className="glass-panel p-5 rounded-xl border-t-2 border-t-slate-700">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  {r.type === 'image' ? <Image size={14} /> : r.type === 'url' ? <Globe size={14} /> : <FileText size={14} />}
                  {r.type}
                </div>
                {r.metadata && <span className="text-xs text-green-400">Score: {r.metadata.credibilityScore}</span>}
              </div>
              <h4 className="font-semibold text-white truncate mb-1" title={r.name}>{r.name}</h4>
              <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">{r.metadata?.summary || 'Processing...'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};