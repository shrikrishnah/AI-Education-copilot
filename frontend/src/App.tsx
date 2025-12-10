import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Planner } from './pages/Planner';
import { Notes } from './pages/Notes';
import { Quiz } from './pages/Quiz';
import { Chat } from './pages/Chat';
import { Research } from './pages/Research';
import { AppState } from './types';
import { api } from './services/api';

type View = 'dashboard' | 'upload' | 'planner' | 'notes' | 'quiz' | 'chat' | 'research';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [state, setState] = useState<AppState>({
    resources: [],
    curriculum: [],
    studyPlan: null,
    masterNotes: [],
    processingLog: []
  });

  useEffect(() => {
    api.checkHealth()
       .catch(() => console.warn('Backend not detected'));
  }, []);

  const addResources = async (files: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const processed = await api.uploadFiles(files);
      setState(prev => ({
        ...prev,
        resources: [...prev.resources, ...processed],
        processingLog: [...prev.processingLog, `Uploaded ${files.length} files.`]
      }));
      setView('dashboard');
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const addUrlResource = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const resource = await api.uploadUrl(url);
      setState(prev => ({
        ...prev,
        resources: [...prev.resources, resource],
        processingLog: [...prev.processingLog, `Added link: ${url}`]
      }));
      setView('dashboard');
    } catch (err: any) {
      setError(err.message || "URL processing failed");
    } finally {
      setLoading(false);
    }
  };

  const generateCurriculum = async () => {
    if (state.resources.length === 0) return setError("Add resources first");
    setLoading(true);
    try {
      const nodes = await api.harmonizeCurriculum(state.resources);
      const plan = await api.generatePlan(nodes);
      setState(prev => ({ ...prev, curriculum: nodes, studyPlan: plan }));
      setView('planner');
    } catch (err: any) {
      setError(err.message || "Plan generation failed");
    } finally {
      setLoading(false);
    }
  };

  const generateNote = async (topicId: string) => {
    const topic = state.curriculum.find(n => n.id === topicId);
    if (!topic) return;
    setLoading(true);
    try {
      const note = await api.generateNote(topic, state.resources);
      setState(prev => ({
        ...prev,
        masterNotes: [...prev.masterNotes.filter(n => n.topicId !== topicId), note]
      }));
    } catch (err: any) {
      setError(err.message || "Note generation failed");
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard state={state} onNavigate={setView} />;
      case 'upload': return <Upload onUpload={addResources} onUrlUpload={addUrlResource} loading={loading} />;
      case 'planner': return <Planner plan={state.studyPlan} onGenerate={generateCurriculum} loading={loading} hasResources={state.resources.length > 0} />;
      case 'notes': return <Notes curriculum={state.curriculum} notes={state.masterNotes} onGenerate={generateNote} loading={loading} />;
      case 'quiz': return <Quiz curriculum={state.curriculum} />;
      case 'chat': return <Chat />;
      case 'research': return <Research />;
      default: return <Dashboard state={state} onNavigate={setView} />;
    }
  };

  return (
    <Layout currentView={view} onViewChange={setView}>
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded mb-4 text-center">
          {error}
        </div>
      )}
      {renderView()}
    </Layout>
  );
}

export default App;