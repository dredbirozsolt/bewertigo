const axios = require('axios');
const { RETRY_CONFIG } = require('../config/constants');

class GooglePlacesService {
    constructor() {
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
        this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    }

    /**
     * Autocomplete - Search suggestions as user types
     */
    async autocomplete(input, location = null, radius = 50000) {
        try {
            const params = {
                input,
                key: this.apiKey,
                language: 'de',
                components: 'country:at', // Austria only
                types: 'establishment'
            };

            if (location) {
                params.location = location;
                params.radius = radius;
            }

            const response = await axios.get(`${this.baseUrl}/autocomplete/json`, { params });

            if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                throw new Error(`Google Places API Error: ${response.data.status}`);
            }

            return response.data.predictions.map(pred => ({
                placeId: pred.place_id,
                description: pred.description,
                mainText: pred.structured_formatting?.main_text,
                secondaryText: pred.structured_formatting?.secondary_text
            }));
        } catch (error) {
            console.error('Autocomplete error:', error.message);
            throw error;
        }
    }

    /**
     * Get detailed place information
     */
    async getPlaceDetails(placeId) {
        try {
            const params = {
                place_id: placeId,
                key: this.apiKey,
                language: 'de',
                fields: [
                    'name',
                    'formatted_address',
                    'address_components',
                    'geometry',
                    'place_id',
                    'types',
                    'business_status',
                    'opening_hours',
                    'formatted_phone_number',
                    'international_phone_number',
                    'website',
                    'rating',
                    'user_ratings_total',
                    'reviews',
                    'photos',
                    'url',
                    'utc_offset',
                    'price_level'
                ].join(',')
            };

            const response = await axios.get(`${this.baseUrl}/details/json`, { params });

            if (response.data.status !== 'OK') {
                throw new Error(`Place Details Error: ${response.data.status}`);
            }

            return this._processPlaceDetails(response.data.result);
        } catch (error) {
            console.error('Place Details error:', error.message);
            throw error;
        }
    }

    /**
     * Get place photos
     */
    async getPlacePhotos(placeId, maxPhotos = 10) {
        try {
            const details = await this.getPlaceDetails(placeId);

            if (!details.photos || details.photos.length === 0) {
                return [];
            }

            const photos = details.photos.slice(0, maxPhotos).map(photo => ({
                reference: photo.photo_reference,
                width: photo.width,
                height: photo.height,
                url: this.getPhotoUrl(photo.photo_reference, 800)
            }));

            return photos;
        } catch (error) {
            console.error('Get Photos error:', error.message);
            return [];
        }
    }

    /**
     * Get photo URL
     * Use frontend API key for browser-side requests (HTTP referrer restriction)
     */
    getPhotoUrl(photoReference, maxWidth = 800) {
        const frontendKey = process.env.GOOGLE_MAPS_API_KEY || this.apiKey;
        return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${frontendKey}`;
    }

    /**
     * Find nearby competitors
     */
    async findNearbyCompetitors(location, businessTypes, initialRadius = 1500, excludePlaceId = null, businessName = '') {
        try {
            // Filter out generic types that every place has
            const genericTypes = ['establishment', 'point_of_interest', 'premise'];
            const specificBusinessTypes = Array.isArray(businessTypes)
                ? businessTypes.filter(type => !genericTypes.includes(type))
                : [businessTypes].filter(type => !genericTypes.includes(type));

            // Priority order: specific types come before broad types
            const typePriority = [
                'hair_care', 'barber_shop',              // Hair services - specific
                'restaurant', 'meal_delivery', 'meal_takeaway',  // Food - specific
                'dentist', 'doctor',                     // Healthcare - specific
                'lawyer', 'law_firm',                    // Legal - specific
                'gym', 'fitness_center',                 // Fitness - specific
                'spa',                                   // Wellness - specific
                'beauty_salon',                          // Beauty - broader
                'cafe', 'bar',                           // Food & drink - broader
                'store', 'food',                         // Very broad
            ];

            // Find the highest priority type from specificBusinessTypes
            let primaryType = specificBusinessTypes[0] || 'business';
            for (const priorityType of typePriority) {
                if (specificBusinessTypes.includes(priorityType)) {
                    primaryType = priorityType;
                    break;
                }
            }

            // For broad types like "restaurant", use keyword for better precision
            const broadTypes = ['restaurant', 'food', 'store', 'cafe'];
            const useKeyword = broadTypes.includes(primaryType);

            // Detect cuisine type from business name for restaurants/food
            let searchKeyword = '';
            const nameLower = businessName ? businessName.toLowerCase() : '';

            // Check if it's a restaurant/food type AND has cuisine in name
            if ((primaryType === 'restaurant' || primaryType === 'food') && nameLower) {
                if (nameLower.includes('pizza')) searchKeyword = 'pizzeria pizza';
                else if (nameLower.includes('burger')) searchKeyword = 'burger restaurant';
                else if (nameLower.includes('sushi')) searchKeyword = 'sushi restaurant';
                else if (nameLower.includes('kebab') || nameLower.includes('döner') || nameLower.includes('doner')) searchKeyword = 'kebab döner';
                else if (nameLower.includes('china') || nameLower.includes('asia')) searchKeyword = 'chinesisches restaurant';
                else if (nameLower.includes('indian')) searchKeyword = 'indisches restaurant';
                else if (nameLower.includes('italien') || nameLower.includes('italian')) searchKeyword = 'italienisches restaurant';
                else if (nameLower.includes('steak')) searchKeyword = 'steakhouse';
                else if (nameLower.includes('beisl')) searchKeyword = 'beisl wirtshaus';
                else searchKeyword = 'restaurant essen';
            } else if (useKeyword) {
                // Keyword mapping for other broad types
                const typeKeywordMap = {
                    'restaurant': 'restaurant essen',
                    'food': 'restaurant',
                    'cafe': 'cafe',
                    'bar': 'bar',
                    'store': 'geschäft'
                };
                searchKeyword = typeKeywordMap[primaryType] || 'restaurant';
            } else {
                // Specific types don't need keywords (hair_care, etc.)
                searchKeyword = '';
            }

            console.log('=== COMPETITOR SEARCH DEBUG ===');
            console.log('Original business types:', businessTypes);
            console.log('Specific types (filtered):', specificBusinessTypes);
            console.log('Primary type:', primaryType);
            console.log('Use keyword search:', useKeyword);
            console.log('Search keyword:', searchKeyword);

            // Types to exclude (retail, lodging, etc.)
            const excludeTypes = [
                'lodging', 'hotel', 'motel',
                'supermarket', 'grocery_or_supermarket', 'convenience_store',
                'department_store', 'shopping_mall',
                'gas_station', 'car_repair', 'car_dealer',
                'bank', 'atm', 'post_office',
                'school', 'university', 'library',
                'hospital', 'pharmacy' // Unless searching for these
            ];

            // If searching for pharmacy/hospital, don't exclude them
            if (['pharmacy', 'hospital', 'doctor', 'dentist'].includes(primaryType)) {
                const healthIndex = excludeTypes.indexOf('hospital');
                if (healthIndex > -1) excludeTypes.splice(healthIndex, 1);
                const pharmacyIndex = excludeTypes.indexOf('pharmacy');
                if (pharmacyIndex > -1) excludeTypes.splice(pharmacyIndex, 1);
            }

            // Progressive radius expansion: try multiple radii until we find enough competitors
            const radii = [1500, 3000, 5000, 10000]; // 1.5km, 3km, 5km, 10km
            let allCompetitors = [];

            for (const radius of radii) {
                console.log(`\n🔍 Searching with radius: ${radius}m`);

                const params = {
                    location: `${location.lat},${location.lng}`,
                    radius,
                    key: this.apiKey,
                    language: 'de'
                };

                // Use keyword for broad types, type for specific ones
                if (useKeyword && searchKeyword) {
                    params.keyword = searchKeyword;
                } else {
                    params.type = primaryType;
                }

                const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, { params });

                if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
                    throw new Error(`Nearby Search Error: ${response.data.status}`);
                }

                console.log(`Total nearby places found: ${response.data.results.length}`);

                // Filter: exclude self + must be relevant + exclude unwanted types
                let competitors = response.data.results
                    .map(place => {
                        if (place.place_id === excludePlaceId) return null;

                        const placeTypes = place.types || [];
                        const placeSpecificTypes = placeTypes.filter(type => !genericTypes.includes(type));

                        // Exclude unwanted business types
                        const hasExcludedType = excludeTypes.some(type => placeTypes.includes(type));
                        if (hasExcludedType) {
                            console.log(`Place: ${place.name}, Excluded: Has excluded type (${placeTypes.find(t => excludeTypes.includes(t))})`);
                            return null;
                        }

                        // Must have the primary type OR matching keyword in name
                        const hasExactType = placeTypes.includes(primaryType);

                        // For specific types (not broad), require exact match only
                        if (!useKeyword) {
                            // Strict matching for hair_care, beauty_salon, etc.
                            if (!hasExactType) {
                                console.log(`Place: ${place.name}, Types: ${placeSpecificTypes.join(', ')}, Match: false (no exact type: ${primaryType})`);
                                return null;
                            }
                        } else {
                            // For broad types (restaurant, food), allow related types
                            const hasRelatedType = specificBusinessTypes.some(type => placeTypes.includes(type));
                            if (!hasExactType && !hasRelatedType) {
                                console.log(`Place: ${place.name}, Types: ${placeSpecificTypes.join(', ')}, Match: false`);
                                return null;
                            }
                        }

                        console.log(`Place: ${place.name}, Types: ${placeSpecificTypes.join(', ')}, Match: true`);

                        return place;
                    })
                    .filter(place => place !== null);

                // Add to collection (avoid duplicates)
                competitors.forEach(comp => {
                    if (!allCompetitors.find(c => c.place_id === comp.place_id)) {
                        allCompetitors.push(comp);
                    }
                });

                console.log(`Competitors found so far: ${allCompetitors.length}`);

                // If we have at least 3 competitors, stop expanding
                if (allCompetitors.length >= 3) {
                    console.log(`✓ Found enough competitors (${allCompetitors.length}), stopping search`);
                    break;
                }

                console.log(`⚠️ Only ${allCompetitors.length} competitors found, expanding search radius...`);
            }

            // Sort by distance and rating
            const sortedCompetitors = allCompetitors
                .sort((a, b) => {
                    // Calculate distance for both
                    const distA = this._calculateDistance(location, a.geometry.location);
                    const distB = this._calculateDistance(location, b.geometry.location);

                    // Prioritize closer competitors (within 0.5km get extra weight)
                    const closeA = distA <= 0.5 ? 1 : 2;
                    const closeB = distB <= 0.5 ? 1 : 2;

                    if (closeA !== closeB) {
                        return closeA - closeB; // Closer = better
                    }

                    // Within same distance tier, sort by rating
                    if ((b.rating || 0) !== (a.rating || 0)) {
                        return (b.rating || 0) - (a.rating || 0);
                    }

                    // Finally by review count
                    return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
                })
                .slice(0, 3); // Take top 3

            console.log(`\n✅ Final competitors selected: ${sortedCompetitors.length}`);
            console.log('=== END DEBUG ===');

            // Fetch detailed info for each competitor (including reviews and photos)
            const detailedCompetitors = await Promise.all(
                sortedCompetitors.map(async (place) => {
                    try {
                        const details = await this.getPlaceDetails(place.place_id);
                        return {
                            placeId: place.place_id,
                            name: place.name,
                            rating: place.rating || 0,
                            reviewCount: place.user_ratings_total || 0,
                            location: place.geometry.location,
                            distance: this._calculateDistance(location, place.geometry.location),
                            photoCount: details.photoCount || 0,
                            reviews: details.reviews || []
                        };
                    } catch (error) {
                        console.error(`Failed to get details for competitor ${place.name}:`, error.message);
                        // Return basic info if details fail
                        return {
                            placeId: place.place_id,
                            name: place.name,
                            rating: place.rating || 0,
                            reviewCount: place.user_ratings_total || 0,
                            location: place.geometry.location,
                            distance: this._calculateDistance(location, place.geometry.location),
                            photoCount: 0,
                            reviews: []
                        };
                    }
                })
            );

            return detailedCompetitors;
        } catch (error) {
            console.error('Find Competitors error:', error.message);
            return [];
        }
    }

    /**
     * Process raw place details
     */
    _processPlaceDetails(place) {
        // Extract city from address components
        const city = place.address_components?.find(
            comp => comp.types.includes('locality')
        )?.long_name || '';

        // Extract relevant business type (prioritize specific types over generic)
        const businessType = this._extractBusinessType(place.types || []);

        return {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            city,
            location: place.geometry?.location,
            types: place.types || [],
            businessType,

            // Contact info
            phone: place.formatted_phone_number,
            internationalPhone: place.international_phone_number,
            website: place.website,

            // Business info
            businessStatus: place.business_status,
            openingHours: place.opening_hours,
            priceLevel: place.price_level,

            // Reviews
            rating: place.rating,
            totalReviews: place.user_ratings_total,
            reviews: place.reviews || [],

            // Media
            photos: place.photos || [],
            photoCount: (place.photos || []).length,

            // Links
            googleMapsUrl: place.url
        };
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    _calculateDistance(point1, point2) {
        const R = 6371; // Earth radius in km
        const dLat = this._toRad(point2.lat - point1.lat);
        const dLon = this._toRad(point2.lng - point1.lng);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._toRad(point1.lat)) * Math.cos(this._toRad(point2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return Math.round(distance * 100) / 100; // Round to 2 decimals
    }

    _toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Extract most relevant business type from Google types array
     * Prioritize specific business types over generic ones
     */
    _extractBusinessType(types) {
        // Priority order: specific business types first, generic last
        const priorityTypes = [
            'restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery',
            'night_club', 'food',
            'hair_care', 'beauty_salon', 'spa', 'barber_shop',
            'gym', 'fitness_center',
            'hotel', 'lodging',
            'store', 'shopping_mall', 'clothing_store', 'jewelry_store', 'shoe_store',
            'supermarket', 'convenience_store',
            'pharmacy', 'dentist', 'doctor', 'hospital',
            'car_repair', 'car_dealer', 'gas_station',
            'real_estate_agency', 'lawyer', 'accounting'
        ];

        // Find first matching priority type
        for (const priorityType of priorityTypes) {
            if (types.includes(priorityType)) {
                return priorityType;
            }
        }

        // If no priority type found, return first non-generic type
        const genericTypes = ['point_of_interest', 'establishment'];
        for (const type of types) {
            if (!genericTypes.includes(type)) {
                return type;
            }
        }

        // Fallback to first type or 'default'
        return types[0] || 'default';
    }
}

module.exports = new GooglePlacesService();
