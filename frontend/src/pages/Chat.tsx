import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { ChatMessage } from '../types';
import { Send, Loader2, Bot, User } from 'lucide-react';

export const Chat: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    const newHistory = [...history, { role: 'user' as const, parts: [{ text: userMsg }] }];
    setHistory(newHistory);
    setLoading(true);

    try {
      const response = await api.chat(userMsg, history);
      setHistory([...newHistory, { role: 'model' as const, parts: [{ text: response.text }] }]);
    } catch (e) {
      setHistory([...newHistory, { role: 'model' as const, parts: [{ text: "Error: Could not fetch response." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">AI Tutor Chat</h2>
        <p className="text-slate-400">Powered by Gemini 3 Pro</p>
      </header>

      <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {history.length === 0 && (
            <div className="text-center text-slate-500 mt-20">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything about your curriculum!</p>
            </div>
          )}
          {history.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600/20 border border-blue-500/20 text-blue-100' : 'bg-slate-800 text-slate-200'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.parts[0].text}</p>
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-4 rounded-2xl bg-slate-800 flex items-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg transition-colors disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};