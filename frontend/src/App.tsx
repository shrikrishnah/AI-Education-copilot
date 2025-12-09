import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Planner } from './pages/Planner';
import { Notes } from './pages/Notes';
import { Quiz } from './pages/Quiz';
import { AppState, Resource, CurriculumNode, StudyPlan, MasterNote } from './types';
import { api } from './services/api';

// Mock Router
type View = 'dashboard' | 'upload' | 'planner' | 'notes' | 'quiz';

function App() {
  const [view, setView] = useState<View>('dashboard');
  
  // Central State Store
  const [state, setState] = useState<AppState>({
    resources: [],
    curriculum: [],
    studyPlan: null,
    masterNotes: [],
    processingLog: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check backend connection on load
    api.checkHealth().catch(() => setError("Backend not connected on port 5000"));
  }, []);

  // --- ACTIONS ---

  const addResources = async (files: File[]) => {
    setLoading(true);
    setError(null);
    try {
      const processed = await api.uploadFiles(files);
      setState(prev => ({
        ...prev,
        resources: [...prev.resources, ...processed],
        processingLog: [...prev.processingLog, `Processed ${processed.length} files.`]
      }));
      setView('dashboard');
    } catch (err) {
      setError("Failed to upload files. Ensure backend is running.");
      console.error(err);
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
        processingLog: [...prev.processingLog, `Processed link: ${url}`]
      }));
      setView('dashboard');
    } catch (err) {
      setError("Failed to process URL.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateCurriculum = async () => {
    if (state.resources.length === 0) {
      setError("Please add resources first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nodes = await api.harmonizeCurriculum(state.resources);
      const plan = await api.generatePlan(nodes);
      
      setState(prev => ({
        ...prev,
        curriculum: nodes,
        studyPlan: plan,
        processingLog: [...prev.processingLog, 'Curriculum and Plan generated.']
      }));
      setView('planner');
    } catch (err) {
      setError("Failed to generate plan.");
      console.error(err);
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
    } catch (err) {
      console.error(err);
      setError("Failed to generate notes.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <Dashboard state={state} onNavigate={setView} />;
      case 'upload': return <Upload onUpload={addResources} onUrlUpload={addUrlResource} loading={loading} />;
      case 'planner': return <Planner plan={state.studyPlan} onGenerate={generateCurriculum} loading={loading} hasResources={state.resources.length > 0} />;
      case 'notes': return <Notes curriculum={state.curriculum} notes={state.masterNotes} onGenerate={generateNote} loading={loading} />;
      case 'quiz': return <Quiz curriculum={state.curriculum} />;
      default: return <Dashboard state={state} onNavigate={setView} />;
    }
  };

  return (
    <Layout currentView={view} onViewChange={setView}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 text-center text-sm">
          {error}
        </div>
      )}
      {renderView()}
    </Layout>
  );
}

export default App;