const axios = require('axios');

class GeocodingService {
    constructor() {
        // Using OpenStreetMap Nominatim as a free geocoding service
        this.baseURL = 'https://nominatim.openstreetmap.org';
        this.userAgent = 'Sentinel-Soil-Analysis/1.0';
    }

    /**
     * Search for locations by name/address
     * @param {string} query - Search query (city name, address, etc.)
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Array>} Array of location results
     */
    async searchLocations(query, limit = 10) {
        try {
            const response = await axios.get(`${this.baseURL}/search`, {
                params: {
                    q: query,
                    format: 'json',
                    limit: limit,
                    addressdetails: 1,
                    countrycodes: '', // Allow all countries
                    dedupe: 1,
                    extratags: 1
                },
                headers: {
                    'User-Agent': this.userAgent
                },
                timeout: 5000
            });

            return this.formatResults(response.data);
        } catch (error) {
            console.error('Geocoding search error:', error.message);
            return this.getFallbackResults(query);
        }
    }

    /**
     * Reverse geocoding - get location details from coordinates
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} Location details
     */
    async reverseGeocode(lat, lon) {
        try {
            const response = await axios.get(`${this.baseURL}/reverse`, {
                params: {
                    lat: lat,
                    lon: lon,
                    format: 'json',
                    addressdetails: 1,
                    extratags: 1
                },
                headers: {
                    'User-Agent': this.userAgent
                },
                timeout: 5000
            });

            return this.formatSingleResult(response.data);
        } catch (error) {
            console.error('Reverse geocoding error:', error.message);
            return {
                name: `Location ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
                city: 'Unknown',
                country: 'Unknown',
                region: 'Unknown',
                lat: lat,
                lon: lon
            };
        }
    }

    /**
     * Format API results to consistent structure
     * @param {Array} results - Raw API results
     * @returns {Array} Formatted results
     */
    formatResults(results) {
        return results.map(result => this.formatSingleResult(result));
    }

    /**
     * Format a single result
     * @param {Object} result - Raw result object
     * @returns {Object} Formatted result
     */
    formatSingleResult(result) {
        const address = result.address || {};
        
        // Extract city name with fallbacks
        const city = address.city || 
                    address.town || 
                    address.village || 
                    address.municipality || 
                    address.hamlet || 
                    'Unknown';

        // Extract country
        const country = address.country || 'Unknown';

        // Extract region/state
        const region = address.state || 
                      address.province || 
                      address.county || 
                      address.region || 
                      'Unknown';

        // Create display name
        let displayName = result.display_name || `${city}, ${country}`;
        
        // Shorten display name if too long
        if (displayName.length > 60) {
            displayName = `${city}, ${region}, ${country}`;
        }

        return {
            name: displayName,
            city: city,
            country: country,
            region: region,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            type: result.type || 'location',
            importance: result.importance || 0
        };
    }

    /**
     * Provide fallback results when API fails
     * @param {string} query - Original search query
     * @returns {Array} Fallback results
     */
    getFallbackResults(query) {
        // Major cities as fallback
        const majorCities = [
            { name: 'New York City, NY, USA', city: 'New York City', country: 'USA', region: 'New York', lat: 40.7128, lon: -74.0060 },
            { name: 'London, England, UK', city: 'London', country: 'UK', region: 'England', lat: 51.5074, lon: -0.1278 },
            { name: 'Paris, Île-de-France, France', city: 'Paris', country: 'France', region: 'Île-de-France', lat: 48.8566, lon: 2.3522 },
            { name: 'Tokyo, Tokyo, Japan', city: 'Tokyo', country: 'Japan', region: 'Tokyo', lat: 35.6762, lon: 139.6503 },
            { name: 'Sydney, NSW, Australia', city: 'Sydney', country: 'Australia', region: 'NSW', lat: -33.8688, lon: 151.2093 },
            { name: 'São Paulo, SP, Brazil', city: 'São Paulo', country: 'Brazil', region: 'SP', lat: -23.5558, lon: -46.6396 },
            { name: 'Delhi, Delhi, India', city: 'Delhi', country: 'India', region: 'Delhi', lat: 28.6139, lon: 77.2090 },
            { name: 'Cairo, Cairo, Egypt', city: 'Cairo', country: 'Egypt', region: 'Cairo', lat: 30.0444, lon: 31.2357 }
        ];

        // Filter cities that match the query
        const filtered = majorCities.filter(city => 
            city.name.toLowerCase().includes(query.toLowerCase()) ||
            city.city.toLowerCase().includes(query.toLowerCase()) ||
            city.country.toLowerCase().includes(query.toLowerCase())
        );

        return filtered.length > 0 ? filtered : majorCities.slice(0, 5);
    }

    /**
     * Get popular agricultural locations
     * @returns {Array} Popular agricultural regions
     */
    getPopularAgricultureLocations() {
        return [
            { name: 'Central Valley, California, USA', city: 'Fresno', country: 'USA', region: 'California', lat: 36.7378, lon: -119.7871, type: 'agricultural' },
            { name: 'Po Valley, Lombardy, Italy', city: 'Milan', country: 'Italy', region: 'Lombardy', lat: 45.4642, lon: 9.1900, type: 'agricultural' },
            { name: 'Punjab, India', city: 'Ludhiana', country: 'India', region: 'Punjab', lat: 30.9010, lon: 75.8573, type: 'agricultural' },
            { name: 'Pampas, Buenos Aires, Argentina', city: 'Buenos Aires', country: 'Argentina', region: 'Buenos Aires', lat: -34.6118, lon: -58.3960, type: 'agricultural' },
            { name: 'Canterbury Plains, New Zealand', city: 'Christchurch', country: 'New Zealand', region: 'Canterbury', lat: -43.5321, lon: 172.6362, type: 'agricultural' },
            { name: 'Nile Delta, Egypt', city: 'Alexandria', country: 'Egypt', region: 'Alexandria', lat: 31.2001, lon: 29.9187, type: 'agricultural' },
            { name: 'Great Plains, Kansas, USA', city: 'Wichita', country: 'USA', region: 'Kansas', lat: 37.6872, lon: -97.3301, type: 'agricultural' },
            { name: 'Cerrado, Mato Grosso, Brazil', city: 'Cuiabá', country: 'Brazil', region: 'Mato Grosso', lat: -15.6014, lon: -56.0979, type: 'agricultural' }
        ];
    }
}

module.exports = new GeocodingService();
