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
        
        // More realistic soil moisture calculation based on NDMI thresholds
        // NDMI > 0.4 indicates very wet conditions
        // NDMI 0.1 to 0.4 indicates moderate moisture
        // NDMI -0.1 to 0.1 indicates low moisture
        // NDMI < -0.1 indicates very dry conditions
        
        let moistureIndex;
        if (ndmi > 0.4) {
            moistureIndex = 70 + (ndmi - 0.4) * 50; // 70-100% for very wet
        } else if (ndmi > 0.1) {
            moistureIndex = 40 + (ndmi - 0.1) * 100; // 40-70% for moderate
        } else if (ndmi > -0.1) {
            moistureIndex = 15 + (ndmi + 0.1) * 125; // 15-40% for low
        } else {
            moistureIndex = 5 + Math.max(0, (ndmi + 0.3) * 50); // 5-15% for very dry
        }
        
        // Apply SWIR ratio for refinement (smaller adjustment)
        const swirRatio = B11 / B12;
        moistureIndex *= (0.9 + (swirRatio - 1) * 0.1); // More conservative adjustment
        
        // Apply geographic and seasonal corrections (reduced impact)
        const { lat } = location;
        
        // Reduced latitude correction
        if (Math.abs(lat) < 23.5) {
            moistureIndex *= 1.05; // Tropical regions slightly more humid
        } else if (Math.abs(lat) > 60) {
            moistureIndex *= 0.95; // Polar regions slightly drier
        }
        
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
        
        // Enhanced moisture recommendations with detailed analysis
        if (moisture.percentage < 15) {
            recommendations.push({
                type: 'Critical Irrigation',
                category: 'water_management',
                priority: 'critical',
                severity: 'high',
                message: 'Critically low soil moisture detected. Immediate irrigation required to prevent crop stress.',
                action: 'Implement emergency irrigation within 24-48 hours',
                details: 'Install drip irrigation systems for efficient water use. Consider mulching to retain moisture.',
                timeline: 'Immediate (0-2 days)',
                cost: 'Medium',
                impact: 'High - Prevents crop failure',
                seasonality: this.getSeasonalAdvice('irrigation', location)
            });
        } else if (moisture.percentage < 30) {
            recommendations.push({
                type: 'Irrigation Management',
                category: 'water_management',
                priority: 'high',
                severity: 'medium',
                message: 'Soil moisture is below optimal levels. Regular irrigation recommended.',
                action: 'Increase irrigation frequency by 30-50%',
                details: 'Monitor soil moisture daily. Consider installing moisture sensors for precise irrigation timing.',
                timeline: 'Short-term (1-2 weeks)',
                cost: 'Low',
                impact: 'Medium - Improves crop yield',
                seasonality: this.getSeasonalAdvice('irrigation', location)
            });
        } else if (moisture.percentage > 85) {
            recommendations.push({
                type: 'Drainage Management',
                category: 'water_management',
                priority: 'high',
                severity: 'medium',
                message: 'Excessive soil moisture may lead to waterlogging and root rot.',
                action: 'Improve drainage systems and reduce irrigation',
                details: 'Install subsurface drainage tiles. Create raised beds for better drainage. Check for irrigation system leaks.',
                timeline: 'Medium-term (2-4 weeks)',
                cost: 'High',
                impact: 'High - Prevents root diseases',
                seasonality: this.getSeasonalAdvice('drainage', location)
            });
        }
        
        // Enhanced vegetation recommendations based on NDVI
        if (indices.ndvi < 0.1) {
            recommendations.push({
                type: 'Urgent Revegetation',
                category: 'vegetation',
                priority: 'critical',
                severity: 'high',
                message: 'Extremely poor vegetation cover. Risk of soil erosion and degradation.',
                action: 'Implement immediate soil stabilization and planting program',
                details: 'Use erosion control blankets, plant fast-growing cover crops, apply organic mulch.',
                timeline: 'Immediate (0-1 week)',
                cost: 'High',
                impact: 'Critical - Prevents soil loss',
                seasonality: this.getSeasonalAdvice('planting', location)
            });
        } else if (indices.ndvi < 0.3) {
            recommendations.push({
                type: 'Vegetation Enhancement',
                category: 'vegetation',
                priority: 'high',
                severity: 'medium',
                message: 'Low vegetation density detected. Consider crop rotation or replanting.',
                action: 'Plant cover crops or implement crop diversification',
                details: 'Select drought-resistant varieties. Consider nitrogen-fixing legumes for soil improvement.',
                timeline: 'Short-term (2-4 weeks)',
                cost: 'Medium',
                impact: 'Medium - Improves soil health',
                seasonality: this.getSeasonalAdvice('planting', location)
            });
        }
        
        // Enhanced soil composition recommendations
        if (composition.clay > 60) {
            recommendations.push({
                type: 'Soil Structure Improvement',
                category: 'soil_health',
                priority: 'medium',
                severity: 'low',
                message: 'High clay content restricts water infiltration and root development.',
                action: 'Add organic amendments to improve soil structure',
                details: 'Apply 2-4 inches of compost annually. Use gypsum to improve clay aggregation. Avoid working wet clay soil.',
                timeline: 'Long-term (6-12 months)',
                cost: 'Medium',
                impact: 'Medium - Improves soil workability',
                seasonality: this.getSeasonalAdvice('soil_amendment', location)
            });
        }
        
        if (composition.sand > 70) {
            recommendations.push({
                type: 'Water Retention Enhancement',
                category: 'soil_health',
                priority: 'medium',
                severity: 'medium',
                message: 'Sandy soil has poor water and nutrient retention capacity.',
                action: 'Increase organic matter content and implement frequent, light irrigation',
                details: 'Add compost, biochar, or well-aged manure. Use slow-release fertilizers. Consider polymer soil conditioners.',
                timeline: 'Medium-term (3-6 months)',
                cost: 'Medium',
                impact: 'High - Improves nutrient retention',
                seasonality: this.getSeasonalAdvice('soil_amendment', location)
            });
        }
        
        if (composition.organicMatter < 2) {
            recommendations.push({
                type: 'Organic Matter Enhancement',
                category: 'fertility',
                priority: 'high',
                severity: 'medium',
                message: 'Low organic matter reduces soil fertility and water retention.',
                action: 'Implement comprehensive organic matter building program',
                details: 'Apply 25-50 lbs compost per 1000 sq ft. Plant cover crops. Use crop residue management. Consider vermicomposting.',
                timeline: 'Long-term (12-24 months)',
                cost: 'Medium',
                impact: 'High - Transforms soil health',
                seasonality: this.getSeasonalAdvice('organic_matter', location)
            });
        }
        
        // Enhanced pH recommendations with specific amendments
        if (composition.ph < 5.5) {
            recommendations.push({
                type: 'Severe Acidity Correction',
                category: 'ph_management',
                priority: 'high',
                severity: 'high',
                message: 'Severely acidic soil limits nutrient availability and microbial activity.',
                action: 'Apply agricultural lime with ongoing pH monitoring',
                details: 'Apply 2-4 tons/acre of ground limestone. Test pH every 6 months. Consider pelletized lime for easier application.',
                timeline: 'Medium-term (6-12 months)',
                cost: 'Medium',
                impact: 'High - Unlocks soil nutrients',
                seasonality: this.getSeasonalAdvice('liming', location)
            });
        } else if (composition.ph < 6.2) {
            recommendations.push({
                type: 'Mild Acidity Adjustment',
                category: 'ph_management',
                priority: 'medium',
                severity: 'low',
                message: 'Slightly acidic soil may benefit from pH adjustment for optimal crop growth.',
                action: 'Apply moderate lime application',
                details: 'Apply 1-2 tons/acre of agricultural lime. Monitor pH annually. Consider organic amendments like wood ash.',
                timeline: 'Medium-term (6-12 months)',
                cost: 'Low',
                impact: 'Medium - Optimizes nutrient uptake',
                seasonality: this.getSeasonalAdvice('liming', location)
            });
        } else if (composition.ph > 8.5) {
            recommendations.push({
                type: 'Alkalinity Reduction',
                category: 'ph_management',
                priority: 'high',
                severity: 'high',
                message: 'Highly alkaline soil restricts iron and zinc availability.',
                action: 'Apply sulfur amendments and organic acidifiers',
                details: 'Apply 10-20 lbs/1000 sq ft elemental sulfur. Use organic mulches. Consider iron sulfate for quick results.',
                timeline: 'Long-term (12-18 months)',
                cost: 'Medium',
                impact: 'High - Prevents micronutrient deficiency',
                seasonality: this.getSeasonalAdvice('acidification', location)
            });
        }
        
        // Advanced recommendations based on vegetation indices combinations
        if (indices.ndvi > 0.7 && indices.ndmi < 0.3) {
            recommendations.push({
                type: 'Water Stress Management',
                category: 'precision_agriculture',
                priority: 'medium',
                severity: 'medium',
                message: 'Good vegetation cover but moisture stress detected in plants.',
                action: 'Implement precision irrigation targeting plant water needs',
                details: 'Use NDMI monitoring for irrigation scheduling. Consider deficit irrigation strategies during non-critical growth stages.',
                timeline: 'Short-term (1-2 weeks)',
                cost: 'Low',
                impact: 'Medium - Optimizes water use efficiency',
                seasonality: this.getSeasonalAdvice('precision_irrigation', location)
            });
        }
        
        // Soil health recommendations based on multiple factors
        this.addSoilHealthRecommendations(recommendations, moisture, composition, indices, location);
        
        // Crop-specific recommendations
        this.addCropRecommendations(recommendations, moisture, composition, indices, location);
        
        // Sustainability and environmental recommendations
        this.addSustainabilityRecommendations(recommendations, moisture, composition, indices, location);
        
        return recommendations;
    }

    /**
     * Add comprehensive soil health recommendations
     */
    addSoilHealthRecommendations(recommendations, moisture, composition, indices, location) {
        // Soil biology enhancement
        if (composition.organicMatter < 3 && indices.ndvi < 0.5) {
            recommendations.push({
                type: 'Soil Biology Enhancement',
                category: 'soil_health',
                priority: 'medium',
                severity: 'medium',
                message: 'Poor soil biology indicated by low organic matter and vegetation health.',
                action: 'Implement biological soil enhancement program',
                details: 'Apply mycorrhizal inoculants, beneficial bacteria, and compost tea. Minimize soil disturbance.',
                timeline: 'Medium-term (3-6 months)',
                cost: 'Medium',
                impact: 'High - Builds soil ecosystem',
                seasonality: this.getSeasonalAdvice('soil_biology', location)
            });
        }
        
        // Erosion prevention
        if (composition.sand > 60 && indices.ndvi < 0.4) {
            recommendations.push({
                type: 'Erosion Prevention',
                category: 'conservation',
                priority: 'high',
                severity: 'high',
                message: 'Sandy soil with poor vegetation cover is susceptible to erosion.',
                action: 'Implement immediate erosion control measures',
                details: 'Install windbreaks, create contour farming, use cover crops, apply erosion control matting.',
                timeline: 'Immediate (0-2 weeks)',
                cost: 'Medium',
                impact: 'Critical - Prevents soil loss',
                seasonality: this.getSeasonalAdvice('erosion_control', location)
            });
        }
    }

    /**
     * Add crop-specific recommendations
     */
    addCropRecommendations(recommendations, moisture, composition, indices, location) {
        // Crop selection based on soil conditions
        let cropSuggestions = [];
        
        if (composition.clay > 50 && moisture.percentage > 60) {
            cropSuggestions = ['rice', 'cotton', 'soybeans'];
        } else if (composition.sand > 60 && moisture.percentage < 40) {
            cropSuggestions = ['drought-resistant crops', 'millet', 'sorghum'];
        } else if (composition.ph >= 6.0 && composition.ph <= 7.5) {
            cropSuggestions = ['corn', 'wheat', 'vegetables'];
        }
        
        if (cropSuggestions.length > 0) {
            recommendations.push({
                type: 'Optimal Crop Selection',
                category: 'crop_planning',
                priority: 'low',
                severity: 'low',
                message: 'Current soil conditions are well-suited for specific crop types.',
                action: `Consider planting: ${cropSuggestions.join(', ')}`,
                details: 'These crops are well-adapted to your current soil conditions and will likely perform well with minimal amendments.',
                timeline: 'Next planting season',
                cost: 'Variable',
                impact: 'Medium - Optimizes crop success',
                seasonality: this.getSeasonalAdvice('crop_selection', location)
            });
        }
    }

    /**
     * Add sustainability and environmental recommendations
     */
    addSustainabilityRecommendations(recommendations, moisture, composition, indices, location) {
        // Carbon sequestration opportunities
        if (composition.organicMatter < 4) {
            recommendations.push({
                type: 'Carbon Sequestration',
                category: 'sustainability',
                priority: 'low',
                severity: 'low',
                message: 'Opportunity to increase soil carbon storage and improve environmental sustainability.',
                action: 'Implement carbon-building agricultural practices',
                details: 'Use no-till farming, diverse crop rotations, cover cropping, and integrated livestock grazing.',
                timeline: 'Long-term (2-5 years)',
                cost: 'Low',
                impact: 'High - Environmental and economic benefits',
                seasonality: 'Year-round implementation'
            });
        }
        
        // Biodiversity enhancement
        if (indices.ndvi < 0.6) {
            recommendations.push({
                type: 'Biodiversity Enhancement',
                category: 'sustainability',
                priority: 'low',
                severity: 'low',
                message: 'Enhance on-farm biodiversity to improve ecosystem services.',
                action: 'Create habitat corridors and diverse plantings',
                details: 'Plant native hedgerows, establish pollinator strips, create wildlife corridors, use diverse crop rotations.',
                timeline: 'Long-term (1-3 years)',
                cost: 'Medium',
                impact: 'Medium - Ecosystem benefits',
                seasonality: this.getSeasonalAdvice('biodiversity', location)
            });
        }
    }

    /**
     * Get seasonal advice for different management practices
     */
    getSeasonalAdvice(practice, location) {
        const month = new Date().getMonth(); // 0-11
        const season = this.getSeason(month, location);
        
        const seasonalAdvice = {
            irrigation: {
                spring: 'Monitor emerging crops closely for water needs',
                summer: 'Peak irrigation season - ensure adequate water supply',
                fall: 'Reduce irrigation as temperatures cool',
                winter: 'Minimal irrigation needed in most regions'
            },
            planting: {
                spring: 'Optimal time for most crop planting',
                summer: 'Plant heat-tolerant varieties',
                fall: 'Plant cool-season crops and cover crops',
                winter: 'Limited planting options in temperate regions'
            },
            soil_amendment: {
                spring: 'Apply amendments before planting',
                summer: 'Light applications to avoid plant stress',
                fall: 'Ideal time for major soil amendments',
                winter: 'Plan and prepare amendments for spring'
            },
            liming: {
                spring: 'Apply lime before planting season',
                summer: 'Avoid liming during hot weather',
                fall: 'Best time for lime application',
                winter: 'Good time for lime application in mild climates'
            }
        };
        
        return seasonalAdvice[practice]?.[season] || 'Consult local agricultural extension for timing';
    }

    /**
     * Determine season based on month and location
     */
    getSeason(month, location) {
        // Simplified seasonal determination (Northern Hemisphere default)
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
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
