const turf = require('@turf/turf');

class GeoService {
    constructor() {
        this.locationDatabase = this.initializeLocationDatabase();
    }

    /**
     * Get detailed location information
     */
    async getLocationInfo(location) {
        const { lat, lon } = location;
        
        try {
            // In production, this would call a geocoding service like OpenStreetMap Nominatim
            const locationInfo = await this.reverseGeocode(lat, lon);
            
            return {
                country: locationInfo.country || 'Unknown',
                region: locationInfo.region || 'Unknown',
                city: locationInfo.city || 'Unknown',
                elevation: await this.getElevation(lat, lon),
                timezone: this.getTimezone(lat, lon),
                climate: this.getClimateInfo(lat, lon)
            };
        } catch (error) {
            console.error('Error getting location info:', error);
            return this.getMockLocationInfo(lat, lon);
        }
    }

    /**
     * Search for locations by name or coordinates
     */
    async searchLocations(query, type = 'all') {
        try {
            // Check if query is coordinates
            const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lon = parseFloat(coordMatch[2]);
                
                if (this.isValidCoordinate(lat, lon)) {
                    const locationInfo = await this.getLocationInfo({ lat, lon });
                    return [{
                        type: 'coordinate',
                        name: `${lat}, ${lon}`,
                        lat,
                        lon,
                        ...locationInfo
                    }];
                }
            }

            // Search in location database
            return this.searchLocationDatabase(query, type);
        } catch (error) {
            console.error('Error searching locations:', error);
            return [];
        }
    }

    /**
     * Reverse geocoding (coordinates to place name)
     */
    async reverseGeocode(lat, lon) {
        // Mock implementation - replace with real service in production
        return this.getMockLocationInfo(lat, lon);
    }

    /**
     * Get elevation for coordinates
     */
    async getElevation(lat, lon) {
        // Mock elevation based on rough geographic patterns
        // In production, use a real elevation service
        
        // Rough elevation estimation based on latitude/longitude patterns
        let elevation = 100; // Base elevation in meters
        
        // Mountain ranges (simplified)
        if ((lat > 25 && lat < 50 && lon > -125 && lon < -100) || // Rocky Mountains
            (lat > 35 && lat < 50 && lon > -10 && lon < 20) ||    // Alps
            (lat > 25 && lat < 35 && lon > 70 && lon < 100)) {    // Himalayas
            elevation += Math.random() * 2000 + 1000;
        }
        
        // Coastal areas (lower elevation)
        if (this.isNearCoast(lat, lon)) {
            elevation = Math.random() * 200;
        }
        
        // Add some random variation
        elevation += (Math.random() - 0.5) * 200;
        
        return Math.max(0, Math.round(elevation));
    }

    /**
     * Get timezone information
     */
    getTimezone(lat, lon) {
        // Simplified timezone calculation based on longitude
        const offsetHours = Math.round(lon / 15);
        const utcOffset = Math.max(-12, Math.min(12, offsetHours));
        
        return {
            utcOffset,
            name: `UTC${utcOffset >= 0 ? '+' : ''}${utcOffset}`,
            description: `${Math.abs(utcOffset)} hours ${utcOffset >= 0 ? 'ahead of' : 'behind'} UTC`
        };
    }

    /**
     * Get climate information based on location
     */
    getClimateInfo(lat, lon) {
        const absLat = Math.abs(lat);
        
        let climate = {
            zone: 'temperate',
            description: 'Temperate climate with moderate temperatures',
            averageTemp: 15,
            precipitation: 'moderate'
        };
        
        if (absLat < 23.5) {
            climate = {
                zone: 'tropical',
                description: 'Tropical climate with high temperatures and humidity',
                averageTemp: 26,
                precipitation: 'high'
            };
        } else if (absLat > 66.5) {
            climate = {
                zone: 'polar',
                description: 'Polar climate with very cold temperatures',
                averageTemp: -5,
                precipitation: 'low'
            };
        } else if (absLat > 40) {
            climate = {
                zone: 'continental',
                description: 'Continental climate with seasonal temperature variations',
                averageTemp: 10,
                precipitation: 'moderate'
            };
        }
        
        // Adjust for inland vs coastal
        if (this.isNearCoast(lat, lon)) {
            climate.description += ' (coastal moderation)';
            climate.averageTemp += 2;
        }
        
        // Add seasonal information
        climate.seasons = this.getSeasonalInfo(lat);
        
        return climate;
    }

    /**
     * Search the location database
     */
    searchLocationDatabase(query, type) {
        const queryLower = query.toLowerCase();
        
        return this.locationDatabase
            .filter(location => {
                if (type !== 'all' && location.type !== type) return false;
                
                return location.name.toLowerCase().includes(queryLower) ||
                       location.country.toLowerCase().includes(queryLower) ||
                       location.region.toLowerCase().includes(queryLower);
            })
            .slice(0, 10); // Limit results
    }

    /**
     * Check if coordinates are valid
     */
    isValidCoordinate(lat, lon) {
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }

    /**
     * Check if location is near coast (simplified)
     */
    isNearCoast(lat, lon) {
        // Very simplified coastal detection
        // In production, use proper geographic data
        
        // Major coastal indicators (simplified)
        const coastalRegions = [
            { minLat: 30, maxLat: 45, minLon: -125, maxLon: -115 }, // US West Coast
            { minLat: 25, maxLat: 45, minLon: -85, maxLon: -65 },   // US East Coast
            { minLat: 35, maxLat: 65, minLon: -10, maxLon: 30 },    // European Coast
            { minLat: -40, maxLat: -10, minLon: 110, maxLon: 155 }  // Australian Coast
        ];
        
        return coastalRegions.some(region => 
            lat >= region.minLat && lat <= region.maxLat &&
            lon >= region.minLon && lon <= region.maxLon
        );
    }

    /**
     * Get seasonal information
     */
    getSeasonalInfo(lat) {
        const hemisphere = lat >= 0 ? 'northern' : 'southern';
        const currentMonth = new Date().getMonth();
        
        let currentSeason;
        if (hemisphere === 'northern') {
            if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'spring';
            else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'summer';
            else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'autumn';
            else currentSeason = 'winter';
        } else {
            if (currentMonth >= 2 && currentMonth <= 4) currentSeason = 'autumn';
            else if (currentMonth >= 5 && currentMonth <= 7) currentSeason = 'winter';
            else if (currentMonth >= 8 && currentMonth <= 10) currentSeason = 'spring';
            else currentSeason = 'summer';
        }
        
        return {
            hemisphere,
            currentSeason,
            description: `Currently ${currentSeason} in the ${hemisphere} hemisphere`
        };
    }

    /**
     * Get mock location information
     */
    getMockLocationInfo(lat, lon) {
        // Generate reasonable mock data based on coordinates
        let country = 'Unknown';
        let region = 'Unknown';
        let city = 'Unknown';
        
        // Very basic geographic mapping
        if (lat >= 25 && lat <= 49 && lon >= -125 && lon <= -66) {
            country = 'United States';
            if (lon <= -95) region = 'Western US';
            else region = 'Eastern US';
        } else if (lat >= 35 && lat <= 71 && lon >= -10 && lon <= 40) {
            country = 'Europe';
            region = 'Central Europe';
        } else if (lat >= -45 && lat <= -10 && lon >= 110 && lon <= 155) {
            country = 'Australia';
            region = 'Australian Mainland';
        } else if (lat >= 45 && lat <= 85 && lon >= -180 && lon <= -50) {
            country = 'Canada';
            region = 'Canadian Territory';
        }
        
        // Generate a mock city name
        city = `Location ${lat.toFixed(2)}_${lon.toFixed(2)}`;
        
        return { country, region, city };
    }

    /**
     * Initialize location database
     */
    initializeLocationDatabase() {
        return [
            // Major cities
            { name: 'New York', type: 'city', lat: 40.7128, lon: -74.0060, country: 'United States', region: 'New York' },
            { name: 'London', type: 'city', lat: 51.5074, lon: -0.1278, country: 'United Kingdom', region: 'England' },
            { name: 'Paris', type: 'city', lat: 48.8566, lon: 2.3522, country: 'France', region: 'Île-de-France' },
            { name: 'Tokyo', type: 'city', lat: 35.6762, lon: 139.6503, country: 'Japan', region: 'Kantō' },
            { name: 'Sydney', type: 'city', lat: -33.8688, lon: 151.2093, country: 'Australia', region: 'New South Wales' },
            { name: 'São Paulo', type: 'city', lat: -23.5558, lon: -46.6396, country: 'Brazil', region: 'São Paulo' },
            { name: 'Mumbai', type: 'city', lat: 19.0760, lon: 72.8777, country: 'India', region: 'Maharashtra' },
            { name: 'Cairo', type: 'city', lat: 30.0444, lon: 31.2357, country: 'Egypt', region: 'Cairo Governorate' },
            
            // Agricultural regions
            { name: 'Central Valley', type: 'region', lat: 36.7378, lon: -119.7871, country: 'United States', region: 'California' },
            { name: 'Pampas', type: 'region', lat: -34.0000, lon: -64.0000, country: 'Argentina', region: 'Buenos Aires' },
            { name: 'Po Valley', type: 'region', lat: 45.0000, lon: 10.0000, country: 'Italy', region: 'Lombardy' },
            { name: 'Ganges Plain', type: 'region', lat: 26.0000, lon: 84.0000, country: 'India', region: 'Uttar Pradesh' },
            { name: 'Great Plains', type: 'region', lat: 41.0000, lon: -100.0000, country: 'United States', region: 'Nebraska' },
            
            // Countries
            { name: 'United States', type: 'country', lat: 39.8283, lon: -98.5795, country: 'United States', region: 'North America' },
            { name: 'China', type: 'country', lat: 35.8617, lon: 104.1954, country: 'China', region: 'East Asia' },
            { name: 'India', type: 'country', lat: 20.5937, lon: 78.9629, country: 'India', region: 'South Asia' },
            { name: 'Brazil', type: 'country', lat: -14.2350, lon: -51.9253, country: 'Brazil', region: 'South America' },
            { name: 'Australia', type: 'country', lat: -25.2744, lon: 133.7751, country: 'Australia', region: 'Oceania' }
        ];
    }

    /**
     * Calculate distance between two points
     */
    calculateDistance(point1, point2) {
        return turf.distance(
            turf.point([point1.lon, point1.lat]),
            turf.point([point2.lon, point2.lat]),
            { units: 'kilometers' }
        );
    }

    /**
     * Create a bounding box around a point
     */
    createBoundingBox(lat, lon, radiusKm) {
        const center = turf.point([lon, lat]);
        const bbox = turf.bbox(turf.buffer(center, radiusKm, { units: 'kilometers' }));
        
        return {
            minLon: bbox[0],
            minLat: bbox[1],
            maxLon: bbox[2],
            maxLat: bbox[3]
        };
    }

    /**
     * Check if point is within bounding box
     */
    isWithinBounds(point, bounds) {
        return point.lat >= bounds.minLat && point.lat <= bounds.maxLat &&
               point.lon >= bounds.minLon && point.lon <= bounds.maxLon;
    }
}

module.exports = new GeoService();
