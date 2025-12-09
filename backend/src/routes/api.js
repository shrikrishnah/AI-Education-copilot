const express = require('express');
const upload = require('../middleware/upload');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.post('/upload', upload.array('files'), aiController.processFiles);
router.post('/url', aiController.processUrl);
router.post('/harmonize', aiController.harmonizeCurriculum);
router.post('/plan', aiController.generateStudyPlan);
router.post('/notes', aiController.generateMasterNotes);
router.post('/quiz', aiController.generateQuiz);

module.exports = router;