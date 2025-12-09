import React, { useState } from 'react';
import { CurriculumNode, QuizQuestion } from '../types';
import { api } from '../services/api';
import { BrainCircuit, Check, X, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';

interface QuizProps {
  curriculum: CurriculumNode[];
}

export const Quiz: React.FC<QuizProps> = ({ curriculum }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState<string>('');

  const generateQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const qs = await api.generateQuiz(topic);
      setQuestions(qs);
      setCurrentQIndex(0);
      setSelectedOption(null);
      setIsRevealed(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (isRevealed) return;
    setSelectedOption(idx);
    setIsRevealed(true);
  };

  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsRevealed(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-xl mx-auto text-center space-y-6">
        <div className="p-4 bg-purple-500/10 rounded-full">
          <BrainCircuit className="w-12 h-12 text-purple-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Active Recall Generator</h2>
        <p className="text-slate-400">
          Select a topic from your curriculum to generate a spaced-repetition quiz.
        </p>
        
        <div className="flex gap-2 w-full">
          <select 
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 outline-none"
            onChange={(e) => setTopic(e.target.value)}
            value={topic}
          >
            <option value="">Select a Topic...</option>
            {curriculum.map(c => <option key={c.id} value={c.title}>{c.title}</option>)}
          </select>
          <button 
            onClick={generateQuiz}
            disabled={loading || !topic}
            className="bg-brand-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-500 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Start'}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQIndex];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Quiz: {topic}</h2>
        <div className="text-sm text-slate-500">
          Question {currentQIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-slate-800 w-full">
          <div 
            className="h-full bg-brand-500 transition-all duration-500" 
            style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }} 
          />
        </div>

        <h3 className="text-2xl font-semibold text-white mb-8 mt-2 leading-relaxed">
          {q.question}
        </h3>

        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            let stateClass = "border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800";
            
            if (isRevealed) {
              if (idx === q.correctIndex) stateClass = "border-green-500/50 bg-green-500/10 text-green-400";
              else if (idx === selectedOption) stateClass = "border-red-500/50 bg-red-500/10 text-red-400";
              else stateClass = "border-slate-800 opacity-50";
            } else if (selectedOption === idx) {
              stateClass = "border-brand-500 bg-brand-500/20 text-white";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${stateClass}`}
                disabled={isRevealed}
              >
                <span>{opt}</span>
                {isRevealed && idx === q.correctIndex && <Check className="w-5 h-5 text-green-500" />}
                {isRevealed && idx === selectedOption && idx !== q.correctIndex && <X className="w-5 h-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        {isRevealed && (
          <div className="mt-8 p-4 bg-slate-900/80 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <p className="font-semibold text-white mb-1">Explanation:</p>
            <p className="text-slate-400 text-sm">{q.explanation}</p>
            
            <div className="flex justify-end mt-4">
              {currentQIndex < questions.length - 1 ? (
                <button 
                  onClick={nextQuestion}
                  className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-500"
                >
                  Next Question <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={() => setQuestions([])}
                  className="flex items-center gap-2 bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-600"
                >
                  Finish Quiz <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};