export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'url' | 'image';
  content: string;
  url?: string;
  uploadedAt: string;
  status?: 'pending' | 'processing' | 'analyzed' | 'error';
  metadata?: ResourceMetadata;
}

export interface ResourceMetadata {
  summary: string;
  topics: string[];
  difficulty: number;
  credibilityScore: number;
  warnings?: string[];
  type: string;
}

export interface CurriculumNode {
  id: string;
  title: string;
  description: string;
  duration?: string;
  prerequisites: string[];
  resources: string[];
}

export interface StudyPlan {
  years: {
    year: number;
    focus: string;
    quarters: {
      quarter: number;
      focus: string;
      months: {
        month: number;
        topics: CurriculumNode[];
      }[];
    }[];
  }[];
}

export interface MasterNote {
  topicId: string;
  title: string;
  contentMarkdown: string;
  generatedAt: string;
  references: {
    resourceId: string;
    snippet: string;
  }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface ResearchResult {
  text: string;
  sources: { uri: string; title: string }[];
}

export interface AppState {
  resources: Resource[];
  curriculum: CurriculumNode[];
  studyPlan: StudyPlan | null;
  masterNotes: MasterNote[];
  processingLog: string[];
}