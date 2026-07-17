// backend/src/config.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Log loaded variables
console.log('📂 .env loaded from:', path.join(__dirname, '..', '.env'));
console.log('🔑 PAYMOB_API_KEY:', process.env.PAYMOB_API_KEY ? '✅ Found' : '❌ Missing');
console.log('🔑 PAYMOB_INTEGRATION_ID:', process.env.PAYMOB_INTEGRATION_ID ? '✅ Found' : '❌ Missing');
console.log('🔑 PAYMOB_IFRAME_ID:', process.env.PAYMOB_IFRAME_ID ? '✅ Found' : '❌ Missing');

export default process.env;