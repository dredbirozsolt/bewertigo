const puppeteer = require('puppeteer');
const { RETRY_CONFIG } = require('../config/constants');

class ScreenshotService {
    constructor() {
        this.browser = null;
    }

    /**
     * Initialize browser instance (reusable)
     */
    async initBrowser() {
        if (!this.browser) {
            const os = require('os');
            const fs = require('fs');
            const platform = os.platform();

            const launchOptions = {
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-extensions',
                    '--disable-background-networking',
                    '--disable-default-apps',
                    '--disable-sync',
                    '--metrics-recording-only',
                    '--mute-audio',
                    '--no-first-run',
                    '--safebrowsing-disable-auto-update',
                    '--disable-crash-reporter',
                    '--disable-breakpad'
                ]
            };

            // On macOS, try to use system Chrome for better Apple Silicon compatibility
            if (platform === 'darwin') {
                const macChromePaths = [
                    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    '/Applications/Chromium.app/Contents/MacOS/Chromium',
                    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
                    process.env.CHROME_PATH
                ].filter(Boolean);

                for (const path of macChromePaths) {
                    if (fs.existsSync(path)) {
                        launchOptions.executablePath = path;
                        console.log(`✅ macOS: Using system browser at ${path}`);
                        break;
                    }
                }

                if (!launchOptions.executablePath) {
                    console.log(`⚠️  macOS: No system Chrome found, using bundled Chromium`);
                }
            } else {
                // Linux/Docker: Use bundled Chromium (works well on servers)
                console.log(`✅ ${platform}: Using bundled Chromium`);
            }

            this.browser = await puppeteer.launch(launchOptions);
        }
        return this.browser;
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
            page = await browser.newPage();

            // Set viewport
            await page.setViewport({
                width,
                height,
                deviceScaleFactor: 1
            });

            // Set reasonable timeout
            await page.setDefaultNavigationTimeout(timeout);
            await page.setDefaultTimeout(timeout);

            // Navigate to URL
            await page.goto(url, {
                waitUntil: 'networkidle2', // Wait until network is mostly idle
                timeout
            });

            // Optional: Wait for specific selector
            if (waitForSelector) {
                await page.waitForSelector(waitForSelector, { timeout: 5000 }).catch(() => {
                    console.warn(`Selector ${waitForSelector} not found, continuing anyway`);
                });
            }

            // Take screenshot
            const screenshot = await page.screenshot({
                type: 'jpeg',
                quality: 50, // Lower quality for smaller file size
                fullPage,
                encoding: 'base64'
            });

            console.log(`✅ Screenshot captured successfully (${Math.round(screenshot.length / 1024)}KB)`);

            // Return as data URL
            return `data:image/jpeg;base64,${screenshot}`;

        } catch (error) {
            console.error('❌ Screenshot error:', error.message);
            return null;
        } finally {
            // Close page but keep browser open for reuse
            if (page) {
                await page.close().catch(() => { });
            }
        }
    }

    /**
     * Take both desktop and mobile screenshots
     * @param {string} url - Website URL
     * @returns {Promise<object>} Object with desktop and mobile screenshots
     */
    async takeMultipleScreenshots(url) {
        try {
            const [desktop, mobile] = await Promise.all([
                this.takeScreenshot(url, {
                    width: 1280,
                    height: 800,
                    fullPage: false
                }),
                this.takeScreenshot(url, {
                    width: 375,
                    height: 667,
                    fullPage: false
                })
            ]);

            return { desktop, mobile };
        } catch (error) {
            console.error('❌ Multiple screenshots error:', error.message);
            return { desktop: null, mobile: null };
        }
    }

    /**
     * Close browser instance
     */
    async closeBrowser() {
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
