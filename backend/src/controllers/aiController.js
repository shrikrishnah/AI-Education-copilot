// =========================
// AI CONTROLLER (FREE TIER SAFE)
// =========================

const fs = require("fs");
const pdf = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load API Key
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
if (!apiKey) console.error("❌ ERROR: Missing GEMINI_API_KEY");

const genAI = new GoogleGenerativeAI(apiKey);

// FREE model (fast + stable)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


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
function tryParseJSON(text) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {}; // fallback
  }
}

function tryParseJSONArray(text) {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
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

CONTENT (first 4000 chars):
${text.slice(0, 4000)}

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

      let aiResponse;
      try {
        const result = await model.generateContent(prompt);
        aiResponse = await result.text();
      } catch (e) {
        console.error("AI Error:", e);
        aiResponse = "{}";
      }

      const metadata = tryParseJSON(aiResponse);

      responses.push({
        id: file.filename,
        name: file.originalname,
        type: file.mimetype.includes("pdf") ? "pdf" : "text",
        content: text,
        metadata,
        uploadedAt: new Date().toISOString(),
      });

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

    const result = await model.generateContent(prompt);
    const metadata = tryParseJSON(await result.text());

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

    const result = await model.generateContent(prompt);
    res.json(tryParseJSONArray(await result.text()));

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

    const result = await model.generateContent(prompt);
    res.json(tryParseJSON(await result.text()));

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
      .map(r => r.content.slice(0, 2000))
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
      contentMarkdown: await result.text(),
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

    const result = await model.generateContent(prompt);
    res.json(tryParseJSONArray(await result.text()));

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

    const prompt = `
You are an AI education assistant. Respond to:

User: ${message}
`;

    const result = await model.generateContent(prompt);
    res.json({ text: await result.text() });

  } catch (err) {
    console.error("❌ Chat Error:", err);
    res.status(500).json({ error: err.message });
  }
};



// =========================
// 8️⃣ RESEARCH (NO GOOGLE SEARCH, FREE TIER SAFE)
// =========================

exports.research = async (req, res) => {
  try {
    const { query } = req.body;

    const prompt = `
Research the topic: ${query}
Provide a structured summary.
No external sources (free tier only).
`;

    const result = await model.generateContent(prompt);

    res.json({
      text: await result.text(),
      sources: [] // free API cannot fetch real sources
    });

  } catch (err) {
    console.error("❌ Research Error:", err);
    res.status(500).json({ error: err.message });
  }
};

