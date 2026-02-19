#!/usr/bin/env node
/**
 * Elam Integration Guard — verifies the Elam game files in public/games/elam/
 * are internally consistent:
 *
 *  1. All script tags in index.html reference files that exist
 *  2. local-ai.js exposes the ElamLocalAI UMD global
 *  3. main.js references ElamLocalAI
 *  4. SHA256 hashes are printed for audit trail
 *
 * Usage:
 *   node scripts/check-elam-integrity.mjs           # human-readable
 *   node scripts/check-elam-integrity.mjs --json     # structured JSON
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const ELAM_DIR = resolve(PROJECT_ROOT, 'public', 'games', 'elam');
const jsonMode = process.argv.includes('--json');

const checks = [];

function check(name, pass, detail) {
  checks.push({ name, pass, detail });
}

// ── 1. Required files exist ────────────────────────────────
const REQUIRED_FILES = [
  'index.html',
  'main.js',
  'elam-ai/local-ai.js',
];

const hashes = {};
for (const file of REQUIRED_FILES) {
  const fullPath = resolve(ELAM_DIR, file);
  const exists = existsSync(fullPath);
  check(`file-exists:${file}`, exists, exists ? 'found' : `MISSING: ${fullPath}`);
  if (exists) {
    const content = readFileSync(fullPath);
    hashes[file] = createHash('sha256').update(content).digest('hex');
  }
}

// ── 2. index.html script tags match actual files ───────────

// Scripts injected at deploy time — expected to be absent from source
const DEPLOY_INJECTED_SCRIPTS = new Set(['site-config.js']);

const indexPath = resolve(ELAM_DIR, 'index.html');
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, 'utf8');

  // Extract all <script src="..."> references (not external URLs)
  const scriptRefs = [];
  const re = /<script[^>]+src=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
      scriptRefs.push(src);
    }
  }

  for (const src of scriptRefs) {
    if (DEPLOY_INJECTED_SCRIPTS.has(src)) {
      check(`script-ref:${src}`, true, 'deploy-injected — expected absent from source');
      continue;
    }
    const refPath = resolve(ELAM_DIR, src);
    const exists = existsSync(refPath);
    check(`script-ref:${src}`, exists, exists ? 'referenced file exists' : `MISSING: index.html references "${src}" but file not found`);
  }

  // Verify local-ai.js is loaded BEFORE main.js
  const aiIdx = html.indexOf('elam-ai/local-ai.js');
  const mainIdx = html.indexOf('src="main.js"');
  if (aiIdx >= 0 && mainIdx >= 0) {
    check('load-order', aiIdx < mainIdx, aiIdx < mainIdx
      ? 'local-ai.js loaded before main.js'
      : 'WRONG ORDER: main.js loads before local-ai.js — AI module will not be available');
  } else {
    check('load-order', false, 'Could not find both script references in index.html');
  }
}

// ── 3. local-ai.js UMD pattern check ──────────────────────
const aiPath = resolve(ELAM_DIR, 'elam-ai', 'local-ai.js');
if (existsSync(aiPath)) {
  const aiContent = readFileSync(aiPath, 'utf8');
  const hasUmd = aiContent.includes('ElamLocalAI') && aiContent.includes('module.exports');
  check('umd-pattern', hasUmd, hasUmd
    ? 'local-ai.js exports ElamLocalAI (UMD)'
    : 'local-ai.js is missing UMD pattern — browser will not get ElamLocalAI global');
}

// ── 4. main.js references ElamLocalAI ──────────────────────
const mainPath = resolve(ELAM_DIR, 'main.js');
if (existsSync(mainPath)) {
  const mainContent = readFileSync(mainPath, 'utf8');
  const hasRef = mainContent.includes('ElamLocalAI');
  check('main-ai-ref', hasRef, hasRef
    ? 'main.js references ElamLocalAI'
    : 'main.js does not reference ElamLocalAI — AI integration may be broken');
}

// ── Output ─────────────────────────────────────────────────
const allPassed = checks.every((c) => c.pass);
const summary = {
  timestamp: new Date().toISOString(),
  allPassed,
  checks,
  hashes,
};

if (jsonMode) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log('Elam Integration Check');
  console.log('======================');
  for (const c of checks) {
    const icon = c.pass ? 'OK' : 'FAIL';
    console.log(`  [${icon}] ${c.name}: ${c.detail}`);
  }
  console.log('');
  console.log('File hashes (SHA256):');
  for (const [file, hash] of Object.entries(hashes)) {
    console.log(`  ${file}: ${hash}`);
  }
  if (allPassed) {
    console.log('\nAll checks passed.');
  } else {
    const failed = checks.filter((c) => !c.pass);
    console.error(`\nFAILED: ${failed.length} check(s) failed.`);
    for (const f of failed) {
      console.error(`  - ${f.name}: ${f.detail}`);
    }
  }
}

process.exit(allPassed ? 0 : 1);
