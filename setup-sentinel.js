#!/usr/bin/env node

/**
 * Setup script for Sentinel Soil Analysis Platform
 * Helps configure real Sentinel satellite data integration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function setupSentinelIntegration() {
    console.log('🛰️  Sentinel Soil Analysis Platform Setup');
    console.log('=========================================\n');
    
    console.log('This script will help you configure real Sentinel satellite data integration.');
    console.log('You will need a free Copernicus Data Space Ecosystem account.\n');
    
    const proceed = await question('Do you want to set up real Sentinel data integration? (y/n): ');
    
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
        console.log('Setup cancelled. Your application will continue using mock data.');
        rl.close();
        return;
    }
    
    console.log('\n📋 Account Setup Instructions:');
    console.log('1. Visit: https://dataspace.copernicus.eu/');
    console.log('2. Click "Register" to create a free account');
    console.log('3. Verify your email address');
    console.log('4. Note your username and password\n');
    
    const hasAccount = await question('Do you have a Copernicus Data Space account? (y/n): ');
    
    if (hasAccount.toLowerCase() !== 'y' && hasAccount.toLowerCase() !== 'yes') {
        console.log('\n⚠️  Please create an account first and then run this setup again.');
        console.log('Visit: https://dataspace.copernicus.eu/');
        rl.close();
        return;
    }
    
    console.log('\n🔐 Enter your Copernicus Data Space credentials:');
    const username = await question('Username: ');
    const password = await question('Password: ');
    
    if (!username || !password) {
        console.log('❌ Username and password are required.');
        rl.close();
        return;
    }
    
    // Update .env file
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add environment variables
    const envVars = {
        'USE_MOCK_DATA': 'false',
        'COPERNICUS_USERNAME': username,
        'COPERNICUS_PASSWORD': password,
        'SENTINEL_API_BASE_URL': 'https://catalogue.dataspace.copernicus.eu/odata/v1',
        'SENTINEL_DOWNLOAD_BASE_URL': 'https://zipper.dataspace.copernicus.eu/odata/v1',
        'DEFAULT_MAX_CLOUD_COVER': '20',
        'API_TIMEOUT': '30000'
    };
    
    Object.entries(envVars).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (envContent.match(regex)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
            envContent += `\n${key}=${value}`;
        }
    });
    
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    console.log('\n✅ Configuration saved successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Restart your server: npm run dev');
    console.log('2. Your application will now use real Sentinel satellite data');
    console.log('3. Monitor the console for authentication status');
    
    console.log('\n📊 Usage Tips:');
    console.log('• Real data may take longer to fetch than mock data');
    console.log('• Cloud cover filtering helps find clearer images');
    console.log('• Data availability depends on satellite coverage and timing');
    console.log('• The system will fallback to mock data if real data is unavailable');
    
    console.log('\n🔧 Troubleshooting:');
    console.log('• If authentication fails, check your credentials');
    console.log('• Set USE_MOCK_DATA=true to revert to mock data');
    console.log('• Check console logs for detailed error messages');
    
    rl.close();
}

if (require.main === module) {
    setupSentinelIntegration().catch(console.error);
}

module.exports = { setupSentinelIntegration };
