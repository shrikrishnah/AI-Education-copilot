require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const pdf = require("pdf-parse");

// IMPORTANT — Use correct class name AND environment variable
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// Helper to extract text from files
async function extractText(filePath, mimeType) {
  if (mimeType === 'application/pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } else {
    // Assume text/plain, markdown, etc.
    return fs.readFileSync(filePath, 'utf8');
  }
}

// --- AGENT 1: Ingest & Analyze ---
exports.processFiles = async (req, res) => {
  try {
    const files = req.files;
    const results = [];

    for (const file of files) {
      try {
        const textContent = await extractText(file.path, file.mimetype);
        
        // Analyze with Gemini
        const prompt = `
          Analyze this educational resource.
          Filename: ${file.originalname}
          Content Snippet: ${textContent.slice(0, 10000)}...

          Return a JSON object with:
          {
            "summary": "string (max 100 words)",
            "topics": ["string"],
            "difficulty": number (1-10),
            "credibilityScore": number (1-100),
            "type": "string"
          }
        `;

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
          content: textContent, // In production, store path or vector embedding
          metadata,
          uploadedAt: new Date().toISOString()
        });

        // Cleanup
        // fs.unlinkSync(file.path); 
      } catch (err) {
        console.error(`Error processing ${file.originalname}:`, err);
        results.push({ id: file.filename, name: file.originalname, status: 'error' });
      }
    }

    res.json({ resources: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processUrl = async (req, res) => {
  try {
    const { url } = req.body;
    
    // In a real app, use Puppeteer to scrape. 
    // Here we assume the user provides a URL and we ask Gemini to infer or use its own knowledge.
    const prompt = `
      The user provided this URL for learning: ${url}.
      Infer the educational content, summary, and topics based on the URL structure and common knowledge.
      
      Return a JSON object with:
      {
        "summary": "string",
        "topics": ["string"],
        "difficulty": 5,
        "credibilityScore": 80,
        "type": "url"
      }
    `;

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
        url: url,
        content: `External Link: ${url}`,
        metadata,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- AGENT 2: Harmonize ---
exports.harmonizeCurriculum = async (req, res) => {
  try {
    const { resources } = req.body;
    const summaries = resources.map(r => 
      `ID: ${r.id}, Name: ${r.name}, Topics: ${r.metadata?.topics?.join(', ')}`
    ).join('\n');

    const prompt = `
      Act as a Curriculum Architect. 
      Resources:
      ${summaries}

      Create a logical dependency tree of "Curriculum Nodes".
      Output JSON:
      [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "resources": ["resource_id_1"],
          "prerequisites": ["node_id_previous"] 
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Stronger reasoning model
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- AGENT 3: Planner ---
exports.generateStudyPlan = async (req, res) => {
  try {
    const { nodes } = req.body;
    
    const prompt = `
      Create a 3-Year Study Plan based on these topics: ${JSON.stringify(nodes)}.
      Output strictly JSON:
      {
        "years": [
          {
            "year": 1,
            "focus": "string",
            "quarters": [
               { "quarter": 1, "focus": "string", "months": [ { "month": 1, "topics": [ { "id": "node_id", "title": "string" } ] } ] }
            ]
          }
        ]
      }
    `;

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

// --- AGENT 4: Master Notes ---
exports.generateMasterNotes = async (req, res) => {
  try {
    const { topic, resources } = req.body;
    
    // Filter relevant content
    const context = resources
      .filter(r => topic.resources.includes(r.id))
      .map(r => `Source (${r.name}):\n${r.content.substring(0, 3000)}`)
      .join('\n\n');

    const prompt = `
      Write a comprehensive "Master Note" for the topic: "${topic.title}".
      Use the provided sources. Format in Markdown.
      Include: Overview, Deep Dive, Examples, References.
      
      Sources:
      ${context || "No specific source text, use general knowledge."}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High quality writing
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

// --- AGENT 5: Quiz ---
exports.generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;
    const prompt = `Generate 5 multiple choice questions about "${topic}". JSON format.`;
    
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
