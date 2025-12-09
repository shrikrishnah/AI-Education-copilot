import express from 'express';
import upload from '../middleware/upload.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

// Ingestion
router.post('/upload', upload.array('files'), aiController.processFiles);
router.post('/url', aiController.processUrl);

// Curriculum & Planning
router.post('/harmonize', aiController.harmonizeCurriculum);
router.post('/plan', aiController.generateStudyPlan);

// Generation
router.post('/notes', aiController.generateMasterNotes);
router.post('/quiz', aiController.generateQuiz);

export default router;