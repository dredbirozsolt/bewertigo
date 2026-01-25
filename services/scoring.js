const {
    SCORING_WEIGHTS,
    THRESHOLDS,
    INDUSTRY_BENCHMARKS,
    ESTIMATED_LOSS_MESSAGES,
    ISSUE_IMPACT_MAP
} = require('../config/constants');

class ScoringService {
    /**
     * Calculate overall score from all modules
     */
    calculateOverallScore(moduleScores) {
        const totalScore =
            moduleScores.googleBusinessProfile +
            moduleScores.reviewSentiment +
            moduleScores.websitePerformance +
            moduleScores.mobileExperience +
            moduleScores.socialMediaPresence +
            moduleScores.competitorAnalysis;

        return Math.min(Math.round(totalScore * 10) / 10, 100);
    }

    /**
     * Module 1: Google Business Profile (16.6 points)
     */
    scoreGoogleBusinessProfile(placeDetails) {
        let score = 0;
        const issues = [];
        const details = {
            hasOpeningHours: false,
            hasPhone: false,
            hasWebsite: false,
            hasDescription: false,
            descriptionLength: 0,
            hasCategories: false,
            issues: []
        };

        // Basic data (8.3 points total)
        const basicDataPoints = 8.3 / 4; // Split among 4 checks

        // Opening hours
        if (placeDetails.openingHours) {
            score += basicDataPoints;
            details.hasOpeningHours = true;
        } else {
            issues.push('Keine Öffnungszeiten hinterlegt');
        }

        // Phone number
        if (placeDetails.phone) {
            score += basicDataPoints;
            details.hasPhone = true;
        } else {
            issues.push('Keine Telefonnummer angegeben');
        }

        // Categories
        if (placeDetails.types && placeDetails.types.length > 0) {
            score += basicDataPoints;
            details.hasCategories = true;
        } else {
            issues.push('Kategorie nicht vollständig');
        }

        // Description check (Google doesn't provide this directly, placeholder)
        // In production, you might need to scrape Google Maps page
        details.hasDescription = false;
        issues.push('Beschreibung fehlt oder zu kurz (< 250 Zeichen)');

        // Profile completeness (8.3 points total)
        const completenessPoints = 8.3 / 2;

        // Website link
        if (placeDetails.website) {
            score += completenessPoints;
            details.hasWebsite = true;
        } else {
            issues.push('Keine Website hinterlegt - Sie existieren digital nicht!');
        }

        // Services/Products (placeholder - Google API doesn't always provide this)
        // In production, check if business has products/services listed
        issues.push('Dienstleistungen/Produkte nicht aufgelistet');

        details.issues = issues;
        return {
            score: Math.min(Math.round(score * 10) / 10, SCORING_WEIGHTS.googleBusinessProfile),
            details
        };
    }

    /**
     * Module 2: Review Sentiment & Response (16.6 points)
     */
    scoreReviewSentiment(placeDetails, competitors = []) {
        let score = 0;
        const issues = [];
        const rating = placeDetails.rating || 0;
        const totalReviews = placeDetails.totalReviews || 0;
        const reviews = placeDetails.reviews || [];

        // Rating score (8.3 points)
        if (rating >= THRESHOLDS.excellentRating) {
            score += 8.3;
        } else if (rating >= THRESHOLDS.goodRating) {
            score += 5;
            issues.push(`Bewertung ${rating} unter 4.5 Sternen - Vertrauensverlust!`);
        } else if (rating >= THRESHOLDS.fairRating) {
            score += 2;
            issues.push(`Bewertung ${rating} deutlich unter dem Optimum`);
        } else if (rating > 0) {
            issues.push(`Kritische Bewertung ${rating} - Dringender Handlungsbedarf!`);
        } else {
            issues.push('Keine Bewertungen vorhanden');
        }

        // Review count score (8.3 points)
        // More reviews = better, with diminishing returns
        if (totalReviews >= 100) {
            score += 8.3;
        } else if (totalReviews >= 50) {
            score += 6;
        } else if (totalReviews >= 20) {
            score += 4;
            issues.push('Wenige Bewertungen - Aktives Bewertungsmanagement empfohlen');
        } else if (totalReviews >= 5) {
            score += 2;
            issues.push('Sehr wenige Bewertungen - Vertrauen aufbauen durch mehr Rezensionen');
        } else {
            issues.push('Keine oder fast keine Bewertungen vorhanden');
        }

        return {
            score: Math.min(Math.max(score, 0), SCORING_WEIGHTS.reviewSentiment),
            details: {
                rating,
                totalReviews,
                issues
            }
        };
    }

    /**
     * Module 3: Website Performance & Photos (16.6 points)
     */
    scoreWebsitePerformance(pageSpeedData, placeDetails, clickToCallCheck, competitors = []) {
        let score = 0;
        const issues = [];

        // Desktop LCP (12.6 points)
        const desktopLCP = pageSpeedData?.desktop?.metrics?.lcp;

        if (desktopLCP === null || desktopLCP === undefined) {
            issues.push('Website-Geschwindigkeit konnte nicht gemessen werden');
        } else if (desktopLCP <= THRESHOLDS.desktopLcpExcellent) {
            score += 12.6;
        } else if (desktopLCP <= THRESHOLDS.desktopLcpGood) {
            score += 8;
            issues.push(`Desktop Ladezeit ${desktopLCP}s - Kann verbessert werden`);
        } else {
            score += 3;
            issues.push(`Kritische Desktop Ladezeit ${desktopLCP}s - Sie verlieren 7% Conversion pro Sekunde!`);
        }

        // Visual content (4 points) - basic check only
        const photoCount = placeDetails.photoCount || placeDetails.photos?.length || 0;
        const hasHighQualityPhotos = photoCount >= THRESHOLDS.minPhotos;

        if (hasHighQualityPhotos) {
            score += 4;
        } else {
            issues.push(`Nur ${photoCount} Fotos - Minimum 5 hochwertige Bilder empfohlen`);
        }

        // Click-to-call check (penalty)
        const hasClickToCall = clickToCallCheck?.hasClickToCall || false;
        if (!hasClickToCall && placeDetails.website) {
            score -= 3;
            issues.push('Keine Click-to-Call Funktion - Mobile Nutzer können nicht direkt anrufen!');
        }

        return {
            score: Math.min(Math.max(score, 0), SCORING_WEIGHTS.websitePerformance),
            details: {
                desktopLCP,
                hasHighQualityPhotos,
                photoCount,
                hasClickToCall,
                issues
            }
        };
    }

    /**
     * Module 4: Mobile Experience & UI/UX (16.6 points)
     */
    scoreMobileExperience(pageSpeedData, clickToCallCheck, placeDetails) {
        let score = 0;
        const issues = [];
        const hasWebsite = placeDetails?.website ? true : false;

        // Mobile LCP (8.3 points)
        const mobileLCP = pageSpeedData?.mobile?.metrics?.lcp;

        if (mobileLCP === null || mobileLCP === undefined) {
            if (hasWebsite) {
                issues.push('Mobile Geschwindigkeit konnte nicht gemessen werden');
            } else {
                // No website = critical issue, but give base 2 points for having Google Business profile
                score += 2;
                issues.push('Keine Website - Sie verlieren 80% der mobilen Kunden!');
            }
        } else if (mobileLCP <= THRESHOLDS.mobileLcpExcellent) {
            score += 8.3;
        } else if (mobileLCP <= THRESHOLDS.mobileLcpGood) {
            score += 5;
            issues.push(`Mobile Ladezeit ${mobileLCP}s - 80% der Suchen erfolgen mobil!`);
        } else {
            score += 2;
            issues.push(`Kritische Mobile Ladezeit ${mobileLCP}s - Sie verlieren mobile Kunden!`);
        }

        // UI/UX Design (8.3 points)
        const checks = pageSpeedData?.mobile?.checks || {};
        const cls = pageSpeedData?.mobile?.metrics?.cls;

        let uiScore = 0;
        const maxUIScore = 8.3;
        const checkWeight = maxUIScore / 4;

        if (hasWebsite) {
            // SSL
            if (checks.usesHttps) {
                uiScore += checkWeight;
            } else {
                issues.push('Keine HTTPS Verschlüsselung - Unsicher!');
            }

            // CLS (Layout Stability)
            if (cls !== null && cls < 0.1) {
                uiScore += checkWeight;
            } else if (cls !== null) {
                issues.push('Instabile Seitenlayout - Elemente springen beim Laden');
            }

            // Font size
            if (checks.fontSizeOk) {
                uiScore += checkWeight;
            } else {
                issues.push('Schrift zu klein - Unleserlich auf mobilen Geräten');
            }

            // Tap targets
            if (checks.tapTargetsOk) {
                uiScore += checkWeight;
            } else {
                issues.push('Buttons zu klein - Schwer klickbar auf Smartphones');
            }
        } else {
            // No website = give minimal UI score (phone number visible on Google)
            if (placeDetails?.phone) {
                uiScore += 2; // Partial credit for having a phone number
            }
            issues.push('Keine mobile Website - Kunden können Ihr Angebot nicht online sehen');
        }

        score += uiScore;

        // Click-to-call penalty (only if website exists but no click-to-call)
        const hasClickToCall = clickToCallCheck?.hasClickToCall || false;
        if (hasWebsite && !hasClickToCall) {
            score -= 3;
            issues.push('Fehlende Click-to-Call Funktion kostet Sie direkte Kundenanfragen!');
        }

        return {
            score: Math.min(Math.max(score, 0), SCORING_WEIGHTS.mobileExperience),
            details: {
                mobileLCP,
                cls,
                hasSSL: checks.usesHttps,
                hasClickToCall,
                hasMobileFriendlyUI: checks.fontSizeOk && checks.tapTargetsOk,
                issues
            }
        };
    }

    /**
     * Module 5: Social Media Presence (16.6 points)
     */
    scoreSocialMediaPresence(socialProfiles) {
        let score = 0;
        const issues = [];

        // Availability and follower count (8.3 points)
        let availabilityScore = 0;
        const hasInstagram = socialProfiles.instagram !== null;
        const hasTikTok = socialProfiles.tiktok !== null;

        if (!hasInstagram && !hasTikTok) {
            issues.push('Keine Social Media Präsenz - Sie existieren für die neue Generation nicht!');
            return {
                score: 0,
                details: {
                    hasInstagram: false,
                    hasTikTok: false,
                    instagramFollowers: 0,
                    tiktokFollowers: 0,
                    instagramEngagement: 0,
                    tiktokEngagement: 0,
                    lastPostDate: null,
                    isActive: false,
                    issues
                }
            };
        }

        // Instagram scoring
        const instagramData = socialProfiles.instagramData;
        if (hasInstagram && instagramData) {
            availabilityScore += 4.15;

            if (instagramData.followers >= THRESHOLDS.minFollowers) {
                availabilityScore += 2;
            }
        } else if (hasInstagram) {
            availabilityScore += 2;
            issues.push('Instagram Profil gefunden, aber Daten nicht abrufbar');
        } else if (socialProfiles.sources.instagram === null) {
            issues.push('Instagram Profil nicht auf Website verlinkt - Chance verpasst!');
        }

        // TikTok scoring
        const tiktokData = socialProfiles.tiktokData;
        if (hasTikTok && tiktokData) {
            availabilityScore += 4.15;

            if (tiktokData.followers >= THRESHOLDS.minFollowers) {
                availabilityScore += 2;
            }
        } else if (hasTikTok) {
            availabilityScore += 2;
            issues.push('TikTok Profil gefunden, aber Daten nicht abrufbar');
        } else if (socialProfiles.sources.tiktok === null) {
            issues.push('TikTok Profil nicht gefunden - Virale Reichweite ungenutzt!');
        }

        score += Math.min(availabilityScore, 8.3);

        // Engagement and activity (8.3 points)
        let engagementScore = 0;

        if (instagramData && instagramData.posts && instagramData.posts.length > 0) {
            // Check engagement rate
            if (instagramData.engagementRate >= THRESHOLDS.engagementRate) {
                engagementScore += 4.15;
            } else {
                engagementScore += 1;
                issues.push('Instagram: Niedrige Interaktionsrate - Content erreicht Zielgruppe nicht');
            }

            // Check activity
            if (instagramData.lastPostDate) {
                const daysSincePost = (new Date() - new Date(instagramData.lastPostDate)) / (1000 * 60 * 60 * 24);

                if (daysSincePost <= THRESHOLDS.inactivityDays) {
                    engagementScore += 2;
                } else {
                    issues.push(`Instagram inaktiv seit ${Math.round(daysSincePost)} Tagen - Wirkt wie geschlossenes Geschäft!`);
                }
            } else {
                engagementScore += 1; // Give partial credit if can't determine
            }
        }

        if (tiktokData && tiktokData.videos && tiktokData.videos.length > 0) {
            // Check average views
            const avgViews = tiktokData.averageViews || 0;
            const expectedViews = tiktokData.followers * THRESHOLDS.engagementRate;

            if (avgViews >= expectedViews) {
                engagementScore += 4.15;
            } else {
                engagementScore += 1;
                issues.push('TikTok: Niedrige Aufrufzahlen - Videos werden nicht gesehen');
            }

            // Check activity
            if (tiktokData.lastVideoDate) {
                const daysSinceVideo = (new Date() - new Date(tiktokData.lastVideoDate)) / (1000 * 60 * 60 * 24);

                if (daysSinceVideo <= THRESHOLDS.inactivityDays) {
                    engagementScore += 2;
                } else {
                    issues.push(`TikTok inaktiv seit ${Math.round(daysSinceVideo)} Tagen`);
                }
            } else {
                engagementScore += 1; // Give partial credit if can't determine
            }
        }

        score += Math.min(engagementScore, 8.3);

        return {
            score: Math.min(score, SCORING_WEIGHTS.socialMediaPresence),
            details: {
                hasInstagram,
                hasTikTok,
                instagramFollowers: instagramData?.followers || 0,
                tiktokFollowers: tiktokData?.followers || 0,
                instagramEngagement: instagramData?.engagementRate || 0,
                tiktokEngagement: tiktokData?.averageViews || 0,
                lastPostDate: instagramData?.lastPostDate || tiktokData?.lastVideoDate || null,
                isActive: instagramData?.isActive || tiktokData?.isActive || false,
                issues
            }
        };
    }

    /**
     * Module 6: Competitor Analysis (16.6 points)
     */
    scoreCompetitorAnalysis(businessData, competitors) {
        const issues = [];

        if (!competitors || competitors.length === 0) {
            issues.push('Keine Konkurrenten in der Nähe gefunden');
            return {
                score: SCORING_WEIGHTS.competitorAnalysis / 2, // Give half points
                details: {
                    rank: 0,
                    competitors: [],
                    issues
                }
            };
        }

        // Calculate business score for comparison
        const businessScore = this._calculateCompetitorScore(
            businessData.rating || 0,
            businessData.totalReviews || 0
        );

        // Calculate scores for all competitors
        const allBusinesses = [
            {
                name: businessData.name,
                rating: businessData.rating || 0,
                reviewCount: businessData.totalReviews || 0,
                score: businessScore,
                isSelf: true
            },
            ...competitors.map(comp => ({
                name: comp.name,
                rating: comp.rating,
                reviewCount: comp.reviewCount,
                distance: comp.distance,
                score: this._calculateCompetitorScore(comp.rating, comp.reviewCount),
                isSelf: false
            }))
        ];

        // Sort by score
        allBusinesses.sort((a, b) => b.score - a.score);

        // Find rank
        const rank = allBusinesses.findIndex(b => b.isSelf) + 1;

        // Score based on rank
        let score = 0;
        if (rank === 1) {
            score = SCORING_WEIGHTS.competitorAnalysis;
            issues.push('Marktführer in Ihrer Region - Position halten!');
        } else if (rank === 2) {
            score = SCORING_WEIGHTS.competitorAnalysis * 0.75;
            issues.push('2. Platz - Knapp am Spitzenplatz vorbei');
        } else if (rank === 3) {
            score = SCORING_WEIGHTS.competitorAnalysis * 0.5;
            issues.push('3. Platz - Sie verlieren Sichtbarkeit an die Konkurrenz');
        } else if (rank === 4) {
            score = SCORING_WEIGHTS.competitorAnalysis * 0.3;
            issues.push(`4. Platz - Ihre Top-Konkurrenten ziehen mehr Aufmerksamkeit auf sich`);
        } else {
            score = SCORING_WEIGHTS.competitorAnalysis * 0.15;
            issues.push(`Platz ${rank} von ${allBusinesses.length} - Ihre Konkurrenten dominieren den Markt!`);
        }

        return {
            score: Math.round(score * 10) / 10,
            details: {
                rank,
                competitors: allBusinesses.filter(b => !b.isSelf).slice(0, 3),
                issues
            }
        };
    }

    /**
     * Calculate competitor comparison score
     */
    _calculateCompetitorScore(rating, reviewCount) {
        // Weight: 70% rating, 30% review count (normalized)
        const ratingScore = (rating / 5) * 70;
        const reviewScore = Math.min((reviewCount / 100) * 30, 30); // Cap at 100 reviews
        return ratingScore + reviewScore;
    }

    /**
     * Identify top issues for PDF
     */
    identifyTopIssues(scores) {
        const allIssues = [];

        // Collect all issues with their module and score
        Object.entries(scores).forEach(([module, data]) => {
            if (data.details && data.details.issues) {
                data.details.issues.forEach(issue => {
                    allIssues.push({
                        module,
                        score: data.score,
                        severity: this._calculateSeverity(data.score, SCORING_WEIGHTS[module]),
                        message: issue,
                        estimatedLoss: this._getIssueImpact(issue, module)
                    });
                });
            }
        });

        // Sort by severity (lowest score = highest severity)
        allIssues.sort((a, b) => a.score - b.score);

        // Return all issues (max 8 to keep it manageable)
        return allIssues.slice(0, 8);
    }

    /**
     * Get issue-specific impact message
     */
    _getIssueImpact(issueMessage, module) {
        // Try to find a specific impact message based on keywords
        for (const [keyword, impact] of Object.entries(ISSUE_IMPACT_MAP)) {
            if (issueMessage.includes(keyword)) {
                return impact;
            }
        }

        // Fallback to module-level message
        return ESTIMATED_LOSS_MESSAGES[module] || 'Dieses Problem beeinträchtigt Ihre Online-Sichtbarkeit und kostet Sie potenzielle Kunden.';
    }

    /**
     * Calculate issue severity
     */
    _calculateSeverity(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        if (percentage < 30) return 'critical';
        if (percentage < 60) return 'high';
        if (percentage < 80) return 'medium';
        return 'low';
    }

    /**
     * Get industry benchmark
     */
    getIndustryBenchmark(businessType, city = '') {
        // For now, use static benchmarks
        // Later, calculate from database when we have 100+ audits per category
        const category = businessType.toLowerCase().replace(/ /g, '_');
        const averageScore = INDUSTRY_BENCHMARKS[category] || INDUSTRY_BENCHMARKS.default;

        return {
            averageScore,
            category: businessType,
            city,
            source: 'static' // Change to 'dynamic' when using real data
        };
    }
}

module.exports = new ScoringService();
