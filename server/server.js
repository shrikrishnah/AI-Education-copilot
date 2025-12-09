// This backend is provided as a complete reference implementation.
// For the demo, the frontend uses client-side Gemini calls.
// To use this backend, switch the service mode in the frontend.

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeResource, generateCurriculum } = require('./controllers/aiController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Storage Setup
const upload = multer({ dest: 'uploads/' });

// Routes
app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    const processed = [];
    
    // Simulate processing queue
    for (const file of files) {
      const content = fs.readFileSync(file.path, 'utf-8'); // Simplified: assumes text
      const metadata = await analyzeResource(content, file.mimetype);
      processed.push({
        id: file.filename,
        originalName: file.originalname,
        metadata
      });
      // Cleanup temp file
      fs.unlinkSync(file.path);
    }

    res.json({ success: true, resources: processed });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Processing failed' });
  }
});

app.post('/api/curriculum', async (req, res) => {
  try {
    const { resources } = req.body;
    const curriculum = await generateCurriculum(resources);
    res.json(curriculum);
  } catch (error) {
    res.status(500).json({ error: 'AI generation failed' });
  }
});

// Health Check
app.get('/health', (req, res) => res.send('AI Education Co-Pilot Backend Active'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
