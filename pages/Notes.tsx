import React, { useState } from 'react';
import { CurriculumNode, MasterNote } from '../types';
import { Book, ChevronRight, Loader2, FileText, Check } from 'lucide-react';

interface NotesProps {
  curriculum: CurriculumNode[];
  notes: MasterNote[];
  onGenerate: (topicId: string) => void;
  loading: boolean;
}

export const Notes: React.FC<NotesProps> = ({ curriculum, notes, onGenerate, loading }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const selectedNote = notes.find(n => n.topicId === selectedTopicId);
  const selectedTopic = curriculum.find(n => n.id === selectedTopicId);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar: Topic List */}
      <div className="w-1/3 glass-panel rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700 bg-slate-900/50">
          <h3 className="font-bold text-white">Curriculum Topics</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {curriculum.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">Generate a plan first to see topics.</p>
          )}
          {curriculum.map(topic => {
            const hasNote = notes.some(n => n.topicId === topic.id);
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${
                  selectedTopicId === topic.id 
                    ? 'bg-brand-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex-1 truncate pr-2">
                  <div className="font-medium text-sm truncate">{topic.title}</div>
                  <div className="text-xs opacity-70 truncate">{topic.description}</div>
                </div>
                {hasNote ? <Check className="w-4 h-4 text-green-400" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main: Note Content */}
      <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col relative">
        {!selectedTopicId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Book className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a topic to view or generate notes.</p>
          </div>
        ) : selectedNote ? (
          <div className="flex-1 overflow-y-auto p-8 prose prose-invert max-w-none">
            <h1 className="text-3xl font-bold text-white mb-2">{selectedNote.title}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-8 pb-4 border-b border-slate-700">
              <span>Generated: {new Date(selectedNote.generatedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Sources: {selectedNote.references.length}</span>
            </div>
            
            <div className="whitespace-pre-wrap text-slate-300">
              {/* Simple markdown rendering simulation */}
              {selectedNote.contentMarkdown.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mt-6 mb-4">{line.replace('# ', '')}</h1>
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-brand-400 mt-6 mb-3">{line.replace('## ', '')}</h2>
                if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc">{line.replace('- ', '')}</li>
                return <p key={i} className="mb-2 leading-relaxed">{line}</p>
              })}
            </div>

            <div className="mt-12 pt-6 border-t border-slate-700">
              <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Provenance & Sources</h4>
              <div className="grid grid-cols-2 gap-4">
                {selectedNote.references.map((ref, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-brand-400 bg-brand-900/20 p-2 rounded border border-brand-500/10">
                    <FileText className="w-3 h-3" />
                    {ref.snippet}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold text-white mb-2">{selectedTopic?.title}</h2>
            <p className="text-slate-400 mb-6 max-w-md text-center">
              Master Notes compile all your uploaded resources into a single, verified guide for this topic.
            </p>
            <button 
              onClick={() => onGenerate(selectedTopicId)}
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Book />}
              Generate Master Note (AI)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
