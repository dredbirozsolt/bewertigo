/**
 * Sleep/delay utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 30000,
        backoffFactor = 2,
        onRetry = null
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                throw error;
            }

            if (onRetry) {
                onRetry(attempt + 1, maxRetries, delay, error);
            }

            await sleep(delay);
            delay = Math.min(delay * backoffFactor, maxDelay);
        }
    }

    throw lastError;
}

/**
 * Retry specifically for API calls
 */
async function retryApiCall(apiFunction, options = {}) {
    return retryWithBackoff(apiFunction, {
        maxRetries: options.maxRetries || 2,
        initialDelay: options.delay || 5000,
        onRetry: (attempt, maxAttempts, delay, error) => {
            console.log(
                `API call failed (attempt ${attempt}/${maxAttempts}). ` +
                `Retrying in ${delay}ms... Error: ${error.message}`
            );
        },
        ...options
    });
}

module.exports = {
    sleep,
    retryWithBackoff,
    retryApiCall
};
