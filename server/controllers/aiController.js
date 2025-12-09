const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function analyzeResource(content, type) {
  const prompt = `Analyze this resource (Type: ${type}). Provide JSON summary, topics, and difficulty.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt + `\n\n${content.substring(0, 5000)}`,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
  } catch (e) {
    console.error("AI Error", e);
    return { summary: "Error analyzing", topics: [] };
  }
}

async function generateCurriculum(resources) {
  // Implementation matches client-side logic but runs on server
  // ...
  return []; 
}

module.exports = { analyzeResource, generateCurriculum };
