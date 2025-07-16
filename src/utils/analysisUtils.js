/**
 * Utility functions for soil analysis calculations
 */

class AnalysisUtils {
    /**
     * Validate geographic coordinates
     */
    static validateCoordinates(lat, lon) {
        if (typeof lat !== 'number' || typeof lon !== 'number') {
            return { valid: false, error: 'Coordinates must be numbers' };
        }
        
        if (lat < -90 || lat > 90) {
            return { valid: false, error: 'Latitude must be between -90 and 90' };
        }
        
        if (lon < -180 || lon > 180) {
            return { valid: false, error: 'Longitude must be between -180 and 180' };
        }
        
        return { valid: true };
    }

    /**
     * Validate date range
     */
    static validateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return { valid: false, error: 'Invalid date format' };
        }
        
        if (start > end) {
            return { valid: false, error: 'Start date must be before end date' };
        }
        
        if (end > now) {
            return { valid: false, error: 'End date cannot be in the future' };
        }
        
        const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
        if (daysDiff > 365) {
            return { valid: false, error: 'Date range cannot exceed 365 days' };
        }
        
        return { valid: true };
    }

    /**
     * Calculate vegetation indices from spectral bands
     */
    static calculateIndices(bands) {
        const { B02, B03, B04, B08, B11, B12 } = bands;
        
        // Ensure all bands are valid numbers
        const validBands = Object.values(bands).every(band => 
            typeof band === 'number' && band >= 0 && band <= 1
        );
        
        if (!validBands) {
            throw new Error('Invalid spectral band values');
        }
        
        const indices = {};
        
        // NDVI (Normalized Difference Vegetation Index)
        indices.ndvi = this.safeCalculation(() => (B08 - B04) / (B08 + B04));
        
        // EVI (Enhanced Vegetation Index)
        indices.evi = this.safeCalculation(() => 
            2.5 * ((B08 - B04) / (B08 + 6 * B04 - 7.5 * B02 + 1))
        );
        
        // NDMI (Normalized Difference Moisture Index)
        indices.ndmi = this.safeCalculation(() => (B08 - B11) / (B08 + B11));
        
        // BSI (Bare Soil Index)
        indices.bsi = this.safeCalculation(() => 
            ((B11 + B04) - (B08 + B02)) / ((B11 + B04) + (B08 + B02))
        );
        
        // SAVI (Soil Adjusted Vegetation Index)
        const L = 0.5; // Soil brightness correction factor
        indices.savi = this.safeCalculation(() => 
            ((B08 - B04) / (B08 + B04 + L)) * (1 + L)
        );
        
        return indices;
    }

    /**
     * Safe mathematical calculation with bounds checking
     */
    static safeCalculation(calculation) {
        try {
            const result = calculation();
            
            if (isNaN(result) || !isFinite(result)) {
                return 0;
            }
            
            // Clamp to realistic range for indices
            return Math.max(-1, Math.min(1, result));
        } catch (error) {
            console.warn('Calculation error:', error);
            return 0;
        }
    }

    /**
     * Convert percentage to descriptive level
     */
    static getLevel(percentage, thresholds) {
        if (percentage <= thresholds.veryLow) return 'very_low';
        if (percentage <= thresholds.low) return 'low';
        if (percentage <= thresholds.moderate) return 'moderate';
        if (percentage <= thresholds.high) return 'high';
        return 'very_high';
    }

    /**
     * Calculate confidence score based on multiple factors
     */
    static calculateConfidence(factors) {
        let score = 100;
        
        // Cloud cover impact
        if (factors.cloudCover) {
            score -= Math.min(50, factors.cloudCover * 2);
        }
        
        // Data age impact
        if (factors.dataAgeDays) {
            if (factors.dataAgeDays > 30) score -= 10;
            if (factors.dataAgeDays > 90) score -= 20;
            if (factors.dataAgeDays > 180) score -= 30;
        }
        
        // Number of scenes impact
        if (factors.sceneCount) {
            if (factors.sceneCount < 2) score -= 15;
            if (factors.sceneCount === 1) score -= 10;
        }
        
        // Seasonal appropriateness
        if (factors.seasonalFactor) {
            score += factors.seasonalFactor * 10;
        }
        
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Apply geographic and seasonal corrections to values
     */
    static applyEnvironmentalCorrections(value, location, date = new Date()) {
        const { lat, lon } = location;
        const month = date.getMonth();
        
        let correctedValue = value;
        
        // Latitude-based corrections
        const absLat = Math.abs(lat);
        
        // Tropical regions (higher baseline moisture)
        if (absLat < 23.5) {
            correctedValue *= 1.1;
        }
        
        // Polar regions (lower baseline moisture)
        else if (absLat > 66.5) {
            correctedValue *= 0.8;
        }
        
        // Seasonal corrections (Northern Hemisphere)
        if (lat > 0) {
            // Summer months (higher evaporation)
            if (month >= 5 && month <= 8) {
                correctedValue *= 0.9;
            }
            // Winter months (lower evaporation)
            else if (month >= 11 || month <= 2) {
                correctedValue *= 1.1;
            }
        }
        // Southern Hemisphere (opposite seasons)
        else {
            if (month >= 11 || month <= 2) {
                correctedValue *= 0.9;
            }
            else if (month >= 5 && month <= 8) {
                correctedValue *= 1.1;
            }
        }
        
        return correctedValue;
    }

    /**
     * Generate realistic mock spectral data based on location and season
     */
    static generateRealisticSpectralData(location, date = new Date()) {
        const { lat, lon } = location;
        const month = date.getMonth();
        
        // Base reflectance values for different land types
        const baseReflectance = {
            B02: 0.08,  // Blue
            B03: 0.10,  // Green
            B04: 0.12,  // Red
            B05: 0.15,  // Red Edge 1
            B06: 0.18,  // Red Edge 2
            B07: 0.20,  // Red Edge 3
            B08: 0.25,  // NIR
            B8A: 0.24,  // Narrow NIR
            B11: 0.15,  // SWIR 1
            B12: 0.10   // SWIR 2
        };
        
        // Apply geographic variations
        const latEffect = Math.cos(lat * Math.PI / 180); // 0 at poles, 1 at equator
        const seasonEffect = Math.cos((month - 5) * Math.PI / 6); // Peak in summer (NH)
        
        // Modify reflectance values
        Object.keys(baseReflectance).forEach(band => {
            let value = baseReflectance[band];
            
            // Vegetation bands respond to season and latitude
            if (['B05', 'B06', 'B07', 'B08', 'B8A'].includes(band)) {
                value *= (1 + seasonEffect * latEffect * 0.4);
            }
            
            // Soil/moisture bands
            if (['B11', 'B12'].includes(band)) {
                value *= (1 - seasonEffect * latEffect * 0.2);
            }
            
            // Add random variation
            value += (Math.random() - 0.5) * 0.05;
            
            // Ensure realistic bounds
            baseReflectance[band] = Math.max(0.01, Math.min(0.8, value));
        });
        
        return baseReflectance;
    }

    /**
     * Format numbers for display
     */
    static formatNumber(number, decimals = 2) {
        if (typeof number !== 'number' || isNaN(number)) {
            return 'N/A';
        }
        
        return number.toFixed(decimals);
    }

    /**
     * Calculate area of interest from coordinates and radius
     */
    static calculateAOI(lat, lon, radiusKm) {
        // Simple bounding box calculation
        const latDelta = radiusKm / 111; // Approx km per degree latitude
        const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
        
        return {
            north: lat + latDelta,
            south: lat - latDelta,
            east: lon + lonDelta,
            west: lon - lonDelta
        };
    }

    /**
     * Check if a coordinate is over land (simplified)
     */
    static isOverLand(lat, lon) {
        // Very simplified land/ocean check
        // In production, use a proper land mask dataset
        
        // Exclude obvious ocean areas
        if (lat > 85 || lat < -85) return false; // Polar ice
        
        // Simple continental bounds (very rough)
        const continentalAreas = [
            { minLat: -55, maxLat: 75, minLon: -170, maxLon: -30 }, // Americas
            { minLat: -35, maxLat: 80, minLon: -30, maxLon: 60 },   // Europe/Africa
            { minLat: -50, maxLat: 80, minLon: 60, maxLon: 180 },   // Asia/Australia
        ];
        
        return continentalAreas.some(area =>
            lat >= area.minLat && lat <= area.maxLat &&
            lon >= area.minLon && lon <= area.maxLon
        );
    }
}

module.exports = AnalysisUtils;
