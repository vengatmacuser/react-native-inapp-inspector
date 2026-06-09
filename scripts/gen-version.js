#!/usr/bin/env node
/**
 * Auto-generates src/constants/version.ts from package.json so the in-app
 * version tag always matches the published npm version. Runs automatically
 * before every build via the "prebuild" npm script.
 *
 * This avoids importing package.json directly from src (which sits outside
 * tsconfig's rootDir) and avoids fragile runtime require paths that differ
 * between the src and dist layouts.
 */
const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const outFile = path.join(__dirname, '..', 'src', 'constants', 'version.ts');

const contents =
  '// AUTO-GENERATED FILE — do not edit by hand.\n' +
  '// Regenerated from package.json on every build by scripts/gen-version.js.\n' +
  `export const LIB_VERSION = '${pkg.version}';\n`;

fs.writeFileSync(outFile, contents);
console.log(
  `[gen-version] LIB_VERSION = ${pkg.version} -> ${path.relative(
    process.cwd(),
    outFile,
  )}`,
);
