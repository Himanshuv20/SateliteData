<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Sentinel Soil Analysis Platform - Copilot Instructions

This is a Node.js application for analyzing satellite data to provide soil insights. The application processes Sentinel-2 satellite imagery to extract soil moisture, composition, and agricultural parameters.

## Project Context

- **Domain**: Agricultural technology, remote sensing, geospatial analysis
- **Data Sources**: Sentinel-2 satellite imagery, Copernicus Data Space Ecosystem
- **Analysis Methods**: Spectral analysis, vegetation indices (NDVI, NDMI, EVI), soil composition estimation
- **Target Users**: Farmers, agricultural researchers, environmental scientists

## Code Style and Patterns

- Use async/await for asynchronous operations
- Implement proper error handling with try-catch blocks
- Follow RESTful API conventions for endpoints
- Use ES6+ features and modern JavaScript patterns
- Implement comprehensive logging for debugging
- Add JSDoc comments for complex functions

## Key Technical Concepts

- **Spectral Bands**: B02 (Blue), B03 (Green), B04 (Red), B08 (NIR), B11 (SWIR1), B12 (SWIR2)
- **Vegetation Indices**: 
  - NDVI = (NIR - Red) / (NIR + Red)
  - NDMI = (NIR - SWIR1) / (NIR + SWIR1)
  - EVI = 2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))
- **Soil Parameters**: Moisture percentage, clay/sand/silt composition, pH, organic matter
- **Geographic Processing**: Use Turf.js for geospatial calculations

## API Integration Guidelines

- Use mock data by default for development (USE_MOCK_DATA=true)
- Implement proper authentication for Copernicus API
- Handle rate limiting and API quotas gracefully
- Provide fallback to mock data when APIs are unavailable
- Validate coordinates and date ranges before API calls

## Data Processing Best Practices

- Normalize spectral values to 0-1 range
- Apply seasonal and geographic corrections to calculations
- Implement confidence scoring based on data quality
- Use statistical methods for outlier detection
- Provide uncertainty estimates in results

## Frontend Integration

- Ensure API responses are properly formatted for the web interface
- Include metadata for data visualization (progress bars, charts)
- Provide user-friendly error messages
- Support both coordinate input and location search
- Implement proper loading states and error handling

## Testing and Validation

- Test with various geographic locations and seasons
- Validate scientific calculations against known references
- Ensure proper handling of edge cases (polar regions, oceans)
- Test API error scenarios and fallback mechanisms
- Verify responsive design on different screen sizes

## Environmental Considerations

- Consider climate zones and seasonal variations in analysis
- Account for different soil types and agricultural practices globally
- Implement region-specific recommendations
- Consider local farming calendars and crop cycles
- Factor in elevation and topographic effects

When working on this project, prioritize scientific accuracy, user experience, and robust error handling. Always consider the agricultural context and provide actionable insights for farmers and researchers.
