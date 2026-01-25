const axios = require('axios');
const cheerio = require('cheerio');

class SEOAnalysisService {
    constructor() {
        this.timeout = 3000;
    }

    /**
     * Comprehensive SEO analysis of a website
     */
    async analyzeWebsite(url, businessName, city) {
        try {
            console.log(`Starting SEO analysis for: ${url}`);

            const response = await axios.get(url, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
                },
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);
            const analysis = {
                // Metadata
                metadata: this._analyzeMetadata($, businessName, city),

                // Content structure
                content: this._analyzeContent($, businessName, city),

                // Technical SEO
                technical: this._analyzeTechnical($, url),

                // Conversion elements
                conversion: this._analyzeConversion($),

                // Score calculation
                score: 0,
                issues: [],
                recommendations: []
            };

            // Calculate score and generate recommendations
            this._calculateScore(analysis);

            console.log(`SEO analysis completed: ${analysis.score}/100`);
            return analysis;

        } catch (error) {
            console.error('SEO analysis error:', error.message);
            return this._getDefaultAnalysis();
        }
    }

    /**
     * Analyze metadata (title, description, keywords)
     */
    _analyzeMetadata($, businessName, city) {
        const metadata = {
            title: $('title').text() || '',
            description: $('meta[name="description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            ogTitle: $('meta[property="og:title"]').attr('content') || '',
            ogDescription: $('meta[property="og:description"]').attr('content') || '',
            ogImage: $('meta[property="og:image"]').attr('content') || ''
        };

        // Check if title includes business name
        metadata.titleIncludesBusinessName = metadata.title.toLowerCase().includes(businessName.toLowerCase());

        // Check if title includes city
        metadata.titleIncludesCity = city ? metadata.title.toLowerCase().includes(city.toLowerCase()) : false;

        // Title length check (optimal: 50-60 characters)
        metadata.titleLength = metadata.title.length;
        metadata.titleOptimal = metadata.titleLength >= 30 && metadata.titleLength <= 60;

        // Description length check (optimal: 120-160 characters)
        metadata.descriptionLength = metadata.description.length;
        metadata.descriptionOptimal = metadata.descriptionLength >= 120 && metadata.descriptionLength <= 160;

        // Check if description includes city
        metadata.descriptionIncludesCity = city ? metadata.description.toLowerCase().includes(city.toLowerCase()) : false;

        return metadata;
    }

    /**
     * Analyze content structure (H1, H2, images, etc.)
     */
    _analyzeContent($, businessName, city) {
        const content = {
            // Heading analysis
            h1Tags: [],
            h2Tags: [],

            // Image analysis
            images: [],
            imagesWithoutAlt: 0,

            // Text content
            paragraphs: $('p').length,
            textLength: $('body').text().replace(/\s+/g, ' ').trim().length,

            // Links
            internalLinks: 0,
            externalLinks: 0
        };

        // Analyze H1 tags
        $('h1').each((i, elem) => {
            const text = $(elem).text().trim();
            content.h1Tags.push({
                text,
                includesBusinessName: text.toLowerCase().includes(businessName.toLowerCase()),
                includesCity: city ? text.toLowerCase().includes(city.toLowerCase()) : false
            });
        });

        // Analyze H2 tags
        $('h2').each((i, elem) => {
            content.h2Tags.push($(elem).text().trim());
        });

        // Analyze images
        $('img').each((i, elem) => {
            const alt = $(elem).attr('alt') || '';
            const src = $(elem).attr('src') || '';

            content.images.push({
                src,
                hasAlt: alt.length > 0,
                alt
            });

            if (!alt || alt.length === 0) {
                content.imagesWithoutAlt++;
            }
        });

        // Analyze links
        $('a').each((i, elem) => {
            const href = $(elem).attr('href') || '';
            if (href.startsWith('http') || href.startsWith('//')) {
                content.externalLinks++;
            } else if (href.startsWith('/') || href.startsWith('#')) {
                content.internalLinks++;
            }
        });

        return content;
    }

    /**
     * Analyze technical SEO elements
     */
    _analyzeTechnical($, url) {
        const technical = {
            // SSL/HTTPS
            hasSSL: url.startsWith('https://'),

            // Favicon
            hasFavicon: $('link[rel="icon"]').length > 0 || $('link[rel="shortcut icon"]').length > 0,

            // Canonical URL
            hasCanonical: $('link[rel="canonical"]').length > 0,
            canonicalUrl: $('link[rel="canonical"]').attr('href') || '',

            // Robots meta
            robotsMeta: $('meta[name="robots"]').attr('content') || '',

            // Viewport meta (mobile-friendly)
            hasViewport: $('meta[name="viewport"]').length > 0,

            // Language
            htmlLang: $('html').attr('lang') || '',

            // Schema.org structured data
            hasStructuredData: $('script[type="application/ld+json"]').length > 0
        };

        return technical;
    }

    /**
     * Analyze conversion elements (CTA, contact info, ordering)
     */
    _analyzeConversion($) {
        const conversion = {
            // Phone number detection
            hasPhoneInContent: false,
            phoneNumbers: [],

            // CTA buttons
            ctaButtons: [],

            // Forms
            hasForms: $('form').length > 0,
            formsCount: $('form').length,

            // Online ordering
            hasOnlineOrdering: false,

            // Reservation system
            hasReservationSystem: false,

            // FAQ section
            hasFAQ: false,

            // Reviews section
            hasReviewsSection: false,

            // Social media links
            socialLinks: []
        };

        // Detect phone numbers in content
        const bodyText = $('body').text();
        const phoneRegex = /(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g;
        const phones = bodyText.match(phoneRegex) || [];
        conversion.phoneNumbers = [...new Set(phones)].slice(0, 3); // Unique, max 3
        conversion.hasPhoneInContent = conversion.phoneNumbers.length > 0;

        // Detect CTA buttons (common patterns)
        const ctaKeywords = ['bestell', 'reserv', 'kontakt', 'anruf', 'order', 'book', 'call', 'menu'];
        $('a, button').each((i, elem) => {
            const text = $(elem).text().toLowerCase().trim();
            const href = $(elem).attr('href') || '';

            if (ctaKeywords.some(keyword => text.includes(keyword)) ||
                $(elem).hasClass('cta') ||
                $(elem).hasClass('button') ||
                $(elem).hasClass('btn')) {
                conversion.ctaButtons.push({
                    text: $(elem).text().trim().substring(0, 50),
                    href
                });
            }
        });

        // Check for online ordering
        const orderingKeywords = ['online bestellen', 'jetzt bestellen', 'order online', 'delivery', 'lieferung'];
        conversion.hasOnlineOrdering = orderingKeywords.some(keyword =>
            bodyText.toLowerCase().includes(keyword)
        );

        // Check for reservation system
        const reservationKeywords = ['reservierung', 'tisch reservieren', 'reservation', 'book a table'];
        conversion.hasReservationSystem = reservationKeywords.some(keyword =>
            bodyText.toLowerCase().includes(keyword)
        );

        // Check for FAQ
        const faqIndicators = $('*').filter((i, elem) => {
            const text = $(elem).text().toLowerCase();
            const className = $(elem).attr('class') || '';
            const id = $(elem).attr('id') || '';
            return text.includes('faq') ||
                text.includes('häufig') ||
                className.includes('faq') ||
                id.includes('faq');
        });
        conversion.hasFAQ = faqIndicators.length > 0;

        // Check for reviews section
        const reviewIndicators = $('*').filter((i, elem) => {
            const text = $(elem).text().toLowerCase();
            const className = $(elem).attr('class') || '';
            return text.includes('bewertung') ||
                text.includes('review') ||
                className.includes('review') ||
                className.includes('testimonial');
        });
        conversion.hasReviewsSection = reviewIndicators.length > 0;

        // Detect social media links
        const socialPlatforms = ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'youtube'];
        $('a').each((i, elem) => {
            const href = $(elem).attr('href') || '';
            socialPlatforms.forEach(platform => {
                if (href.includes(platform)) {
                    conversion.socialLinks.push({
                        platform,
                        url: href
                    });
                }
            });
        });

        return conversion;
    }

    /**
     * Calculate overall score and generate recommendations
     */
    _calculateScore(analysis) {
        let score = 0;
        const issues = [];
        const recommendations = [];

        // Metadata scoring (25 points)
        const meta = analysis.metadata;

        if (meta.title && meta.title.length > 0) {
            score += 5;
        } else {
            issues.push('Kein Page Title - Kritisch für SEO!');
            recommendations.push('Fügen Sie einen aussagekräftigen Seitentitel hinzu');
        }

        if (meta.titleOptimal) {
            score += 5;
        } else if (meta.title.length > 0) {
            issues.push(`Page Title zu ${meta.titleLength < 30 ? 'kurz' : 'lang'} (${meta.titleLength} Zeichen)`);
            recommendations.push('Optimaler Title: 30-60 Zeichen');
        }

        if (meta.titleIncludesCity) {
            score += 5;
        } else {
            issues.push('Title enthält keinen Standort - Lokale SEO Chance verpasst!');
            recommendations.push('Fügen Sie Ihre Stadt in den Title ein');
        }

        if (meta.description && meta.description.length > 0) {
            score += 5;
        } else {
            issues.push('Keine Meta Description - Google erstellt eigene!');
            recommendations.push('Schreiben Sie eine überzeugende Meta Description');
        }

        if (meta.descriptionOptimal) {
            score += 5;
        } else if (meta.description.length > 0) {
            issues.push(`Meta Description zu ${meta.descriptionLength < 120 ? 'kurz' : 'lang'}`);
            recommendations.push('Optimale Description: 120-160 Zeichen');
        }

        // Content scoring (30 points)
        const content = analysis.content;

        if (content.h1Tags.length > 0) {
            score += 10;
        } else {
            issues.push('Kein H1 Tag - Suchmaschinen verstehen Ihre Seite nicht!');
            recommendations.push('Fügen Sie eine klare H1 Überschrift hinzu');
        }

        if (content.h1Tags.length === 1) {
            score += 5;
        } else if (content.h1Tags.length > 1) {
            issues.push(`${content.h1Tags.length} H1 Tags gefunden - Sollte nur 1 sein!`);
            recommendations.push('Verwenden Sie nur eine H1 Überschrift pro Seite');
        }

        if (content.h1Tags.some(h1 => h1.includesCity)) {
            score += 5;
        } else if (content.h1Tags.length > 0) {
            issues.push('H1 enthält keinen Standort');
            recommendations.push('Erwähnen Sie Ihre Stadt in der Hauptüberschrift');
        }

        if (content.images.length > 0 && content.imagesWithoutAlt === 0) {
            score += 10;
        } else if (content.imagesWithoutAlt > 0) {
            issues.push(`${content.imagesWithoutAlt} Bilder ohne Alt-Text - Google kann sie nicht "sehen"!`);
            recommendations.push('Fügen Sie allen Bildern beschreibende Alt-Texte hinzu');
        }

        // Technical scoring (20 points)
        const tech = analysis.technical;

        if (tech.hasSSL) {
            score += 5;
        } else {
            issues.push('Keine HTTPS Verschlüsselung - Unsicher für Kunden!');
            recommendations.push('Installieren Sie ein SSL-Zertifikat (oft kostenlos)');
        }

        if (tech.hasViewport) {
            score += 5;
        } else {
            issues.push('Nicht mobile-optimiert - 60% Ihrer Besucher sehen Chaos!');
            recommendations.push('Fügen Sie Viewport Meta Tag hinzu');
        }

        if (tech.hasFavicon) {
            score += 5;
        } else {
            recommendations.push('Fügen Sie ein Favicon hinzu für professionelles Aussehen');
        }

        if (tech.hasStructuredData) {
            score += 5;
        } else {
            recommendations.push('Implementieren Sie Schema.org strukturierte Daten');
        }

        // Conversion scoring (25 points)
        const conv = analysis.conversion;

        if (conv.hasPhoneInContent) {
            score += 5;
        } else {
            issues.push('Keine Telefonnummer auf der Website - Sie verlieren Anrufe!');
            recommendations.push('Zeigen Sie Ihre Telefonnummer prominent an');
        }

        if (conv.ctaButtons.length >= 2) {
            score += 10;
        } else if (conv.ctaButtons.length === 1) {
            score += 5;
            recommendations.push('Fügen Sie mehr Call-to-Action Buttons hinzu');
        } else {
            issues.push('Keine Call-to-Action Buttons - Besucher wissen nicht, was zu tun ist!');
            recommendations.push('Fügen Sie "Jetzt bestellen" oder "Reservieren" Buttons hinzu');
        }

        if (conv.hasOnlineOrdering) {
            score += 5;
        } else {
            recommendations.push('Online-Bestellung könnte Ihren Umsatz steigern');
        }

        if (conv.hasFAQ) {
            score += 5;
        } else {
            recommendations.push('FAQ-Sektion verbessert SEO und beantwortet Kundenfragen');
        }

        // Store results
        analysis.score = Math.min(score, 100);
        analysis.issues = issues;
        analysis.recommendations = recommendations.slice(0, 5); // Top 5 recommendations
    }

    /**
     * Get default analysis when scraping fails
     */
    _getDefaultAnalysis() {
        return {
            metadata: {},
            content: {},
            technical: {},
            conversion: {},
            score: 0,
            issues: ['Website konnte nicht analysiert werden'],
            recommendations: []
        };
    }
}

module.exports = new SEOAnalysisService();
