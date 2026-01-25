const axios = require('axios');
const { RETRY_CONFIG } = require('../config/constants');

class ScreenshotService {
    constructor() {
        // No browser needed - we'll use iframe or Open Graph images
    }

    /**
     * Get Open Graph image from website
     * @param {string} url - Website URL
     * @returns {Promise<string|null>} Open Graph image URL or null
     */
    async getOpenGraphImage(url) {
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; BewerigoBot/1.0; +https://bewertigo.dmf.n4.ininet.hu)'
                },
                maxRedirects: 5
            });

            const html = response.data;
            
            // Try to find og:image meta tag
            const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
            
            if (ogImageMatch && ogImageMatch[1]) {
                return ogImageMatch[1];
            }

            // Fallback: try twitter:image
            const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                                     html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
            
            if (twitterImageMatch && twitterImageMatch[1]) {
                return twitterImageMatch[1];
            }

            return null;
        } catch (error) {
            console.error('Error fetching Open Graph image:', error.message);
            return null;
        }
    }

    /**
     * Take screenshot of a website
     * @param {string} url - Website URL
     * @param {object} options - Screenshot options
     * @returns {Promise<string>} Base64 encoded screenshot
     */
    async takeScreenshot(url, options = {}) {
        const {
            fullPage = false,
            width = 1280,
            height = 800,
            timeout = 15000,
            waitForSelector = null
        } = options;

        let page = null;

        try {
            console.log(`📸 Taking screenshot of ${url}...`);

            const browser = await this.initBrowser();

    /**
     * Get website preview data (URL for iframe + Open Graph image as fallback)
     * @param {string} url - Website URL
     * @param {object} options - Options
     * @returns {Promise<object>} Preview data with URL and OG image
     */
    async takeScreenshot(url, options = {}) {
        try {
            // Get Open Graph image as fallback
            const ogImage = await this.getOpenGraphImage(url);

            return {
                type: 'iframe', // Use iframe for live preview
                url: url,
                ogImage: ogImage, // Fallback if iframe is blocked
                hasScreenshot: true // Mark as available
            };
        } catch (error) {
            console.error('❌ Preview generation error:', error.message);
            return {
                type: 'none',
                url: url,
                ogImage: null,
                hasScreenshot: false
            };
        }
    }

    /**
     * Take both desktop and mobile screenshots
     * @param {string} url - Website URL
     * @returns {Promise<object>} Object with desktop and mobile preview data
     */
    async takeMultipleScreenshots(url) {
        try {
            const preview = await this.takeScreenshot(url);
            
            return {
                desktop: preview,
                mobile: preview // Same preview for both
            };
        } catch (error) {
            console.error('❌ Multiple screenshots error:', error.message);
            return {
                desktop: { type: 'none', url: url, ogImage: null, hasScreenshot: false },
                mobile: { type: 'none', url: url, ogImage: null, hasScreenshot: false }
            };
        }
    }

    /**
     * Close browser instance (no-op since we don't use browser)
     */
    async closeBrowser() {
        // No browser to close
        return Promise.resolve();
    }
        if (this.browser) {
            try {
                await this.browser.close();
                this.browser = null;
                console.log('🔒 Browser closed');
            } catch (error) {
                console.error('Error closing browser:', error.message);
            }
        }
    }

    /**
     * Health check - ensures browser is working
     */
    async healthCheck() {
        try {
            const screenshot = await this.takeScreenshot('https://example.com', {
                width: 800,
                height: 600,
                timeout: 10000
            });
            return !!screenshot;
        } catch (error) {
            console.error('Health check failed:', error.message);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new ScreenshotService();
