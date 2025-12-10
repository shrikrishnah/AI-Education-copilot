import React from 'react';
import { LayoutDashboard, UploadCloud, Map, BookOpen, BrainCircuit, MessageSquare, Search } from 'lucide-react';

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
    { id: 'chat', label: 'AI Tutor Chat', icon: MessageSquare },
    { id: 'research', label: 'Web Research', icon: Search },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white">EDU CO-PILOT</h1>
          <p className="text-xs text-slate-500 mt-1">Gemini 3 Pro Powered</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-950">
        <div className="max-w-7xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
};