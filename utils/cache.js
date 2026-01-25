const NodeCache = require('node-cache');
const { CACHE_TTL } = require('../config/constants');

// Create cache instance with TTL
const cache = new NodeCache({
    stdTTL: CACHE_TTL,
    checkperiod: 600, // Check for expired keys every 10 minutes
    useClones: false
});

class CacheService {
    /**
     * Get cached audit result by placeId
     */
    getAuditByPlaceId(placeId) {
        return cache.get(`audit:${placeId}`);
    }

    /**
     * Set audit result cache
     */
    setAudit(placeId, auditData) {
        return cache.set(`audit:${placeId}`, auditData, CACHE_TTL);
    }

    /**
     * Check if audit is cached and still valid (within 48 hours)
     * Only return true if audit is COMPLETED
     */
    hasValidCache(placeId) {
        const cached = this.getAuditByPlaceId(placeId);
        if (!cached) return false;

        // CRITICAL: Only cache completed audits!
        if (cached.status !== 'completed') {
            // Clear incomplete audit from cache
            this.clearPlace(placeId);
            return false;
        }

        const now = new Date();
        const cacheAge = (now - new Date(cached.createdAt)) / 1000; // in seconds

        return cacheAge < CACHE_TTL;
    }

    /**
     * Clear cache for a specific place
     */
    clearPlace(placeId) {
        return cache.del(`audit:${placeId}`);
    }

    /**
     * Clear all cache
     */
    clearAll() {
        return cache.flushAll();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return cache.getStats();
    }

    /**
     * Get all cached keys
     */
    getKeys() {
        return cache.keys();
    }
}

module.exports = new CacheService();
