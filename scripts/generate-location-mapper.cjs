#!/usr/bin/env node

/**
 * Generates data/location-flags.json from world data
 *
 * This script:
 * 1. Reads raw world data from data/world-raw/
 * 2. Applies custom overrides and aliases from data/world-custom.json
 * 3. Converts ISO codes to flag emojis
 * 4. Generates location-flags.json with all world data (249 territories)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'world-raw');
const CUSTOM_FILE = path.join(DATA_DIR, 'world-custom.json');
const OUTPUT_DATA_FILE = path.join(DATA_DIR, 'location-flags.json');

// Convert ISO 3166-1 alpha-2 code to flag emoji
function isoToFlag(code) {
  return code.toUpperCase()
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

// Normalize locale key
function normalizeLocaleKey(locale) {
  const map = {
    'en': 'en',
    'zh-tw': 'zh_TW',
    'zh': 'zh_CN',
    'ja': 'ja',
    'ko': 'ko'
  };
  return map[locale.toLowerCase()] || locale;
}

// Load all raw world files
function loadRawWorld() {
  const languages = ['en', 'zh_TW', 'zh_CN', 'ja', 'ko'];
  const fileMap = {
    'en': 'world-en.json',
    'zh_TW': 'world-zh_TW.json',
    'zh_CN': 'world-zh_CN.json',
    'ja': 'world-ja.json',
    'ko': 'world-ko.json'
  };

  const countryData = {};

  for (const lang of languages) {
    const filepath = path.join(RAW_DIR, fileMap[lang]);

    if (!fs.existsSync(filepath)) {
      console.error(`❌ Missing file: ${filepath}`);
      console.error('   Run: npm run download:world');
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    countryData[lang] = data;
  }

  return countryData;
}

// Merge country data by ISO code
function mergeCountries(countryData) {
  const merged = {};

  // Use English as base
  for (const country of countryData.en) {
    const alpha2 = country.alpha2.toUpperCase();
    merged[alpha2] = {
      en: [country.name.toLowerCase()]
    };
  }

  // Add other languages
  const langKeys = ['zh_TW', 'zh_CN', 'ja', 'ko'];
  for (const langKey of langKeys) {
    for (const country of countryData[langKey]) {
      const alpha2 = country.alpha2.toUpperCase();
      if (merged[alpha2]) {
        if (!merged[alpha2][langKey]) {
          merged[alpha2][langKey] = [];
        }
        merged[alpha2][langKey].push(country.name.toLowerCase());
      }
    }
  }

  return merged;
}

// Apply custom overrides and aliases
function applyCustomData(merged) {
  if (!fs.existsSync(CUSTOM_FILE)) {
    console.log('⚠️  No custom data file found, skipping customizations');
    return merged;
  }

  const custom = JSON.parse(fs.readFileSync(CUSTOM_FILE, 'utf-8'));

  // Apply overrides
  if (custom.overrides) {
    for (const [isoCode, overrides] of Object.entries(custom.overrides)) {
      if (merged[isoCode]) {
        for (const [lang, value] of Object.entries(overrides)) {
          merged[isoCode][lang] = [value.toLowerCase()];
        }
      }
    }
  }

  // Apply additions
  if (custom.additions) {
    for (const [isoCode, data] of Object.entries(custom.additions)) {
      merged[isoCode] = {};
      for (const [lang, value] of Object.entries(data)) {
        if (lang !== 'aliases') {
          merged[isoCode][lang] = [value.toLowerCase()];
        }
      }
    }
  }

  // Apply aliases
  if (custom.aliases) {
    for (const [isoCode, aliases] of Object.entries(custom.aliases)) {
      if (merged[isoCode]) {
        // Simple approach: put all aliases in 'common' array
        if (!merged[isoCode].common) {
          merged[isoCode].common = [];
        }

        // If aliases is array (simple format), add to common
        if (Array.isArray(aliases)) {
          merged[isoCode].common.push(...aliases.map(a => a.toLowerCase()));
        }
        // If aliases is object with locale-specific keys (future support)
        else if (typeof aliases === 'object') {
          for (const [key, values] of Object.entries(aliases)) {
            if (!merged[isoCode][key]) {
              merged[isoCode][key] = [];
            }
            if (Array.isArray(values)) {
              merged[isoCode][key].push(...values.map(v => v.toLowerCase()));
            }
          }
        }
      }
    }
  }

  return merged;
}

// Generate the location-flags.json data file
function generateLocationFlagsData(countryFlags) {
  const output = {};

  for (const [isoCode, translations] of Object.entries(countryFlags)) {
    const flag = isoToFlag(isoCode);
    output[flag] = {
      iso: isoCode
    };

    for (const [lang, variants] of Object.entries(translations)) {
      const uniqueVariants = [...new Set(variants)]; // Remove duplicates
      output[flag][lang] = uniqueVariants;
    }
  }

  return output;
}

// Main function
function main() {
  console.log('🔨 Generating location-flags.json...\n');

  // Step 1: Load raw world data
  console.log('📖 Loading raw world data...');
  const worldData = loadRawWorld();
  console.log(`   ✓ Loaded data for ${Object.keys(worldData).length} languages\n`);

  // Step 2: Merge by ISO code
  console.log('🔄 Merging territories by ISO code...');
  let merged = mergeCountries(worldData);
  console.log(`   ✓ Merged ${Object.keys(merged).length} territories\n`);

  // Step 3: Apply custom data
  console.log('⚙️  Applying custom overrides and aliases...');
  merged = applyCustomData(merged);
  console.log(`   ✓ Applied customizations\n`);

  // Step 4: Generate location-flags.json
  console.log('📝 Generating location-flags.json...');
  const data = generateLocationFlagsData(merged);
  const jsonOutput = JSON.stringify(data, null, 2);
  fs.writeFileSync(OUTPUT_DATA_FILE, jsonOutput, 'utf-8');
  console.log(`   ✓ Saved to data/location-flags.json\n`);

  // Summary
  console.log('📊 Summary:');
  console.log(`   Territories: ${Object.keys(merged).length}`);
  console.log(`   File size: ${(jsonOutput.length / 1024).toFixed(2)} KB\n`);

  console.log('✅ Done!');
}

main();
