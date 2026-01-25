// API Base URL
const API_BASE = window.location.origin + '/api';

// Global state
let currentAuditId = null;
let pollInterval = null;
let googleMapsLoaded = false;
let googleMapsLoading = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initAutocomplete();
    initEventListeners();
});

/**
 * Load Google Maps API dynamically
 */
function loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
        if (googleMapsLoaded) {
            resolve();
            return;
        }

        if (googleMapsLoading) {
            // Wait for existing load
            const checkInterval = setInterval(() => {
                if (googleMapsLoaded) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            return;
        }

        googleMapsLoading = true;

        // Fetch API key from backend
        fetch(`${API_BASE}/config/maps-key`)
            .then(res => res.json())
            .then(data => {
                if (!data.success || !data.apiKey) {
                    throw new Error('Maps API key not available');
                }

                // Global callback for async Maps API
                window.initGoogleMaps = () => {
                    googleMapsLoaded = true;
                    googleMapsLoading = false;
                    resolve();
                };

                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&loading=async&callback=initGoogleMaps&libraries=marker`;
                script.async = true;
                script.defer = true;

                script.onerror = () => {
                    googleMapsLoading = false;
                    reject(new Error('Failed to load Google Maps'));
                };

                document.head.appendChild(script);
            })
            .catch(err => {
                googleMapsLoading = false;
                reject(err);
            });
    });
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Unlock button
    const unlockBtn = document.getElementById('unlock-btn');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', showLeadForm);
    }

    // Modal close button
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeLeadForm);
    }

    // Close modal on outside click
    const modal = document.getElementById('lead-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLeadForm();
            }
        });
    }

    // Lead form submit
    const leadForm = document.getElementById('lead-form');
    if (leadForm) {
        leadForm.addEventListener('submit', submitLead);
    }

    // Social media button
    const addSocialBtn = document.getElementById('add-social-btn');
    if (addSocialBtn) {
        addSocialBtn.addEventListener('click', showSocialModal);
    }

    // Social modal close button
    const socialModalCloseBtn = document.getElementById('social-modal-close-btn');
    if (socialModalCloseBtn) {
        socialModalCloseBtn.addEventListener('click', closeSocialModal);
    }

    // Close social modal on outside click
    const socialModal = document.getElementById('social-modal');
    if (socialModal) {
        socialModal.addEventListener('click', (e) => {
            if (e.target === socialModal) {
                closeSocialModal();
            }
        });
    }

    // Social form submit
    const socialForm = document.getElementById('social-form');
    if (socialForm) {
        socialForm.addEventListener('submit', submitSocialLinks);
    }
}

/**
 * Initialize autocomplete functionality
 */
function initAutocomplete() {
    const searchInput = document.getElementById('businessSearch');
    const autocompleteDiv = document.getElementById('autocomplete');
    let debounceTimer;
    let lastQuery = '';
    let cachedResults = {};

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 4) { // Increased from 3 to 4
            autocompleteDiv.classList.remove('show');
            return;
        }

        // Don't search again if query hasn't changed
        if (query === lastQuery) {
            return;
        }

        // Check cache first
        if (cachedResults[query]) {
            renderAutocomplete(cachedResults[query]);
            return;
        }

        // Debounce API calls - increased delay to reduce API usage
        debounceTimer = setTimeout(async () => {
            try {
                lastQuery = query;
                const response = await fetch(`${API_BASE}/audit/autocomplete?input=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.success && data.predictions.length > 0) {
                    cachedResults[query] = data.predictions; // Cache results
                    renderAutocomplete(data.predictions);
                } else {
                    autocompleteDiv.classList.remove('show');
                }
            } catch (error) {
                console.error('Autocomplete error:', error);
                // Show user-friendly error for rate limiting
                if (error.message && error.message.includes('429')) {
                    autocompleteDiv.innerHTML = '<div class="autocomplete-item" style="color: #ef4444;">⚠️ Zu viele Anfragen - Bitte langsamer tippen</div>';
                    autocompleteDiv.classList.add('show');
                }
            }
        }, 800); // Increased from 300ms to 800ms
    });

    // Close autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteDiv.contains(e.target)) {
            autocompleteDiv.classList.remove('show');
        }
    });
}

/**
 * Render autocomplete results
 */
function renderAutocomplete(predictions) {
    const autocompleteDiv = document.getElementById('autocomplete');

    autocompleteDiv.innerHTML = predictions.map(pred => `
        <div class="autocomplete-item" data-place-id="${pred.placeId}">
            <div class="autocomplete-main">${pred.mainText}</div>
            <div class="autocomplete-secondary">${pred.secondaryText}</div>
        </div>
    `).join('');

    // Add click handlers
    autocompleteDiv.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            const placeId = item.dataset.placeId;
            const businessName = item.querySelector('.autocomplete-main').textContent;
            startAudit(placeId, businessName);
        });
    });

    autocompleteDiv.classList.add('show');
}

/**
 * Start audit for selected business
 */
async function startAudit(placeId, businessName) {
    try {
        // Hide hero, show scanning
        document.getElementById('hero').style.display = 'none';
        document.getElementById('scanning').style.display = 'block';
        document.getElementById('scanning-business-name').textContent = businessName;

        // Start audit
        const response = await fetch(`${API_BASE}/audit/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ placeId })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        currentAuditId = data.auditId;

        if (data.cached) {
            // If cached, jump directly to results
            setTimeout(() => {
                showResults();
            }, 2000);
        } else {
            // Poll for progress
            startProgressPolling();
        }

    } catch (error) {
        console.error('Start audit error:', error);
        alert('Fehler beim Starten der Analyse. Bitte versuchen Sie es erneut.');
        location.reload();
    }
}

/**
 * Poll audit progress
 */
function startProgressPolling() {
    let currentStep = 0;
    let animationDelay = 0; // Add delay for animations to be visible

    pollInterval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/audit/status/${currentAuditId}`);
            const data = await response.json();

            if (!data.success) {
                clearInterval(pollInterval);
                return;
            }

            const audit = data.audit;
            console.log(`📊 Poll: Step ${audit.progress.current}/${audit.progress.total} - Status: ${audit.status}`);

            // Update progress (with delay for animations)
            if (audit.progress.current > currentStep) {
                const newStep = audit.progress.current;

                // Set minimal delay for all steps
                animationDelay = 500;

                // Update currentStep IMMEDIATELY to prevent re-triggering
                currentStep = newStep;

                // Wait for current animation to finish before moving to next
                setTimeout(() => {
                    // Fetch full audit data for animations (photos, etc.)
                    fetchAuditDataForAnimation(currentStep);
                    updateChecklistProgress(currentStep, audit.progress.currentStep);
                }, animationDelay);
            }

            // If completed, show results
            if (audit.status === 'completed') {
                clearInterval(pollInterval);
                setTimeout(() => {
                    showResults();
                }, 2000);
            } else if (audit.status === 'failed') {
                clearInterval(pollInterval);
                alert('Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.');
                location.reload();
            }

        } catch (error) {
            console.error('Progress polling error:', error);
        }
    }, 1000); // Poll every 1 second (faster to catch all steps)
}

/**
 * Fetch audit data for animations
 */
let screenshotPromise = null; // Store screenshot fetch promise

async function fetchAuditDataForAnimation(step) {
    try {
        // SCREENSHOT PREFETCH DISABLED - screenshot generation is disabled on backend
        // At step 3, start prefetching screenshot in background
        // if (step === 3) {
        //     console.log('⏳ Pre-fetching screenshot in background...');
        //     screenshotPromise = prefetchScreenshot();
        // }

        // For step 4 (website screenshot), wait for the prefetched screenshot
        // if (step === 4) {
        //     if (screenshotPromise) {
        //         console.log('⏳ Waiting for pre-fetched screenshot...');
        //         const screenshotData = await screenshotPromise;

        //         if (screenshotData && screenshotData.audit?.rawData?.websiteScreenshot) {
        //             console.log(`✅ Screenshot ready!`);
        //             if (typeof showVisualFeedback === 'function') {
        //                 showVisualFeedback(step, screenshotData.audit);
        //             }
        //             screenshotPromise = null; // Clear promise
        //             return;
        //         }
        //     }
        // }

        const response = await fetch(`${API_BASE}/audit/status/${currentAuditId}`);
        const data = await response.json();

        if (data.success && data.audit) {
            const screenshot = data.audit.rawData?.websiteScreenshot;
            const screenshotPreview = screenshot
                ? (typeof screenshot === 'string' ? screenshot.substring(0, 50) + '...' : 'iframe-object')
                : 'none';

            console.log(`📊 Fetched audit data for step ${step}:`, {
                hasRawData: !!data.audit.rawData,
                hasScreenshot: !!screenshot,
                screenshotPreview: screenshotPreview
            });

            // Call animation with full audit data
            if (typeof showVisualFeedback === 'function') {
                showVisualFeedback(step, data.audit);
            }
        } else {
            // Fallback to animation without data
            if (typeof showVisualFeedback === 'function') {
                showVisualFeedback(step);
            }
        }
    } catch (error) {
        console.error('❌ Fetch audit data error:', error);
        // Fallback to animation without data
        if (typeof showVisualFeedback === 'function') {
            showVisualFeedback(step);
        }
    }
}

/**
 * Prefetch screenshot in background during step 3
 */
async function prefetchScreenshot() {
    // Poll every 3 seconds up to 12 times (36 seconds total)
    for (let i = 0; i < 12; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            const response = await fetch(`${API_BASE}/audit/status/${currentAuditId}`);
            const data = await response.json();

            if (data.success && data.audit?.rawData?.websiteScreenshot) {
                console.log(`✅ Screenshot pre-fetched successfully after ${(i + 1) * 3}s`);
                return data;
            }

            console.log(`⏳ Polling for screenshot... (${i + 1}/12)`);
        } catch (error) {
            console.error('Screenshot prefetch error:', error);
        }
    }

    console.warn('⚠️ Screenshot prefetch timeout after 36s');
    return null;
}

/**
 * Update checklist progress
 */
function updateChecklistProgress(step, message) {
    // Mark current step as completed
    if (step > 0) {
        const prevItem = document.querySelector(`.checklist-item[data-step="${step - 1}"]`);
        if (prevItem) {
            prevItem.classList.remove('processing');
            prevItem.classList.add('completed');
        }
    }

    // Mark current step as processing
    const currentItem = document.querySelector(`.checklist-item[data-step="${step}"]`);
    if (currentItem) {
        currentItem.classList.add('processing');
        // Update message if needed
        const p = currentItem.querySelector('p');
        if (p && message) {
            p.textContent = message;
        }
    }

    // Note: Animation is triggered by fetchAuditDataForAnimation (not here)
}

/**
 * Show results section
 */
async function showResults() {
    try {
        // Fetch full results
        const response = await fetch(`${API_BASE}/audit/result/${currentAuditId}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        const audit = data.audit;

        // Hide scanning, show results
        document.getElementById('scanning').style.display = 'none';
        document.getElementById('results').style.display = 'block';

        // Populate results
        document.getElementById('business-name-result').textContent = audit.businessName;

        // Animate score
        animateScore(audit.totalScore);

        // Update module scores
        updateModuleScores(audit.moduleScores);

        // Check for no-website alert
        if (audit.rawData?.placeDetails && !audit.rawData.placeDetails.website) {
            showNoWebsiteAlert();
        }

        // Show/hide unlock CTA based on unlock status
        if (audit.isUnlocked) {
            document.getElementById('unlock-cta').style.display = 'none';
            document.getElementById('modules-grid').classList.remove('blurred');

            // Show detailed results
            renderDetailedResults(audit);
        } else {
            document.getElementById('unlock-cta').style.display = 'block';
            document.getElementById('modules-grid').classList.add('blurred');
        }

    } catch (error) {
        console.error('Show results error:', error);
        alert('Fehler beim Laden der Ergebnisse.');
    }
}

/**
 * Animate score circle
 */
function animateScore(score) {
    const scoreElement = document.getElementById('total-score');
    const progressCircle = document.getElementById('score-ring-progress');
    const statusElement = document.getElementById('score-status');

    // Calculate circumference and offset
    const radius = 85; // Match SVG radius
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    // Set color based on score
    let color, status;
    if (score >= 80) {
        color = '#10b981';
        status = 'Ausgezeichnet';
    } else if (score >= 60) {
        color = '#f59e0b';
        status = 'Gut';
    } else if (score >= 40) {
        color = '#f97316';
        status = 'Verbesserungsbedarf';
    } else {
        color = '#ef4444';
        status = 'Kritisch';
    }

    // Set initial state (full circle = empty progress)
    progressCircle.style.strokeDashoffset = circumference;
    progressCircle.style.stroke = color;

    // Trigger animation after a brief delay (allows CSS transition to work)
    setTimeout(() => {
        progressCircle.style.strokeDashoffset = offset;
    }, 100);

    // Animate number
    let current = 0;
    const increment = score / 100; // 100 frames over 2 seconds
    const timer = setInterval(() => {
        current += increment;
        if (current >= score) {
            current = score;
            clearInterval(timer);
        }
        scoreElement.textContent = Math.round(current);
    }, 20);

    statusElement.textContent = status;
    statusElement.style.color = color;
}

/**
 * Update module scores
 */
function updateModuleScores(scores) {
    Object.entries(scores).forEach(([module, score]) => {
        const card = document.querySelector(`.module-card[data-module="${module}"]`);
        if (card) {
            const valueElement = card.querySelector('.score-value');
            const colorElement = card.querySelector('.score-color');

            valueElement.textContent = Math.round(score);

            // Set color indicator
            if (score >= 13) { // >= 80% of 16.6
                colorElement.className = 'score-color green';
            } else if (score >= 8) { // >= 50% of 16.6
                colorElement.className = 'score-color yellow';
            } else {
                colorElement.className = 'score-color red';
            }
        }
    });
}

/**
 * Render detailed results (after unlock)
 */
function renderDetailedResults(audit) {
    const detailedDiv = document.getElementById('detailed-results');

    if (!audit.scores || !audit.topIssues) {
        return;
    }

    // DEBUG: Log competitor data
    console.log('🗺️ Competitor Debug:', {
        hasRawData: !!audit.rawData,
        hasCompetitors: !!audit.rawData?.competitors,
        competitorsLength: audit.rawData?.competitors?.length,
        competitors: audit.rawData?.competitors
    });

    // Show competitor map if available
    let html = '';
    if (audit.rawData?.competitors?.length > 0) {
        html += `
            <div class="competitor-map-section">
                <h2>🗺️ Ihre Wettbewerbsposition</h2>
                <p class="map-description">Ihre ${audit.rawData.competitors.length} nächsten Konkurrenten in einem 3 km Radius</p>
                <div class="map-container">
                    <div id="competitor-map" class="competitor-map"></div>
                </div>
            </div>
        `;
    }

    // Google Business Profile Details
    if (audit.rawData?.placeDetails) {
        const place = audit.rawData.placeDetails;
        html += `
            <div class="info-section">
                <h2>📍 Google Business Profile</h2>
                <div class="info-grid">
                    <div class="info-item"><strong>Name:</strong> ${place.name || 'N/A'}</div>
                    <div class="info-item"><strong>Typ:</strong> ${place.businessType || 'N/A'}</div>
                    <div class="info-item"><strong>Adresse:</strong> ${place.address || 'N/A'}</div>
                    <div class="info-item"><strong>Telefon:</strong> ${place.phone || 'Nicht hinterlegt'}</div>
                    <div class="info-item"><strong>Website:</strong> ${place.website ? `<a href="${place.website}" target="_blank">Zur Website</a>` : 'Nicht hinterlegt'}</div>
                    <div class="info-item"><strong>Bewertung:</strong> ${place.rating ? `${place.rating} ⭐ (${place.reviewCount || 0} Bewertungen)` : 'Keine Bewertungen'}</div>
                    <div class="info-item"><strong>Öffnungszeiten:</strong> ${place.openingHours ? 'Hinterlegt' : 'Nicht hinterlegt'}</div>
                    <div class="info-item"><strong>Fotos:</strong> ${place.photoCount || 0} Bilder</div>
                </div>
            </div>
        `;
    }



    // Competitors List
    if (audit.rawData?.competitors?.length > 0) {
        html += `
            <div class="info-section">
                <h2>🏆 Ihre Konkurrenten</h2>
                <div class="competitors-list">
        `;
        audit.rawData.competitors.forEach((comp, index) => {
            html += `
                <div class="competitor-item">
                    <div class="competitor-number">${index + 1}</div>
                    <div class="competitor-info">
                        <strong>${comp.name}</strong>
                        <div class="competitor-meta">
                            <span>⭐ ${comp.rating} (${comp.reviewCount} Bewertungen)</span>
                            <span>📍 ${comp.distance} km entfernt</span>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div></div>`;
    }

    // SEO Analysis Section
    if (audit.rawData?.seoAnalysis && audit.rawData.seoAnalysis.score > 0) {
        const seo = audit.rawData.seoAnalysis;
        const scoreClass = seo.score >= 70 ? 'good' : seo.score >= 40 ? 'medium' : 'poor';

        html += `
            <div class="info-section">
                <h2>🔍 SEO & Website-Qualität</h2>
                <div class="seo-score-container">
                    <div class="seo-score ${scoreClass}">
                        <div class="score-value">${seo.score}</div>
                        <div class="score-label">/100</div>
                    </div>
                    <div class="seo-status">
                        <strong>${seo.score >= 70 ? 'Gut' : seo.score >= 40 ? 'Verbesserungsbedarf' : 'Kritisch'}</strong>
                        <p>${seo.issues.length} kritische Probleme gefunden</p>
                    </div>
                </div>
                
                ${seo.issues.length > 0 ? `
                    <div class="seo-issues">
                        <h3>❌ Kritische Probleme:</h3>
                        <ul>
                            ${seo.issues.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${seo.recommendations.length > 0 ? `
                    <div class="seo-recommendations">
                        <h3>💡 Empfehlungen:</h3>
                        <ul>
                            ${seo.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <details class="seo-details">
                    <summary>📊 Detaillierte SEO-Analyse anzeigen</summary>
                    <div class="seo-checklist">
                        <h4>Metadata</h4>
                        <div class="check-item ${seo.metadata.title ? 'check-pass' : 'check-fail'}">
                            ${seo.metadata.title ? '✓' : '✗'} Page Title: ${seo.metadata.title ? `"${seo.metadata.title.substring(0, 60)}..."` : 'Fehlt!'}
                        </div>
                        <div class="check-item ${seo.metadata.description ? 'check-pass' : 'check-fail'}">
                            ${seo.metadata.description ? '✓' : '✗'} Meta Description: ${seo.metadata.descriptionLength || 0} Zeichen
                        </div>
                        
                        <h4>Content-Struktur</h4>
                        <div class="check-item ${seo.content.h1Tags && seo.content.h1Tags.length === 1 ? 'check-pass' : 'check-fail'}">
                            ${seo.content.h1Tags && seo.content.h1Tags.length > 0 ? '✓' : '✗'} H1 Tag: ${seo.content.h1Tags ? seo.content.h1Tags.length : 0} gefunden
                        </div>
                        <div class="check-item ${seo.content.images && seo.content.imagesWithoutAlt === 0 ? 'check-pass' : 'check-fail'}">
                            ${seo.content.imagesWithoutAlt === 0 ? '✓' : '✗'} Bilder Alt-Tags: ${seo.content.imagesWithoutAlt || 0} ohne Alt-Text
                        </div>
                        
                        <h4>Technisch</h4>
                        <div class="check-item ${seo.technical.hasSSL ? 'check-pass' : 'check-fail'}">
                            ${seo.technical.hasSSL ? '✓' : '✗'} HTTPS Verschlüsselung
                        </div>
                        <div class="check-item ${seo.technical.hasViewport ? 'check-pass' : 'check-fail'}">
                            ${seo.technical.hasViewport ? '✓' : '✗'} Mobile-optimiert (Viewport)
                        </div>
                        
                        <h4>Conversion-Elemente</h4>
                        <div class="check-item ${seo.conversion.hasPhoneInContent ? 'check-pass' : 'check-fail'}">
                            ${seo.conversion.hasPhoneInContent ? '✓' : '✗'} Telefonnummer sichtbar
                        </div>
                        <div class="check-item ${seo.conversion.ctaButtons && seo.conversion.ctaButtons.length > 0 ? 'check-pass' : 'check-fail'}">
                            ${seo.conversion.ctaButtons && seo.conversion.ctaButtons.length > 0 ? '✓' : '✗'} Call-to-Action Buttons: ${seo.conversion.ctaButtons ? seo.conversion.ctaButtons.length : 0}
                        </div>
                    </div>
                </details>
            </div>
        `;
    }

    // Website Performance Details
    if (audit.rawData?.pageSpeedData || audit.rawData?.websiteScreenshot) {
        const ps = audit.rawData.pageSpeedData;
        html += `<div class="info-section"><h2>🚀 Website Performance</h2>`;

        // Show screenshot (from Puppeteer or PageSpeed)
        const screenshot = audit.rawData.websiteScreenshot || ps?.desktop?.screenshot || ps?.mobile?.screenshot;
        if (screenshot) {
            html += `
                <div class="website-screenshot">
                    <h3>📸 Website-Vorschau</h3>
                    <img src="${screenshot}" alt="Website Screenshot" class="screenshot-img" />
                </div>
            `;
        }

        // Show PageSpeed metrics only if available
        if (ps?.desktop?.metrics || ps?.mobile?.metrics) {
            html += `<div class="performance-grid">`;

            if (ps.desktop?.metrics) {
                html += `<div class="performance-card"><h3>💻 Desktop</h3>
                    <div class="metric"><span>LCP:</span><strong>${ps.desktop.metrics.lcp ? ps.desktop.metrics.lcp.toFixed(2) + 's' : 'N/A'}</strong></div>
                    <div class="metric"><span>FCP:</span><strong>${ps.desktop.metrics.fcp ? ps.desktop.metrics.fcp.toFixed(2) + 's' : 'N/A'}</strong></div>
                </div>`;
            }

            if (ps.mobile?.metrics) {
                html += `<div class="performance-card"><h3>📱 Mobile</h3>
                    <div class="metric"><span>LCP:</span><strong>${ps.mobile.metrics.lcp ? ps.mobile.metrics.lcp.toFixed(2) + 's' : 'N/A'}</strong></div>
                    <div class="metric"><span>CLS:</span><strong>${ps.mobile.metrics.cls !== undefined ? ps.mobile.metrics.cls.toFixed(3) : 'N/A'}</strong></div>
                    <div class="checks">
                        <div class="check-item ${ps.mobile.checks?.usesHttps ? 'check-pass' : 'check-fail'}">${ps.mobile.checks?.usesHttps ? '✓' : '✗'} HTTPS</div>
                        <div class="check-item ${ps.mobile.checks?.fontSizeOk ? 'check-pass' : 'check-fail'}">${ps.mobile.checks?.fontSizeOk ? '✓' : '✗'} Schriftgröße</div>
                        <div class="check-item ${ps.mobile.checks?.tapTargetsOk ? 'check-pass' : 'check-fail'}">${ps.mobile.checks?.tapTargetsOk ? '✓' : '✗'} Tap Targets</div>
                    </div>
                </div>`;
            }

            html += `</div>`;
        }

        html += `</div>`;
    }

    // Social Media Profiles
    if (audit.rawData?.socialProfiles) {
        const social = audit.rawData.socialProfiles;
        html += `<div class="info-section"><h2>📱 Social Media Präsenz</h2><div class="social-grid">`;

        if (social.facebook) {
            html += `<div class="social-card"><h3>Facebook</h3>
                <div class="social-status ${social.facebook.exists ? 'active' : 'inactive'}">${social.facebook.exists ? '✓ Aktiv' : '✗ Nicht gefunden'}</div>
                ${social.facebook.lastPost ? `<p>Letzter Post: ${social.facebook.lastPost}</p>` : ''}
            </div>`;
        }

        if (social.instagram) {
            html += `<div class="social-card"><h3>Instagram</h3>
                <div class="social-status ${social.instagram.exists ? 'active' : 'inactive'}">${social.instagram.exists ? '✓ Aktiv' : '✗ Nicht gefunden'}</div>
                ${social.instagram.lastPost ? `<p>Letzter Post: ${social.instagram.lastPost}</p>` : ''}
            </div>`;
        }

        html += `</div></div>`;
    }

    // Show top issues
    html += '<div class="top-issues"><h2>🎯 Ihre größten Verbesserungspotenziale</h2>';

    audit.topIssues.forEach((issue, index) => {
        html += `
            <div class="issue-card ${issue.severity}">
                <div class="issue-number">${index + 1}</div>
                <div class="issue-content">
                    <h3>${getModuleName(issue.module)}</h3>
                    <p class="issue-message">${issue.message}</p>
                    <p class="issue-loss">${issue.estimatedLoss}</p>
                </div>
            </div>
        `;
    });

    html += '</div>';

    // Show industry benchmark
    if (audit.industryBenchmark) {
        html += `
            <div class="benchmark-card">
                <h3>Branchenvergleich</h3>
                <p>Ihr Score: <strong>${audit.totalScore}</strong></p>
                <p>Durchschnitt ${audit.industryBenchmark.category} in ${audit.city}: <strong>${audit.industryBenchmark.averageScore}</strong></p>
                ${audit.totalScore < audit.industryBenchmark.averageScore ?
                '<p class="warning">⚠️ Sie liegen unter dem Branchendurchschnitt</p>' :
                '<p class="success">✓ Sie liegen über dem Branchendurchschnitt</p>'}
            </div>
        `;
    }

    // CTA to strategy call
    html += `
        <div class="strategy-cta">
            <h2>Bereit, Ihre Online-Präsenz zu transformieren?</h2>
            <p>Buchen Sie jetzt ein kostenloses Strategiegespräch und erhalten Sie ein <strong>NFC Google-Bewertungs-Display (60€ Wert)</strong> als Geschenk!</p>
            <a href="https://bewertigo.at/termin?company=${encodeURIComponent(audit.businessName)}" class="btn-primary btn-large" target="_blank">
                Jetzt Strategiegespräch buchen
            </a>
        </div>
    `;

    detailedDiv.innerHTML = html;
    detailedDiv.style.display = 'block';
    detailedDiv.classList.remove('blurred');

    // Initialize competitor map if available
    if (audit.rawData?.placeDetails?.location && audit.rawData?.competitors?.length > 0) {
        loadGoogleMapsAPI()
            .then(() => {
                setTimeout(() => {
                    initCompetitorMap(
                        audit.rawData.placeDetails.location,
                        audit.businessName,
                        audit.rawData.competitors
                    );
                }, 100);
            })
            .catch(err => {
                console.error('Failed to load Google Maps:', err);
                // Show fallback message
                const mapDiv = document.getElementById('competitor-map');
                if (mapDiv) {
                    mapDiv.innerHTML = '<p style="text-align: center; padding: 50px; color: #666;">Karte konnte nicht geladen werden.</p>';
                }
            });
    }
}

/**
 * Initialize competitor map with Google Maps
 */
function initCompetitorMap(businessLocation, businessName, competitors) {
    const mapDiv = document.getElementById('competitor-map');
    if (!mapDiv || !window.google) return;

    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(businessLocation);

    // Add competitor locations to bounds
    competitors.forEach(competitor => {
        bounds.extend(competitor.location);
    });

    // Create map (without zoom/center, we'll fit bounds)
    const map = new google.maps.Map(mapDiv, {
        styles: [
            { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
            { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] }
        ],
        disableDefaultUI: true,
        zoomControl: true
    });

    // Add business marker (larger, special icon) - Using standard Marker for compatibility
    const businessMarker = new google.maps.Marker({
        position: businessLocation,
        map: map,
        title: businessName,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        },
        zIndex: 1000,
        optimized: true
    });

    // Info window for business
    const businessInfo = new google.maps.InfoWindow({
        content: `<div style="padding: 10px;"><strong>${businessName}</strong><br><span style="color: #ef4444;">Ihr Unternehmen</span></div>`
    });
    businessMarker.addListener('click', () => businessInfo.open(map, businessMarker));

    // Add competitor markers
    competitors.forEach((competitor, index) => {
        const marker = new google.maps.Marker({
            position: competitor.location,
            map: map,
            title: competitor.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#f97316',
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2
            },
            zIndex: 100 - index,
            optimized: true
        });

        const info = new google.maps.InfoWindow({
            content: `<div style="padding: 10px;">
                <strong>${competitor.name}</strong><br>
                ⭐ ${competitor.rating} (${competitor.reviewCount} Bewertungen)<br>
                📍 ${competitor.distance} km entfernt
            </div>`
        });
        marker.addListener('click', () => info.open(map, marker));
    });

    // Draw 3km radius circle
    new google.maps.Circle({
        map: map,
        center: businessLocation,
        radius: 3000,
        fillColor: '#6366f1',
        fillOpacity: 0.05,
        strokeColor: '#6366f1',
        strokeOpacity: 0.3,
        strokeWeight: 1
    });

    // Fit map to show all markers
    if (competitors.length > 0) {
        map.fitBounds(bounds);
        // Add some padding and limit max zoom
        setTimeout(() => {
            const currentZoom = map.getZoom();
            if (currentZoom > 15) {
                map.setZoom(15);
            }
        }, 100);
    } else {
        map.setCenter(businessLocation);
        map.setZoom(14);
    }

    // Trigger radar animation after map loads
    setTimeout(() => {
        const radar = document.querySelector('.radar-scanner');
        if (radar) radar.style.animation = 'radar-scan 3s ease-in-out';
    }, 500);
}

/**
 * Get module display name
 */
function getModuleName(module) {
    const names = {
        googleBusinessProfile: 'Google Business Profile',
        reviewSentiment: 'Bewertungen & Antworten',
        websitePerformance: 'Website-Geschwindigkeit',
        mobileExperience: 'Mobile Benutzererfahrung',
        socialMediaPresence: 'Social Media Präsenz',
        competitorAnalysis: 'Wettbewerbsposition'
    };
    return names[module] || module;
}

/**
 * Show lead capture form
 */
function showLeadForm() {
    document.getElementById('lead-modal').style.display = 'flex';
}

/**
 * Close lead capture form
 */
function closeLeadForm() {
    document.getElementById('lead-modal').style.display = 'none';
}

/**
 * Submit lead form
 */
async function submitLead(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const gdprConsent = document.getElementById('gdpr-consent').checked;
    const errorDiv = document.querySelector('.email-error');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');

    // Show loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';

    try {
        const response = await fetch(`${API_BASE}/lead/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                auditId: currentAuditId,
                email,
                gdprConsent
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message);
        }

        // Success! Close modal and unlock results
        closeLeadForm();
        document.getElementById('unlock-cta').style.display = 'none';
        document.getElementById('modules-grid').classList.remove('blurred');

        // Show detailed results
        if (data.audit) {
            renderDetailedResults(data.audit);
        }

        // Show success modal
        showSuccessModal();

    } catch (error) {
        console.error('Lead submission error:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        // Hide loading
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

// Real-time email validation
document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const email = emailInput.value.trim();
            const errorDiv = document.querySelector('.email-error');

            // Basic validation
            if (email && !isValidEmail(email)) {
                errorDiv.textContent = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
                errorDiv.style.display = 'block';
            } else if (email && isFakeEmail(email)) {
                errorDiv.textContent = 'Bitte geben Sie eine echte E-Mail-Adresse ein';
                errorDiv.style.display = 'block';
            } else {
                errorDiv.style.display = 'none';
            }
        });
    }
});

/**
 * Email validation
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isFakeEmail(email) {
    const fakePatterns = /^(test|fake|dummy|example|a@a\.|aa@|aaa@)/i;
    return fakePatterns.test(email);
}

/**
 * Show social media modal
 */
function showSocialModal() {
    const modal = document.getElementById('social-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Close social media modal
 */
function closeSocialModal() {
    const modal = document.getElementById('social-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Submit social media links
 */
async function submitSocialLinks(e) {
    e.preventDefault();

    if (!currentAuditId) {
        alert('Bitte führen Sie zuerst eine Analyse durch.');
        return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const socialLinks = {};

    // Collect non-empty URLs
    for (let [key, value] of formData.entries()) {
        if (value.trim()) {
            socialLinks[key] = value.trim();
        }
    }

    if (Object.keys(socialLinks).length === 0) {
        alert('Bitte fügen Sie mindestens einen Social Media Link hinzu.');
        return;
    }

    try {
        // Submit to backend
        const response = await fetch(`${API_BASE}/audit/${currentAuditId}/social-links`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ socialLinks })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Fehler beim Hinzufügen der Links');
        }

        // Close modal
        closeSocialModal();

        // Show success message
        alert('✓ Social Media Links hinzugefügt! Ihre Bewertung wird aktualisiert...');

        // Trigger re-evaluation
        pollAuditStatus();

    } catch (error) {
        console.error('Social links error:', error);
        alert('Fehler: ' + error.message);
    }
}

/**
 * Show critical no-website alert
 */
function showNoWebsiteAlert() {
    // Check if alert already exists
    if (document.getElementById('no-website-alert')) {
        return;
    }

    const alertHTML = `
        <div id="no-website-alert" class="critical-alert">
            <div class="alert-content">
                <div class="alert-icon">🚨</div>
                <div class="alert-text">
                    <h3>KRITISCH: Keine Website hinterlegt!</h3>
                    <p>Ohne Website existieren Sie digital nicht. <strong>80% der Kunden</strong> suchen online nach Informationen, bevor sie entscheiden.</p>
                    <p class="alert-loss">💸 Geschätzter Verlust: <strong>3-5 Neukunden pro Woche</strong></p>
                </div>
                <button class="alert-close" onclick="closeNoWebsiteAlert()">×</button>
            </div>
            <div class="alert-cta">
                <p>✨ Im kostenlosen Strategiegespräch zeigen wir Ihnen, wie Sie eine professionelle Website in 48 Stunden aufsetzen.</p>
            </div>
        </div>
    `;

    // Insert after score display
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
        resultsSection.insertAdjacentHTML('afterbegin', alertHTML);

        // Scroll to alert
        setTimeout(() => {
            document.getElementById('no-website-alert').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 500);
    }
}

/**
 * Close no-website alert
 */
function closeNoWebsiteAlert() {
    const alert = document.getElementById('no-website-alert');
    if (alert) {
        alert.style.animation = 'slideOutUp 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }
}

/**
 * Show success modal after lead submission
 */
function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'flex';

        // Add event listener to close button
        const closeBtn = document.getElementById('success-modal-close-btn');
        if (closeBtn) {
            closeBtn.onclick = closeSuccessModal;
        }

        // Trigger checkmark animation
        setTimeout(() => {
            const checkmark = modal.querySelector('.checkmark');
            if (checkmark) {
                checkmark.classList.add('animate');
            }
        }, 100);
    }
}

/**
 * Close success modal
 */
function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}
