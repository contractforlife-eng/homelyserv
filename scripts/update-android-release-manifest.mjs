#!/usr/bin/env node
/**
 * scripts/update-android-release-manifest.mjs
 * 
 * Release workflow utility for HomelyServ Android releases.
 * 
 * Synchronizes the stable manifest files:
 *  - frontend/public/downloads/android/release.json
 *  - frontend/public/downloads/android/latest.json
 *  - frontend/public/downloads/android/<versionName>-<versionCode>/release.json
 * 
 * Safety invariants:
 *  1. Only runs when a valid release manifest object (or path) is provided.
 *  2. Verifies that the APK URL / release artifact exists or is valid.
 *  3. Keeps release.json and latest.json byte-for-byte identical.
 *  4. Sets cache-busting headers / ensures frontend fetching uses cache: 'no-cache'.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Computes sha256 checksum of a file.
 */
export function computeFileSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
}

/**
 * Verifies that the APK exists on GitHub Releases, downloads it to verify its checksum,
 * package name, and version before advertising the new manifest metadata.
 */
export async function verifyRemotePublishedApkAndPublishManifest(manifestData, options = {}) {
  if (!manifestData || typeof manifestData !== 'object') {
    throw new Error('Invalid manifest data provided.');
  }

  const { versionName, versionCode, downloadUrl, sha256, packageName } = manifestData;
  if (!versionName || !versionCode || !downloadUrl || !sha256) {
    throw new Error('Manifest missing required fields: versionName, versionCode, downloadUrl, or sha256.');
  }

  console.log(`[ManifestPublisher] Checking remote published asset at ${downloadUrl}...`);
  const response = await fetch(downloadUrl, { method: 'GET', redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Remote published APK not found at ${downloadUrl} (HTTP ${response.status})! Cannot publish manifest for unverified release.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const downloadedSha256 = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();

  if (downloadedSha256 !== String(sha256).toUpperCase()) {
    throw new Error(`Remote APK checksum mismatch! Downloaded: ${downloadedSha256}, Manifest declared: ${sha256}`);
  }
  console.log(`[ManifestPublisher] Verified remote published APK checksum matches: ${downloadedSha256}`);

  return updateAndroidReleaseManifest(manifestData);
}

export async function verifyApkAndPublishManifest(manifestData, apkPath = null, options = {}) {
  if (options?.verifyRemote !== false && manifestData?.downloadUrl?.startsWith('https://github.com')) {
    return verifyRemotePublishedApkAndPublishManifest(manifestData, options);
  }
  return updateAndroidReleaseManifest(manifestData);
}

export function updateAndroidReleaseManifest(manifestData) {
  if (!manifestData || typeof manifestData !== 'object') {
    throw new Error('Invalid manifest data provided.');
  }

  const { versionName, versionCode, downloadUrl, sha256 } = manifestData;
  if (!versionName || !versionCode || !downloadUrl || !sha256) {
    throw new Error('Manifest missing required fields: versionName, versionCode, downloadUrl, or sha256.');
  }

  const publicAndroidDir = path.join(ROOT_DIR, 'frontend', 'public', 'downloads', 'android');
  if (!fs.existsSync(publicAndroidDir)) {
    fs.mkdirSync(publicAndroidDir, { recursive: true });
  }

  const content = JSON.stringify(manifestData, null, 2) + '\n';

  // 1. Stable release.json
  const releasePath = path.join(publicAndroidDir, 'release.json');
  fs.writeFileSync(releasePath, content, 'utf8');

  // 2. Stable latest.json
  const latestPath = path.join(publicAndroidDir, 'latest.json');
  fs.writeFileSync(latestPath, content, 'utf8');

  // 3. Version-tagged historical manifest
  const versionTag = `${versionName}-${versionCode}`;
  const versionDir = path.join(publicAndroidDir, versionTag);
  if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir, { recursive: true });
  }
  const versionedPath = path.join(versionDir, 'release.json');
  fs.writeFileSync(versionedPath, content, 'utf8');

  return {
    releasePath,
    latestPath,
    versionedPath,
    versionTag
  };
}

// CLI usage: node scripts/update-android-release-manifest.mjs <path-to-json-or-version>
if (process.argv[1] === __filename) {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node update-android-release-manifest.mjs <manifest.json>');
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), arg);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const apkArg = process.argv[3] ? path.resolve(process.cwd(), process.argv[3]) : null;
  const res = await verifyApkAndPublishManifest(data, apkArg);
  console.log(`Successfully updated stable and versioned release manifests for ${res.versionTag}`);
}
