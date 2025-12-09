import { GoogleGenAI, Type } from "@google/genai";
import { Resource, ResourceMetadata, StudyPlan, CurriculumNode, MasterNote, QuizQuestion } from "../types";

// In a real production app, these keys would be on the backend.
// For this standalone demo, we use the env variable directly or fallback to a placeholder check.
const API_KEY = process.env.API_KEY || '';

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  // --- AGENT 1: SUMMARIZER & VALIDATOR ---
  async analyzeResource(content: string, type: string): Promise<ResourceMetadata> {
    const prompt = `
      Analyze the following educational resource content. 
      Act as an expert academic curator.
      
      Content Type: ${type}
      Content Snippet (first 5000 chars): ${content.slice(0, 5000)}...
      
      If the content is a URL or a placeholder for a video (like a YouTube link), infer the likely topics, summary, and utility based on the context provided or mark it as a generic resource for that type.
      
      Output strictly in JSON format with the following schema:
      {
        "summary": "Concise summary (max 100 words)",
        "topics": ["Array", "of", "Topic", "Tags"],
        "difficulty": 1-10 (1=Elementary, 10=PhD),
        "credibilityScore": 1-100 (Based on fact-checking and tone),
        "yearSurvivalScore": 1-100 (How likely this info is to remain relevant in 3 years),
        "warnings": ["Array of potential biases, outdated info, or prerequisites needed"],
        "type": "Lecture" | "Tutorial" | "Reference" | "Paper" | "Video"
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      
      const text = response.text || '{}';
      return JSON.parse(text) as ResourceMetadata;
    } catch (e) {
      console.error("Gemini Analysis Failed", e);
      // Fallback stub for demo stability if API fails
      return {
        summary: "Analysis failed or pending API key.",
        topics: ["General"],
        difficulty: 5,
        credibilityScore: 50,
        yearSurvivalScore: 50,
        warnings: ["Analysis incomplete"],
        type: "Unknown"
      };
    }
  }

  // --- AGENT 2: HARMONIZER ---
  async harmonizeCurriculum(resources: Resource[]): Promise<CurriculumNode[]> {
    const summaries = resources.map(r => `ID: ${r.id}, Title: ${r.name}, Topics: ${r.metadata?.topics.join(', ')}`).join('\n');
    
    const prompt = `
      Act as a Curriculum Architect. I have the following resources:
      ${summaries}

      Create a logical, dependency-aware list of distinct Learning Topics (Curriculum Nodes) that covers all this material.
      Merge overlapping topics. Order them by prerequisite.

      Output JSON:
      [
        {
          "id": "unique_topic_id",
          "title": "Topic Title",
          "description": "Short description",
          "duration": "Estimated time (e.g. '1 week')",
          "prerequisites": ["List of topic IDs that must come before"],
          "resources": ["List of Resource IDs relevant to this topic"],
          "objectives": ["Learning objective 1", "Learning objective 2"]
        }
      ]
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash', // Using Flash for speed on larger context
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Harmonization Failed", e);
      return [];
    }
  }

  // --- AGENT 3: 3-YEAR PLANNER ---
  async generateStudyPlan(nodes: CurriculumNode[]): Promise<StudyPlan | null> {
    const nodesJson = JSON.stringify(nodes);
    
    const prompt = `
      Act as a Long-term Career Coach. 
      Based on the following Curriculum Nodes, generate a comprehensive 3-Year Study Roadmap.
      Distribute the workload realistically.

      Curriculum: ${nodesJson}

      Output strict JSON matching the StudyPlan interface:
      {
        "years": [
          {
            "year": 1,
            "focus": "Year 1 Theme",
            "quarters": [
              {
                "quarter": 1,
                "focus": "Q1 Theme",
                "months": [
                  { "month": 1, "topics": [ { ...full copy of relevant curriculum node objects... } ] }
                ]
              }
              ... (generate for all relevant quarters/months)
            ]
          }
          ... (up to 3 years)
        ]
      }
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || 'null');
    } catch (e) {
      console.error("Planning Failed", e);
      return null;
    }
  }

  // --- AGENT 4: MASTER NOTES SYNTHESIZER ---
  async generateMasterNotes(topic: CurriculumNode, resources: Resource[]): Promise<MasterNote> {
    // Filter resources relevant to this topic
    const relevantResources = resources.filter(r => topic.resources.includes(r.id));
    const combinedContent = relevantResources.map(r => `--- Source: ${r.name} ---\n${r.content.slice(0, 2000)}`).join('\n\n');

    const prompt = `
      You are a Master Tutor. Create the ultimate "Master Note" for the topic: "${topic.title}".
      
      Use the provided source material.
      
      Format: Markdown.
      Structure:
      1. Concept Overview
      2. Key Principles (with detailed explanation)
      3. Common Pitfalls / Misconceptions
      4. Practical Examples
      5. "Why this matters" (Connect to other topics)
      
      At the end, list references to the specific Source Names used.

      Source Material:
      ${combinedContent}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Use Pro for high quality writing
        contents: prompt
      });

      return {
        topicId: topic.id,
        title: topic.title,
        contentMarkdown: response.text || 'Generation failed.',
        generatedAt: new Date().toISOString(),
        references: relevantResources.map(r => ({ resourceId: r.id, snippet: r.name }))
      };
    } catch (e) {
      console.error("Notes Generation Failed", e);
      return {
        topicId: topic.id,
        title: topic.title,
        contentMarkdown: "# Error\nCould not generate notes.",
        generatedAt: new Date().toISOString(),
        references: []
      };
    }
  }

   // --- AGENT 5: QUIZ GENERATOR ---
   async generateQuiz(topicTitle: string): Promise<QuizQuestion[]> {
    const prompt = `
      Generate 5 multiple-choice questions for the topic: "${topicTitle}".
      Vary the difficulty.

      Output JSON:
      [
        {
          "id": "q1",
          "question": "The question text",
          "options": ["A", "B", "C", "D"],
          "correctIndex": 0, // 0-3
          "explanation": "Why this is correct"
        }
      ]
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Quiz Gen Failed", e);
      return [];
    }
  }
}

export const geminiService = new GeminiService();