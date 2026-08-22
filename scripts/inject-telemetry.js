#!/usr/bin/env node
/**
 * scripts/inject-telemetry.js
 *
 * Injects GA4 Measurement Protocol credentials from environment variables / .env
 * into compiled dist/ bundles before packaging.
 *
 * This ensures credentials are NEVER committed to GitHub in source files while
 * being seamlessly bundled into published npm artifacts.
 */

const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const rootDir = path.resolve(__dirname, '..');
const localEnv = parseEnvFile(path.join(rootDir, '.env.local'));
const baseEnv = parseEnvFile(path.join(rootDir, '.env'));

const measurementId =
  process.env.GA4_MEASUREMENT_ID ||
  localEnv.GA4_MEASUREMENT_ID ||
  baseEnv.GA4_MEASUREMENT_ID ||
  '';

const apiSecret =
  process.env.GA4_API_SECRET ||
  localEnv.GA4_API_SECRET ||
  baseEnv.GA4_API_SECRET ||
  '';

if (!measurementId || !apiSecret) {
  console.log(
    '[inject-telemetry] No GA4 credentials detected in .env / process.env — keeping default placeholders in dist.',
  );
  process.exit(0);
}

const targetFiles = [
  path.join(rootDir, 'dist', 'commonjs', 'helpers', 'telemetry.js'),
  path.join(rootDir, 'dist', 'esm', 'helpers', 'telemetry.js'),
  path.join(rootDir, 'dist', 'commonjs', 'index.js'),
  path.join(rootDir, 'dist', 'esm', 'index.js'),
];

let injectedCount = 0;

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  const initialContent = content;

  content = content.replace(/__GA4_MEASUREMENT_ID__|G-XXXXXXXXXX/g, measurementId);
  content = content.replace(/__GA4_API_SECRET__|YOUR_GA4_API_SECRET/g, apiSecret);

  if (content !== initialContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    injectedCount++;
  }
}

console.log(
  `[inject-telemetry] Successfully injected GA4 credentials into ${injectedCount} dist bundle(s).`,
);
