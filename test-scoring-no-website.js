// Test scoring with business that has NO website
const scoringService = require('./services/scoring');

// Sample data for a business WITHOUT website
const mockPlaceDetails = {
    name: 'Kleines Kaffeehaus',
    businessType: 'cafe',
    rating: 4.3,
    totalReviews: 45,
    phone: '+43153577',
    website: null, // NO WEBSITE!
    openingHours: true,
    types: ['cafe', 'food'],
    location: { lat: 48.2082, lng: 16.3738 },
    placeId: 'ChIJ_____test',
    photos: [1, 2, 3] // 3 photos on Google Business
};

const mockPageSpeedData = {
    desktop: null,
    mobile: null
};

const mockClickToCall = {
    hasClickToCall: false
};

const mockSocialProfiles = {
    instagram: null,
    tiktok: null,
    instagramData: null,
    tiktokData: null,
    sources: {
        instagram: null,
        tiktok: null
    }
};

const mockCompetitors = [
    { name: 'Competitor 1', rating: 4.5, reviewCount: 80 },
    { name: 'Competitor 2', rating: 4.6, reviewCount: 120 }
];

console.log('\n=== TESTING SCORING - KEIN WEBSITE ===\n');

// Test each module
console.log('1. Google Business Profile:');
const googleScore = scoringService.scoreGoogleBusinessProfile(mockPlaceDetails);
console.log(`   Score: ${googleScore.score}/16.6`);

console.log('\n2. Review Sentiment:');
const reviewScore = scoringService.scoreReviewSentiment(mockPlaceDetails);
console.log(`   Score: ${reviewScore.score}/16.6`);

console.log('\n3. Website Performance:');
const websiteScore = scoringService.scoreWebsitePerformance(
    mockPageSpeedData,
    mockPlaceDetails,
    mockClickToCall
);
console.log(`   Score: ${websiteScore.score}/16.6`);

console.log('\n4. Mobile Experience:');
const mobileScore = scoringService.scoreMobileExperience(
    mockPageSpeedData,
    mockClickToCall,
    mockPlaceDetails
);
console.log(`   Score: ${mobileScore.score}/16.6`);

console.log('\n5. Social Media Presence:');
const socialScore = scoringService.scoreSocialMediaPresence(mockSocialProfiles);
console.log(`   Score: ${socialScore.score}/16.6`);

console.log('\n6. Competitor Analysis:');
const competitorScore = scoringService.scoreCompetitorAnalysis(
    mockPlaceDetails,
    mockCompetitors
);
console.log(`   Score: ${competitorScore.score}/16.6`);

// Calculate overall
const moduleScores = {
    googleBusinessProfile: googleScore.score,
    reviewSentiment: reviewScore.score,
    websitePerformance: websiteScore.score,
    mobileExperience: mobileScore.score,
    socialMediaPresence: socialScore.score,
    competitorAnalysis: competitorScore.score
};

const totalScore = scoringService.calculateOverallScore(moduleScores);

console.log('\n=== OVERALL RESULTS (KEIN WEBSITE) ===');
console.log(`Total Score: ${totalScore}/100`);
console.log('\nModule Breakdown:');
console.log(`  📍 Google Business: ${moduleScores.googleBusinessProfile}`);
console.log(`  ⭐ Reviews: ${moduleScores.reviewSentiment}`);
console.log(`  🚀 Website: ${moduleScores.websitePerformance}`);
console.log(`  📱 Mobile: ${moduleScores.mobileExperience}`);
console.log(`  📸 Social: ${moduleScores.socialMediaPresence}`);
console.log(`  📊 Competitor: ${moduleScores.competitorAnalysis}`);
