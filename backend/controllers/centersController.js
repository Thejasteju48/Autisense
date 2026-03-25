const placesService = require('../services/placesService');

// @desc    Get nearby autism-related centers using SerpAPI
// @route   GET /api/centers?city=Bangalore&state=Karnataka&country=India
// @access  Private
exports.getCenters = async (req, res) => {
  try {
    const city = (req.query.city || '').trim();
    const state = (req.query.state || '').trim();
    const country = (req.query.country || '').trim();

    if (!city) {
      return res.status(400).json({
        success: false,
        message: 'city query parameter is required'
      });
    }

    const centers = await placesService.getNearbyAutismCenters(city, state, country, 3);

    return res.json({
      success: true,
      data: {
        city,
        state,
        country,
        count: centers.length,
        source: 'SerpAPI',
        centers
      }
    });
  } catch (error) {
    console.error('Error fetching centers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby centers',
      error: error.message
    });
  }
};
