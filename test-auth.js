const axios = require('axios');

async function testCopernicusAuthentication() {
    console.log('🔐 Testing Copernicus Data Space Authentication...');
    
    const credentials = {
        username: process.env.COPERNICUS_USERNAME || 'himanshuv20@gmail.com',
        password: process.env.COPERNICUS_PASSWORD || 'Hackathon@2025'
    };
    
    console.log(`📧 Testing with username: ${credentials.username}`);
    
    try {
        const response = await axios.post(
            'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
            new URLSearchParams({
                grant_type: 'password',
                username: credentials.username,
                password: credentials.password,
                client_id: 'cdse-public'
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 30000
            }
        );

        console.log('✅ Authentication successful!');
        console.log(`🔑 Token type: ${response.data.token_type}`);
        console.log(`⏰ Expires in: ${response.data.expires_in} seconds`);
        console.log(`🎯 Access token length: ${response.data.access_token.length} characters`);
        
        // Test a simple API call
        console.log('\n🔍 Testing Sentinel data search...');
        
        const searchResponse = await axios.get(
            'https://catalogue.dataspace.copernicus.eu/odata/v1/Products',
            {
                params: {
                    '$filter': "Collection/Name eq 'SENTINEL-2'",
                    '$top': 1
                },
                headers: {
                    'Authorization': `Bearer ${response.data.access_token}`
                },
                timeout: 30000
            }
        );
        
        console.log(`✅ Sentinel API test successful! Found ${searchResponse.data.value?.length || 0} products`);
        console.log('🎉 Real Sentinel data integration is working!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        
        if (error.response) {
            console.error(`📊 Status: ${error.response.status}`);
            console.error(`📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        
        if (error.code === 'ENOTFOUND') {
            console.error('🌐 Network issue: Cannot reach Copernicus servers');
        }
        
        return false;
    }
}

// Run the test
if (require.main === module) {
    require('dotenv').config();
    testCopernicusAuthentication()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test error:', error);
            process.exit(1);
        });
}

module.exports = { testCopernicusAuthentication };
