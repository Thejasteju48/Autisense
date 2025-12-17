const express = require('express');
const router = express.Router();
const {
  startScreening,
  processEyeContact,
  processGesture,
  processSmile,
  processRepetitive,
  processImitation,
  submitQuestionnaire,
  completeScreening,
  getScreening,
  getScreeningsByChild,
  generateReport,
  deleteScreening
} = require('../controllers/screeningController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.use(protect);

// Start new screening
router.post('/start', startScreening);

// Process interaction frames
router.post('/:id/eye-contact', processEyeContact);
router.post('/:id/smile', processSmile);
router.post('/:id/gesture', processGesture);
router.post('/:id/repetitive', processRepetitive);
router.post('/:id/imitation', processImitation);

// Submit questionnaire
router.post('/:id/questionnaire', submitQuestionnaire);

// Complete screening and get final prediction
router.post('/:id/complete', completeScreening);

// Get screening data
router.get('/child/:childId/latest', getScreeningsByChild); // Get latest screening for a child
router.get('/child/:childId', getScreeningsByChild); // Get all screenings for a child
router.get('/:id', getScreening);

// Generate report
router.get('/:id/report', generateReport);

// Delete screening
router.delete('/:id', deleteScreening);

module.exports = router;
