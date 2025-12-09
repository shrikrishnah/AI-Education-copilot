import axios from 'axios';
import { Resource, CurriculumNode, StudyPlan } from '../types';

const API_URL = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  checkHealth: async () => {
    return client.get('/health');
  },

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
    const response = await client.post('/notes', { topic, resources });
    return response.data;
  },

  generateQuiz: async (topicTitle: string) => {
    const response = await client.post('/quiz', { topic: topicTitle });
    return response.data;
  }
};