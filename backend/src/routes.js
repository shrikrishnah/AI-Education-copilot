const express = require('express');
const router = express.Router();
const multer = require('multer');
const aiController = require('./controllers/aiController');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 50MB limit
});

// --- ROUTES ---

// 1. Ingest Resources
router.post('/upload', upload.array('files'), aiController.processFiles);
router.post('/url', aiController.processUrl);

// 2. Planning & Curriculum
router.post('/harmonize', aiController.harmonizeCurriculum);
router.post('/plan', aiController.generateStudyPlan);

// 3. Content Generation
router.post('/notes', aiController.generateMasterNotes);
router.post('/quiz', aiController.generateQuiz);

module.exports = router;