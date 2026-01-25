// Test scoring with sample data
const scoringService = require('./services/scoring');

// Sample data for a business like Plachutta Wollzeile
const mockPlaceDetails = {
    name: 'Plachutta Wollzeile',
    businessType: 'restaurant',
    rating: 4.5,
    totalReviews: 1542,
    phone: '+43153577',
    website: 'https://www.plachutta.at',
    openingHours: true,
    types: ['restaurant', 'food'],
    location: { lat: 48.2082, lng: 16.3738 },
    placeId: 'ChIJ_____test'
};

const mockPageSpeedData = {
    desktop: {
        metrics: { lcp: 1.5 },
        checks: { usesHttps: true }
    },
    mobile: {
        metrics: { lcp: 3.0, cls: 0.08 },
        checks: { usesHttps: true, fontSizeOk: true, tapTargetsOk: true }
    }
};

const mockClickToCall = {
    hasClickToCall: false
};

const mockSocialProfiles = {
    instagram: 'plachutta_official',
    tiktok: null,
    instagramData: {
        followers: 500,
        posts: [1, 2, 3],
        engagementRate: 0.1,
        isActive: false
    },
    tiktokData: null,
    sources: {
        instagram: 'website',
        tiktok: null
    }
};

const mockCompetitors = [
    { name: 'Competitor 1', rating: 4.3, reviewCount: 800 },
    { name: 'Competitor 2', rating: 4.6, reviewCount: 1200 },
    { name: 'Competitor 3', rating: 4.2, reviewCount: 600 }
];

console.log('\n=== TESTING SCORING SERVICE ===\n');

// Test each module
console.log('1. Google Business Profile:');
const googleScore = scoringService.scoreGoogleBusinessProfile(mockPlaceDetails);
console.log(`   Score: ${googleScore.score}/16.6`);
console.log(`   Issues: ${googleScore.details.issues.length}`);
googleScore.details.issues.forEach(issue => console.log(`   - ${issue}`));

console.log('\n2. Review Sentiment:');
const reviewScore = scoringService.scoreReviewSentiment(mockPlaceDetails);
console.log(`   Score: ${reviewScore.score}/16.6`);
console.log(`   Issues: ${reviewScore.details.issues.length}`);
reviewScore.details.issues.forEach(issue => console.log(`   - ${issue}`));

console.log('\n3. Website Performance:');
const websiteScore = scoringService.scoreWebsitePerformance(
    mockPageSpeedData,
    mockPlaceDetails,
    mockClickToCall
);
console.log(`   Score: ${websiteScore.score}/16.6`);
console.log(`   Issues: ${websiteScore.details.issues.length}`);
websiteScore.details.issues.forEach(issue => console.log(`   - ${issue}`));

console.log('\n4. Mobile Experience:');
const mobileScore = scoringService.scoreMobileExperience(
    mockPageSpeedData,
    mockClickToCall,
    mockPlaceDetails
);
console.log(`   Score: ${mobileScore.score}/16.6`);
console.log(`   Issues: ${mobileScore.details.issues.length}`);
mobileScore.details.issues.forEach(issue => console.log(`   - ${issue}`));

console.log('\n5. Social Media Presence:');
const socialScore = scoringService.scoreSocialMediaPresence(mockSocialProfiles);
console.log(`   Score: ${socialScore.score}/16.6`);
console.log(`   Issues: ${socialScore.details.issues.length}`);
socialScore.details.issues.forEach(issue => console.log(`   - ${issue}`));

console.log('\n6. Competitor Analysis:');
const competitorScore = scoringService.scoreCompetitorAnalysis(
    mockPlaceDetails,
    mockCompetitors
);
console.log(`   Score: ${competitorScore.score}/16.6`);
console.log(`   Issues: ${competitorScore.details.issues.length}`);
competitorScore.details.issues.forEach(issue => console.log(`   - ${issue}`));

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

console.log('\n=== OVERALL RESULTS ===');
console.log(`Total Score: ${totalScore}/100`);
console.log('\nModule Breakdown:');
console.log(`  📍 Google Business: ${moduleScores.googleBusinessProfile}`);
console.log(`  ⭐ Reviews: ${moduleScores.reviewSentiment}`);
console.log(`  🚀 Website: ${moduleScores.websitePerformance}`);
console.log(`  📱 Mobile: ${moduleScores.mobileExperience}`);
console.log(`  📸 Social: ${moduleScores.socialMediaPresence}`);
console.log(`  📊 Competitor: ${moduleScores.competitorAnalysis}`);
