const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * Proxy endpoint for Google Places photos
 * This allows the backend to fetch photos with IP-restricted API key
 * and serve them to the frontend
 */
router.get('/proxy', async (req, res) => {
    try {
        const { photo_reference, maxwidth = 800 } = req.query;

        if (!photo_reference) {
            return res.status(400).json({ error: 'photo_reference is required' });
        }

        const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photo_reference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

        // Fetch the photo from Google Places API
        const response = await axios.get(photoUrl, {
            responseType: 'arraybuffer',
            maxRedirects: 5
        });

        // Forward the image to the client
        res.set('Content-Type', response.headers['content-type']);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.send(response.data);

    } catch (error) {
        console.error('Photo proxy error:', error.message);
        
        // Send a transparent 1x1 pixel PNG as fallback
        const transparentPng = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );
        res.set('Content-Type', 'image/png');
        res.status(404).send(transparentPng);
    }
});

module.exports = router;
