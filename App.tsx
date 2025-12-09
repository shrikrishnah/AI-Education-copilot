import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Planner } from './pages/Planner';
import { Notes } from './pages/Notes';
import { Quiz } from './pages/Quiz';
import { AppState, Resource, CurriculumNode, StudyPlan, MasterNote } from './types';
import { geminiService } from './services/gemini.ts';

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

  // --- ACTIONS ---

  const addResources = (files: File[]) => {
    // In a real app, this would upload to server. 
    // Here we simulate extraction and run client-side AI analysis.
    setLoading(true);
    const newResources: Resource[] = [];

    const processFile = async (file: File) => {
      // Mock extraction: read as text
      const text = await file.text(); 
      const id = Math.random().toString(36).substr(2, 9);
      
      // Call Agent 1: Summarize & Validate
      const metadata = await geminiService.analyzeResource(text, file.type);
      
      return {
        id,
        name: file.name,
        type: file.type.includes('pdf') ? 'pdf' : 'text',
        content: text,
        uploadedAt: new Date().toISOString(),
        status: 'analyzed',
        metadata
      } as Resource;
    };

    Promise.all(files.map(processFile)).then(processed => {
      setState(prev => ({
        ...prev,
        resources: [...prev.resources, ...processed],
        processingLog: [...prev.processingLog, `Processed ${processed.length} files.`]
      }));
      setLoading(false);
      setView('dashboard');
    });
  };

  const addUrlResource = async (url: string) => {
    setLoading(true);
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    const type = isYoutube ? 'youtube' : 'url';
    const id = Math.random().toString(36).substr(2, 9);
    
    // In a real app, backend extracts content. Here we simulate/ask AI to infer.
    // If it's a youtube link, we pass a specific instruction.
    const content = isYoutube 
      ? `[YouTube Video Link: ${url}] (Note: The user has provided this YouTube link. Please infer the likely educational content, topics, and difficulty based on the URL or treat it as a video resource on this subject.)`
      : `[Website Link: ${url}]`;

    const metadata = await geminiService.analyzeResource(content, type);
    
    const newResource: Resource = {
      id,
      name: url,
      type,
      content,
      url,
      uploadedAt: new Date().toISOString(),
      status: 'analyzed',
      metadata
    };

    setState(prev => ({
        ...prev,
        resources: [...prev.resources, newResource],
        processingLog: [...prev.processingLog, `Processed link: ${url}`]
    }));
    setLoading(false);
    setView('dashboard');
  };

  const generateCurriculum = async () => {
    setLoading(true);
    const nodes = await geminiService.harmonizeCurriculum(state.resources);
    const plan = await geminiService.generateStudyPlan(nodes);
    
    setState(prev => ({
      ...prev,
      curriculum: nodes,
      studyPlan: plan,
      processingLog: [...prev.processingLog, 'Curriculum and Plan generated.']
    }));
    setLoading(false);
    setView('planner');
  };

  const generateNote = async (topicId: string) => {
    const topic = state.curriculum.find(n => n.id === topicId);
    if (!topic) return;
    
    setLoading(true);
    const note = await geminiService.generateMasterNotes(topic, state.resources);
    setState(prev => ({
      ...prev,
      masterNotes: [...prev.masterNotes.filter(n => n.topicId !== topicId), note]
    }));
    setLoading(false);
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
      {renderView()}
    </Layout>
  );
}

export default App;