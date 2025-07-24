const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testAIAPI() {
    try {
        console.log('🤖 Testing AI API at http://165.22.208.62:4999/predict');
        
        // Check if we have a test image
        const imagePath = path.join(__dirname, 'assets', 'logo.jpg');
        
        if (!fs.existsSync(imagePath)) {
            console.log('❌ Test image not found at:', imagePath);
            console.log('Available files in assets:', fs.readdirSync(path.join(__dirname, 'assets')));
            return;
        }
        
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));
        
        console.log('📤 Sending image to AI API...');
        
        const response = await fetch('http://165.22.208.62:4999/predict', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            return;
        }
        
        const result = await response.json();
        
        console.log('\n🎯 COMPLETE AI RESPONSE:');
        console.log('================================');
        console.log(JSON.stringify(result, null, 2));
        console.log('================================');
        console.log('🔍 Response type:', typeof result);
        console.log('🔍 Response keys:', Object.keys(result));
        console.log('🔍 Response values:', Object.values(result));
        
    } catch (error) {
        console.error('❌ Error testing AI API:', error.message);
    }
}

testAIAPI();
