import React, { useState } from 'react';
import { CurriculumNode, MasterNote } from '../types';
import { Book, Loader2, AlertCircle } from 'lucide-react';

interface NotesProps {
  curriculum: CurriculumNode[];
  notes: MasterNote[];
  onGenerate: (topicId: string) => void;
  loading: boolean;
}

export const Notes: React.FC<NotesProps> = ({ curriculum, notes, onGenerate, loading }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNote = notes.find(n => n.topicId === selectedId);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="w-1/3 overflow-y-auto glass-panel rounded-xl">
        <div className="p-4 border-b border-slate-700">
           <h3 className="font-bold text-white">Topics</h3>
        </div>
        {curriculum.length === 0 && <p className="p-4 text-slate-500">No curriculum generated yet.</p>}
        {curriculum.map(t => (
          <div 
            key={t.id} 
            onClick={() => setSelectedId(t.id)}
            className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors border-b border-slate-800/50 ${selectedId === t.id ? 'bg-blue-900/20 border-l-2 border-l-blue-500' : ''}`}
          >
            <p className="text-white font-medium">{t.title}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 glass-panel rounded-xl p-8 overflow-y-auto relative">
        {selectedId ? (
          !selectedNote ? (
            <div className="text-center mt-20">
              <Book className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h2 className="text-xl font-bold text-white mb-2">No Notes Found</h2>
              <p className="text-slate-400 mb-6">Generate comprehensive study notes for this topic.</p>
              <button 
                onClick={() => onGenerate(selectedId)} 
                disabled={loading} 
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg text-white disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Generate Master Note'}
              </button>
            </div>
          ) : (
            <article className="prose prose-invert max-w-none">
              <h1>{selectedNote.title}</h1>
              <div className="whitespace-pre-wrap">{selectedNote.contentMarkdown}</div>
            </article>
          )
        ) : (
           <div className="flex items-center justify-center h-full text-slate-500">
             <p>Select a topic to view notes.</p>
           </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Gemini is writing notes...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};