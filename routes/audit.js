const express = require('express');
const router = express.Router();
const Audit = require('../models/Audit');
const googlePlaces = require('../services/googlePlaces');
const pageSpeed = require('../services/pageSpeed');
const screenshotService = require('../services/screenshot');
const socialMedia = require('../services/socialMedia');
const seoAnalysis = require('../services/seoAnalysis');
const scoringService = require('../services/scoring');
const cacheService = require('../utils/cache');
const { validatePlaceId } = require('../utils/validation');
const { retryApiCall } = require('../utils/retry');

/**
 * POST /api/audit/start
 * Start a new audit for a business
 */
router.post('/start', async (req, res) => {
    try {
        const { placeId } = req.body;

        // Validate place ID
        const validation = validatePlaceId(placeId);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        // Check cache first (48-hour window)
        const cachedAudit = cacheService.getAuditByPlaceId(placeId);
        if (cachedAudit && cacheService.hasValidCache(placeId)) {
            console.log(`Returning cached audit for ${placeId}`);
            return res.json({
                success: true,
                cached: true,
                auditId: cachedAudit.id,
                message: 'Audit bereits in den letzten 48 Stunden durchgeführt'
            });
        }

        // Get basic place details first (this is quick)
        const placeDetails = await googlePlaces.getPlaceDetails(placeId);

        // Create audit record
        const audit = await Audit.create({
            placeId,
            businessName: placeDetails.name,
            businessType: placeDetails.businessType,
            address: placeDetails.address,
            city: placeDetails.city,
            status: 'processing',
            progress: {
                current: 0,
                total: 7,
                currentStep: 'Initializing...'
            }
        });

        // Start background processing
        processAudit(audit.id, placeDetails).catch(err => {
            console.error('Audit processing error:', err);
        });

        res.json({
            success: true,
            cached: false,
            auditId: audit.id,
            businessName: placeDetails.name,
            message: 'Audit gestartet'
        });

    } catch (error) {
        console.error('Start audit error:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Starten des Audits',
            error: error.message
        });
    }
});

/**
 * GET /api/audit/status/:auditId
 * Get audit status and progress
 */
router.get('/status/:auditId', async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.auditId);

        if (!audit) {
            return res.status(404).json({
                success: false,
                message: 'Audit nicht gefunden'
            });
        }

        res.json({
            success: true,
            audit: {
                _id: audit._id,
                businessName: audit.businessName,
                status: audit.status,
                progress: audit.progress,
                totalScore: audit.totalScore,
                isUnlocked: audit.isUnlocked,
                createdAt: audit.createdAt,
                completedAt: audit.completedAt,
                // Legacy format for animations (top-level)
                placeDetails: audit.rawData?.placeDetails ? {
                    photos: audit.rawData.placeDetails.photos?.slice(0, 6).map(photo => {
                        if (photo.photo_reference) {
                            return googlePlaces.getPhotoUrl(photo.photo_reference, 400);
                        }
                        return null;
                    }).filter(url => url !== null) || [],
                    phone: audit.rawData.placeDetails.phone,
                    website: audit.rawData.placeDetails.website,
                    openingHours: audit.rawData.placeDetails.openingHours,
                    description: audit.rawData.placeDetails.description,
                    location: audit.rawData.placeDetails.location,
                    name: audit.rawData.placeDetails.name,
                    address: audit.rawData.placeDetails.address,
                    businessType: audit.rawData.placeDetails.businessType,
                    rating: audit.rawData.placeDetails.rating,
                    totalReviews: audit.rawData.placeDetails.totalReviews,
                    photoCount: audit.rawData.placeDetails.photoCount,
                    reviews: audit.rawData.placeDetails.reviews || []
                } : null,
                competitors: audit.rawData?.competitors || [],
                // Include rawData for new features
                rawData: {
                    websiteScreenshot: audit.rawData?.websiteScreenshot || audit.rawData?.websiteScreenshotDesktop || null, // Legacy fallback
                    websiteScreenshotDesktop: audit.rawData?.websiteScreenshotDesktop || null,
                    websiteScreenshotMobile: audit.rawData?.websiteScreenshotMobile || null,
                    placeDetails: audit.rawData?.placeDetails ? {
                        photos: audit.rawData.placeDetails.photos?.slice(0, 6).map(photo => {
                            if (photo.photo_reference) {
                                return googlePlaces.getPhotoUrl(photo.photo_reference, 400);
                            }
                            return null;
                        }).filter(url => url !== null) || [],
                        phone: audit.rawData.placeDetails.phone,
                        website: audit.rawData.placeDetails.website,
                        openingHours: audit.rawData.placeDetails.openingHours,
                        description: audit.rawData.placeDetails.description,
                        location: audit.rawData.placeDetails.location,
                        name: audit.rawData.placeDetails.name,
                        address: audit.rawData.placeDetails.address,
                        businessType: audit.rawData.placeDetails.businessType,
                        rating: audit.rawData.placeDetails.rating,
                        totalReviews: audit.rawData.placeDetails.totalReviews,
                        photoCount: audit.rawData.placeDetails.photoCount,
                        reviews: audit.rawData.placeDetails.reviews || []
                    } : null,
                    competitors: audit.rawData?.competitors || []
                }
            }
        });

    } catch (error) {
        console.error('Get audit status error:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen des Audit-Status',
            error: error.message
        });
    }
});

/**
 * GET /api/audit/result/:auditId
 * Get full audit results (requires unlock for details)
 */
router.get('/result/:auditId', async (req, res) => {
    try {
        const audit = await Audit.findByPk(req.params.auditId);

        if (!audit) {
            return res.status(404).json({
                success: false,
                message: 'Audit nicht gefunden'
            });
        }

        if (audit.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Audit noch nicht abgeschlossen'
            });
        }

        // Determine what data to return based on unlock status
        const response = {
            success: true,
            audit: {
                _id: audit._id,
                businessName: audit.businessName,
                businessType: audit.businessType,
                address: audit.address,
                city: audit.city,
                totalScore: audit.totalScore,
                status: audit.status,
                industryBenchmark: audit.industryBenchmark,
                isUnlocked: audit.isUnlocked,

                // Module scores (always visible)
                moduleScores: {
                    googleBusinessProfile: audit.scores.googleBusinessProfile.score,
                    reviewSentiment: audit.scores.reviewSentiment.score,
                    websitePerformance: audit.scores.websitePerformance.score,
                    mobileExperience: audit.scores.mobileExperience.score,
                    socialMediaPresence: audit.scores.socialMediaPresence.score,
                    competitorAnalysis: audit.scores.competitorAnalysis.score
                }
            }
        };

        // Only return detailed info if unlocked
        if (audit.isUnlocked) {
            response.audit.scores = audit.scores;
            response.audit.topIssues = audit.topIssues;
            response.audit.rawData = audit.rawData; // Include rawData for map
        } else {
            response.message = 'Geben Sie Ihre E-Mail-Adresse ein, um den vollständigen Bericht zu erhalten';
            response.requiresUnlock = true;
        }

        res.json(response);

    } catch (error) {
        console.error('Get audit result error:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler beim Abrufen des Audit-Ergebnisses',
            error: error.message
        });
    }
});

/**
 * GET /api/autocomplete
 * Google Places Autocomplete
 */
router.get('/autocomplete', async (req, res) => {
    try {
        const { input } = req.query;

        if (!input || input.length < 3) {
            return res.json({
                success: true,
                predictions: []
            });
        }

        const predictions = await googlePlaces.autocomplete(input);

        res.json({
            success: true,
            predictions
        });

    } catch (error) {
        console.error('Autocomplete error:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Suche',
            error: error.message
        });
    }
});

/**
 * Background audit processing function
 */
async function processAudit(auditId, placeDetails) {
    let audit = await Audit.findByPk(auditId);

    try {
        // Step 1: Update progress IMMEDIATELY so frontend sees it
        await updateProgress(audit, 1, 'Vergleich mit Konkurrenten...');

        // Find competitors (this can take 5-15 seconds)
        const competitors = await googlePlaces.findNearbyCompetitors(
            placeDetails.location,
            placeDetails.types || [placeDetails.businessType], // Pass all types for better matching
            1500, // Reduced radius: 1.5km for local competitors
            placeDetails.placeId,
            placeDetails.name // Pass business name for keyword detection
        );

        // Save placeDetails + competitors for Step 1 data
        await audit.update({
            rawData: {
                placeDetails,
                competitors
            }
        });

        // Extra delay for Step 1 to let users see competitor map animation
        // Competitors appear: business (500ms), comp1 (1500ms), comp2 (2500ms), comp3 (3500ms)
        // Wait 3500ms for last competitor + 3000ms to view = 6500ms total
        await new Promise(resolve => setTimeout(resolve, 6500));

        // Step 2: Analyze Google Business Profile
        await updateProgress(audit, 2, 'Analyse des Google Business Profils...');

        const googleProfileScore = scoringService.scoreGoogleBusinessProfile(placeDetails);

        // Extra delay for Step 2 animation
        // Photos appear: 1st (500ms), 2nd (800ms), ..., 6th (2000ms)
        // Wait 2000ms for last photo + 3000ms to view = 5000ms total
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Step 3: Analyze reviews
        console.log('🔍 Step 3: Starting review analysis...');
        await updateProgress(audit, 3, 'Bewertungen und Antworten analysieren...');
        console.log('✅ Step 3: Progress updated, calculating score...');

        const reviewScore = scoringService.scoreReviewSentiment(placeDetails, competitors);
        console.log('✅ Step 3 completed: Review score calculated:', reviewScore.score);

        // Extra delay for Step 3 animation (review bubbles)
        console.log('⏳ Step 3: Waiting 3500ms for animation...');
        await new Promise(resolve => setTimeout(resolve, 3500));
        console.log('✅ Step 3 animation delay done, moving to Step 4');

        // Step 4: Screenshot + SEO analysis (Fast alternative to PageSpeed)
        console.log('🚀 Starting Step 4...');

        // IMPORTANT: Prepare screenshot BEFORE updating progress!
        let clickToCallCheck = { hasClickToCall: false };
        let seoData = null;
        let websiteScreenshot = null;
        let pageSpeedData = {
            desktop: { metrics: {}, checks: {} },
            mobile: { metrics: {}, checks: {} }
        };

        if (placeDetails.website) {
            console.log('📝 Step 4: Website found, taking screenshots BEFORE progress update:', placeDetails.website);

            // Take website screenshots (desktop + mobile) FIRST (before progress update)
            try {
                console.log(`📸 Starting desktop & mobile screenshots for ${placeDetails.website}...`);

                const screenshots = await screenshotService.takeMultipleScreenshots(placeDetails.website);

                if (screenshots.desktop || screenshots.mobile) {
                    if (screenshots.desktop) {
                        console.log(`✅ Desktop screenshot captured (type: ${screenshots.desktop.type})`);
                    }
                    if (screenshots.mobile) {
                        console.log(`✅ Mobile screenshot captured (type: ${screenshots.mobile.type})`);
                    }

                    // Update audit with screenshots immediately
                    audit.rawData = {
                        ...audit.rawData,
                        websiteScreenshot: screenshots.desktop, // Legacy field for backwards compatibility
                        websiteScreenshotDesktop: screenshots.desktop,
                        websiteScreenshotMobile: screenshots.mobile
                    };

                    // Save to database
                    await audit.save();
                    console.log('💾 Screenshots saved to database BEFORE progress update');

                    // Verify it was saved
                    await audit.reload();
                    console.log('🔍 Verification - Screenshots in DB:', {
                        desktop: !!audit.rawData?.websiteScreenshotDesktop,
                        mobile: !!audit.rawData?.websiteScreenshotMobile
                    });
                } else {
                    console.warn('⚠️ Screenshot service returned null for both desktop and mobile');
                }
            } catch (error) {
                console.error('❌ Screenshots failed:', error.message);
                // Continue without screenshots - not critical for audit completion
            }
        } else {
            console.log('⚠️ Step 4: No website found');
        }

        // NOW update progress - screenshot is already saved!
        await updateProgress(audit, 4, 'Website & SEO analysieren...');
        console.log('✅ Step 4: Progress updated (screenshot already in DB)');

        // Extra delay to ensure frontend sees Step 4
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (placeDetails.website) {

            // SEO Analysis TEMPORARILY DISABLED (causes 3-10 second delays)
            // try {
            //     seoData = await seoAnalysis.analyzeWebsite(
            //         placeDetails.website,
            //         placeDetails.name,
            //         placeDetails.city
            //     );
            //     console.log(`SEO Score: ${seoData.score}/100, Issues: ${seoData.issues.length}`);
            // } catch (error) {
            //     console.error('SEO analysis failed:', error);
            // }

            // Optional: PageSpeed (only if needed for scoring)
            // DISABLED by default - too slow (30-60 seconds)
            // Uncomment if you need detailed performance metrics:
            // try {
            //     pageSpeedData = await retryApiCall(
            //         () => pageSpeed.analyzeAll(placeDetails.website),
            //         { maxRetries: 2 }
            //     );
            // } catch (error) {
            //     console.error('PageSpeed analysis failed:', error);
            // }

            // Check click-to-call TEMPORARILY DISABLED (10 second timeout)
            // try {
            //     clickToCallCheck = await socialMedia.checkClickToCall(
            //         placeDetails.website,
            //         placeDetails.phone
            //     );
            // } catch (error) {
            //     console.error('Click-to-call check failed:', error);
            // }
        }

        console.log('🔢 Step 4: Calculating website score...');
        const websiteScore = scoringService.scoreWebsitePerformance(
            pageSpeedData,
            placeDetails,
            clickToCallCheck,
            competitors
        );

        // Extra delay for Step 4 animation (website speed gauge)
        await new Promise(resolve => setTimeout(resolve, 4000));

        // Step 5: Mobile experience
        await updateProgress(audit, 5, 'Mobile Benutzererfahrung prüfen...');

        const mobileScore = scoringService.scoreMobileExperience(
            pageSpeedData,
            clickToCallCheck,
            placeDetails
        );

        // Extra delay for Step 5 animation
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Step 6: Social media presence
        await updateProgress(audit, 6, 'Social Media Präsenz analysieren...');

        let socialProfiles = { instagram: null, tiktok: null };
        // TEMPORARILY DISABLED - social media search can take 10+ seconds
        // try {
        //     socialProfiles = await socialMedia.findProfiles(
        //         placeDetails.name,
        //         placeDetails.city,
        //         placeDetails.website
        //     );
        // } catch (error) {
        //     console.error('Social media analysis failed:', error);
        // }

        const socialScore = scoringService.scoreSocialMediaPresence(socialProfiles);

        // Extra delay for Step 6 animation
        await new Promise(resolve => setTimeout(resolve, 3500));

        // Step 7: Competitor analysis
        await updateProgress(audit, 7, 'Marktposition berechnen...');

        const competitorScore = scoringService.scoreCompetitorAnalysis(
            placeDetails,
            competitors
        );

        // Extra delay for Step 7 animation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Calculate overall score
        const moduleScores = {
            googleBusinessProfile: googleProfileScore.score,
            reviewSentiment: reviewScore.score,
            websitePerformance: websiteScore.score,
            mobileExperience: mobileScore.score,
            socialMediaPresence: socialScore.score,
            competitorAnalysis: competitorScore.score
        };

        const totalScore = scoringService.calculateOverallScore(moduleScores);

        // Identify top issues
        const topIssues = scoringService.identifyTopIssues({
            googleBusinessProfile: googleProfileScore,
            reviewSentiment: reviewScore,
            websitePerformance: websiteScore,
            mobileExperience: mobileScore,
            socialMediaPresence: socialScore,
            competitorAnalysis: competitorScore
        });

        // Get industry benchmark
        const industryBenchmark = scoringService.getIndustryBenchmark(
            placeDetails.businessType,
            placeDetails.city
        );

        // Update audit with results
        await audit.update({
            totalScore: totalScore,
            scores: {
                googleBusinessProfile: googleProfileScore,
                reviewSentiment: reviewScore,
                websitePerformance: websiteScore,
                mobileExperience: mobileScore,
                socialMediaPresence: socialScore,
                competitorAnalysis: competitorScore
            },
            topIssues: topIssues,
            industryBenchmark: industryBenchmark,
            rawData: {
                ...audit.rawData, // Keep existing placeDetails from Step 2
                websiteScreenshot: websiteScreenshot, // may be null if disabled
                pageSpeedData: pageSpeedData, // include defaults or collected data
                seoAnalysis: seoData, // Add SEO analysis results
                socialProfiles: socialProfiles,
                competitors: competitors // Add competitors for map
            },
            status: 'completed',
            completedAt: new Date()
        });

        // Reload audit to get updated data
        await audit.reload();

        // Cache the result
        cacheService.setAudit(placeDetails.placeId, audit.get({ plain: true }));

        console.log(`✅ Audit completed for ${placeDetails.name}: ${totalScore}/100`);

    } catch (error) {
        console.error('Audit processing error:', error);
        await audit.update({
            status: 'failed',
            progress: {
                ...audit.progress,
                currentStep: `Fehler: ${error.message}`
            }
        });
    }
}

/**
 * Update audit progress
 */
async function updateProgress(audit, step, message) {
    await audit.update({
        progress: {
            current: step,
            total: 7,
            currentStep: message
        }
    });
    console.log(`[${audit.businessName}] Step ${step}/7: ${message}`);

    // Short delay to ensure database update is complete
    await new Promise(resolve => setTimeout(resolve, 200));
}

module.exports = router;
