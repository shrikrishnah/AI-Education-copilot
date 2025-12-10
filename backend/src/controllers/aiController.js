const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const pdf = require('pdf-parse');

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper to extract text
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

// Helper to clean JSON
function cleanJSON(text) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return {};
    return JSON.parse(text.substring(start, end + 1));
  } catch (e) {
    console.error("JSON Parse Error", e);
    return {};
  }
}

function cleanJSONArray(text) {
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    return JSON.parse(text.substring(start, end + 1));
  } catch (e) {
    console.error("JSON Array Parse Error", e);
    return [];
  }
}

// 1. Ingestion (Enhanced with Image Analysis)
exports.processFiles = async (req, res) => {
  try {
    if (!ai) throw new Error("API Key not configured");
    const files = req.files || [];
    const results = [];

    for (const file of files) {
      let analysisResult = {};
      let contentPreview = "";

      if (file.mimetype.startsWith('image/')) {
        // IMAGE ANALYSIS: Use gemini-3-pro-preview
        const imageBuffer = fs.readFileSync(file.path);
        const base64Image = imageBuffer.toString('base64');
        
        const prompt = `
          Analyze this educational image. Describe the diagrams, text, or visual concepts in detail.
          Return strict JSON (no markdown):
          {
            "summary": "Detailed visual description (max 100 words)",
            "topics": ["Visual Topic 1", "Visual Topic 2"],
            "difficulty": number (1-10),
            "credibilityScore": 80,
            "type": "Image/Diagram",
            "warnings": []
          }
        `;

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: {
              parts: [
                { inlineData: { mimeType: file.mimetype, data: base64Image } },
                { text: prompt }
              ]
            },
            config: { responseMimeType: 'application/json' }
          });
          analysisResult = cleanJSON(response.text);
          contentPreview = `[Image Analysis] ${analysisResult.summary}`;
        } catch (e) {
          console.error("Image Analysis Error", e);
          analysisResult = { summary: "Image analysis failed", topics: ["Image"], difficulty: 5, credibilityScore: 50, type: "Image", warnings: ["Analysis failed"] };
        }

      } else {
        // TEXT/PDF ANALYSIS: Use gemini-2.5-flash
        contentPreview = await extractText(file.path, file.mimetype);
        const prompt = `
          Analyze this educational resource.
          Filename: ${file.originalname}
          Content Snippet: ${contentPreview.slice(0, 8000)}...

          Return strict JSON (no markdown) with:
          {
            "summary": "string (max 100 words)",
            "topics": ["string"],
            "difficulty": number (1-10),
            "credibilityScore": number (1-100),
            "type": "string",
            "warnings": ["string"]
          }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        analysisResult = cleanJSON(response.text);
      }

      results.push({
        id: file.filename,
        name: file.originalname,
        type: file.mimetype.startsWith('image/') ? 'image' : (file.mimetype === 'application/pdf' ? 'pdf' : 'text'),
        content: contentPreview,
        metadata: analysisResult,
        uploadedAt: new Date().toISOString()
      });

      try { fs.unlinkSync(file.path); } catch (e) {}
    }
    res.json({ resources: results });
  } catch (error) {
    console.error("Process Files Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.processUrl = async (req, res) => {
  try {
    if (!ai) throw new Error("API Key not configured");
    const { url } = req.body;
    const prompt = `
      Analyze this URL: ${url}.
      Infer educational content.
      Return strict JSON: { "summary": "", "topics": [], "difficulty": 5, "credibilityScore": 80, "type": "url", "warnings": [] }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    res.json({
      resource: {
        id: Date.now().toString(),
        name: url,
        type: 'url',
        url,
        content: `External Link: ${url}`,
        metadata: cleanJSON(response.text),
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.harmonizeCurriculum = async (req, res) => {
  try {
    if (!ai) throw new Error("API Key not configured");
    const { resources } = req.body;
    const summaries = resources.map(r => 
      `ID: ${r.id}, Name: ${r.name}, Topics: ${r.metadata?.topics?.join(', ')}`
    ).join('\n');

    const prompt = `
      Act as a Curriculum Architect. Create a dependency tree.
      Input: ${summaries}
      Output strict JSON Array:
      [{ "id": "uuid", "title": "string", "description": "string", "resources": ["resource_id"], "prerequisites": ["node_id"], "duration": "string" }]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    res.json(cleanJSONArray(response.text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Planning (Enhanced with Thinking Mode)
exports.generateStudyPlan = async (req, res) => {
  try {
    if (!ai) throw new Error("API Key not configured");
    const { nodes } = req.body;
    
    if (!nodes || nodes.length === 0) return res.status(400).json({ error: "No curriculum nodes" });

    const prompt = `
      Create a comprehensive 3-Year Study Plan for these topics: ${JSON.stringify(nodes)}.
      The plan must be logically sequenced and balanced.
      Output strictly JSON:
      { "years": [{ "year": 1, "focus": "", "quarters": [{ "quarter": 1, "focus": "", "months": [{ "month": 1, "topics": [ { "id": "node_id", "title": "" } ] }] }] }] }
    `;

    // THINKING MODE: Use gemini-3-pro-preview with thinkingBudget
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 32768 } // Max reasoning for complex planning
      }
    });
    res.json(cleanJSON(response.text));
  } catch (error) {
    console.error("Study Plan Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.generateMasterNotes = async (req, res) => {
  try {
    if (!ai) throw new Error("API Key not configured");
    const { topic, resources } = req.body;
    const context = resources
      .filter(r => topic.resources && topic.resources.includes(r.id))
      .map(r => `Source (${r.name}):\n${r.content.substring(0, 4000)}`)
      .join('\n\n');

    const prompt = `Write a comprehensive Master Note (Markdown) for "${topic.title}" using sources:\n${context}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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

exports.generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;
    const prompt = `Generate 5 multiple choice questions for "${topic}". JSON Array output.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    res.json(cleanJSONArray(response.text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Chatbot (gemini-3-pro-preview)
exports.chat = async (req, res) => {
  try {
    if (!ai) throw new Error("API Key not configured");
    const { message, history } = req.body;
    
    // Construct history for context
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history || []
    });

    const result = await chat.sendMessage(message);
    res.json({ text: result.text });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 4. Research / Search Grounding (gemini-2.5-flash + googleSearch)
exports.research = async (req, res) => {
  try {
    if (!ai) throw new Error("API Key not configured");
    const { query } = req.body;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Research this topic and provide a summary with sources: ${query}`,
      config: {
        tools: [{ googleSearch: {} }] // Enable Google Search Grounding
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    res.json({ 
      text: response.text, 
      sources: groundingChunks.map(chunk => chunk.web).filter(web => web) // Extract web sources
    });
  } catch (error) {
    console.error("Research Error:", error);
    res.status(500).json({ error: error.message });
  }
};