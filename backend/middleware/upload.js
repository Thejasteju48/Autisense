const multer = require('multer');
const path = require('path');

// Configure multer for profile image uploads
const storage = multer.memoryStorage(); // Store in memory since we're not using file uploads for screening anymore

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for profile images
  }
});

// Export middleware for profile image upload
const uploadProfile = upload.single('profileImage');

module.exports = {
  uploadProfile
};
