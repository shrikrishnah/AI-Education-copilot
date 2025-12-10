const fs = require("fs");
const pdf = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load API Key
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) console.error("❌ ERROR: Missing GEMINI_API_KEY");

const genAI = new GoogleGenerativeAI(apiKey);

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
    // Using gemini-2.0-flash as it is valid and stable
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        const metadata = cleanJSON(aiResponse);

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent(prompt);
    const metadata = cleanJSON(result.response.text());

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
    // Switch to gemini-2.0-flash to avoid 404 on gemini-2.0-pro
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent(prompt);
    res.json(cleanJSONArray(result.response.text()));

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
    // Switch to gemini-2.0-flash to avoid 404
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent(prompt);
    res.json(cleanJSON(result.response.text()));

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
    // Switch to gemini-2.0-flash to avoid 404
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent(prompt);

    res.json({
      topicId: topic.id,
      title: topic.title,
      contentMarkdown: result.response.text(),
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent(prompt);
    res.json(cleanJSONArray(result.response.text()));

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
    const { message } = req.body;
    // Switch to gemini-2.0-flash to avoid 404
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an AI education assistant. Respond to:

User: ${message}
`;

    const result = await model.generateContent(prompt);
    res.json({ text: result.response.text() });

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
Research the topic: ${query}
Provide a structured summary.
`;

    const result = await model.generateContent(prompt);

    res.json({
      text: result.response.text(),
      sources: [] 
    });

  } catch (err) {
    console.error("❌ Research Error:", err);
    res.status(500).json({ error: err.message });
  }
};