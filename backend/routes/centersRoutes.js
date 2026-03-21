const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCenters } = require('../controllers/centersController');

router.get('/', protect, getCenters);

module.exports = router;
