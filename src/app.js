const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const soilController = require('./controllers/soilController');
const sentinelService = require('./services/sentinelService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Routes
app.get('/api/soil/analysis', soilController.getSoilAnalysis);
app.get('/api/soil/location', soilController.getSoilByLocation);
app.get('/api/sentinel/data', soilController.getSentinelData);
app.get('/api/locations/search', soilController.searchLocations);
app.get('/api/locations/reverse', soilController.getLocationFromCoordinates);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Sentinel Soil Analysis API'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Sentinel Soil Analysis Server running on port ${PORT}`);
    console.log(`📡 Ready to analyze satellite data for soil insights`);
});

module.exports = app;
