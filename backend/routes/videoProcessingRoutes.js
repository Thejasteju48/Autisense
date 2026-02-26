const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
const EMOTION_SERVICE_URL = process.env.EMOTION_SERVICE_URL || 'http://localhost:8001';

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

    const uploadsDir = path.join(__dirname, '../uploads/videos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(videoFile.originalname) || '.mp4';
    const filename = `screening-${screeningId || 'video'}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, videoFile.buffer);

    console.log('📤 Forwarding video path to ML service for processing...');

    let videoData = null;
    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/analyze`,
        { video_path: filePath },
        { timeout: 600000 }
      );

      console.log('✓ ML processing complete:', mlResponse.data);
      videoData = mlResponse.data;

      try {
        const emotionResponse = await axios.post(
          `${EMOTION_SERVICE_URL}/analyze-emotion`,
          { video_path: filePath },
          { timeout: 600000 }
        );
        videoData.emotion_variation = emotionResponse.data?.emotion_variation || videoData.emotion_variation;
      } catch (emotionError) {
        console.error('⚠️ Emotion service failed:', emotionError.message);
      }
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({
      success: true,
      features: videoData,
      duration: Number(duration) || 0
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
