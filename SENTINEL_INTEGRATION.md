# Real Sentinel Satellite Data Integration

This guide explains how to integrate real Sentinel-2 satellite data from the Copernicus Data Space Ecosystem into your Soil Analysis Platform.

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)
```bash
npm run setup-sentinel
```

### Option 2: Manual Configuration

1. **Create Copernicus Account**
   - Visit [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/)
   - Register for a free account
   - Verify your email address

2. **Update Environment Variables**
   ```bash
   # Edit .env file
   USE_MOCK_DATA=false
   COPERNICUS_USERNAME=your_username_here
   COPERNICUS_PASSWORD=your_password_here
   ```

3. **Restart Application**
   ```bash
   npm run dev
   ```

## 🛰️ Understanding Sentinel-2 Data

### What You Get
- **Real satellite imagery** from ESA's Sentinel-2 mission
- **13 spectral bands** including visible, near-infrared, and short-wave infrared
- **10-60m spatial resolution** depending on the band
- **5-day revisit time** for most locations
- **Global coverage** with systematic acquisition

### Data Processing Pipeline

1. **Search & Discovery**
   - Query Copernicus Data Space API
   - Filter by location, date, and cloud cover
   - Select best available scenes

2. **Band Extraction**
   - Access spectral reflectance values
   - Calculate vegetation indices (NDVI, NDMI, EVI)
   - Derive soil parameters

3. **Quality Assessment**
   - Cloud cover analysis
   - Data completeness validation
   - Confidence scoring

## 📊 API Endpoints with Real Data

### Get Soil Analysis
```http
GET /api/soil/analysis?lat=40.7128&lon=-74.0060&date=2024-07-01
```

**Response with Real Data:**
```json
{
  "location": { "lat": 40.7128, "lon": -74.0060 },
  "analysis": {
    "soilMoisture": 45.2,
    "composition": {
      "clay": 25.4,
      "sand": 48.7,
      "silt": 25.9
    },
    "vegetation": {
      "ndvi": 0.642,
      "ndmi": 0.387,
      "evi": 0.541
    }
  },
  "metadata": {
    "dataSource": "Copernicus Data Space Ecosystem",
    "sentinelScene": "S2A_MSIL1C_20240701T153611_N0510_R011_T18TWL_20240701T184951",
    "acquisitionDate": "2024-07-01T15:36:11Z",
    "cloudCover": 8.3,
    "confidence": 0.89
  }
}
```

### Get Sentinel Data
```http
GET /api/sentinel/data?lat=40.7128&lon=-74.0060&start=2024-06-01&end=2024-07-01
```

**Response:**
```json
{
  "location": { "lat": 40.7128, "lon": -74.0060 },
  "scenes": [
    {
      "id": "e8c3d4f5-a1b2-4c5d-8e9f-123456789abc",
      "name": "S2A_MSIL1C_20240701T153611_N0510_R011_T18TWL_20240701T184951",
      "date": "2024-07-01T15:36:11Z",
      "cloudCover": 8.3,
      "size": 1024768000,
      "bands": {
        "B02": 0.089,  // Blue
        "B03": 0.104,  // Green
        "B04": 0.087,  // Red
        "B08": 0.342   // NIR
        // ... more bands
      }
    }
  ],
  "dataSource": "Copernicus Data Space Ecosystem"
}
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_MOCK_DATA` | Enable/disable mock data | `true` |
| `COPERNICUS_USERNAME` | Your account username | - |
| `COPERNICUS_PASSWORD` | Your account password | - |
| `DEFAULT_MAX_CLOUD_COVER` | Maximum cloud cover % | `20` |
| `API_TIMEOUT` | Request timeout (ms) | `30000` |

### Advanced Configuration

```javascript
// Custom search parameters
const options = {
  maxCloudCover: 15,        // Lower cloud cover for clearer images
  includeMetadata: true,    // Include detailed scene metadata
  processingLevel: 'L1C',   // Specify processing level
  dateRange: {              // Custom date range
    start: '2024-06-01',
    end: '2024-07-01'
  }
};
```

## 🌍 Data Availability

### Coverage
- **Global**: Sentinel-2 covers all land surfaces between 84°N and 56°S
- **Frequency**: 5-day revisit time (10 days per satellite)
- **Archive**: Data available from 2015 onwards

### Limitations
- **Cloud cover**: May limit data availability in cloudy regions
- **Polar regions**: Limited coverage above 84°N and below 56°S
- **Ocean areas**: No land surface data over water bodies
- **Real-time**: Small delay between acquisition and availability

## 🔍 Troubleshooting

### Common Issues

#### Authentication Errors
```
❌ Authentication failed: Invalid credentials
```
**Solution**: Verify your username and password in the `.env` file

#### No Data Found
```
⚠️ No Sentinel-2 data found for the specified criteria
```
**Solutions**:
- Increase date range
- Increase cloud cover threshold
- Check location coordinates
- Try a different time period

#### API Timeout
```
❌ Error fetching Sentinel data: timeout
```
**Solutions**:
- Increase `API_TIMEOUT` value
- Check internet connection
- Try during off-peak hours

#### Rate Limiting
```
❌ Error: Too many requests
```
**Solutions**:
- Implement request queuing
- Add delays between requests
- Contact Copernicus support for higher limits

### Fallback Behavior

The application automatically falls back to mock data when:
- Authentication fails
- No real data is available
- API requests timeout
- Network connectivity issues

## 📈 Performance Optimization

### Best Practices

1. **Smart Caching**
   ```javascript
   // Cache authentication tokens
   // Store processed results locally
   // Implement scene metadata caching
   ```

2. **Efficient Queries**
   ```javascript
   // Use appropriate bounding boxes
   // Filter by cloud cover early
   // Limit date ranges for faster response
   ```

3. **Parallel Processing**
   ```javascript
   // Process multiple scenes concurrently
   // Use worker threads for heavy calculations
   // Implement progressive data loading
   ```

## 🔐 Security Considerations

### Credential Management
- Never commit credentials to version control
- Use environment variables for sensitive data
- Consider using secret management services
- Rotate credentials regularly

### API Security
- Implement rate limiting on your endpoints
- Validate all input parameters
- Log access patterns for monitoring
- Use HTTPS for all communications

## 📚 Additional Resources

### Official Documentation
- [Copernicus Data Space Ecosystem](https://dataspace.copernicus.eu/)
- [Sentinel-2 User Guide](https://sentinels.copernicus.eu/web/sentinel/user-guides/sentinel-2-msi)
- [OData API Documentation](https://documentation.dataspace.copernicus.eu/APIs/OData.html)

### Scientific References
- [Sentinel-2 Spectral Bands](https://sentinels.copernicus.eu/web/sentinel/technical-guides/sentinel-2-msi/msi-instrument)
- [NDVI Calculation](https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index)
- [Soil Moisture from Satellite Data](https://www.mdpi.com/journal/remotesensing)

### Community
- [Copernicus Forum](https://forum.copernicus.eu/)
- [ESA Sentinel Online](https://sentinels.copernicus.eu/)
- [Open Data Cube Community](https://www.opendatacube.org/)

---

**Need Help?** Check the console logs for detailed error messages and debugging information. The application provides comprehensive logging for troubleshooting real data integration issues.
