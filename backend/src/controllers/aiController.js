const fs = require("fs");
const pdf = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

// Load API Key
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) console.error("❌ ERROR: Missing GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey });

// =========================
// Helpers
// =========================

// Extract text from PDF or TXT
async function extractText(filePath, mimeType) {
  try {
    if (mimeType === "application/pdf") {
      const buffer = fs.readFileSync(filePath);
      const data = await pdf(buffer);
      return data.text || "";
    }
    return fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error("❌ Extract error:", err);
    return "";
  }
}

// Clean JSON from AI messy text
function cleanJSON(text) {
  try {
    if (!text) return {};
    // Remove markdown code blocks if present
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    // Find the first '{' and last '}'
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return {};
    return JSON.parse(clean.substring(start, end + 1));
  } catch (e) {
    console.error("JSON Parse Error", e);
    return {};
  }
}

function cleanJSONArray(text) {
  try {
    if (!text) return [];
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    return JSON.parse(clean.substring(start, end + 1));
  } catch (e) {
    console.error("JSON Array Parse Error", e);
    return [];
  }
}

// =========================
// 1️⃣ FILE INGESTION
// =========================

exports.processFiles = async (req, res) => {
  try {
    const files = req.files || [];
    const responses = [];

    for (const file of files) {
      const text = await extractText(file.path, file.mimetype);

      const prompt = `
Analyze this educational resource and output strict JSON only.

CONTENT (first 8000 chars):
${text.slice(0, 8000)}

Return JSON like:
{
  "summary": "",
  "topics": [],
  "difficulty": 1,
  "credibilityScore": 50,
  "type": "pdf/text",
  "warnings": []
}
`;

      try {
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        
        const metadata = cleanJSON(result.text);

        responses.push({
          id: file.filename,
          name: file.originalname,
          type: file.mimetype.includes("pdf") ? "pdf" : "text",
          content: text,
          metadata,
          uploadedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error("AI Error:", e);
        responses.push({ id: file.filename, name: file.originalname, status: 'error', error: e.message });
      }

      try { fs.unlinkSync(file.path); } catch {}
    }

    res.json({ resources: responses });

  } catch (err) {
    console.error("❌ File Process Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 2️⃣ URL INGESTION
// =========================

exports.processUrl = async (req, res) => {
  try {
    const { url } = req.body;

    const prompt = `
Analyze this URL: ${url}

Return only JSON:
{
  "summary": "",
  "topics": [],
  "difficulty": 5,
  "credibilityScore": 60,
  "type": "url",
  "warnings": []
}
`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    const metadata = cleanJSON(result.text);

    res.json({
      resource: {
        id: Date.now().toString(),
        name: url,
        type: "url",
        url,
        content: `External URL: ${url}`,
        metadata,
        uploadedAt: new Date().toISOString(),
      },
    });

  } catch (err) {
    console.error("❌ URL Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 3️⃣ HARMONIZE CURRICULUM
// =========================

exports.harmonizeCurriculum = async (req, res) => {
  try {
    const { resources } = req.body;

    const summary = resources
      .map(r => `${r.id} - ${r.name}: ${r.metadata?.topics?.join(", ")}`)
      .join("\n");

    const prompt = `
Create curriculum learning nodes from these resources:

${summary}

Return an array of JSON objects ONLY:
[
  {
    "id": "node1",
    "title": "",
    "description": "",
    "resources": ["id1"],
    "prerequisites": [],
    "duration": "2 weeks"
  }
]
`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    res.json(cleanJSONArray(result.text));

  } catch (err) {
    console.error("❌ Harmonize Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 4️⃣ STUDY PLAN
// =========================

exports.generateStudyPlan = async (req, res) => {
  try {
    const { nodes } = req.body;

    const prompt = `
Create a structured 3-year study plan based on topics:

${JSON.stringify(nodes)}

Return JSON ONLY:
{
  "years": [
    {
      "year": 1,
      "focus": "",
      "quarters": [
        {
          "quarter": 1,
          "focus": "",
          "months": [
            { "month": 1, "topics": [] }
          ]
        }
      ]
    }
  ]
}
`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    res.json(cleanJSON(result.text));

  } catch (err) {
    console.error("❌ Study Plan Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 5️⃣ MASTER NOTES
// =========================

exports.generateMasterNotes = async (req, res) => {
  try {
    const { topic, resources } = req.body;

    const context = resources
      .filter(r => topic.resources?.includes(r.id))
      .map(r => r.content.slice(0, 4000))
      .join("\n\n");

    const prompt = `
Write complete master notes in Markdown for topic: ${topic.title}

Sources:
${context}

Return clean Markdown only.
`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });

    res.json({
      topicId: topic.id,
      title: topic.title,
      contentMarkdown: result.text,
      generatedAt: new Date().toISOString(),
      references: resources.map(r => ({ id: r.id, name: r.name })),
    });

  } catch (err) {
    console.error("❌ Notes Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 6️⃣ QUIZ GENERATOR
// =========================

exports.generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;

    const prompt = `
Generate 5 MCQ questions for topic: "${topic}"

Return JSON ONLY:
[
  {
    "id": "1",
    "question": "",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": ""
  }
]
`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    res.json(cleanJSONArray(result.text));

  } catch (err) {
    console.error("❌ Quiz Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 7️⃣ CHATBOT
// =========================

exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    // Convert simple history to context string or proper format if supported
    // For simplicity in this controller, appending previous context as text
    const context = history ? history.map(h => `${h.role}: ${h.parts[0].text}`).join('\n') : '';
    
    const prompt = `
You are an AI education assistant. 
Previous conversation:
${context}

User: ${message}
`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    
    res.json({ text: result.text });

  } catch (err) {
    console.error("❌ Chat Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// 8️⃣ RESEARCH
// =========================

exports.research = async (req, res) => {
  try {
    const { query } = req.body;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Research the topic: ${query}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map(chunk => chunk.web)
      .filter(web => web) // Filter out nulls
      .map(web => ({ uri: web.uri, title: web.title }));

    res.json({
      text: result.text,
      sources: sources
    });

  } catch (err) {
    console.error("❌ Research Error:", err);
    res.status(500).json({ error: err.message });
  }
};