const express = require('express');
const router = express.Router();

/**
 * GET /api/config/maps-key
 * Get Google Maps API key for frontend
 */
router.get('/maps-key', (req, res) => {
    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            return res.status(503).json({
                success: false,
                message: 'Google Maps API key not configured'
            });
        }

        res.json({
            success: true,
            apiKey: apiKey
        });
    } catch (error) {
        console.error('Maps key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Maps API key'
        });
    }
});

module.exports = router;
