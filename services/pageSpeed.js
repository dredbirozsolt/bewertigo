const axios = require('axios');
const { RETRY_CONFIG } = require('../config/constants');

class PageSpeedService {
    constructor() {
        this.apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
        this.baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    }

    /**
     * Analyze website performance with retry logic
     */
    async analyze(url, strategy = 'desktop') {
        let attempts = 0;
        const maxAttempts = RETRY_CONFIG.maxRetries + 1;

        while (attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`PageSpeed ${strategy} attempt ${attempts}/${maxAttempts} for ${url}`);

                const response = await axios.get(this.baseUrl, {
                    params: {
                        url,
                        key: this.apiKey,
                        strategy, // 'desktop' or 'mobile'
                        category: ['performance', 'accessibility', 'best-practices', 'seo']
                    },
                    timeout: RETRY_CONFIG.timeout
                });

                return this._processPageSpeedData(response.data, strategy);
            } catch (error) {
                console.error(`PageSpeed ${strategy} attempt ${attempts} failed:`, error.message);

                // If this is the last attempt, throw error
                if (attempts >= maxAttempts) {
                    console.error(`PageSpeed ${strategy} failed after ${maxAttempts} attempts`);
                    return this._getDefaultScores(strategy);
                }

                // Wait before retry
                await this._sleep(RETRY_CONFIG.retryDelay);
            }
        }
    }

    /**
     * Analyze both desktop and mobile
     */
    async analyzeAll(url) {
        try {
            const [desktop, mobile] = await Promise.all([
                this.analyze(url, 'desktop'),
                this.analyze(url, 'mobile')
            ]);

            return { desktop, mobile };
        } catch (error) {
            console.error('PageSpeed analyzeAll error:', error.message);
            return {
                desktop: this._getDefaultScores('desktop'),
                mobile: this._getDefaultScores('mobile')
            };
        }
    }

    /**
     * Process PageSpeed Insights data
     */
    _processPageSpeedData(data, strategy) {
        const lighthouseResult = data.lighthouseResult;
        const audits = lighthouseResult?.audits || {};

        // Core Web Vitals
        const lcp = audits['largest-contentful-paint']?.numericValue / 1000 || null; // Convert to seconds
        const fid = audits['max-potential-fid']?.numericValue || null;
        const cls = audits['cumulative-layout-shift']?.numericValue || null;
        const fcp = audits['first-contentful-paint']?.numericValue / 1000 || null;
        const si = audits['speed-index']?.numericValue / 1000 || null;
        const tbt = audits['total-blocking-time']?.numericValue || null;
        const tti = audits['interactive']?.numericValue / 1000 || null;

        // Performance Score
        const performanceScore = lighthouseResult?.categories?.performance?.score * 100 || 0;

        // Additional checks
        const usesHttps = audits['is-on-https']?.score === 1;
        const hasViewport = audits['viewport']?.score === 1;
        const fontSizeOk = audits['font-size']?.score === 1;
        const tapTargetsOk = audits['tap-targets']?.score === 1;

        // Extract screenshot
        const screenshot = audits['final-screenshot']?.details?.data || audits['screenshot-thumbnails']?.details?.items?.[0]?.data || null;

        return {
            strategy,
            performanceScore: Math.round(performanceScore),
            metrics: {
                lcp: lcp ? Math.round(lcp * 100) / 100 : null,
                fid: fid ? Math.round(fid) : null,
                cls: cls ? Math.round(cls * 100) / 100 : null,
                fcp: fcp ? Math.round(fcp * 100) / 100 : null,
                si: si ? Math.round(si * 100) / 100 : null,
                tbt: tbt ? Math.round(tbt) : null,
                tti: tti ? Math.round(tti * 100) / 100 : null
            },
            checks: {
                usesHttps,
                hasViewport,
                fontSizeOk,
                tapTargetsOk
            },
            screenshot,
            loadingExperience: data.loadingExperience,
            originLoadingExperience: data.originLoadingExperience,
            finalUrl: lighthouseResult?.finalUrl
        };
    }

    /**
     * Get default scores when API fails
     */
    _getDefaultScores(strategy) {
        return {
            strategy,
            performanceScore: 0,
            metrics: {
                lcp: null,
                fid: null,
                cls: null,
                fcp: null,
                si: null,
                tbt: null,
                tti: null
            },
            checks: {
                usesHttps: false,
                hasViewport: false,
                fontSizeOk: false,
                tapTargetsOk: false
            },
            error: 'PageSpeed API unavailable',
            loadingExperience: null,
            originLoadingExperience: null,
            finalUrl: null
        };
    }

    /**
     * Sleep helper for retry logic
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new PageSpeedService();
