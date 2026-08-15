#!/usr/bin/env node
'use strict';

/*
 * release.cjs — one-shot release pipeline
 *
 *   bump version  ->  push to GitHub  ->  create GitHub Release  ->  publish to npm
 *   ...then print a tabular summary of exactly what changed.
 *
 * Usage (wired to the "publish" npm script):
 *   npm run publish                  # patch bump (default)
 *   npm run publish -- minor         # minor bump
 *   npm run publish -- major -y      # major bump, skip the confirm prompt
 *   npm run publish -- 2.0.0         # set an explicit version
 *   npm run publish -- patch -n      # dry run, changes nothing
 *
 * Flags:
 *   -y, --yes            skip the confirmation prompt
 *   -n, --dry-run        print the plan, execute nothing destructive
 *       --no-push        skip `git push`
 *       --no-release     skip the GitHub release
 *       --local-publish  publish directly from local machine (default: false, delegated to GitHub Actions)
 *       --no-publish     skip `npm publish`
 *       --access <a>     pass --access to npm publish (public|restricted)
 *       --tag <t>        publish under an npm dist-tag (e.g. next, beta)
 */

const {execSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');

// --- Recursion guard --------------------------------------------------------
// `npm publish` runs a lifecycle script literally named "publish" — which is
// THIS script. Without a guard the inner `npm publish` would re-invoke us
// forever. We set this env var around the inner publish and bail immediately
// when we see it, so the real publish proceeds and other lifecycle hooks
// (prepare, build, etc.) still run normally.
if (process.env.__RELEASE_PUBLISHING__ === '1') process.exit(0);

// --- Styling ----------------------------------------------------------------
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = code => s => useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s);
const C = {
  bold: wrap('1'),
  dim: wrap('2'),
  red: wrap('31'),
  green: wrap('32'),
  yellow: wrap('33'),
  blue: wrap('34'),
  magenta: wrap('35'),
  cyan: wrap('36'),
  gray: wrap('90'),
};
const ICON = {
  ok: C.green('✔'),
  fail: C.red('✗'),
  info: C.cyan('ℹ'),
  warn: C.yellow('!'),
  arrow: C.gray('→'),
};

const log = (s = '') => process.stdout.write(s + '\n');

// --- Table renderer (zero deps, ANSI-aware) ---------------------------------
const stripAnsi = s => String(s).replace(/\x1b\[[0-9;]*m/g, '');
const vlen = s => stripAnsi(s).length;
const pad = (s, w) => s + ' '.repeat(Math.max(0, w - vlen(s)));

function table({head = [], rows = [], title = ''}) {
  const cols = Math.max(head.length, ...rows.map(r => r.length), 0);
  const widths = new Array(cols).fill(0);
  for (const r of [head, ...rows]) {
    r.forEach(
      (cell, i) =>
        (widths[i] = Math.max(widths[i] || 0, vlen(String(cell ?? '')))),
    );
  }
  const V = C.gray('│');
  const border = (l, m, r) =>
    C.gray(l + widths.map(w => '─'.repeat(w + 2)).join(m) + r);
  const row = (cells, fn = x => x) =>
    V +
    cells
      .map((cell, i) => ' ' + fn(pad(String(cell ?? ''), widths[i])) + ' ')
      .join(V) +
    V;

  if (title) log(C.bold(title));
  log(border('┌', head.length ? '┬' : '─', '┐'));
  if (head.length) {
    log(row(head, C.bold));
    log(border('├', '┼', '┤'));
  }
  rows.forEach(r => log(row(r)));
  log(border('└', head.length ? '┴' : '─', '┘'));
}

// --- Step status ("checklist" UI) -------------------------------------------
function step(label, fn, {live = false} = {}) {
  log(`${C.gray('▸')} ${label}`);
  try {
    const res = fn();
    if (process.stdout.isTTY && !live) {
      readline.moveCursor(process.stdout, 0, -1);
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
    }
    log(`${ICON.ok} ${label}`);
    return res;
  } catch (err) {
    log(`${ICON.fail} ${label}`);
    throw err;
  }
}

// --- Shell helpers ----------------------------------------------------------
// run(): always executes (read-only inspection). exec(): respects --dry-run.
function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...opts,
  }).trim();
}
function exec(cmd, {live = false, env} = {}) {
  if (FLAGS.dryRun) {
    log(`  ${C.gray('[dry-run]')} ${C.dim(cmd)}`);
    return '';
  }
  if (live) {
    execSync(cmd, {stdio: 'inherit', env: env || process.env});
    return '';
  }
  return execSync(cmd, {encoding: 'utf8', env: env || process.env}).trim();
}
const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

// --- Arg parsing ------------------------------------------------------------
const FLAGS = {
  yes: false,
  dryRun: false,
  push: true,
  release: true,
  publish: false, // delegated to GitHub Actions CI/CD on tag push
  access: null,
  distTag: null,
};
let BUMP = null;
{
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const t = a[i];
    if (t === '-y' || t === '--yes') FLAGS.yes = true;
    else if (t === '-n' || t === '--dry-run') FLAGS.dryRun = true;
    else if (t === '--no-push') FLAGS.push = false;
    else if (t === '--no-release') FLAGS.release = false;
    else if (t === '--local-publish' || t === '--publish') FLAGS.publish = true;
    else if (t === '--no-publish') FLAGS.publish = false;
    else if (t === '--access') FLAGS.access = a[++i];
    else if (t === '--tag') FLAGS.distTag = a[++i];
    else if (!t.startsWith('-') && !BUMP) BUMP = t;
    else die(`Unknown argument: ${t}`);
  }
  BUMP = BUMP || 'patch';
}

function die(msg) {
  log(
    `\n${ICON.fail} ${C.red(C.bold('Release aborted'))} ${C.gray('—')} ${msg}`,
  );
  process.exit(1);
}

// --- Version preview (for the plan / dry-run; real value comes from npm) ----
function previewVersion(current, type) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(current);
  if (/^\d+\.\d+\.\d+/.test(type)) return type; // explicit version requested
  if (!m) return type;
  let [, M, mi, p] = m.map(Number);
  if (type === 'major') return `${M + 1}.0.0`;
  if (type === 'minor') return `${M}.${mi + 1}.0`;
  if (type === 'patch') return `${M}.${mi}.${p + 1}`;
  return `${current} (${type})`; // prerelease etc. — npm computes the real one
}

function repoSlug() {
  const url = safe(() => run('git remote get-url origin'));
  if (!url) return null;
  const m = /github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/.exec(url.trim());
  return m ? `${m[1]}/${m[2]}` : null;
}

function getCommits(prevTag) {
  const range = prevTag ? `${prevTag}..HEAD` : 'HEAD';
  let raw = safe(
    () => run(`git log ${range} --no-merges --pretty=format:%h\x1f%s`),
    '',
  );
  if (!raw && !prevTag)
    raw = safe(
      () => run('git log HEAD --no-merges -n 20 --pretty=format:%h\x1f%s'),
      '',
    );
  if (!raw) return [];
  return raw.split('\n').map(l => {
    const [hash, ...rest] = l.split('\x1f');
    return {hash, subject: rest.join('\x1f')};
  });
}

function confirm(question) {
  if (FLAGS.yes) return Promise.resolve(true);
  if (!process.stdin.isTTY)
    die(
      'No TTY available for confirmation. Re-run with -y/--yes for non-interactive use.',
    );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(res =>
    rl.question(question, ans => {
      rl.close();
      res(/^y(es)?$/i.test(ans.trim()));
    }),
  );
}

// --- Main -------------------------------------------------------------------
async function main() {
  log('');
  log(C.magenta(C.bold('  ┌──────────────────────────────┐')));
  log(C.magenta(C.bold('  │   release pipeline            │')));
  log(C.magenta(C.bold('  └──────────────────────────────┘')));
  log('');

  // Pre-flight ---------------------------------------------------------------
  if (!safe(() => run('git rev-parse --is-inside-work-tree')))
    die('Not inside a git repository.');

  const dirty = safe(() => run('git status --porcelain'), '');
  if (dirty && !FLAGS.dryRun)
    die(
      'Working tree is not clean. Commit your changes first, then run again.',
    );

  const pkgPath = path.resolve(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath))
    die('No package.json found in the current directory.');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const name = pkg.name;
  const current = pkg.version;
  const branch = safe(
    () => run('git rev-parse --abbrev-ref HEAD'),
    '(detached)',
  );
  const slug = repoSlug();
  const prevTag = safe(() => run('git describe --tags --abbrev=0'));
  const commits = getCommits(prevTag);
  const preview = previewVersion(current, BUMP);

  // Is gh available + authenticated? Otherwise we skip the release step.
  let ghReady = false;
  if (FLAGS.release) {
    ghReady =
      !!safe(() => run('gh auth status', {stdio: 'ignore'})) ||
      safe(() => {
        run('gh auth status');
        return true;
      }, false);
    if (!ghReady) {
      log(
        `${ICON.warn} ${C.yellow(
          'GitHub CLI not found or not authenticated — the release step will be skipped.',
        )}`,
      );
      log(
        `  ${C.dim('Install: https://cli.github.com  •  then: gh auth login')}`,
      );
      FLAGS.release = false;
    }
  }

  // Plan --------------------------------------------------------------------
  table({
    title: '  Plan',
    rows: [
      ['Package', C.cyan(name)],
      [
        'Version',
        `${C.red(current)} ${ICON.arrow} ${C.green(C.bold(preview))}`,
      ],
      ['Bump', BUMP],
      ['Branch', branch],
      ['Repo', slug || C.gray('no github remote')],
      ['Previous tag', prevTag || C.gray('none')],
      ['Commits since', String(commits.length)],
      ['Push to GitHub', FLAGS.push ? C.green('yes') : C.gray('skipped')],
      ['GitHub release', FLAGS.release ? C.green('yes') : C.gray('skipped')],
      [
        'Publish to npm',
        FLAGS.publish
          ? C.green('yes (local)')
          : FLAGS.push
          ? C.cyan('via GitHub Actions CI/CD')
          : C.gray('skipped'),
      ],
      [
        'Mode',
        FLAGS.dryRun
          ? C.yellow('DRY RUN — nothing will change')
          : C.green('live'),
      ],
    ],
  });
  log('');

  if (commits.length) {
    table({
      title: '  Changes in this release',
      head: ['#', 'Commit', 'Message'],
      rows: commits.map((c, i) => [String(i + 1), C.yellow(c.hash), c.subject]),
    });
    log('');
  }

  const go = await confirm(
    `${C.bold('Proceed')} with releasing ${C.cyan(name)}@${C.green(
      preview,
    )}? ${C.gray('(y/N) ')}`,
  );
  if (!go) die('Cancelled by user.');
  log('');

  // 1) Bump version (commits + tags via npm version) ------------------------
  let newVersion;
  newVersion = step(`Bump version (${BUMP})`, () => {
    if (FLAGS.dryRun) return preview;
    const out = run(`npm version ${BUMP} -m "chore(release): v%s"`);
    return out.replace(/^v/, '').trim();
  });
  const tag = `v${newVersion}`;

  // 2) Push commit + tag -----------------------------------------------------
  if (FLAGS.push) {
    step('Push commit & tag to GitHub', () => exec('git push --follow-tags'));
  }

  // 3) GitHub release --------------------------------------------------------
  let releaseUrl = null;
  if (FLAGS.release) {
    releaseUrl = step('Create GitHub release', () => {
      const notes =
        commits.length > 0
          ? commits.map(c => `- ${c.subject} (${c.hash})`).join('\n')
          : 'Maintenance release.';
      const notesFile = path.join(
        os.tmpdir(),
        `release-notes-${Date.now()}.md`,
      );
      if (!FLAGS.dryRun) fs.writeFileSync(notesFile, notes);
      const out = exec(
        `gh release create ${tag} --title "${tag}" --notes-file ${notesFile}`,
      );
      safe(() => fs.unlinkSync(notesFile));
      // gh prints the release URL on success
      return (
        out.split('\n').find(l => l.startsWith('http')) ||
        (slug ? `https://github.com/${slug}/releases/tag/${tag}` : null)
      );
    });
  }

  // 4) npm publish -----------------------------------------------------------
  if (FLAGS.publish) {
    step(
      'Publish to npm',
      () => {
        let cmd = 'npm publish';
        if (FLAGS.access) cmd += ` --access ${FLAGS.access}`;
        if (FLAGS.distTag) cmd += ` --tag ${FLAGS.distTag}`;
        // Set the guard so npm's "publish" lifecycle hook (this script) no-ops.
        exec(cmd, {
          live: true,
          env: {...process.env, __RELEASE_PUBLISHING__: '1'},
        });
      },
      {live: true},
    );
  }

  // 5) Summary ---------------------------------------------------------------
  log('');
  const npmUrl = `https://www.npmjs.com/package/${name}`;
  table({
    title: FLAGS.dryRun
      ? '  Release summary (dry run)'
      : `  ${name} released 🎉`,
    head: ['Item', 'Detail'],
    rows: [
      ['Package', C.cyan(name)],
      [
        'Version',
        `${C.red(current)} ${ICON.arrow} ${C.green(C.bold(newVersion))}`,
      ],
      ['Bump type', BUMP],
      ['Git tag', C.yellow(tag)],
      ['Branch', branch],
      ['Commits', String(commits.length)],
      [
        'GitHub release',
        FLAGS.release ? C.blue(releaseUrl || '—') : C.gray('skipped'),
      ],
      ['npm dist-tag', FLAGS.distTag || 'latest'],
      [
        'npm package',
        FLAGS.publish
          ? C.blue(npmUrl)
          : FLAGS.push
          ? C.cyan('publishing via GitHub Actions (with provenance)')
          : C.gray('skipped'),
      ],
    ],
  });
  log('');
  log(
    FLAGS.dryRun
      ? `${ICON.info} ${C.yellow('Dry run complete — no changes were made.')}`
      : `${ICON.ok} ${C.green(C.bold('Done.'))} ${C.cyan(name)}@${C.green(
          newVersion,
        )} released.` +
        (FLAGS.publish
          ? ' Live on npm.'
          : FLAGS.push
          ? ' GitHub Actions CI/CD will publish to npm with provenance.'
          : ''),
  );
  log('');
}

main().catch(err => {
  log('');
  die(err && err.message ? err.message.split('\n')[0] : String(err));
});
