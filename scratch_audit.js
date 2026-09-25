import dotenv from './backend/node_modules/dotenv/lib/main.js';
import mongoose from './backend/node_modules/mongoose/index.js';
import fs from 'fs';

dotenv.config({ path: './backend/.env' });

async function auditCities() {
  const connUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  await mongoose.connect(connUri);
  const db = mongoose.connection.db;
  const col = db.collection('healthcare_providers');

  const pipelineCity = [
    { $group: { _id: { country: '$country', city: '$city' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  const citiesByCountry = await col.aggregate(pipelineCity).toArray();
  fs.writeFileSync('cities_by_country.json', JSON.stringify(citiesByCountry, null, 2), 'utf8');
  console.log('Saved cities_by_country.json, total groups:', citiesByCountry.length);

  const pipelineArea = [
    { $group: { _id: { country: '$country', area: '$area' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];
  const areasByCountry = await col.aggregate(pipelineArea).toArray();
  fs.writeFileSync('areas_by_country.json', JSON.stringify(areasByCountry, null, 2), 'utf8');
  console.log('Saved areas_by_country.json, total groups:', areasByCountry.length);

  await mongoose.disconnect();
}

auditCities();
