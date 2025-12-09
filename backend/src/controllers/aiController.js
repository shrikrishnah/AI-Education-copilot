const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const pdf = require('pdf-parse');

// Initialize Gemini
// Fallback to a check to prevent crash if key is missing during dev startup
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const getModel = () => {
  if (!genAI) throw new Error("API Key not configured");
  return genAI.getGenerativeModel({ model: "gemini-pro" });
}

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

// Helpers to clean JSON output from model
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

exports.processFiles = async (req, res) => {
  try {
    const files = req.files || [];
    const results = [];
    const model = getModel();

    for (const file of files) {
      const textContent = await extractText(file.path, file.mimetype);
      
      const prompt = `
        Analyze this educational resource.
        Filename: ${file.originalname}
        Content Snippet: ${textContent.slice(0, 8000)}...

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

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const metadata = cleanJSON(text);

        results.push({
          id: file.filename,
          name: file.originalname,
          type: file.mimetype === 'application/pdf' ? 'pdf' : 'text',
          content: textContent,
          metadata,
          uploadedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(`AI Error for ${file.originalname}:`, err);
        results.push({ id: file.filename, name: file.originalname, status: 'error', error: err.message });
      } finally {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    }
    res.json({ resources: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processUrl = async (req, res) => {
  const { url } = req.body;
  const prompt = `
    Analyze this URL: ${url}.
    Infer educational content, topics, and metadata based on the URL structure.
    Return strict JSON: { "summary": "", "topics": [], "difficulty": 5, "credibilityScore": 80, "type": "url", "warnings": [] }
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const metadata = cleanJSON(text);
    
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

exports.harmonizeCurriculum = async (req, res) => {
  const { resources } = req.body;
  const summaries = resources.map(r => 
    `ID: ${r.id}, Name: ${r.name}, Topics: ${r.metadata?.topics?.join(', ')}`
  ).join('\n');

  const prompt = `
    Act as a Curriculum Architect. Create a dependency tree of "Curriculum Nodes".
    Input:
    ${summaries}

    Output strict JSON Array:
    [{ "id": "uuid", "title": "string", "description": "string", "resources": ["resource_id"], "prerequisites": ["node_id"], "duration": "string" }]
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json(cleanJSONArray(text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateStudyPlan = async (req, res) => {
  const { nodes } = req.body;
  const prompt = `
    Create a 3-Year Study Plan for these topics: ${JSON.stringify(nodes)}.
    Output strictly JSON matching this schema:
    { "years": [{ "year": 1, "focus": "", "quarters": [{ "quarter": 1, "focus": "", "months": [{ "month": 1, "topics": [ { "id": "node_id", "title": "" } ] }] }] }] }
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json(cleanJSON(text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateMasterNotes = async (req, res) => {
  const { topic, resources } = req.body;
  const context = resources
    .filter(r => topic.resources && topic.resources.includes(r.id))
    .map(r => `Source (${r.name}):\n${r.content.substring(0, 4000)}`)
    .join('\n\n');

  const prompt = `
    Write a comprehensive "Master Note" (Markdown) for topic: "${topic.title}".
    Use these sources. Include Overview, Deep Dive, and Key Takeaways.
    
    Sources:
    ${context}
  `;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      topicId: topic.id,
      title: topic.title,
      contentMarkdown: text,
      generatedAt: new Date().toISOString(),
      references: resources.map(r => ({ resourceId: r.id, snippet: r.name }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateQuiz = async (req, res) => {
  const { topic } = req.body;
  const prompt = `Generate 5 multiple choice questions for "${topic}". 
  Return strict JSON Array:
  [{ "id": "1", "question": "", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "" }]`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json(cleanJSONArray(text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};