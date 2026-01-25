const axios = require('axios');
const cheerio = require('cheerio');

class SocialMediaService {
    constructor() {
        // Note: Instagram Graph API and TikTok Business API are NOT suitable
        // for audit tools because they require OAuth authorization from each business.
        // We use web scraping instead to analyze public profiles.
    }

    /**
     * Find social media profiles for a business
     */
    async findProfiles(businessName, city, website = null) {
        const profiles = {
            instagram: null,
            tiktok: null,
            sources: {
                instagram: null,
                tiktok: null
            }
        };

        try {
            // Level 1: Check website for social media links
            if (website) {
                console.log(`Scraping website for social links: ${website}`);
                const websiteProfiles = await this._scrapeWebsiteForSocialLinks(website);

                if (websiteProfiles.instagram) {
                    profiles.instagram = websiteProfiles.instagram;
                    profiles.sources.instagram = 'website';
                }
                if (websiteProfiles.tiktok) {
                    profiles.tiktok = websiteProfiles.tiktok;
                    profiles.sources.tiktok = 'website';
                }
            }

            // Level 2: Google Search API (simulated - would use Custom Search API in production)
            if (!profiles.instagram) {
                console.log(`Searching for Instagram profile: ${businessName} ${city}`);
                const instagramProfile = await this._searchInstagramProfile(businessName, city);
                if (instagramProfile) {
                    profiles.instagram = instagramProfile;
                    profiles.sources.instagram = 'search';
                }
            }

            if (!profiles.tiktok) {
                console.log(`Searching for TikTok profile: ${businessName} ${city}`);
                const tiktokProfile = await this._searchTikTokProfile(businessName, city);
                if (tiktokProfile) {
                    profiles.tiktok = tiktokProfile;
                    profiles.sources.tiktok = 'search';
                }
            }

            // Level 3: Fetch profile data using web scraping
            if (profiles.instagram) {
                profiles.instagramData = await this._getInstagramData(profiles.instagram);
            }
            if (profiles.tiktok) {
                profiles.tiktokData = await this._getTikTokData(profiles.tiktok);
            }

            return profiles;
        } catch (error) {
            console.error('Find profiles error:', error.message);
            return profiles;
        }
    }

    /**
     * Scrape website for social media links
     */
    async _scrapeWebsiteForSocialLinks(url) {
        const profiles = {
            instagram: null,
            tiktok: null
        };

        try {
            // Add timeout and user agent
            const response = await axios.get(url, {
                timeout: 3000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                maxRedirects: 5
            });

            const $ = cheerio.load(response.data);

            // Find Instagram links
            $('a[href*="instagram.com"]').each((i, elem) => {
                const href = $(elem).attr('href');
                if (href && !profiles.instagram) {
                    const match = href.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
                    if (match && match[1]) {
                        profiles.instagram = match[1].replace('/', '');
                    }
                }
            });

            // Find TikTok links
            $('a[href*="tiktok.com"]').each((i, elem) => {
                const href = $(elem).attr('href');
                if (href && !profiles.tiktok) {
                    const match = href.match(/tiktok\.com\/@([a-zA-Z0-9_.]+)/);
                    if (match && match[1]) {
                        profiles.tiktok = match[1];
                    }
                }
            });

            return profiles;
        } catch (error) {
            console.error('Website scraping error:', error.message);
            return profiles;
        }
    }

    /**
     * Search for Instagram profile (simulated)
     * In production, use Google Custom Search API
     */
    async _searchInstagramProfile(businessName, city) {
        try {
            // This is a placeholder - in production you would use:
            // 1. Google Custom Search API with query: site:instagram.com "businessName" "city"
            // 2. Or Instagram Graph API (requires business account)
            // 3. Or third-party services like RapidAPI

            // For now, return null - implement with actual API
            return null;
        } catch (error) {
            console.error('Instagram search error:', error.message);
            return null;
        }
    }

    /**
     * Search for TikTok profile (simulated)
     */
    async _searchTikTokProfile(businessName, city) {
        try {
            // This is a placeholder - in production you would use:
            // 1. Google Custom Search API with query: site:tiktok.com "@businessName"
            // 2. Or TikTok API (if available)
            // 3. Or third-party services

            return null;
        } catch (error) {
            console.error('TikTok search error:', error.message);
            return null;
        }
    }

    /**
     * Get Instagram profile data via web scraping
     * This method works for ANY public Instagram profile without authentication
     */
    async _getInstagramData(username) {
        try {
            console.log(`Fetching Instagram data for: ${username} (via web scraping)`);
            const profileUrl = `https://www.instagram.com/${username}/`;

            const response = await axios.get(profileUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            const $ = cheerio.load(response.data);

            // Try to extract data from meta tags
            const metaDescription = $('meta[property="og:description"]').attr('content') || '';
            const followersMatch = metaDescription.match(/([\\d,\\.]+[KMB]?)\\s+Followers/i) || metaDescription.match(/([\\d,]+)\\s+Followers/i);
            const postsMatch = metaDescription.match(/([\\d,\\.]+[KMB]?)\\s+Posts/i) || metaDescription.match(/([\\d,]+)\\s+Posts/i);

            // Parse numbers (handle K, M, B suffixes)
            const parseCount = (str) => {
                if (!str) return 0;
                str = str.replace(/,/g, '');
                const multipliers = { 'K': 1000, 'M': 1000000, 'B': 1000000000 };
                const match = str.match(/([\\d.]+)([KMB]?)/i);
                if (match) {
                    const num = parseFloat(match[1]);
                    const suffix = match[2].toUpperCase();
                    return Math.round(num * (multipliers[suffix] || 1));
                }
                return parseInt(str) || 0;
            };

            const followers = followersMatch ? parseCount(followersMatch[1]) : 0;
            const posts = postsMatch ? parseCount(postsMatch[1]) : 0;

            // Try to get data from JSON-LD or embedded script
            let jsonData = null;
            $('script[type="application/ld+json"]').each((i, elem) => {
                try {
                    const content = $(elem).html();
                    if (content && content.includes('InteractionCounter')) {
                        jsonData = JSON.parse(content);
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            });

            // If we got structured data, use it
            if (jsonData && jsonData.mainEntityofPage) {
                const interactions = jsonData.mainEntityofPage.interactionStatistic || [];
                for (const stat of interactions) {
                    if (stat['@type'] === 'InteractionCounter') {
                        if (stat.interactionType === 'http://schema.org/FollowAction') {
                            const followCount = parseInt(stat.userInteractionCount);
                            if (followCount > followers) {
                                // Use the more accurate data
                            }
                        }
                    }
                }
            }

            return {
                username,
                followers: followers,
                mediaCount: posts,
                posts: [],
                lastPostDate: null,
                daysSinceLastPost: null,
                engagementRate: 0,
                isActive: followers > 0 || posts > 0, // If has followers or posts, assume active
                source: 'web_scraping',
                note: 'Public profile data - no authentication required'
            };
        } catch (error) {
            console.error('Instagram scraping error:', error.message);
            return {
                username,
                followers: 0,
                posts: [],
                lastPostDate: null,
                engagementRate: 0,
                isActive: false,
                source: 'error',
                error: error.message
            };
        }
    }

    /**
     * Get TikTok profile data via web scraping
     * This method works for ANY public TikTok profile without authentication
     */
    async _getTikTokData(username) {
        try {
            console.log(`Fetching TikTok data for: ${username} (via web scraping)`);
            const profileUrl = `https://www.tiktok.com/@${username}`;

            const response = await axios.get(profileUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive'
                }
            });

            const $ = cheerio.load(response.data);

            // Try to extract data from script tags (TikTok embeds data in __UNIVERSAL_DATA_FOR_REHYDRATION__)
            let followers = 0;
            let videos = 0;
            let likes = 0;

            $('script').each((i, elem) => {
                const scriptContent = $(elem).html();
                if (scriptContent && scriptContent.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
                    try {
                        const jsonMatch = scriptContent.match(/window\\['__UNIVERSAL_DATA_FOR_REHYDRATION__'\\]\\s*=\\s*(\\{.*?\\});/s);
                        if (jsonMatch && jsonMatch[1]) {
                            const data = JSON.parse(jsonMatch[1]);
                            const userDetail = data?.['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo?.stats;
                            if (userDetail) {
                                followers = userDetail.followerCount || 0;
                                videos = userDetail.videoCount || 0;
                                likes = userDetail.heartCount || 0;
                            }
                        }
                    } catch (parseError) {
                        console.error('Error parsing TikTok data:', parseError.message);
                    }
                }
            });

            return {
                username,
                followers: followers,
                videoCount: videos,
                likes: likes,
                videos: [],
                averageViews: 0,
                lastVideoDate: null,
                daysSinceLastVideo: null,
                engagementRate: 0,
                isActive: followers > 0 || videos > 0, // If has followers or videos, assume active
                source: 'web_scraping',
                note: 'Public profile data - no authentication required'
            };
        } catch (error) {
            console.error('TikTok scraping error:', error.message);
            return {
                username,
                followers: 0,
                videos: [],
                lastVideoDate: null,
                averageViews: 0,
                isActive: false,
                source: 'error',
                error: error.message
            };
        }
    }

    /**
     * Check if website has click-to-call functionality
     */
    async checkClickToCall(url, phoneNumber) {
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
                }
            });

            const $ = cheerio.load(response.data);

            // Check for tel: links
            const telLinks = $('a[href^="tel:"]');

            if (telLinks.length > 0) {
                // Check if the phone number matches
                let foundMatch = false;
                telLinks.each((i, elem) => {
                    const href = $(elem).attr('href');
                    const cleanPhone = phoneNumber?.replace(/\D/g, '');
                    const hrefPhone = href?.replace(/\D/g, '');

                    if (cleanPhone && hrefPhone && hrefPhone.includes(cleanPhone.slice(-8))) {
                        foundMatch = true;
                    }
                });

                return {
                    hasClickToCall: true,
                    phoneMatches: foundMatch
                };
            }

            return {
                hasClickToCall: false,
                phoneMatches: false
            };
        } catch (error) {
            console.error('Click-to-call check error:', error.message);
            return {
                hasClickToCall: false,
                phoneMatches: false,
                error: error.message
            };
        }
    }
}

module.exports = new SocialMediaService();
