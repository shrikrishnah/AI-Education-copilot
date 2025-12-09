import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import pdf from 'pdf-parse';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helpers ---

async function extractText(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } else {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (error) {
    console.error("Extraction error:", error);
    return "";
  }
}

// --- Controllers ---

export const processFiles = async (req, res) => {
  try {
    const files = req.files || [];
    const results = [];

    for (const file of files) {
      const textContent = await extractText(file.path, file.mimetype);
      
      const prompt = `
        Analyze this educational resource.
        Filename: ${file.originalname}
        Content Snippet: ${textContent.slice(0, 8000)}...

        Return JSON:
        {
          "summary": "string (max 100 words)",
          "topics": ["string"],
          "difficulty": number (1-10),
          "credibilityScore": number (1-100),
          "type": "string",
          "warnings": ["string"]
        }
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        
        const metadata = JSON.parse(response.text);
        
        results.push({
          id: file.filename,
          name: file.originalname,
          type: file.mimetype === 'application/pdf' ? 'pdf' : 'text',
          content: textContent, // Note: In production, store this in a vector DB or blob storage
          metadata,
          uploadedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(`AI Error for ${file.originalname}:`, err);
        results.push({ id: file.filename, name: file.originalname, status: 'error', error: err.message });
      } finally {
        // Cleanup temp file
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    }

    res.json({ resources: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processUrl = async (req, res) => {
  const { url } = req.body;
  const prompt = `
    Analyze this URL: ${url}.
    Infer educational content, topics, and metadata.
    Return JSON: { "summary": "", "topics": [], "difficulty": 5, "credibilityScore": 80, "type": "url", "warnings": [] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const metadata = JSON.parse(response.text);
    
    res.json({
      resource: {
        id: Date.now().toString(),
        name: url,
        type: 'url',
        url,
        content: `External Link: ${url}`,
        metadata,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const harmonizeCurriculum = async (req, res) => {
  const { resources } = req.body;
  if (!resources?.length) return res.status(400).json({ error: "No resources provided" });

  const summaries = resources.map(r => 
    `ID: ${r.id}, Name: ${r.name}, Topics: ${r.metadata?.topics?.join(', ')}`
  ).join('\n');

  const prompt = `
    Act as a Curriculum Architect. Create a dependency tree of "Curriculum Nodes" covering these resources.
    Input:
    ${summaries}

    Output JSON Array:
    [{ "id": "uuid", "title": "string", "description": "string", "resources": ["resource_id"], "prerequisites": ["node_id"], "duration": "string" }]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateStudyPlan = async (req, res) => {
  const { nodes } = req.body;
  const prompt = `
    Create a 3-Year Study Plan for these topics: ${JSON.stringify(nodes)}.
    Output strictly JSON matching this schema:
    { "years": [{ "year": 1, "focus": "", "quarters": [{ "quarter": 1, "focus": "", "months": [{ "month": 1, "topics": [ { "id": "node_id", "title": "" } ] }] }] }] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateMasterNotes = async (req, res) => {
  const { topic, resources } = req.body;
  const context = resources
    .filter(r => topic.resources.includes(r.id))
    .map(r => `Source (${r.name}):\n${r.content.substring(0, 4000)}`)
    .join('\n\n');

  const prompt = `
    Write a comprehensive "Master Note" (Markdown) for topic: "${topic.title}".
    Use these sources. Include Overview, Deep Dive, and Key Takeaways.
    
    Sources:
    ${context}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });

    res.json({
      topicId: topic.id,
      title: topic.title,
      contentMarkdown: response.text,
      generatedAt: new Date().toISOString(),
      references: resources.map(r => ({ resourceId: r.id, snippet: r.name }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateQuiz = async (req, res) => {
  const { topic } = req.body;
  const prompt = `Generate 5 multiple choice questions for "${topic}". JSON Array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              question: { type: "STRING" },
              options: { type: "ARRAY", items: { type: "STRING" } },
              correctIndex: { type: "INTEGER" },
              explanation: { type: "STRING" }
            }
          }
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};