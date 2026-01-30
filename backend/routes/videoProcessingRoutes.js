const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Configure multer for video upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/video/process
 * Receives complete recorded video, forwards to ML service for frame extraction and analysis
 */
router.post('/process', upload.single('video'), async (req, res) => {
  try {
    const { screeningId, duration } = req.body;
    const videoFile = req.file;

    if (!videoFile) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    console.log(`📹 Received video: ${videoFile.size} bytes | Duration: ${duration}s | Screening: ${screeningId}`);

    // Create form data to send to ML service
    const formData = new FormData();
    formData.append('video', videoFile.buffer, {
      filename: videoFile.originalname,
      contentType: videoFile.mimetype
    });
    formData.append('duration', duration);
    formData.append('screening_id', screeningId);

    console.log('📤 Forwarding video to ML service for processing...');

    // Send to ML service
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/video/process-complete`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 600000 // 10 minutes timeout (increased for video processing)
      }
    );

    console.log('✓ ML processing complete:', {
      frames_processed: mlResponse.data.frames_processed,
      duration: mlResponse.data.duration
    });

    // Return features
    res.json({
      success: true,
      features: mlResponse.data.features,
      frames_processed: mlResponse.data.frames_processed,
      duration: mlResponse.data.duration,
      fps: mlResponse.data.fps
    });

  } catch (error) {
    console.error('❌ Error processing video:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'ML service error',
        message: error.response.data.detail || error.message
      });
    }
    
    res.status(500).json({
      error: 'Video processing failed',
      message: error.message
    });
  }
});

module.exports = router;
