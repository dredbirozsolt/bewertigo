/**
 * Dynamic visual animations during scanning
 */

// Animation state
let currentAnimation = null;

/**
 * Show visual feedback for each step
 */
function showVisualFeedback(step, auditData = null) {
    const visualDiv = document.getElementById('visual-feedback');
    if (!visualDiv) {
        return;
    }

    visualDiv.classList.add('active');

    // Clear previous animation
    if (currentAnimation) {
        clearAnimation();
    }

    switch (step) {
        case 1:
            showCompetitorMap(auditData);
            break;
        case 2:
            showGoogleProfile(auditData?.placeDetails);
            break;
        case 3:
            showReviewBubbles(auditData?.placeDetails?.reviews);
            break;
        case 4:
            showWebsiteSpeed(auditData);
            break;
        case 5:
            showMobilePreview(auditData);
            break;
        case 6:
            showSocialMediaFeeds();
            break;
        case 7:
            showFinalCalculation();
            break;
    }
}

/**
 * Step 1: Competitor map visualization with real Google Maps
 */
function showCompetitorMap(auditData = null) {
    const visualDiv = document.getElementById('visual-feedback');
    visualDiv.innerHTML = `
        <div class="animation-container">
            <h3>🗺️ Scanning competitors in your area...</h3>
            <div id="live-competitor-map" class="live-map-container"></div>
            <div class="competitors-status">
                <span id="competitors-found">0</span> competitors found
            </div>
        </div>
    `;

    // Add styles for this animation
    addAnimationStyles(`
        .live-map-container {
            width: 100%;
            max-width: 600px;
            height: 400px;
            margin: 20px auto;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .competitors-status {
            text-align: center;
            font-size: 1.1rem;
            color: #6366f1;
            font-weight: 600;
            margin-top: 15px;
        }
        @media (max-width: 768px) {
            .live-map-container {
                height: 300px;
            }
        }
    `);

    // Debug: Check what data we have
    console.log('🗺️ Animation Step 1 - Data:', {
        hasAuditData: !!auditData,
        hasPlaceDetails: !!auditData?.placeDetails,
        hasLocation: !!auditData?.placeDetails?.location,
        hasCompetitors: !!auditData?.competitors,
        competitorsLength: auditData?.competitors?.length
    });

    // Initialize map if we have data
    if (auditData?.placeDetails?.location && auditData?.competitors) {
        console.log('✅ Initializing live competitor map');
        initLiveCompetitorMap(auditData);
    } else {
        console.log('❌ Cannot initialize map - missing data');
    }
}

/**
 * Initialize live competitor map during scanning
 */
async function initLiveCompetitorMap(auditData) {
    const mapContainer = document.getElementById('live-competitor-map');
    if (!mapContainer) return;

    try {
        // Ensure Google Maps is loaded
        await loadGoogleMapsAPI();

        const businessLocation = auditData.placeDetails.location;
        const businessName = auditData.placeDetails.name;
        const competitors = auditData.competitors || [];

        // Create map (without zoom/center, we'll fit bounds)
        const map = new google.maps.Map(mapContainer, {
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

        // Create bounds to fit all markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(businessLocation);

        // Add all competitor locations to bounds (for fitting later)
        competitors.forEach(competitor => {
            bounds.extend(competitor.location);
        });

        // Fit map to show all markers
        if (competitors.length > 0) {
            map.fitBounds(bounds);
            // Add some padding
            setTimeout(() => {
                const currentZoom = map.getZoom();
                if (currentZoom > 15) {
                    map.setZoom(15); // Max zoom for better view
                }
            }, 100);
        } else {
            map.setCenter(businessLocation);
            map.setZoom(14);
        }

        // Draw 3km radius circle
        new google.maps.Circle({
            map: map,
            center: businessLocation,
            radius: 3000,
            fillColor: '#6366f1',
            fillOpacity: 0.08,
            strokeColor: '#6366f1',
            strokeOpacity: 0.4,
            strokeWeight: 2
        });

        // Step 1: Add business marker first (after 500ms)
        setTimeout(() => {
            const businessMarker = new google.maps.Marker({
                position: businessLocation,
                map: map,
                title: businessName,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 14,
                    fillColor: '#ef4444',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3
                },
                zIndex: 1000,
                optimized: true,
                animation: google.maps.Animation.DROP
            });
        }, 500);

        // Step 2-4: Add competitors one by one with animation
        let competitorCount = 0;
        const countElement = document.getElementById('competitors-found');

        competitors.forEach((competitor, index) => {
            setTimeout(() => {
                const marker = new google.maps.Marker({
                    position: competitor.location,
                    map: map,
                    title: competitor.name,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: '#f97316',
                        fillOpacity: 0.9,
                        strokeColor: '#ffffff',
                        strokeWeight: 2
                    },
                    zIndex: 100 - index,
                    optimized: true,
                    animation: google.maps.Animation.DROP
                });

                const info = new google.maps.InfoWindow({
                    content: `<div style="padding: 8px;">
                        <strong>${competitor.name}</strong><br>
                        ⭐ ${competitor.rating} (${competitor.reviewCount})<br>
                        📍 ${competitor.distance} km
                    </div>`
                });
                marker.addListener('click', () => info.open(map, marker));

                // Update counter
                competitorCount++;
                if (countElement) {
                    countElement.textContent = competitorCount;
                }
            }, 1500 + (index * 1000)); // Start after business marker (1500ms) with 1s intervals
        });

    } catch (error) {
        console.error('❌ Failed to initialize live competitor map:', error);
        // Fallback to static mockup
        const mapContainer = document.getElementById('live-competitor-map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 1.2rem;">
                    🗺️ Loading map...
                </div>
            `;
        }
    }
}

/**
 * Step 2: Google Profile data with photo gallery
 */
function showGoogleProfile(placeData = null) {
    const visualDiv = document.getElementById('visual-feedback');

    // Get photos from placeData if available (already converted to URLs by backend)
    const photos = placeData && placeData.photos ? placeData.photos : [];
    const photoCount = photos.length;

    visualDiv.innerHTML = `
        <div class="animation-container">
            <h3>📍 Google Business Profil prüfen...</h3>
            <div class="profile-section">
                <div class="photo-gallery" id="photo-gallery">
                    <div class="gallery-placeholder">
                        ${photos.length > 0 ?
            photos.map((photoUrl, idx) => `<div class="photo-slot" data-photo="${photoUrl}" data-index="${idx}"></div>`).join('') :
            '<div class="photo-slot"></div><div class="photo-slot"></div><div class="photo-slot"></div><div class="photo-slot"></div><div class="photo-slot"></div><div class="photo-slot"></div>'
        }
                    </div>
                    <div class="photo-counter">
                        <span id="photo-count">0</span> / ${photoCount || 6} Fotos gefunden
                    </div>
                </div>
                <div class="profile-cards">
                    <div class="data-card slide-in" style="animation-delay: 0.2s">
                        <span class="icon">🕒</span>
                        <span>Öffnungszeiten</span>
                        <span class="checking">${placeData && placeData.openingHours ? '✓' : 'Prüfe...'}</span>
                    </div>
                    <div class="data-card slide-in" style="animation-delay: 0.4s">
                        <span class="icon">📞</span>
                        <span>Telefonnummer</span>
                        <span class="checking">${placeData && placeData.phone ? '✓' : 'Prüfe...'}</span>
                    </div>
                    <div class="data-card slide-in" style="animation-delay: 0.6s">
                        <span class="icon">🌐</span>
                        <span>Website-Link</span>
                        <span class="checking">${placeData && placeData.website ? '✓' : 'Prüfe...'}</span>
                    </div>
                    <div class="data-card slide-in" style="animation-delay: 0.8s">
                        <span class="icon">📝</span>
                        <span>Beschreibung</span>
                        <span class="checking">${placeData && placeData.description ? '✓' : 'Prüfe...'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    addAnimationStyles(`
        .profile-section {
            margin-top: 30px;
        }
        .photo-gallery {
            background: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .gallery-placeholder {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 15px;
        }
        .photo-slot {
            aspect-ratio: 1;
            background: linear-gradient(45deg, #f3f4f6 25%, #e5e7eb 25%, #e5e7eb 50%, #f3f4f6 50%, #f3f4f6 75%, #e5e7eb 75%, #e5e7eb);
            background-size: 20px 20px;
            border-radius: 8px;
            animation: photo-loading 1.5s ease-in-out infinite;
            position: relative;
            overflow: hidden;
            background-size: cover;
            background-position: center;
        }
        .photo-slot.loaded {
            animation: photo-pop 0.3s ease-out;
        }
        .photo-slot.loaded::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3));
        }
        .photo-counter {
            text-align: center;
            font-weight: 600;
            color: #6366f1;
        }
        .photo-counter span {
            font-size: 1.5rem;
        }
        .profile-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .data-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .data-card .icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        .data-card .checking {
            color: #6366f1;
            font-size: 0.9rem;
            margin-top: 10px;
            animation: pulse 1.5s ease-in-out infinite;
        }
        .slide-in {
            animation: slide-in 0.5s ease-out forwards;
        }
        @keyframes slide-in {
            from { transform: translateX(-50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        @keyframes photo-loading {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }
        @keyframes photo-pop {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
        }
    `);

    // Animate photo slots loading with real images
    const photoSlots = document.querySelectorAll('.photo-slot');
    const photoCounter = document.getElementById('photo-count');
    let count = 0;

    photoSlots.forEach((slot, index) => {
        setTimeout(() => {
            const photoUrl = slot.getAttribute('data-photo');
            if (photoUrl) {
                slot.style.backgroundImage = `url(${photoUrl})`;
            } else {
                // Fallback gradient for empty slots
                slot.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
            slot.classList.add('loaded');
            count++;
            photoCounter.textContent = count;
        }, 500 + (index * 300));
    });
}

/**
 * Step 3: Review bubbles with realistic flow
 */
function showReviewBubbles(realReviews = null) {
    const visualDiv = document.getElementById('visual-feedback');

    // Use real reviews if available, otherwise fallback to dummy data
    let reviews = [];
    if (realReviews && realReviews.length > 0) {
        reviews = realReviews.slice(0, 6).map(review => {
            let sentiment = 'neutral';
            if (review.rating >= 4) sentiment = 'positive';
            else if (review.rating <= 2) sentiment = 'negative';

            return {
                stars: review.rating,
                text: review.text ? review.text.substring(0, 50) + '...' : 'Keine Bewertung',
                author: review.author_name || 'Anonymous',
                photoUrl: review.profile_photo_url || null,
                sentiment: sentiment
            };
        });
    } else {
        // Fallback reviews
        reviews = [
            { stars: 5, text: "Ausgezeichneter Service!", author: "Maria S.", photoUrl: null, sentiment: "positive" },
            { stars: 4, text: "Sehr professionell", author: "Thomas K.", photoUrl: null, sentiment: "positive" },
            { stars: 5, text: "Absolut empfehlenswert", author: "Anna B.", photoUrl: null, sentiment: "positive" },
            { stars: 3, text: "Könnte besser sein", author: "Peter M.", photoUrl: null, sentiment: "neutral" },
            { stars: 5, text: "Top Qualität!", author: "Lisa W.", photoUrl: null, sentiment: "positive" },
            { stars: 2, text: "Enttäuschend", author: "Michael R.", photoUrl: null, sentiment: "negative" }
        ];
    }

    visualDiv.innerHTML = `
        <div class="animation-container">
            <h3>⭐ Bewertungen & Antworten analysieren...</h3>
            <div class="review-stream-container">
                <div class="sentiment-meter">
                    <div class="sentiment-bar positive"></div>
                    <div class="sentiment-bar neutral"></div>
                    <div class="sentiment-bar negative"></div>
                </div>
                <div class="review-stream" id="review-stream"></div>
                <div class="response-checker">
                    <div class="checker-icon">💬</div>
                    <div class="checker-text">Überprüfe Antwortquote...</div>
                    <div class="checker-progress">
                        <div class="progress-fill"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    addAnimationStyles(`
        .review-stream-container {
            margin-top: 30px;
        }
        .sentiment-meter {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
        }
        .sentiment-bar {
            height: 100%;
            transition: width 2s ease-out;
        }
        .sentiment-bar.positive { background: #10b981; width: 60%; }
        .sentiment-bar.neutral { background: #f59e0b; width: 25%; }
        .sentiment-bar.negative { background: #ef4444; width: 15%; }
        .review-stream {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            max-height: 480px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        .review-bubble {
            background: white;
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            animation: bubble-pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
            opacity: 0;
            transform: scale(0);
            display: flex;
            gap: 12px;
        }
        .review-bubble.positive { border-left: 3px solid #10b981; }
        .review-bubble.neutral { border-left: 3px solid #f59e0b; }
        .review-bubble.negative { border-left: 3px solid #ef4444; }
        .review-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            flex-shrink: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
        }
        .review-avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
        .review-content {
            flex: 1;
        }
        .review-bubble .stars {
            font-size: 1rem;
            margin-bottom: 8px;
            letter-spacing: 2px;
        }
        .review-bubble p {
            margin: 0;
            font-size: 0.9rem;
            color: #1f2937;
        }
        .response-checker {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            color: white;
        }
        .checker-icon {
            font-size: 2rem;
            margin-bottom: 10px;
            animation: bounce 1s ease-in-out infinite;
        }
        .checker-text {
            font-weight: 600;
            margin-bottom: 15px;
        }
        .checker-progress {
            background: rgba(255, 255, 255, 0.3);
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
        }
        .progress-fill {
            background: white;
            height: 100%;
            width: 0%;
            animation: progress-fill 2s ease-out forwards;
        }
        @keyframes bubble-pop {
            0% { transform: scale(0); opacity: 0; }
            70% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progress-fill {
            from { width: 0%; }
            to { width: 75%; }
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    `);

    // Animate reviews appearing
    const reviewStream = document.getElementById('review-stream');
    reviews.forEach((review, index) => {
        setTimeout(() => {
            const bubble = document.createElement('div');
            bubble.className = `review-bubble ${review.sentiment}`;
            bubble.style.animationDelay = '0s';

            // Avatar HTML
            const avatarHtml = review.photoUrl
                ? `<div class="review-avatar"><img src="${review.photoUrl}" alt="${review.author}"></div>`
                : `<div class="review-avatar">${review.author.charAt(0).toUpperCase()}</div>`;

            bubble.innerHTML = `
                ${avatarHtml}
                <div class="review-content">
                    <div class="stars">${'⭐'.repeat(review.stars)}</div>
                    <p><strong>${review.author}</strong></p>
                    <p style="margin-top: 5px;">${review.text}</p>
                </div>
            `;
            reviewStream.appendChild(bubble);
        }, index * 300);
    });
}

/**
 * Step 4: Website speed gauge with screenshot
 */
function showWebsiteSpeed(auditData = null) {
    const visualDiv = document.getElementById('visual-feedback');

    console.log('🔍 showWebsiteSpeed called with auditData:', auditData);

    // Check desktop screenshot only (mobile will be shown in Step 5)
    const desktopScreenshot = auditData?.rawData?.websiteScreenshotDesktop ||
        auditData?.rawData?.websiteScreenshot || // legacy fallback
        auditData?.rawData?.pageSpeedData?.desktop?.screenshot;

    console.log('📸 Desktop screenshot found:', desktopScreenshot ? 'YES' : 'NO');

    if (desktopScreenshot) {
        const preview = typeof desktopScreenshot === 'string' 
            ? desktopScreenshot.substring(0, 50) + '...'
            : 'iframe-object';
        console.log('📸 Desktop screenshot preview:', preview);
    }

    let screenshotHtml = '';
    if (desktopScreenshot) {
        // Check if it's an iframe-based preview (object with URL)
        if (typeof desktopScreenshot === 'object' && desktopScreenshot.type === 'iframe') {
            screenshotHtml = `
                <div class="website-screenshot-preview">
                    <div class="screenshot-device desktop">
                        <div class="screenshot-label">💻 Desktop Preview</div>
                        <div class="iframe-container">
                            <iframe src="${desktopScreenshot.url}" 
                                    class="website-iframe"
                                    sandbox="allow-same-origin allow-scripts"
                                    loading="lazy"></iframe>
                            ${desktopScreenshot.ogImage ? `
                                <img src="${desktopScreenshot.ogImage}" 
                                     alt="Website Preview" 
                                     class="og-image-fallback" 
                                     onerror="this.style.display='none'" />
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Legacy base64 screenshot
            screenshotHtml = `
                <div class="website-screenshot-preview">
                    <div class="screenshot-device desktop">
                        <div class="screenshot-label">💻 Desktop</div>
                        <img src="${desktopScreenshot}" alt="Desktop Screenshot" class="screenshot-loading" />
                        <div class="screenshot-overlay">
                            <div class="scanner-line-horizontal"></div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    visualDiv.innerHTML = `
        <div class="animation-container">
            <h3>🚀 Measuring website speed...</h3>
            ${screenshotHtml}
            <div class="speed-gauge">
                <svg class="gauge" width="250" height="150" viewBox="0 0 250 150">
                    <path class="gauge-bg" d="M 25 125 A 100 100 0 0 1 225 125" fill="none" stroke="#e0e0e0" stroke-width="20"></path>
                    <path id="gauge-progress" class="gauge-progress" d="M 25 125 A 100 100 0 0 1 225 125" fill="none" stroke="#6366f1" stroke-width="20" stroke-dasharray="314" stroke-dashoffset="314"></path>
                </svg>
                <div class="gauge-label">Analyzing...</div>
            </div>
        </div>
    `;

    addAnimationStyles(`
        .website-screenshot-preview {
            position: relative;
            max-width: 600px;
            margin: 20px auto;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .iframe-container {
            position: relative;
            width: 100%;
            height: 450px;
            background: #f5f5f5;
            overflow: hidden;
        }
        .website-iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
            background: white;
            transform: scale(0.8);
            transform-origin: top left;
            width: 125%;
            height: 125%;
        }
        .og-image-fallback {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            pointer-events: none;
        }
        .screenshot-loading {
            width: 100%;
            height: auto;
            display: block;
            animation: screenshot-fade-in 0.8s ease-out;
        }
        .screenshot-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .scanner-line-horizontal {
            position: absolute;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, transparent, #6366f1, transparent);
            box-shadow: 0 0 10px #6366f1;
            animation: scan-horizontal 2s ease-in-out infinite;
        }
        @keyframes screenshot-fade-in {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        @keyframes scan-horizontal {
            0%, 100% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .speed-gauge {
            text-align: center;
            margin-top: 30px;
        }
        .gauge {
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
        }
        .gauge-progress {
            animation: gauge-fill 3s ease-out infinite;
        }
        @keyframes gauge-fill {
            0% { stroke-dashoffset: 314; }
            50% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 314; }
        }
        .gauge-label {
            margin-top: 20px;
            font-size: 1.2rem;
            font-weight: 600;
            color: #6366f1;
            animation: pulse 1.5s ease-in-out infinite;
        }
    `);
}

/**
 * Step 5: Mobile preview with scanner and realistic checks
 */
function showMobilePreview(auditData = null) {
    const visualDiv = document.getElementById('visual-feedback');

    // Get mobile screenshot if available
    const mobileScreenshot = auditData?.rawData?.websiteScreenshotMobile;

    console.log('📱 showMobilePreview - Mobile screenshot:', mobileScreenshot ? 'YES' : 'NO');

    visualDiv.innerHTML = `
        <div class="animation-container">
            <h3>📱 Mobile-Erlebnis testen...</h3>
            <div class="mobile-preview">
                <div class="phone-mockup">
                    <div class="phone-frame">
                        <div class="phone-notch"></div>
                        <div class="phone-screen">
                            ${mobileScreenshot ? (
                                typeof mobileScreenshot === 'object' && mobileScreenshot.type === 'iframe' ? `
                                    <div class="mobile-iframe-container">
                                        <iframe src="${mobileScreenshot.url}" 
                                                class="mobile-website-iframe"
                                                sandbox="allow-same-origin allow-scripts"
                                                loading="lazy"></iframe>
                                    </div>
                                ` : `
                                    <img src="${mobileScreenshot}" alt="Mobile Website" class="mobile-screenshot-img" />
                                `
                            ) : `
                                <div class="screen-content">
                                    <div class="mock-header"></div>
                                    <div class="mock-button"></div>
                                    <div class="mock-text"></div>
                                    <div class="mock-cta"></div>
                                </div>
                            `}
                            <div class="scanner-line"></div>
                        </div>
                    </div>
                    <div class="device-label">iPhone 14 Pro</div>
                </div>
                <div class="mobile-checks">
                    <div class="check-item" style="animation-delay: 0.5s">
                        <span class="check-icon">📏</span>
                        <span>Touch-Targets</span>
                        <span class="check-status">✓</span>
                    </div>
                    <div class="check-item" style="animation-delay: 0.8s">
                        <span class="check-icon">🔤</span>
                        <span>Schriftgröße</span>
                        <span class="check-status">✓</span>
                    </div>
                    <div class="check-item" style="animation-delay: 1.1s">
                        <span class="check-icon">📞</span>
                        <span>Click-to-Call</span>
                        <span class="check-status">✓</span>
                    </div>
                    <div class="check-item" style="animation-delay: 1.4s">
                        <span class="check-icon">⚡</span>
                        <span>Viewport</span>
                        <span class="check-status">✓</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    addAnimationStyles(`
        .mobile-preview {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 50px;
            margin-top: 30px;
            flex-wrap: wrap;
        }
        .phone-mockup {
            text-align: center;
        }
        .phone-frame {
            width: 200px;
            height: 400px;
            border: 10px solid #1f2937;
            border-radius: 40px;
            background: #000;
            overflow: hidden;
            position: relative;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            animation: phone-slide-in 0.6s ease-out;
        }
        .phone-notch {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 25px;
            background: #000;
            border-radius: 0 0 20px 20px;
            z-index: 10;
        }
        .phone-screen {
            width: 100%;
            height: 100%;
            background: white;
            position: relative;
            overflow: hidden;
        }
        .mobile-iframe-container {
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        .mobile-website-iframe {
            width: 375px;
            height: 667px;
            border: none;
            display: block;
            transform: scale(0.64);
            transform-origin: top left;
        }
        .scanner-line {
            position: absolute;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, transparent, #6366f1, transparent);
            box-shadow: 0 0 15px #6366f1;
            animation: scan 2.5s ease-in-out infinite;
            z-index: 5;
        }
        .screen-content {
            padding: 40px 20px 20px;
        }
        .mock-header,
        .mock-button,
        .mock-text,
        .mock-cta {
            background: #e5e7eb;
            border-radius: 8px;
            margin-bottom: 15px;
            animation: content-pulse 1.5s ease-in-out infinite;
        }
        .mock-header {
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .mock-button {
            height: 50px;
            width: 80%;
            margin: 20px auto;
        }
        .mock-text {
            height: 20px;
            width: 90%;
            opacity: 0.5;
        }
        .mock-cta {
            height: 45px;
            background: #10b981;
            margin-top: 30px;
        }
        .device-label {
            margin-top: 15px;
            font-size: 0.9rem;
            color: #6b7280;
            font-weight: 600;
        }
        @keyframes scan {
            0%, 100% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            50% { top: calc(100% - 4px); opacity: 1; }
            90% { opacity: 1; }
            100% { top: 0; opacity: 0; }
        }
        @keyframes phone-slide-in {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes content-pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
        }
        .mobile-checks {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .check-item {
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: check-slide 0.4s ease-out forwards;
            opacity: 0;
            transform: translateX(-20px);
        }
        .check-icon {
            font-size: 1.5rem;
        }
        .check-item span:nth-child(2) {
            flex: 1;
            font-weight: 600;
            color: #1f2937;
        }
        .check-status {
            color: #10b981;
            font-size: 1.2rem;
            font-weight: bold;
        }
        @keyframes check-slide {
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `);
}

/**
 * Step 6: Social Media Feeds
 */
function showSocialMediaFeeds() {
    const visualDiv = document.getElementById('visual-feedback');
    visualDiv.innerHTML = `
        <div class="animation-container">
            <h3>📸 Searching for social media profiles...</h3>
            <div class="social-search">
                <div class="social-platform">
                    <div class="platform-icon">📷</div>
                    <div class="platform-name">Instagram</div>
                    <div class="search-status">Searching...</div>
                </div>
                <div class="social-platform">
                    <div class="platform-icon">🎵</div>
                    <div class="platform-name">TikTok</div>
                    <div class="search-status">Searching...</div>
                </div>
            </div>
        </div>
    `;

    addAnimationStyles(`
        .social-search {
            display: flex;
            gap: 30px;
            justify-content: center;
            margin-top: 40px;
        }
        .social-platform {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
            min-width: 150px;
            animation: platform-pulse 0.5s ease-out forwards;
            opacity: 0;
        }
        .social-platform:nth-child(1) { animation-delay: 0.2s; }
        .social-platform:nth-child(2) { animation-delay: 0.5s; }
        .platform-icon {
            font-size: 3rem;
            margin-bottom: 15px;
            animation: icon-bounce 1s ease-in-out infinite;
        }
        .platform-name {
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 10px;
        }
        .search-status {
            color: #6366f1;
            font-size: 0.9rem;
            animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes platform-pulse {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        @keyframes icon-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    `);
}

/**
 * Step 7: Final calculation with Matrix effect
 */
function showFinalCalculation() {
    const visualDiv = document.getElementById('visual-feedback');
    visualDiv.innerHTML = `
        <div class="animation-container">
            <h3>🧮 Berechne Ihre finale Punktzahl...</h3>
            <div class="matrix-container">
                <canvas id="matrix-canvas" class="matrix-canvas"></canvas>
                <div class="matrix-overlay">
                    <div class="calculating-text">
                        <div class="calc-line">Analysiere Daten<span class="dots">...</span></div>
                        <div class="calc-line">Berechne Metriken<span class="dots">...</span></div>
                        <div class="calc-line">Finale Auswertung<span class="dots">...</span></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    addAnimationStyles(`
        .matrix-container {
            position: relative;
            width: 100%;
            max-width: 800px;
            height: 400px;
            margin: 40px auto;
            border-radius: 12px;
            overflow: hidden;
            background: #000;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        .matrix-canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
        .matrix-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.3);
            pointer-events: none;
        }
        .calculating-text {
            text-align: center;
            color: #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 1.5rem;
            font-weight: bold;
            text-shadow: 0 0 10px #00ff41, 0 0 20px #00ff41;
        }
        .calc-line {
            margin: 15px 0;
            opacity: 0;
            animation: line-appear 0.5s ease-out forwards;
        }
        .calc-line:nth-child(1) { animation-delay: 0.5s; }
        .calc-line:nth-child(2) { animation-delay: 1.5s; }
        .calc-line:nth-child(3) { animation-delay: 2.5s; }
        @keyframes line-appear {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .dots {
            animation: dots-blink 1.5s infinite;
        }
        @keyframes dots-blink {
            0%, 20% { opacity: 0; }
            40% { opacity: 0.5; }
            60%, 100% { opacity: 1; }
        }
    `);

    // Initialize Matrix rain effect
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Matrix characters - numbers and symbols
    const chars = '0123456789+-*/=<>[]{}()';
    const fontSize = 16;
    const columns = canvas.width / fontSize;

    // Array to track drop positions
    const drops = [];
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }

    // Drawing function
    function drawMatrix() {
        // Fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            // Random character
            const text = chars[Math.floor(Math.random() * chars.length)];

            // Draw character
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            // Reset drop to top randomly
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i]++;
        }
    }

    // Animate matrix
    const matrixInterval = setInterval(drawMatrix, 50);

    // Clean up after animation
    setTimeout(() => {
        clearInterval(matrixInterval);
    }, 5000);
}

/**
 * Add animation-specific styles
 */
function addAnimationStyles(css) {
    const styleId = 'animation-styles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;
}

/**
 * Clear current animation
 */
function clearAnimation() {
    const visualDiv = document.getElementById('visual-feedback');
    visualDiv.innerHTML = '';

    const styleElement = document.getElementById('animation-styles');
    if (styleElement) {
        styleElement.remove();
    }
}
