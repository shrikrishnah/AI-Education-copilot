import React, { useState } from 'react';
import { CurriculumNode, MasterNote } from '../types';
import { Book, Loader2 } from 'lucide-react';

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
        {curriculum.map(t => (
          <div 
            key={t.id} 
            onClick={() => setSelectedId(t.id)}
            className={`p-4 cursor-pointer hover:bg-slate-800 ${selectedId === t.id ? 'bg-blue-900/20 border-l-2 border-blue-500' : ''}`}
          >
            <p className="text-white font-medium">{t.title}</p>
          </div>
        ))}
      </div>
      <div className="flex-1 glass-panel rounded-xl p-8 overflow-y-auto">
        {selectedId && !selectedNote && (
          <div className="text-center">
            <button onClick={() => onGenerate(selectedId)} disabled={loading} className="bg-blue-600 px-6 py-3 rounded-lg text-white">
              {loading ? <Loader2 className="animate-spin" /> : 'Generate Notes'}
            </button>
          </div>
        )}
        {selectedNote && (
          <article className="prose prose-invert max-w-none">
            <h1>{selectedNote.title}</h1>
            <div className="whitespace-pre-wrap">{selectedNote.contentMarkdown}</div>
          </article>
        )}
      </div>
    </div>
  );
};