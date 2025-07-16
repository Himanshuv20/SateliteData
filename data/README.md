# Sentinel Soil Analysis - Sample Data

This directory contains sample data files for testing and development purposes.

## File Structure

- `sample_locations.json` - Pre-defined locations for testing
- `mock_satellite_data/` - Mock Sentinel-2 data samples
- `soil_profiles/` - Reference soil composition data
- `analysis_results/` - Example analysis outputs

## Usage

The application automatically generates realistic mock data based on:
- Geographic location (latitude/longitude)
- Seasonal variations
- Climate zones
- Typical agricultural regions

For production use, replace mock data with real Sentinel-2 API calls.

## Data Sources

- Mock spectral reflectance values based on real Sentinel-2 band characteristics
- Realistic soil composition ranges for different regions
- Seasonal moisture patterns
- Climate-adjusted temperature estimates
