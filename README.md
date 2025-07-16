# 🛰️ Sentinel Soil Analysis Platform

An advanced Node.js application that reads Sentinel satellite data to provide comprehensive insights into soil conditions including moisture levels, composition, and other agricultural parameters. Features geolocation filtering and intelligent recommendations for farmers and environmental scientists.

## 🚀 Features

- **Real-time Satellite Data Processing**: Fetches and analyzes Sentinel-2 satellite imagery
- **Comprehensive Soil Analysis**:
  - Soil moisture content analysis using NDMI (Normalized Difference Moisture Index)
  - Soil composition analysis (clay, sand, silt percentages)
  - Organic matter and pH estimation
  - Soil temperature calculation
- **Vegetation Health Monitoring**: NDVI analysis for crop health assessment
- **Geolocation Filtering**: Select specific geographic locations for targeted analysis
- **Intelligent Recommendations**: AI-powered agricultural recommendations based on soil conditions
- **Interactive Web Interface**: Beautiful, responsive web dashboard
- **RESTful API**: Full API access for integration with other systems

## 🌍 Supported Data Sources

- **Sentinel-2**: Primary satellite data source for multispectral analysis
- **Copernicus Data Space Ecosystem**: European Space Agency's free and open satellite data
- **Mock Data Mode**: For development and demonstration purposes

## 📊 Analysis Parameters

### Soil Moisture
- Moisture percentage (0-100%)
- Moisture level classification (very low, low, moderate, high, very high)
- NDMI values for technical analysis

### Soil Composition
- Clay content percentage
- Sand content percentage
- Silt content percentage
- Soil type classification (Clay, Sand, Loam, etc.)
- Organic matter content
- pH level estimation

### Environmental Factors
- Surface temperature
- Vegetation health indices (NDVI, EVI)
- Seasonal and geographic corrections
- Data quality and confidence metrics

## 🛠️ Installation

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm or yarn package manager

### Quick Start

1. **Clone or navigate to the project directory**:
   ```bash
   cd "C:\Users\Tanya\OneDrive\Desktop\Hackathon\Satelite"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your API keys (optional for demo mode)

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Use mock data for demonstration (set to false for real API)
USE_MOCK_DATA=true

# Optional: Real API Keys (sign up for free)
COPERNICUS_CLIENT_ID=your_client_id_here
COPERNICUS_CLIENT_SECRET=your_client_secret_here
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Real Data Access

To use real satellite data:

1. **Sign up for Copernicus Data Space Ecosystem** (free):
   - Visit: https://dataspace.copernicus.eu/
   - Create an account and get API credentials
   - Add credentials to your `.env` file
   - Set `USE_MOCK_DATA=false`

2. **Optional APIs for enhanced features**:
   - OpenWeatherMap API for weather data
   - Google Maps API for advanced geocoding

## 📡 API Endpoints

### Core Analysis
- `GET /api/soil/analysis?lat={lat}&lon={lon}&startDate={date}&endDate={date}`
  - Primary soil analysis endpoint
  - Returns comprehensive soil data and recommendations

### Data Access
- `GET /api/soil/location?lat={lat}&lon={lon}&radius={meters}&parameters={params}`
  - Get soil data for specific location and radius
  - Filter by specific parameters (moisture, composition, temperature)

- `GET /api/sentinel/data?lat={lat}&lon={lon}&startDate={date}&endDate={date}`
  - Raw Sentinel satellite data access
  - Includes metadata and quality metrics

### Location Services
- `GET /api/locations/search?query={location_name}`
  - Search for locations by name
  - Returns coordinates and location information

### System
- `GET /api/health`
  - API health check
  - System status information

## 🖥️ Web Interface

The application includes a responsive web interface accessible at `http://localhost:3000` with:

- **Interactive Search**: Enter coordinates or search for locations
- **Real-time Analysis**: Click "Analyze Soil" to get instant results
- **Visual Dashboard**: Comprehensive data visualization with progress bars and metrics
- **Recommendations**: AI-powered agricultural advice
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices

## 🔬 Scientific Background

### Vegetation Indices

- **NDVI (Normalized Difference Vegetation Index)**: 
  - Formula: (NIR - Red) / (NIR + Red)
  - Range: -1 to +1
  - Measures vegetation density and health

- **NDMI (Normalized Difference Moisture Index)**:
  - Formula: (NIR - SWIR1) / (NIR + SWIR1)
  - Indicates vegetation water content and soil moisture

- **EVI (Enhanced Vegetation Index)**:
  - Improved version of NDVI with atmospheric correction
  - Better performance in high biomass areas

### Spectral Bands Used

- **B02 (Blue)**: 490nm - Atmospheric and water analysis
- **B03 (Green)**: 560nm - Vegetation analysis
- **B04 (Red)**: 665nm - Chlorophyll absorption
- **B08 (NIR)**: 842nm - Vegetation structure
- **B11 (SWIR1)**: 1610nm - Moisture content
- **B12 (SWIR2)**: 2190nm - Soil and mineral analysis

## 🚀 Deployment

### Local Production
```bash
npm start
```

### Using PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start src/app.js --name "soil-analysis"
pm2 save
pm2 startup
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **European Space Agency (ESA)** for providing free Sentinel satellite data
- **Copernicus Programme** for Earth observation data access
- **Turf.js** for geospatial analysis capabilities
- **Node.js community** for excellent ecosystem support

## 📞 Support

For questions, issues, or contributions:

- Create an issue on GitHub
- Contact the development team
- Check the API documentation for technical details

---

**Built with ❤️ for sustainable agriculture and environmental monitoring**
