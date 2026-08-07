import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory (same as index.js)
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/homelyserv';

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('Connecting to:', MONGODB_URI ? MONGODB_URI.replace(/:[^:]+@/, ':****@') : 'NOT SET');

await mongoose.connect(MONGODB_URI);
console.log('Database name:', mongoose.connection.db.databaseName);

const collections = await mongoose.connection.db.listCollections().toArray();
console.log('Collections:', collections.map(c => c.name));

for (const col of collections) {
  const count = await mongoose.connection.db.collection(col.name).countDocuments();
  console.log('  ' + col.name + ': ' + count + ' documents');
}

const usersCol = mongoose.connection.db.collection('users');
const userCount = await usersCol.countDocuments();
console.log('Total users in users collection:', userCount);

const latestUsers = await usersCol.find({}).sort({ createdAt: -1 }).limit(5).toArray();
console.log('Latest 5 users:');
latestUsers.forEach(u => console.log('  -', u.email, u.fullName, u.role, u.createdAt));

await mongoose.disconnect();
