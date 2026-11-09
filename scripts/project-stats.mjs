#!/usr/bin/env node
/**
 * Count the project. Writes src/lib/project-stats.json (committed, shown on
 * the /stats page) and prints a markdown block for the README.
 *
 *   node scripts/project-stats.mjs        # counts + writes + prints
 *   node scripts/project-stats.mjs --print  # count and print only
 *
 * Run it after a chunk of work so the numbers on the page stay true; the
 * JSON records when it was generated, and the page says so.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const writeJson = !process.argv.includes('--print');

const SKIP = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'coverage',
  'dist',
  'build',
  '.venv',
]);

const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const rel = (p) => path.relative(root, p).split(path.sep).join('/');
const linesOf = (p) => {
  try {
    return fs.readFileSync(p, 'utf8').split('\n').length;
  } catch {
    return 0;
  }
};

function git(cmd, fallback = '—') {
  try {
    return execSync(cmd, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

const allFiles = walk(root).map((p) => ({ path: rel(p), lines: linesOf(p) }));
const srcFiles = allFiles.filter((f) => f.path.startsWith('src/'));

const has = (p, ext) => p.endsWith(ext);
const under = (p, dir) => p.startsWith(dir);

const sum = (files) => files.reduce((n, f) => n + f.lines, 0);
const countCases = (files) =>
  files.reduce((n, f) => {
    let text = '';
    try {
      text = fs.readFileSync(path.join(root, f.path), 'utf8');
    } catch {
      return n;
    }
    const its = text.match(/^\s*(?:it|test)(?:\.\w+)?\(/gm);
    return n + (its ? its.length : 0);
  }, 0);

const appCode = srcFiles.filter(
  (f) => (has(f.path, '.ts') || has(f.path, '.tsx')) && !TEST_FILE.test(f.path)
);
const testFiles = allFiles.filter((f) => TEST_FILE.test(f.path));
const styleFiles = srcFiles.filter((f) => has(f.path, '.css'));
const docFiles = allFiles.filter(
  (f) => has(f.path, '.md') && (under(f.path, 'docs/') || f.path === 'README.md')
);
const sqlFiles = allFiles.filter((f) => under(f.path, 'supabase/') && has(f.path, '.sql'));
// Only runnable scripts: `scripts/screenshots/` holds images, not code.
const scriptFiles = allFiles.filter(
  (f) =>
    under(f.path, 'scripts/') &&
    !under(f.path, 'scripts/screenshots/') &&
    /\.(mjs|cjs|js|sh)$/.test(f.path)
);

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// A shallow clone only sees one commit, so the history numbers would lie.
// Report null and let the page and README skip those rows.
const shallow = git('git rev-parse --is-shallow-repository') === 'true';
const int = (value) => Number.parseInt(value, 10) || 0;

const stats = {
  generatedAt: new Date().toISOString(),
  git: {
    commits: shallow ? null : int(git('git rev-list --count HEAD', '0')),
    contributors: shallow ? null : int(git('git shortlog -sn --all | wc -l', '0')),
    firstCommit: shallow ? null : git('git log --reverse --format=%ad --date=short HEAD | head -1'),
    lastCommit: git('git log -1 --format=%ad --date=short'),
    branch: git('git rev-parse --abbrev-ref HEAD'),
  },
  code: {
    files: appCode.length,
    lines: sum(appCode),
    components: srcFiles.filter(
      (f) => under(f.path, 'src/components/') && has(f.path, '.tsx') && !TEST_FILE.test(f.path)
    ).length,
    pages: srcFiles.filter((f) => f.path.endsWith('/page.tsx')).length,
    apiRoutes: srcFiles.filter((f) => f.path.endsWith('/route.ts')).length,
    libModules: srcFiles.filter(
      (f) => under(f.path, 'src/lib/') && has(f.path, '.ts') && !TEST_FILE.test(f.path)
    ).length,
    hooks: srcFiles.filter(
      (f) => under(f.path, 'src/hooks/') && has(f.path, '.ts') && !TEST_FILE.test(f.path)
    ).length,
    stylesheets: styleFiles.length,
    styleLines: sum(styleFiles),
  },
  tests: {
    files: testFiles.length,
    cases: countCases(testFiles),
    lines: sum(testFiles),
  },
  docs: {
    files: docFiles.length,
    lines: sum(docFiles),
    migrations: sqlFiles.length,
    scripts: scriptFiles.length,
  },
  dependencies: {
    runtime: Object.keys(pkg.dependencies ?? {}).length,
    dev: Object.keys(pkg.devDependencies ?? {}).length,
  },
  repository: {
    trackedFiles: Number.parseInt(git('git ls-files | wc -l', '0'), 10) || 0,
    totalLines: sum(allFiles),
  },
};

if (writeJson) {
  const out = path.join(root, 'src/lib/project-stats.json');
  fs.writeFileSync(out, `${JSON.stringify(stats, null, 2)}\n`);
  console.log(`wrote ${rel(out)}`);
}

const md = [
  '| | |',
  '|---|---|',
  `| Application code | ${stats.code.files} files · ${stats.code.lines.toLocaleString('en-GB')} lines |`,
  `| Tests | ${stats.tests.files} files · ${stats.tests.cases} cases |`,
  `| Pages / API routes | ${stats.code.pages} / ${stats.code.apiRoutes} |`,
  `| Components | ${stats.code.components} |`,
  `| Docs & migrations | ${stats.docs.files} docs · ${stats.docs.migrations} SQL migrations |`,
  `| Dependencies | ${stats.dependencies.runtime} runtime · ${stats.dependencies.dev} dev |`,
  stats.git.commits
    ? `| Commits | ${stats.git.commits} since ${stats.git.firstCommit} |`
    : null,
]
  .filter(Boolean)
  .join('\n');

console.log(md);
