const turf = require('@turf/turf');

class SoilAnalysisService {
    constructor() {
        this.soilDatabase = this.initializeSoilDatabase();
    }

    /**
     * Analyze soil data from Sentinel satellite imagery
     */
    async analyzeSoilData(sentinelData, location) {
        try {
            console.log('🔬 Starting soil analysis...');
            
            if (!sentinelData.scenes || sentinelData.scenes.length === 0) {
                throw new Error('No satellite data available for analysis');
            }

            // Use the most recent scene with lowest cloud cover
            const bestScene = this.selectBestScene(sentinelData.scenes);
            console.log(`📊 Using scene: ${bestScene.id} (${bestScene.cloudCover}% cloud cover)`);

            // Calculate vegetation indices
            const indices = this.calculateVegetationIndices(bestScene.bands);
            
            // Analyze soil moisture
            const moisture = this.analyzeSoilMoisture(bestScene.bands, indices, location);
            
            // Determine soil composition
            const composition = this.analyzeSoilComposition(bestScene.bands, location);
            
            // Calculate soil temperature
            const temperature = this.calculateSoilTemperature(bestScene.bands, location, new Date(bestScene.date));
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(moisture, composition, indices, location);
            
            // Calculate confidence based on cloud cover and data quality
            const confidence = this.calculateConfidence(bestScene, sentinelData.scenes);

            return {
                sceneUsed: bestScene.id,
                analysisDate: new Date().toISOString(),
                moisture,
                composition,
                ndvi: indices.ndvi,
                temperature,
                recommendations,
                confidence,
                indices: {
                    ndvi: indices.ndvi,
                    evi: indices.evi,
                    ndmi: indices.ndmi,
                    bsi: indices.bsi
                }
            };

        } catch (error) {
            console.error('Error in soil analysis:', error);
            throw error;
        }
    }

    /**
     * Select the best scene based on cloud cover and date
     */
    selectBestScene(scenes) {
        return scenes.reduce((best, current) => {
            if (!best) return current;
            
            // Prefer lower cloud cover, then more recent date
            if (current.cloudCover < best.cloudCover) return current;
            if (current.cloudCover === best.cloudCover && 
                new Date(current.date) > new Date(best.date)) return current;
            
            return best;
        }, null);
    }

    /**
     * Calculate various vegetation and soil indices
     */
    calculateVegetationIndices(bands) {
        const { B02, B03, B04, B08, B8A, B11, B12 } = bands;
        
        // NDVI (Normalized Difference Vegetation Index)
        const ndvi = (B08 - B04) / (B08 + B04);
        
        // EVI (Enhanced Vegetation Index)
        const evi = 2.5 * ((B08 - B04) / (B08 + 6 * B04 - 7.5 * B02 + 1));
        
        // NDMI (Normalized Difference Moisture Index)
        const ndmi = (B08 - B11) / (B08 + B11);
        
        // BSI (Bare Soil Index)
        const bsi = ((B11 + B04) - (B08 + B02)) / ((B11 + B04) + (B08 + B02));
        
        return {
            ndvi: Math.max(-1, Math.min(1, ndvi)),
            evi: Math.max(-1, Math.min(1, evi)),
            ndmi: Math.max(-1, Math.min(1, ndmi)),
            bsi: Math.max(-1, Math.min(1, bsi))
        };
    }

    /**
     * Analyze soil moisture content
     */
    analyzeSoilMoisture(bands, indices, location) {
        const { B11, B12 } = bands;
        const { ndmi } = indices;
        
        // Combine SWIR bands and NDMI for moisture estimation
        const swirRatio = B11 / B12;
        
        // Normalize moisture index (0-100%)
        let moistureIndex = ((ndmi + 1) / 2) * 100;
        
        // Adjust based on SWIR ratio
        moistureIndex *= (1 + (swirRatio - 1) * 0.2);
        
        // Apply geographic and seasonal corrections
        moistureIndex = this.applyEnvironmentalCorrections(moistureIndex, location);
        
        // Clamp to realistic range
        moistureIndex = Math.max(5, Math.min(95, moistureIndex));
        
        return {
            percentage: Math.round(moistureIndex * 100) / 100,
            level: this.getMoistureLevel(moistureIndex),
            description: this.getMoistureDescription(moistureIndex),
            ndmiValue: Math.round(ndmi * 1000) / 1000
        };
    }

    /**
     * Analyze soil composition based on spectral signatures
     */
    analyzeSoilComposition(bands, location) {
        const { B02, B03, B04, B11, B12 } = bands;
        
        // Soil composition indicators
        const ironOxide = (B04 / B02); // Iron oxide content
        const clayContent = (B11 / B12); // Clay vs sand content
        const organicMatter = 1 - (B04 + B11) / 2; // Organic matter (inverse relationship)
        
        // Normalize values
        const composition = {
            clay: Math.max(0, Math.min(100, clayContent * 40)),
            sand: Math.max(0, Math.min(100, (2 - clayContent) * 30)),
            silt: 0, // Will be calculated as remainder
            organicMatter: Math.max(0, Math.min(15, organicMatter * 8)),
            ironOxide: Math.max(0, Math.min(10, (ironOxide - 1) * 15)),
            ph: this.estimatePH(bands, location)
        };
        
        // Calculate silt as remainder to make total 100%
        composition.silt = Math.max(0, 100 - composition.clay - composition.sand);
        
        // Determine soil type
        const soilType = this.determineSoilType(composition);
        
        return {
            ...composition,
            soilType: soilType.type,
            description: soilType.description,
            fertility: this.assessFertility(composition)
        };
    }

    /**
     * Calculate soil surface temperature
     */
    calculateSoilTemperature(bands, location, date) {
        const { B11, B12 } = bands;
        
        // Basic temperature estimation from thermal bands (simplified)
        // In reality, you'd need thermal bands from Landsat or MODIS
        let baseTemp = 15; // Base temperature in Celsius
        
        // Seasonal adjustment
        const month = date.getMonth();
        const seasonalAdjustment = 10 * Math.sin((month - 3) * Math.PI / 6);
        
        // Latitude adjustment
        const latitudeAdjustment = (30 - Math.abs(location.lat)) * 0.3;
        
        // Surface type adjustment (based on spectral properties)
        const surfaceAdjustment = (B11 - B12) * 20;
        
        const temperature = baseTemp + seasonalAdjustment + latitudeAdjustment + surfaceAdjustment;
        
        return {
            celsius: Math.round(temperature * 10) / 10,
            fahrenheit: Math.round((temperature * 9/5 + 32) * 10) / 10,
            description: this.getTemperatureDescription(temperature),
            factors: {
                seasonal: Math.round(seasonalAdjustment * 10) / 10,
                latitude: Math.round(latitudeAdjustment * 10) / 10,
                surface: Math.round(surfaceAdjustment * 10) / 10
            }
        };
    }

    /**
     * Get soil data by location with filtering
     */
    async getSoilByLocation(location, parameters) {
        const { lat, lon, radius } = location;
        
        // Find relevant soil data points within radius
        const nearbyData = this.soilDatabase.filter(point => {
            const distance = turf.distance(
                turf.point([lon, lat]),
                turf.point([point.lon, point.lat]),
                { units: 'meters' }
            );
            return distance <= radius;
        });

        // Filter by requested parameters
        const filteredData = nearbyData.map(point => {
            const filtered = { id: point.id, lat: point.lat, lon: point.lon };
            
            if (parameters.includes('all') || parameters.includes('moisture')) {
                filtered.moisture = point.moisture;
            }
            if (parameters.includes('all') || parameters.includes('composition')) {
                filtered.composition = point.composition;
            }
            if (parameters.includes('all') || parameters.includes('temperature')) {
                filtered.temperature = point.temperature;
            }
            if (parameters.includes('all') || parameters.includes('ph')) {
                filtered.ph = point.ph;
            }
            
            return filtered;
        });

        return {
            points: filteredData,
            count: filteredData.length,
            radius,
            parameters
        };
    }

    /**
     * Generate agricultural and environmental recommendations
     */
    generateRecommendations(moisture, composition, indices, location) {
        const recommendations = [];
        
        // Moisture recommendations
        if (moisture.percentage < 20) {
            recommendations.push({
                type: 'irrigation',
                priority: 'high',
                message: 'Soil moisture is low. Consider irrigation to improve crop growth.',
                action: 'Increase irrigation frequency'
            });
        } else if (moisture.percentage > 80) {
            recommendations.push({
                type: 'drainage',
                priority: 'medium',
                message: 'Soil may be waterlogged. Ensure proper drainage.',
                action: 'Check drainage systems'
            });
        }
        
        // Vegetation recommendations based on NDVI
        if (indices.ndvi < 0.2) {
            recommendations.push({
                type: 'vegetation',
                priority: 'high',
                message: 'Low vegetation cover detected. Consider planting or soil treatment.',
                action: 'Implement revegetation strategies'
            });
        }
        
        // Soil composition recommendations
        if (composition.clay > 60) {
            recommendations.push({
                type: 'soil_structure',
                priority: 'medium',
                message: 'High clay content may affect drainage and root penetration.',
                action: 'Add organic matter to improve soil structure'
            });
        }
        
        if (composition.organicMatter < 2) {
            recommendations.push({
                type: 'fertility',
                priority: 'medium',
                message: 'Low organic matter content detected.',
                action: 'Add compost or organic fertilizers'
            });
        }
        
        // pH recommendations
        if (composition.ph < 6.0) {
            recommendations.push({
                type: 'ph_adjustment',
                priority: 'medium',
                message: 'Soil is acidic. Consider liming to improve pH.',
                action: 'Apply lime to increase soil pH'
            });
        } else if (composition.ph > 8.0) {
            recommendations.push({
                type: 'ph_adjustment',
                priority: 'medium',
                message: 'Soil is alkaline. Consider adding sulfur to lower pH.',
                action: 'Apply sulfur to decrease soil pH'
            });
        }
        
        return recommendations;
    }

    // Helper methods
    getMoistureLevel(percentage) {
        if (percentage < 15) return 'very_low';
        if (percentage < 30) return 'low';
        if (percentage < 60) return 'moderate';
        if (percentage < 80) return 'high';
        return 'very_high';
    }

    getMoistureDescription(percentage) {
        const level = this.getMoistureLevel(percentage);
        const descriptions = {
            very_low: 'Very dry soil, irrigation strongly recommended',
            low: 'Dry soil, may need irrigation',
            moderate: 'Adequate moisture for most crops',
            high: 'Good moisture content',
            very_high: 'Potentially waterlogged, check drainage'
        };
        return descriptions[level];
    }

    determineSoilType(composition) {
        const { clay, sand, silt } = composition;
        
        if (clay > 40) {
            return { type: 'Clay', description: 'Heavy clay soil with good nutrient retention but poor drainage' };
        } else if (sand > 70) {
            return { type: 'Sand', description: 'Sandy soil with good drainage but low nutrient retention' };
        } else if (silt > 40) {
            return { type: 'Silt', description: 'Silty soil with good water retention and moderate drainage' };
        } else if (clay > 25 && sand > 25) {
            return { type: 'Clay Loam', description: 'Well-balanced soil with good structure and fertility' };
        } else if (sand > 50) {
            return { type: 'Sandy Loam', description: 'Good drainage with reasonable nutrient retention' };
        } else {
            return { type: 'Loam', description: 'Ideal soil type with balanced properties' };
        }
    }

    estimatePH(bands, location) {
        // Simplified pH estimation based on spectral properties
        const { B02, B04, B11 } = bands;
        
        // Base pH around neutral
        let ph = 7.0;
        
        // Adjust based on spectral properties (simplified relationship)
        const spectralIndicator = (B11 - B04) / (B11 + B04);
        ph += spectralIndicator * 2;
        
        // Apply regional adjustments
        if (location.lat > 50) ph -= 0.5; // Northern regions tend to be more acidic
        if (Math.abs(location.lat) < 23.5) ph += 0.3; // Tropical regions
        
        return Math.max(4.0, Math.min(9.0, Math.round(ph * 10) / 10));
    }

    assessFertility(composition) {
        const { organicMatter, ph, clay, sand } = composition;
        
        let fertilityScore = 50; // Base score
        
        // Organic matter contribution
        fertilityScore += organicMatter * 5;
        
        // pH contribution (optimal around 6.5-7.0)
        const phOptimal = 6.75;
        fertilityScore += 20 - Math.abs(ph - phOptimal) * 10;
        
        // Soil texture contribution
        if (clay > 20 && clay < 50 && sand > 20 && sand < 60) {
            fertilityScore += 15; // Good texture balance
        }
        
        fertilityScore = Math.max(0, Math.min(100, fertilityScore));
        
        return {
            score: Math.round(fertilityScore),
            level: fertilityScore > 75 ? 'high' : fertilityScore > 50 ? 'medium' : 'low',
            description: this.getFertilityDescription(fertilityScore)
        };
    }

    getFertilityDescription(score) {
        if (score > 75) return 'Highly fertile soil suitable for most crops';
        if (score > 50) return 'Moderately fertile soil with some improvement potential';
        return 'Low fertility soil requiring amendments';
    }

    getTemperatureDescription(temp) {
        if (temp < 5) return 'Very cold - limited biological activity';
        if (temp < 15) return 'Cool - slow plant growth';
        if (temp < 25) return 'Optimal - good for most crops';
        if (temp < 35) return 'Warm - may stress some plants';
        return 'Hot - requires heat-tolerant varieties';
    }

    applyEnvironmentalCorrections(moistureIndex, location) {
        // Apply corrections based on climate and geography
        const { lat } = location;
        
        // Latitude correction (tropical vs temperate)
        if (Math.abs(lat) < 23.5) {
            moistureIndex *= 1.1; // Tropical regions typically more humid
        } else if (Math.abs(lat) > 60) {
            moistureIndex *= 0.9; // Polar regions typically drier
        }
        
        // Seasonal correction would go here (requires date parameter)
        
        return moistureIndex;
    }

    calculateConfidence(bestScene, allScenes) {
        let confidence = 100;
        
        // Reduce confidence based on cloud cover
        confidence -= bestScene.cloudCover * 2;
        
        // Reduce confidence if limited data
        if (allScenes.length < 2) confidence -= 20;
        
        // Reduce confidence if scene is old
        const daysSinceCapture = (new Date() - new Date(bestScene.date)) / (1000 * 60 * 60 * 24);
        if (daysSinceCapture > 30) confidence -= 10;
        if (daysSinceCapture > 90) confidence -= 20;
        
        confidence = Math.max(10, Math.min(100, confidence));
        
        if (confidence > 80) return 'high';
        if (confidence > 60) return 'medium';
        return 'low';
    }

    /**
     * Initialize mock soil database for demonstration
     */
    initializeSoilDatabase() {
        // This would be replaced with a real database in production
        return [
            {
                id: 'soil_001',
                lat: 40.7128,
                lon: -74.0060,
                moisture: { percentage: 45, level: 'moderate' },
                composition: { clay: 35, sand: 40, silt: 25, organicMatter: 3.2, ph: 6.8 },
                temperature: { celsius: 18.5 }
            },
            // Add more mock data points as needed
        ];
    }
}

module.exports = new SoilAnalysisService();
