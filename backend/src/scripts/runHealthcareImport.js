// backend/src/scripts/runHealthcareImport.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import {
  importHealthcareFile,
  cleanString,
  cleanPhone,
  cleanEmail,
  cleanNumber,
  normalizeProviderType
} from '../services/healthcareImporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const sourceDir = path.join(__dirname, '..', '..', '..', 'Service Provider');

// Safety gate check: must be local/development database
const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ No DATABASE_URL or MONGODB_URI configured. Aborting.');
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';
if (nodeEnv !== 'development' && nodeEnv !== 'test') {
  console.error(`❌ NODE_ENV is set to '${nodeEnv}'. The importer only runs in development mode. Aborting.`);
  process.exit(1);
}

console.log('====================================================');
console.log('🏥 HOMELYSERV HEALTHCARE DIRECTORY: LOCAL IMPORTER');
console.log('====================================================');
console.log(`Database: homelyserv (local/development mode: ${nodeEnv})`);
console.log(`Source Folder: ${sourceDir}\n`);

async function run() {
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB safely.\n');

  const grandSummary = {
    datasetsProcessed: 0,
    totalRowsRead: 0,
    totalValidRecords: 0,
    newProvidersCreated: 0,
    existingProvidersMerged: 0,
    skippedRecords: 0,
    fileSummaries: []
  };

  // ----------------------------------------------------
  // 1. Egypt Private Network Sheet
  // (Updated Network Sheet.xlsx)
  // ----------------------------------------------------
  const egyptFile = path.join(sourceDir, 'Updated Network Sheet.xlsx');
  console.log('1️⃣ Processing Egypt Network Sheet...');
  const egyptSummary = await importHealthcareFile(egyptFile, {
    sheetName: 'Sheet1',
    mapRow: (row) => {
      const name = cleanString(row['Provider Name'] || row['Tatsh Name']);
      if (!name) return null;

      const phones = cleanPhone(row['Tel. no. - التليفون'] || row['Tel. no.'] || row['Telephone'] || row['Phone']);
      const email = cleanEmail(row['E-MAIL']);
      const address = cleanString(row['Address']);
      const specialty = cleanString(row['Specialty']);
      const rawServices = cleanString(row['Services provided']);
      const services = rawServices ? rawServices.split(/[,/]+/).map(s => s.trim()).filter(Boolean) : [];

      const rawType = cleanString(row['Provider Type']);
      const providerType = normalizeProviderType(rawType, name);

      return {
        providerName: name,
        providerType: providerType,
        specialty: specialty,
        services: services,
        country: 'Egypt',
        region: cleanString(row['Governate']),
        city: cleanString(row['Area / City']),
        address: address,
        phone: phones.primary,
        phoneSecondary: phones.secondary,
        email: email,
        verificationStatus: 'verified'
      };
    }
  });

  printSummary(egyptSummary);
  aggregate(grandSummary, egyptSummary);

  // ----------------------------------------------------
  // 2. Nextcare Regional Multi-Country Sheet
  // (nextcare-regional.xlsx)
  // ----------------------------------------------------
  const nextcareFile = path.join(sourceDir, 'nextcare-regional.xlsx');
  console.log('2️⃣ Processing Nextcare Regional Network...');
  const nextcareSummary = await importHealthcareFile(nextcareFile, {
    sheetName: 'REGIONAL',
    mapRow: (row) => {
      const name = cleanString(row['Name']);
      if (!name) return null;

      const phones = cleanPhone(row['Tel']);
      const fax = cleanString(row['Fax']);
      const lat = cleanNumber(row['LATITUDE']);
      const lon = cleanNumber(row['LONGITUDE']);
      const rawType = cleanString(row['Type']);

      return {
        providerName: name,
        providerType: normalizeProviderType(rawType, name),
        country: cleanString(row['Country']) || 'United Arab Emirates',
        city: cleanString(row['City']),
        area: cleanString(row['Area']),
        address: cleanString(row['Address']),
        phone: phones.primary,
        phoneSecondary: phones.secondary,
        fax: fax,
        latitude: lat,
        longitude: lon,
        googleMapsUrl: (lat && lon) ? `https://maps.google.com/?q=${lat},${lon}` : '',
        verificationStatus: 'verified'
      };
    }
  });

  printSummary(nextcareSummary);
  aggregate(grandSummary, nextcareSummary);

  // ----------------------------------------------------
  // 3. NAS UAE & GCC Network List
  // (OpenX-NAS-Network-List.xlsx)
  // ----------------------------------------------------
  const nasFile = path.join(sourceDir, 'OpenX-NAS-Network-List.xlsx');
  console.log('3️⃣ Processing OpenX NAS Network List...');
  const nasSummary = await importHealthcareFile(nasFile, {
    sheetName: 'NETWORK LIST',
    range: 'A5:Y5772',
    mapRow: (row) => {
      const name = cleanString(row['PROVIDER'] || row['PROVIDER ']);
      if (!name) return null;

      const phones = cleanPhone(row['TELEPHONE'] || row['PHONE']);
      const fax = cleanString(row['FAX']);
      const mapsUrl = cleanString(row['LOCATION']);
      const rawType = cleanString(row['CATEGORY'] || row['TYPE']);
      const hasDental = cleanString(row['HAS DENTAL SERVICE'] || row['DENTAL']).toLowerCase() === 'yes';

      return {
        providerName: name,
        providerType: normalizeProviderType(rawType, name),
        licenseNumber: cleanString(row['LICENSE NUMBER']),
        country: cleanString(row['COUNTRY']) || 'United Arab Emirates',
        region: cleanString(row['REGION'] || row['EMIRATE']),
        city: cleanString(row['REGION'] || row['EMIRATE']),
        area: cleanString(row['SUBREGION'] || row['AREA']),
        address: cleanString(row['BUILDING ADDRESS']),
        phone: phones.primary,
        phoneSecondary: phones.secondary,
        fax: fax,
        googleMapsUrl: mapsUrl.startsWith('http') ? mapsUrl : '',
        hasDental: hasDental,
        verificationStatus: 'verified'
      };
    }
  });

  printSummary(nasSummary);
  aggregate(grandSummary, nasSummary);

  // ----------------------------------------------------
  // 4. US CMS Hospital Master General Information
  // (Hospital_General_Information.csv)
  // ----------------------------------------------------
  const cmsFile = path.join(sourceDir, 'Hospital_General_Information.csv');
  console.log('4️⃣ Processing US CMS Hospital General Information...');
  const cmsSummary = await importHealthcareFile(cmsFile, {
    mapRow: (row) => {
      const name = cleanString(row['Facility Name']);
      if (!name) return null;

      const phones = cleanPhone(row['Telephone Number']);
      const rating = cleanNumber(row['Hospital overall rating']);
      const emergency = cleanString(row['Emergency Services']).toLowerCase() === 'yes';

      return {
        providerName: name,
        providerType: 'hospital',
        specialty: cleanString(row['Hospital Type']),
        ownershipType: cleanString(row['Hospital Ownership']),
        country: 'United States',
        region: cleanString(row['State']),
        city: cleanString(row['City/Town']),
        area: cleanString(row['County/Parish']),
        address: cleanString(row['Address']),
        postalCode: cleanString(row['ZIP Code']),
        phone: phones.primary,
        hasEmergency: emergency,
        rating: rating,
        verificationStatus: 'official_registry'
      };
    }
  });

  printSummary(cmsSummary);
  aggregate(grandSummary, cmsSummary);

  // ----------------------------------------------------
  // 5. UK NHS Active GP Practices
  // (epraccur.csv - headerless standard ODS CSV format)
  // ----------------------------------------------------
  const ukFile = path.join(sourceDir, 'epraccur.csv');
  console.log('5️⃣ Processing UK NHS GP Practices (epraccur.csv)...');
  const ukSummary = await importHealthcareFile(ukFile, {
    header: 1, // Array mode for headerless CSV
    mapRow: (row) => {
      if (!Array.isArray(row)) return null;
      const code = cleanString(row[0]);
      const name = cleanString(row[1]);
      if (!name || name.length < 3) return null;

      const addr1 = cleanString(row[4]);
      const addr2 = cleanString(row[5]);
      const addr3 = cleanString(row[6]);
      const town = cleanString(row[7]);
      const county = cleanString(row[8]);
      const postcode = cleanString(row[9]);
      const status = cleanString(row[12]);
      const phone = cleanPhone(row[17]);

      // Only import active surgeries
      if (status && status !== 'A' && status !== 'ACTIVE') return null;

      const fullAddress = [addr1, addr2, addr3].filter(Boolean).join(', ');

      return {
        providerId: `nhs_${code || Math.random().toString(36).slice(2, 9)}`,
        providerName: name,
        providerType: 'clinic',
        specialty: 'General Practice & Family Medicine',
        country: 'United Kingdom',
        region: county,
        city: town,
        address: fullAddress,
        postalCode: postcode,
        phone: phone.primary,
        verificationStatus: 'official_registry'
      };
    }
  });

  printSummary(ukSummary);
  aggregate(grandSummary, ukSummary);

  console.log('\n====================================================');
  console.log('🎉 TOTAL IMPORT PIPELINE COMPLETE');
  console.log('====================================================');
  console.log(`Datasets Processed:         ${grandSummary.datasetsProcessed}`);
  console.log(`Total Rows Read:            ${grandSummary.totalRowsRead.toLocaleString()}`);
  console.log(`Valid Provider Records:     ${grandSummary.totalValidRecords.toLocaleString()}`);
  console.log(`New Unique Providers:       ${grandSummary.newProvidersCreated.toLocaleString()}`);
  console.log(`Duplicates Safely Merged:   ${grandSummary.existingProvidersMerged.toLocaleString()}`);
  console.log(`Skipped Rows:               ${grandSummary.skippedRecords.toLocaleString()}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
}

function printSummary(s) {
  console.log(`   📄 File: ${s.filename}`);
  console.log(`   📊 Rows Read: ${s.rowsRead.toLocaleString()} | Valid: ${s.validRecords.toLocaleString()} | Created: ${s.newCreated.toLocaleString()} | Merged: ${s.mergedUpdated.toLocaleString()} | Skipped: ${s.skipped.toLocaleString()}`);
  if (s.errors.length > 0) {
    console.log(`   ⚠️ Errors encountered: ${s.errors.length} (showing first 3):`, s.errors.slice(0, 3));
  }
  console.log('');
}

function aggregate(grand, single) {
  grand.datasetsProcessed++;
  grand.totalRowsRead += single.rowsRead;
  grand.totalValidRecords += single.validRecords;
  grand.newProvidersCreated += single.newCreated;
  grand.existingProvidersMerged += single.mergedUpdated;
  grand.skippedRecords += single.skipped;
  grand.fileSummaries.push(single);
}

run().catch((err) => {
  console.error('Fatal error during import run:', err);
  process.exit(1);
});
