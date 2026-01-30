const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  startScreening,
  submitQuestionnaire,
  completeScreening,
  getScreening,
  getScreeningsByChild,
  getAllUserScreenings,
  generateReport,
  deleteScreening,
  uploadVideo
} = require('../controllers/screeningController');
const { protect } = require('../middleware/auth');

// Configure multer for video upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// All routes are protected (require authentication)
router.use(protect);

// Start new screening
router.post('/start', startScreening);

// Upload video for screening (BEFORE :id routes to avoid conflicts)
router.post('/:id/video', upload.single('video'), uploadVideo);

// Submit questionnaire
router.post('/:id/questionnaire', submitQuestionnaire);

// Complete screening and get final prediction
router.post('/:id/complete', completeScreening);

// Generate report (specific route before generic :id)
router.get('/:id/report', generateReport);

// Get screening data
router.get('/user/all', getAllUserScreenings); // Get all screenings for current user
router.get('/child/:childId/latest', getScreeningsByChild); // Get latest screening for a child
router.get('/child/:childId', getScreeningsByChild); // Get all screenings for a child
router.get('/:id', getScreening);

// Delete screening
router.delete('/:id', deleteScreening);

// Delete screening
router.delete('/:id', deleteScreening);

module.exports = router;
