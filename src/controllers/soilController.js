const sentinelService = require('../services/sentinelService');
const soilAnalysisService = require('../services/soilAnalysisService');
const geoService = require('../services/geoService');
const geocodingService = require('../services/geocodingService');

class SoilController {
    /**
     * Get comprehensive soil analysis for a given location
     */
    async getSoilAnalysis(req, res) {
        try {
            const { lat, lon, startDate, endDate } = req.query;
            
            if (!lat || !lon) {
                return res.status(400).json({ 
                    error: 'Latitude and longitude are required' 
                });
            }

            // Validate coordinates
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);
            
            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({ 
                    error: 'Invalid coordinates provided' 
                });
            }

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return res.status(400).json({ 
                    error: 'Coordinates out of valid range' 
                });
            }

            const location = { lat: latitude, lon: longitude };
            const dateRange = {
                start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: endDate || new Date().toISOString().split('T')[0]
            };

            // Get Sentinel satellite data
            console.log(`🛰️  Fetching Sentinel data for location: ${lat}, ${lon}`);
            const sentinelData = await sentinelService.getSentinelData(location, dateRange);
            
            // Perform soil analysis
            console.log('🔬 Analyzing soil data...');
            const soilAnalysis = await soilAnalysisService.analyzeSoilData(sentinelData, location);
            
            // Get location information
            const locationInfo = await geoService.getLocationInfo(location);

            const response = {
                location: {
                    ...location,
                    ...locationInfo
                },
                dateRange,
                sentinelData: {
                    scenes: sentinelData.scenes?.length || 0,
                    cloudCover: sentinelData.averageCloudCover || 'N/A',
                    lastUpdate: sentinelData.lastUpdate || new Date().toISOString()
                },
                soilAnalysis: {
                    moisture: soilAnalysis.moisture,
                    composition: soilAnalysis.composition,
                    ndvi: soilAnalysis.ndvi,
                    temperature: soilAnalysis.temperature,
                    recommendations: soilAnalysis.recommendations
                },
                metadata: {
                    analysisDate: new Date().toISOString(),
                    dataSource: 'Sentinel-2',
                    confidence: soilAnalysis.confidence || 'medium'
                }
            };

            res.json(response);

        } catch (error) {
            console.error('Error in soil analysis:', error);
            res.status(500).json({ 
                error: 'Failed to analyze soil data',
                message: error.message 
            });
        }
    }

    /**
     * Get soil data by location with filtering options
     */
    async getSoilByLocation(req, res) {
        try {
            const { lat, lon, radius = 1000, parameters } = req.query;
            
            if (!lat || !lon) {
                return res.status(400).json({ 
                    error: 'Latitude and longitude are required' 
                });
            }

            const location = { 
                lat: parseFloat(lat), 
                lon: parseFloat(lon),
                radius: parseInt(radius)
            };

            const requestedParameters = parameters ? parameters.split(',') : ['all'];
            
            const soilData = await soilAnalysisService.getSoilByLocation(location, requestedParameters);
            
            res.json({
                location,
                parameters: requestedParameters,
                data: soilData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error getting soil by location:', error);
            res.status(500).json({ 
                error: 'Failed to get soil data by location',
                message: error.message 
            });
        }
    }

    /**
     * Get raw Sentinel satellite data
     */
    async getSentinelData(req, res) {
        try {
            const { lat, lon, startDate, endDate, cloudCover = 20 } = req.query;
            
            if (!lat || !lon) {
                return res.status(400).json({ 
                    error: 'Latitude and longitude are required' 
                });
            }

            const location = { lat: parseFloat(lat), lon: parseFloat(lon) };
            const dateRange = {
                start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end: endDate || new Date().toISOString().split('T')[0]
            };

            const options = {
                maxCloudCover: parseInt(cloudCover),
                includeMetadata: true
            };

            const sentinelData = await sentinelService.getSentinelData(location, dateRange, options);
            
            res.json({
                location,
                dateRange,
                options,
                data: sentinelData,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error getting Sentinel data:', error);
            res.status(500).json({ 
                error: 'Failed to get Sentinel data',
                message: error.message 
            });
        }
    }

    /**
     * Search for locations by name or coordinates using geocoding service
     */
    async searchLocations(req, res) {
        try {
            const { query, type = 'all', limit = 10 } = req.query;
            
            if (!query) {
                return res.status(400).json({ 
                    error: 'Search query is required' 
                });
            }

            // Use the new geocoding service for enhanced location search
            let locations = [];
            
            if (type === 'agricultural' || type === 'popular') {
                // Get popular agricultural locations
                locations = geocodingService.getPopularAgricultureLocations();
                
                // Filter by query if provided
                if (query.trim()) {
                    locations = locations.filter(loc => 
                        loc.name.toLowerCase().includes(query.toLowerCase()) ||
                        loc.city.toLowerCase().includes(query.toLowerCase()) ||
                        loc.country.toLowerCase().includes(query.toLowerCase()) ||
                        loc.region.toLowerCase().includes(query.toLowerCase())
                    );
                }
            } else {
                // Search using geocoding service
                locations = await geocodingService.searchLocations(query, parseInt(limit));
            }
            
            res.json({
                query,
                type,
                results: locations,
                count: locations.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error searching locations:', error);
            res.status(500).json({ 
                error: 'Failed to search locations',
                message: error.message 
            });
        }
    }

    /**
     * Get location details from coordinates (reverse geocoding)
     */
    async getLocationFromCoordinates(req, res) {
        try {
            const { lat, lon } = req.query;
            
            if (!lat || !lon) {
                return res.status(400).json({ 
                    error: 'Latitude and longitude are required' 
                });
            }

            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({ 
                    error: 'Invalid coordinates provided' 
                });
            }

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return res.status(400).json({ 
                    error: 'Coordinates are out of valid range' 
                });
            }

            const locationDetails = await geocodingService.reverseGeocode(latitude, longitude);
            
            res.json({
                coordinates: { lat: latitude, lon: longitude },
                location: locationDetails,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Error reverse geocoding:', error);
            res.status(500).json({ 
                error: 'Failed to get location details',
                message: error.message 
            });
        }
    }
}

module.exports = new SoilController();
