import React, { useState } from 'react';
import { CurriculumNode, QuizQuestion } from '../types';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';

export const Quiz: React.FC<{ curriculum: CurriculumNode[] }> = ({ curriculum }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const startQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const qs = await api.generateQuiz(topic);
      setQuestions(qs);
    } catch (e) {
      alert('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {questions.length === 0 ? (
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Quiz Generator</h2>
          <select 
            className="w-full bg-slate-900 p-3 rounded-lg text-white"
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="">Select Topic</option>
            {curriculum.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
          </select>
          <button onClick={startQuiz} disabled={loading} className="bg-blue-600 px-8 py-3 rounded-lg text-white">
            {loading ? <Loader2 className="animate-spin" /> : 'Start Quiz'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, i) => (
            <div key={i} className="glass-panel p-6 rounded-xl">
              <p className="font-bold text-white mb-4">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, idx) => (
                  <div key={idx} className="p-3 bg-slate-800 rounded text-slate-300">{opt}</div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setQuestions([])} className="bg-slate-700 px-6 py-2 rounded text-white">Reset</button>
        </div>
      )}
    </div>
  );
};