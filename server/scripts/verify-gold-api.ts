/// <reference types="node" />
import 'dotenv/config';
import axios from 'axios';

async function verifyGoldApi() {
    console.log('🔍 Verifying Gold API Configuration (Direct Axios Test)...');

    const apiKey = process.env.GOLD_API_KEY;
    if (!apiKey) {
        console.error('❌ GOLD_API_KEY is not set in environment variables');
        process.exit(1);
    }

    console.log('🔑 GOLD_API_KEY is set');

    try {
        console.log('📡 Fetching live prices from GoldAPI.io...');

        // Test Gold
        const goldResponse = await axios.get(`https://www.goldapi.io/api/XAU/USD`, {
            headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
            timeout: 5000
        });

        if (goldResponse.status !== 200) throw new Error(`Gold API Status: ${goldResponse.status}`);

        // Test Silver
        const silverResponse = await axios.get(`https://www.goldapi.io/api/XAG/USD`, {
            headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
            timeout: 5000
        });

        const goldPrice = goldResponse.data.price_gram_24k || (goldResponse.data.price / 31.1034768);
        const silverPrice = silverResponse.data.price_gram_24k || (silverResponse.data.price / 31.1034768);

        console.log('\n✅ API Call Successful!');
        console.log('--------------------------------');
        console.log(`Gold Price:   $${goldPrice.toFixed(2)} /g`);
        console.log(`Silver Price: $${silverPrice.toFixed(2)} /g`);

        if (Math.abs(goldPrice - 65.00) < 0.01) {
            console.warn('⚠️  Values match default fallback. Suspicious.');
        } else {
            console.log('🎉 Values differ from fallback, indicating LIVE data.');
        }

    } catch (error: any) {
        console.error('\n❌ Verification Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        }
        process.exit(1);
    }
}

verifyGoldApi();
