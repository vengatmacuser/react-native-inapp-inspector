#!/usr/bin/env node

const {execFileSync} = require('node:child_process');
const {readFileSync} = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const help = args.includes('--help') || args.includes('-h');

const bumpArg = args.find(arg => !arg.startsWith('-'));
const bump = bumpArg || getOptionValue('--bump') || 'patch';
const npmTag = getOptionValue('--tag') || 'latest';
const allowedBumps = new Set(['patch', 'minor', 'major']);

function getOptionValue(name) {
  const match = args.find(arg => arg.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

function run(command, commandArgs, options = {}) {
  const printable = [command, ...commandArgs].join(' ');
  console.log(`\n$ ${printable}`);

  if (dryRun && options.skipInDryRun) {
    console.log('[dry-run] skipped');
    return '';
  }

  return execFileSync(command, commandArgs, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function getPackageJson() {
  return JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
}

function getNextVersion(currentVersion, releaseType) {
  const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/);

  if (!match) {
    throw new Error(`Unsupported package version: ${currentVersion}`);
  }

  let [, major, minor, patch] = match.map(Number);

  if (releaseType === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (releaseType === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

function ensureCleanGit() {
  const status = run('git', ['status', '--porcelain'], {capture: true}).trim();

  if (status) {
    throw new Error(
      'Git working tree is not clean. Commit or stash changes before publishing.',
    );
  }
}

function ensureVersionIsNotPublished(packageName, version) {
  try {
    run('npm', ['view', `${packageName}@${version}`, 'version'], {
      capture: true,
    });
  } catch (_error) {
    return;
  }

  throw new Error(`${packageName}@${version} is already published on npm.`);
}

function printHelp() {
  console.log(`
Publish the next package version to npm and push the release commit/tag to GitHub.

Usage:
  npm run publish
  npm run publish -- minor
  npm run publish -- --bump=major --tag=latest
  npm run publish -- --dry-run

Options:
  patch|minor|major       Version bump to apply. Defaults to patch.
  --bump=<type>           Alternative way to set patch, minor, or major.
  --tag=<dist-tag>        npm dist-tag to publish with. Defaults to latest.
  --dry-run               Build and preview package contents without publishing.
`);
}

function main() {
  if (help) {
    printHelp();
    return;
  }

  if (!allowedBumps.has(bump)) {
    throw new Error(`Unsupported bump "${bump}". Use patch, minor, or major.`);
  }

  const packageJson = getPackageJson();
  const nextVersion = getNextVersion(packageJson.version, bump);

  run('git', ['rev-parse', '--is-inside-work-tree'], {capture: true});

  if (!dryRun) {
    ensureCleanGit();
  }

  console.log(
    `\nPreparing ${packageJson.name} ${packageJson.version} -> ${nextVersion}`,
  );
  console.log(`npm dist-tag: ${npmTag}`);

  if (!dryRun) {
    run('npm', ['whoami'], {capture: true});
    ensureVersionIsNotPublished(packageJson.name, nextVersion);
  }

  run('npm', ['run', 'build']);
  run('npm', ['pack', '--dry-run']);

  if (dryRun) {
    console.log(
      `\n[dry-run] Ready to publish ${packageJson.name}@${nextVersion}.`,
    );
    return;
  }

  run('npm', ['version', bump, '-m', 'chore(release): v%s']);

  const releaseVersion = getPackageJson().version;

  run('npm', ['publish', '--access', 'public', '--tag', npmTag]);
  run('git', ['push', 'origin', 'HEAD']);
  run('git', ['push', 'origin', `v${releaseVersion}`]);

  console.log(
    `\nPublished ${packageJson.name}@${releaseVersion} and pushed v${releaseVersion} to GitHub.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`\nRelease failed: ${error.message}`);
  process.exit(1);
}
