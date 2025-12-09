import React from 'react';
import { AppState, Resource } from '../types';
import { FileText, Award, AlertTriangle, CheckCircle } from 'lucide-react';

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
            <div key={r.id} className="glass-panel p-5 rounded-xl">
              <h4 className="font-semibold text-white truncate">{r.name}</h4>
              <p className="text-sm text-slate-400 line-clamp-2">{r.metadata?.summary || 'Processing...'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};