const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const uploadDir = path.join(__dirname, '../uploads/medical-reports');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, `medical-report-${uniqueSuffix}${path.extname(file.originalname)}`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 15 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (file.mimetype === 'application/pdf') return cb(null, true);
		return cb(new Error('Only PDF files are allowed'));
	},
});

router.use(protect);

router.get('/suggestions', chatController.getSuggestions);
router.get('/:screeningId/history', chatController.getHistory);
router.post('/:screeningId/upload-report', upload.single('reportFile'), chatController.uploadMedicalReport);
router.post('/:screeningId/message', chatController.sendMessage);

module.exports = router;
