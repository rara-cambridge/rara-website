#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

// ---------------------------------------------------------------------------
// CLI args
// Usage: compose.js <template.hbs> <output.json> [--minify]
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const tplArg = args[0];
const outArg = args[1];
const minify = args.includes('--minify');

if (!tplArg || !outArg) {
  console.error('Usage: compose.js <template.hbs> <output.json> [--minify]');
  process.exit(1);
}

const tplPath = path.resolve(process.cwd(), tplArg);
const outPath = path.resolve(process.cwd(), outArg);
const tplDir = path.dirname(tplPath);

if (!fs.existsSync(tplPath)) {
  console.error(`Template not found: ${tplPath}`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Helper to load JSON relative to template directory
// ---------------------------------------------------------------------------

function loadJson(fullPath) {
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

Handlebars.registerHelper('includeJson', function (fileName, prop) {
  // If prop is the Handlebars options object, ignore it
  if (prop && typeof prop === 'object' && !Array.isArray(prop)) {
    prop = undefined;
  }

  if (typeof fileName !== 'string') {
    throw new Error('includeJson: filename must be a string');
  }

  const full = path.resolve(tplDir, fileName);
  if (!fs.existsSync(full)) {
    throw new Error(`includeJson: file not found: ${full}`);
  }

  const jsonObj = loadJson(full);
  const selected = prop ? jsonObj[prop] : jsonObj;

  return new Handlebars.SafeString(JSON.stringify(selected));
});

// ---------------------------------------------------------------------------
// Render template
// ---------------------------------------------------------------------------

const tplSource = fs.readFileSync(tplPath, 'utf8');
const tpl = Handlebars.compile(tplSource, { noEscape: true });

// Produce raw JSON string
const rawOutput = tpl({});

// Validate JSON
let jsonValue;
try {
  jsonValue = JSON.parse(rawOutput);
} catch (err) {
  console.error('❌ Rendered output is not valid JSON:', err.message);
  console.error('--- Output preview ---');
  console.error(rawOutput.slice(0, 2000));
  console.error('--- End preview ---');
  process.exit(3);
}

// ---------------------------------------------------------------------------
// Pretty-print or minify
// ---------------------------------------------------------------------------

const finalOutput = minify ? JSON.stringify(jsonValue) : JSON.stringify(jsonValue, null, 2);

// Ensure directory exists
fs.mkdirSync(path.dirname(outPath), { recursive: true });

// Write file
fs.writeFileSync(outPath, finalOutput, 'utf8');

console.log(`✓ Wrote ${outPath} (${minify ? 'minified' : 'pretty-printed'})`);
