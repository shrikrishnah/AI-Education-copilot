import React from 'react';
import { AppState, Resource } from '../types';
import { FileText, Award, AlertTriangle, CheckCircle } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const avgCredibility = state.resources.length 
    ? Math.round(state.resources.reduce((acc, r) => acc + (r.metadata?.credibilityScore || 0), 0) / state.resources.length)
    : 0;

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Command Center</h2>
        <p className="text-slate-400">Overview of your learning database and AI analysis.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Resources Ingested" 
          value={state.resources.length} 
          icon={FileText} 
          color="blue"
        />
        <StatCard 
          title="Curriculum Nodes" 
          value={state.curriculum.length} 
          icon={CheckCircle} 
          color="green"
        />
        <StatCard 
          title="Avg. Credibility" 
          value={`${avgCredibility}%`} 
          icon={Award} 
          color="purple"
        />
        <StatCard 
          title="Potential Conflicts" 
          value={state.resources.filter(r => (r.metadata?.warnings.length || 0) > 0).length} 
          icon={AlertTriangle} 
          color="orange"
        />
      </div>

      {/* Resource Scoreboard */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Resource Scoreboard</h3>
          <button 
            onClick={() => onNavigate('upload')}
            className="text-sm text-brand-400 hover:text-brand-300"
          >
            + Add New
          </button>
        </div>
        
        {state.resources.length === 0 ? (
          <div className="glass-panel p-12 rounded-xl text-center border-dashed border-2 border-slate-700">
            <p className="text-slate-400 mb-4">No knowledge base loaded.</p>
            <button 
              onClick={() => onNavigate('upload')}
              className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Upload Resources
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.resources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <div className={`p-6 rounded-xl border ${colors[color]} glass-card`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-slate-100">{value}</h4>
        </div>
        <Icon className="opacity-80" />
      </div>
    </div>
  );
};

const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => {
  const meta = resource.metadata;
  return (
    <div className="glass-card p-5 rounded-xl flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-slate-800 text-xs px-2 py-1 rounded text-slate-300 uppercase tracking-wider">
          {resource.type}
        </span>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${meta && meta.credibilityScore > 70 ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-xs text-slate-400">Score: {meta?.credibilityScore || '?'}</span>
        </div>
      </div>
      
      <h4 className="font-semibold text-white mb-2 line-clamp-2" title={resource.name}>{resource.name}</h4>
      <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-grow">
        {meta?.summary || "Pending analysis..."}
      </p>

      <div className="flex flex-wrap gap-2 mt-auto">
        {meta?.topics.slice(0, 3).map(t => (
          <span key={t} className="text-xs px-2 py-1 bg-brand-900/30 text-brand-300 border border-brand-500/20 rounded-full">
            #{t}
          </span>
        ))}
      </div>
    </div>
  );
};