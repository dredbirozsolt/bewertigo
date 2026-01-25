const validator = require('validator');

/**
 * Validate email address
 */
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return {
            valid: false,
            message: 'E-Mail-Adresse ist erforderlich'
        };
    }

    // Trim and lowercase
    email = email.trim().toLowerCase();

    // Check if valid email format
    if (!validator.isEmail(email)) {
        return {
            valid: false,
            message: 'Ungültige E-Mail-Adresse'
        };
    }

    // Check for disposable email domains
    const disposableDomains = [
        'tempmail.com',
        'throwaway.email',
        'guerrillamail.com',
        '10minutemail.com',
        'mailinator.com',
        'trashmail.com'
    ];

    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) {
        return {
            valid: false,
            message: 'Einweg-E-Mail-Adressen sind nicht erlaubt'
        };
    }

    // Check for common typos (very basic)
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aon.at', 'gmx.at'];
    const typos = {
        'gmial.com': 'gmail.com',
        'gmai.com': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com'
    };

    if (typos[domain]) {
        return {
            valid: false,
            message: `Meinten Sie ${email.split('@')[0]}@${typos[domain]}?`,
            suggestion: `${email.split('@')[0]}@${typos[domain]}`
        };
    }

    // Check for obviously fake emails
    if (email.match(/^(test|fake|dummy|example|a@a\.|aa@|aaa@)/i)) {
        return {
            valid: false,
            message: 'Bitte geben Sie eine echte E-Mail-Adresse ein'
        };
    }

    return {
        valid: true,
        email
    };
}

/**
 * Validate place ID
 */
function validatePlaceId(placeId) {
    if (!placeId || typeof placeId !== 'string') {
        return {
            valid: false,
            message: 'Place ID ist erforderlich'
        };
    }

    // Google Place IDs typically start with "ChIJ" and are base64-like
    if (!placeId.match(/^ChIJ[A-Za-z0-9_-]+$/)) {
        return {
            valid: false,
            message: 'Ungültige Place ID'
        };
    }

    return {
        valid: true,
        placeId
    };
}

/**
 * Validate URL
 */
function validateUrl(url) {
    if (!url || typeof url !== 'string') {
        return {
            valid: false,
            message: 'URL ist erforderlich'
        };
    }

    if (!validator.isURL(url, {
        protocols: ['http', 'https'],
        require_protocol: true
    })) {
        return {
            valid: false,
            message: 'Ungültige URL'
        };
    }

    return {
        valid: true,
        url
    };
}

/**
 * Sanitize user input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }

    // Remove potential XSS
    return validator.escape(input.trim());
}

module.exports = {
    validateEmail,
    validatePlaceId,
    validateUrl,
    sanitizeInput
};
