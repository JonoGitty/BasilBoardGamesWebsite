#!/usr/bin/env node
/**
 * Import a static game build into public/games/<id>.
 *
 * Usage:
 *   node scripts/import-static-game.mjs --id interrogate --source "C:\AI\Interrogate!"
 *
 * The script will:
 * 1. Locate the build root (dist/ preferred, else source root with index.html)
 * 2. Copy all files into public/games/<id>/
 * 3. Rewrite index.html asset paths to relative ./assets/...
 */

import { existsSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';

// --- Parse args ---
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const gameId = getArg('id');
const sourcePath = getArg('source');

if (!gameId || !sourcePath) {
  console.error('Usage: node scripts/import-static-game.mjs --id <game-id> --source <path>');
  console.error('  --id      Game identifier (e.g. interrogate)');
  console.error('  --source  Path to the game repo / build folder');
  process.exit(1);
}

// --- Resolve build root ---
const sourceAbs = resolve(sourcePath);
if (!existsSync(sourceAbs)) {
  console.error(`Source path not found: ${sourceAbs}`);
  process.exit(1);
}

const distDir = join(sourceAbs, 'dist');
let buildRoot;

if (existsSync(join(distDir, 'index.html'))) {
  buildRoot = distDir;
} else if (existsSync(join(sourceAbs, 'index.html'))) {
  buildRoot = sourceAbs;
} else {
  console.error(`No index.html found in ${distDir} or ${sourceAbs}`);
  console.error('Build the game first (e.g. npm run build) then re-run this script.');
  process.exit(1);
}

console.log(`Build root: ${buildRoot}`);

// --- Copy to public/games/<id> ---
const repoRoot = resolve(import.meta.dirname, '..');
const destDir = join(repoRoot, 'public', 'games', gameId);

if (existsSync(destDir)) {
  rmSync(destDir, { recursive: true });
}

cpSync(buildRoot, destDir, { recursive: true });
console.log(`Copied to: ${destDir}`);

// --- Rewrite index.html asset paths to relative ---
const indexPath = join(destDir, 'index.html');
let html = readFileSync(indexPath, 'utf-8');

// Replace any absolute or malformed asset paths with relative ./assets/
// Matches src="<anything>/assets/" or href="<anything>/assets/"
html = html.replace(
  /((?:src|href)=["'])(?:[^"']*\/)?assets\//g,
  '$1./assets/'
);

writeFileSync(indexPath, html, 'utf-8');
console.log('Rewrote asset paths to relative ./assets/...');

// --- Verify ---
const finalHtml = readFileSync(indexPath, 'utf-8');
const absolutePaths = finalHtml.match(/(?:src|href)=["']\/[A-Z]/g);
if (absolutePaths) {
  console.warn('WARNING: Possible absolute paths remain in index.html:');
  absolutePaths.forEach((m) => console.warn(`  ${m}`));
} else {
  console.log('All asset paths are relative. Import complete.');
}
