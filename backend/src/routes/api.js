const express = require('express');
const upload = require('../middleware/upload');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Ingestion
router.post('/upload', upload.array('files'), aiController.processFiles);
router.post('/url', aiController.processUrl);

// Planning
router.post('/harmonize', aiController.harmonizeCurriculum);
router.post('/plan', aiController.generateStudyPlan);

// Content
router.post('/notes', aiController.generateMasterNotes);
router.post('/quiz', aiController.generateQuiz);

// New Features
router.post('/chat', aiController.chat);
router.post('/research', aiController.research);

// Health
router.get('/health', (req, res) => {
  res.json({ status: 'API healthy', timestamp: new Date().toISOString() });
});

module.exports = router;