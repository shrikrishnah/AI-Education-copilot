/// <reference types="vite/client" />
import axios from 'axios';
import { Resource, CurriculumNode, StudyPlan, MasterNote, QuizQuestion } from '../types';

// Use relative path '/api' to leverage Vite's proxy in development.
// In production, this can be replaced by the full URL env var.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  checkHealth: async () => client.get('/health'),

  uploadFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await client.post<{ resources: Resource[] }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.resources;
  },

  uploadUrl: async (url: string) => {
    const response = await client.post<{ resource: Resource }>('/url', { url });
    return response.data.resource;
  },

  harmonizeCurriculum: async (resources: Resource[]) => {
    const response = await client.post<CurriculumNode[]>('/harmonize', { resources });
    return response.data;
  },

  generatePlan: async (nodes: CurriculumNode[]) => {
    const response = await client.post<StudyPlan>('/plan', { nodes });
    return response.data;
  },

  generateNote: async (topic: CurriculumNode, resources: Resource[]) => {
    const response = await client.post<MasterNote>('/notes', { topic, resources });
    return response.data;
  },

  generateQuiz: async (topicTitle: string) => {
    const response = await client.post<QuizQuestion[]>('/quiz', { topic: topicTitle });
    return response.data;
  }
};