// ✅ USE THE CORRECT FREE SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const pdf = require('pdf-parse');

// Initialize Gemini correctly
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(apiKey);

// FREE MODEL
const MODEL = "gemini-1.5-flash";

// Extract text
async function extractText(filePath, mimeType) {
  try {
    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    }
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error("Text extraction error:", err);
    return "";
  }
}

// JSON cleaner
function cleanJSON(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return {};
    return JSON.parse(text.substring(start, end + 1));
  } catch {
    return {};
  }
}

function cleanJSONArray(text) {
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    return JSON.parse(text.substring(start, end + 1));
  } catch {
    return [];
  }
}

// =========================================================
// 1. PROCESS FILES
// =========================================================

exports.processFiles = async (req, res) => {
  try {
    const files = req.files || [];
    const results = [];

    for (const file of files) {
      const model = ai.getGenerativeModel({ model: MODEL });

      let content = await extractText(file.path, file.mimetype);

      const prompt = `
        Analyze this educational content:
        ${content.slice(0, 7000)}

        Return JSON:
        {
          "summary": "",
          "topics": [],
          "difficulty": 1,
          "credibilityScore": 80,
          "type": "text",
          "warnings": []
        }
      `;

      const result = await model.generateContent(prompt);
      const text = await result.text();
      const json = cleanJSON(text);

      results.push({
        id: file.filename,
        name: file.originalname,
        type: file.mimetype,
        content,
        metadata: json,
        uploadedAt: new Date()
      });

      try { fs.unlinkSync(file.path); } catch {}
    }

    res.json({ resources: results });

  } catch (err) {
    console.error("ProcessFiles Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =========================================================
// 2. URL PROCESSOR
// =========================================================

exports.processUrl = async (req, res) => {
  try {
    const { url } = req.body;
    const model = ai.getGenerativeModel({ model: MODEL });

    const prompt = `
      Analyze this URL: ${url}
      Return JSON: {
        "summary": "",
        "topics": [],
        "difficulty": 5,
        "credibilityScore": 80,
        "type": "url",
        "warnings": []
      }
    `;

    const result = await model.generateContent(prompt);
    const output = cleanJSON(await result.text());

    res.json({
      resource: {
        id: Date.now().toString(),
        name: url,
        url,
        type: "url",
        metadata: output,
        uploadedAt: new Date()
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================================================
// 3. CURRICULUM HARMONIZER
// =========================================================

exports.harmonizeCurriculum = async (req, res) => {
  try {
    const model = ai.getGenerativeModel({ model: MODEL });

    const prompt = `
      Build a dependency tree for these resources:
      ${JSON.stringify(req.body.resources)}

      Return JSON Array:
      [{
        "id": "",
        "title": "",
        "description": "",
        "resources": [],
        "prerequisites": []
      }]
    `;

    const result = await model.generateContent(prompt);
    const json = cleanJSONArray(await result.text());

    res.json(json);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================================================
// 4. STUDY PLAN (must NOT use gemini-3-pro)
// =========================================================

exports.generateStudyPlan = async (req, res) => {
  try {
    const model = ai.getGenerativeModel({ model: MODEL });

    const prompt = `
      Create a structured 3-year study plan.
      Topics: ${JSON.stringify(req.body.nodes)}

      Return JSON:
      { "years": [] }
    `;

    const result = await model.generateContent(prompt);
    res.json(cleanJSON(await result.text()));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================================================
// 5. MASTER NOTES
// =========================================================

exports.generateMasterNotes = async (req, res) => {
  try {
    const { topic, resources } = req.body;
    const model = ai.getGenerativeModel({ model: MODEL });

    const context = resources
      .map(r => `[${r.name}]: ${r.content.slice(0, 3000)}`)
      .join("\n");

    const prompt = `
      Create detailed Markdown master notes for topic "${topic.title}"
      using the following context:

      ${context}
    `;

    const result = await model.generateContent(prompt);

    res.json({
      topicId: topic.id,
      title: topic.title,
      contentMarkdown: await result.text(),
      generatedAt: new Date()
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================================================
// 6. QUIZ GENERATOR
// =========================================================

exports.generateQuiz = async (req, res) => {
  try {
    const model = ai.getGenerativeModel({ model: MODEL });

    const prompt = `
      Generate 5 MCQs for topic: "${req.body.topic}"
      Return JSON Array.
    `;

    const result = await model.generateContent(prompt);
    res.json(cleanJSONArray(await result.text()));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
