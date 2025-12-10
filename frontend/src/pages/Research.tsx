import React, { useState } from 'react';
import { api } from '../services/api';
import { ResearchResult } from '../types';
import { Search, ExternalLink, Loader2, Globe } from 'lucide-react';

export const Research: React.FC = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.research(query);
      setResult(data);
    } catch (e) {
      alert('Research failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-2">Web Research Assistant</h2>
        <p className="text-slate-400">Grounded responses using real-time Google Search data.</p>
      </header>

      <form onSubmit={handleResearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Research a topic (e.g., 'Latest breakthroughs in quantum computing')..."
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 pl-12 pr-32 text-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-xl"
        />
        <button 
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Search'}
        </button>
      </form>

      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="glass-panel p-8 rounded-xl border border-blue-500/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" /> 
              AI Synthesis
            </h3>
            <div className="prose prose-invert prose-blue max-w-none">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{result.text}</p>
            </div>
          </div>

          {result.sources.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Verified Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all group"
                  >
                    <span className="text-sm text-slate-300 truncate font-medium">{source.title}</span>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};