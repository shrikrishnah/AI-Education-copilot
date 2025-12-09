export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'text' | 'url' | 'youtube';
  content: string;
  url?: string;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'analyzed' | 'error';
  metadata?: ResourceMetadata;
}

export interface ResourceMetadata {
  summary: string;
  topics: string[];
  difficulty: number; // 1-10
  credibilityScore: number; // 1-100
  yearSurvivalScore: number; // 1-100
  warnings: string[];
  type: string;
}

export interface CurriculumNode {
  id: string;
  title: string;
  description: string;
  duration: string; // e.g. "2 weeks"
  prerequisites: string[];
  resources: string[]; // IDs of resources
  objectives: string[];
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
  contentMarkdown: string; // Full markdown content
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

export interface AppState {
  resources: Resource[];
  curriculum: CurriculumNode[];
  studyPlan: StudyPlan | null;
  masterNotes: MasterNote[];
  processingLog: string[];
}