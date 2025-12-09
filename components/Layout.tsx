import React from 'react';
import { LayoutDashboard, UploadCloud, Map, BookOpen, BrainCircuit } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Ingest Resources', icon: UploadCloud },
    { id: 'planner', label: '3-Year Roadmap', icon: Map },
    { id: 'notes', label: 'Master Notes', icon: BookOpen },
    { id: 'quiz', label: 'Quiz & Recall', icon: BrainCircuit },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-accent-500 bg-clip-text text-transparent">
            EDU CO-PILOT
          </h1>
          <p className="text-xs text-slate-500 mt-1">AI-Powered Curriculum</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id 
                  ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            Gemini 3 Pro Active
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
