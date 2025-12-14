#!/usr/bin/env node

/**
 * Downloads world data from world_countries_lists and stores original files
 * Source: https://github.com/stefangabos/world_countries
 *
 * This script downloads the raw world data files (249 countries/territories)
 * and stores them with timestamps. It includes change detection to prevent
 * unnecessary updates.
 *
 * Usage:
 *   npm run download:world           # Download and save if changed
 *   npm run download:world -- --dry  # Check for changes without saving
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'https://cdn.jsdelivr.net/npm/world_countries_lists@latest/data/countries';

// Languages we support
const LANGUAGES = {
  en: 'en',
  zh_TW: 'zh-tw',
  zh_CN: 'zh',
  ja: 'ja',
  ko: 'ko'
};

// Check if --dry flag is present
const isDryRun = process.argv.includes('--dry') || process.argv.includes('--dry-run');

// Download JSON from URL with timeout
function downloadJSON(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`));
        }
      });
    });

    request.on('error', (err) => {
      reject(new Error(`Network error: ${err.message}`));
    });

    // Add timeout handling
    request.setTimeout(timeoutMs, () => {
      request.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    });
  });
}

// Calculate hash of data for comparison
// Sort by ID to ensure consistent ordering
function calculateHash(data) {
  const sorted = [...data].sort((a, b) => (a.id || 0) - (b.id || 0));
  const normalized = JSON.stringify(sorted, Object.keys(sorted).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Compare downloaded data with existing files
function detectChanges(downloadedData, dataDir) {
  const changes = {};
  let hasChanges = false;

  for (const [key, data] of Object.entries(downloadedData)) {
    const filename = `world-${key}.json`;
    const filepath = path.join(dataDir, filename);

    if (!fs.existsSync(filepath)) {
      changes[key] = { status: 'new', count: data.length };
      hasChanges = true;
      continue;
    }

    const existingData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const existingHash = calculateHash(existingData);
    const newHash = calculateHash(data);

    if (existingHash !== newHash) {
      changes[key] = {
        status: 'changed',
        count: data.length,
        oldCount: existingData.length
      };
      hasChanges = true;
    } else {
      changes[key] = { status: 'unchanged', count: data.length };
    }
  }

  return { changes, hasChanges };
}

async function main() {
  console.log('📥 Downloading world data from world_countries_lists...');
  console.log(`Source: https://github.com/stefangabos/world_countries (world.json - 249 countries/territories)`);
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  } else {
    console.log('');
  }

  const dataDir = path.join(__dirname, '..', 'data', 'world-raw');

  // Download all languages
  const downloadedData = {};

  for (const [key, code] of Object.entries(LANGUAGES)) {
    const url = `${BASE_URL}/${code}/world.json`;
    console.log(`Downloading ${key} (${code})...`);

    try {
      const data = await downloadJSON(url);
      downloadedData[key] = data;
      console.log(`  ✓ Downloaded ${data.length} territories\n`);
    } catch (err) {
      console.error(`  ✗ Failed to download ${key}:`, err.message);
      process.exit(1);
    }
  }

  // Detect changes
  console.log('🔍 Checking for changes...\n');
  const { changes, hasChanges } = detectChanges(downloadedData, dataDir);

  // Display change summary
  for (const [key, change] of Object.entries(changes)) {
    if (change.status === 'new') {
      console.log(`  📝 ${key}: NEW FILE (${change.count} territories)`);
    } else if (change.status === 'changed') {
      console.log(`  ⚠️  ${key}: CHANGED (${change.oldCount} → ${change.count} territories)`);
    } else {
      console.log(`  ✓ ${key}: No changes (${change.count} territories)`);
    }
  }

  if (!hasChanges) {
    console.log('\n✅ All files are up to date. No changes detected.');
    return;
  }

  if (isDryRun) {
    console.log('\n⚠️  Changes detected but not saved (dry run mode).');
    console.log('Run without --dry flag to save changes.');
    return;
  }

  // Save files
  console.log('\n💾 Saving updated files...\n');

  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const downloadInfo = {
    downloadedAt: timestamp,
    source: 'https://github.com/stefangabos/world_countries',
    cdnUrl: BASE_URL,
    languages: {}
  };

  for (const [key, data] of Object.entries(downloadedData)) {
    const filename = `world-${key}.json`;
    const filepath = path.join(dataDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');

    downloadInfo.languages[key] = {
      code: LANGUAGES[key],
      filename: filename,
      count: data.length,
      hash: calculateHash(data)
    };

    const changeStatus = changes[key].status;
    if (changeStatus === 'new' || changeStatus === 'changed') {
      console.log(`  ✓ Saved ${filename}`);
    }
  }

  // Save metadata file with timestamp
  const metadataPath = path.join(dataDir, 'download-info.json');
  fs.writeFileSync(metadataPath, JSON.stringify(downloadInfo, null, 2), 'utf-8');

  console.log(`  ✓ Saved download-info.json`);
  console.log(`\n📅 Download Date: ${new Date(timestamp).toISOString().split('T')[0]}`);
  console.log(`📁 Files saved to: data/world-raw/`);
  console.log('\n✅ Done! Run the build process to generate location-flags.json');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
