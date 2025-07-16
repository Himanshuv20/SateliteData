# 🛰️ Sentinel Soil Analysis Platform

![GitHub last commit](https://img.shields.io/github/last-commit/Himanshuv20/SateliteData)
![GitHub repo size](https://img.shields.io/github/repo-size/Himanshuv20/SateliteData)
![GitHub language count](https://img.shields.io/github/languages/count/Himanshuv20/SateliteData)

A comprehensive platform for analyzing soil conditions using real-time Sentinel-2 satellite imagery and advanced spectral analysis algorithms.

## 🌟 Features

### 🛰️ **Real Satellite Data Integration**
- **Copernicus Data Space Ecosystem** integration
- **Sentinel-2** satellite imagery processing
- **Real-time authentication** and data retrieval
- **Automatic fallback** to mock data when needed

### 🌱 **Advanced Soil Analysis**
- **NDVI (Normalized Difference Vegetation Index)** calculation
- **NDMI (Normalized Difference Moisture Index)** analysis
- **EVI (Enhanced Vegetation Index)** computation
- **Soil composition** estimation (clay, sand, silt)
- **Moisture level** assessment
- **pH and organic matter** analysis
- **Fertility scoring** algorithm

### 🗺️ **Enhanced Location Services**
- **City name to coordinates** conversion
- **Real-time geocoding** using OpenStreetMap Nominatim
- **Agricultural location** recommendations
- **Global location search** with autocomplete
- **Popular farming regions** quick access

### 🎨 **Professional Web Interface**
- **Modern responsive design** with CSS Grid
- **Real-time search** with loading indicators
- **Interactive progress bars** and charts
- **Smart recommendations** system
- **Mobile-optimized** interface

### 🔧 **Technical Excellence**
- **Node.js + Express.js** backend
- **RESTful API** architecture
- **Comprehensive error handling**
- **Production-ready** code structure
- **Environmental configuration**
- **Detailed documentation**

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- Copernicus Data Space account (free)

### Installation

```bash
# Clone the repository
git clone https://github.com/Himanshuv20/SateliteData.git
cd SateliteData

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Copernicus credentials

# Start the server
npm run dev
```

Visit `http://localhost:3000` to access the application.

### Quick Authentication Setup

```bash
# Test your Copernicus credentials
node test-auth.js
```

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/soil/analysis` | GET | Complete soil analysis for coordinates |
| `/api/locations/search` | GET | Search locations by city name |
| `/api/locations/reverse` | GET | Reverse geocoding from coordinates |
| `/api/health` | GET | API health status |

## 🌍 Usage Examples

### City Name Search
```javascript
// Search for cities
fetch('/api/locations/search?query=Delhi&type=all')

// Search agricultural regions
fetch('/api/locations/search?query=valley&type=agricultural')
```

### Soil Analysis
```javascript
// Analyze soil at coordinates
fetch('/api/soil/analysis?lat=28.6139&lon=77.2090&startDate=2025-06-16&endDate=2025-07-16')
```

## 🛰️ Satellite Data Sources

- **Sentinel-2 MSI**: Multispectral Instrument data
- **Spectral Bands**: B02, B03, B04, B08, B11, B12
- **Resolution**: 10m-60m depending on band
- **Coverage**: Global, 5-day revisit time
- **Provider**: Copernicus Data Space Ecosystem

## 🧪 Scientific Algorithms

### Vegetation Indices
```javascript
// NDVI: Normalized Difference Vegetation Index
NDVI = (NIR - Red) / (NIR + Red)

// NDMI: Normalized Difference Moisture Index  
NDMI = (NIR - SWIR1) / (NIR + SWIR1)

// EVI: Enhanced Vegetation Index
EVI = 2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))
```

### Soil Parameters
- **Moisture Percentage**: Based on NDMI and thermal data
- **Soil Composition**: Spectral analysis of mineral content
- **pH Estimation**: Using multispectral correlations
- **Organic Matter**: Derived from vegetation and soil indices

## 📱 Web Interface

### Location Input Methods
1. **City Name Search**: Type "New York", "Delhi", "Paris"
2. **Coordinate Input**: Enter "40.7128, -74.0060"
3. **Quick Chips**: Click popular agricultural regions
4. **Search Filters**: All locations vs Agricultural only

### Analysis Results
- **Interactive Cards**: Soil moisture, vegetation health, composition
- **Progress Bars**: Visual representation of metrics
- **Smart Recommendations**: AI-powered farming suggestions
- **Export Options**: Download analysis reports

## 🌾 Agricultural Applications

### Farmers
- **Soil health monitoring**
- **Irrigation planning**
- **Crop suitability assessment**
- **Yield optimization**

### Researchers
- **Environmental monitoring**
- **Climate impact studies**
- **Agricultural research**
- **Land use analysis**

### Government Agencies
- **Policy planning**
- **Agricultural subsidies**
- **Environmental protection**
- **Food security planning**

## 🔒 Security & Privacy

- **Environment variables** for sensitive data
- **API rate limiting** implementation
- **Input validation** and sanitization
- **Error handling** without data exposure
- **No personal data** collection

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)**: Step-by-step setup guide
- **[SENTINEL_INTEGRATION.md](SENTINEL_INTEGRATION.md)**: Satellite data integration
- **[README.md](README.md)**: Comprehensive project overview
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)**: Development guidelines

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ESA Copernicus Programme** for Sentinel-2 data
- **OpenStreetMap** for geocoding services
- **Font Awesome** for icons
- **Google Fonts** for typography

## 📧 Contact

**Himanshu** - himanshuv20@gmail.com

**Project Link**: [https://github.com/Himanshuv20/SateliteData](https://github.com/Himanshuv20/SateliteData)

---

⭐ **Star this repository** if you find it helpful for your agricultural or environmental projects!

## 🎯 Future Roadmap

- [ ] **Machine Learning Models** for crop prediction
- [ ] **Historical Data Analysis** and trends
- [ ] **Mobile Application** development
- [ ] **API Rate Limiting** and caching
- [ ] **Real-time Notifications** system
- [ ] **Multi-language Support**
- [ ] **Advanced Data Visualization**
- [ ] **Integration with IoT Sensors**
