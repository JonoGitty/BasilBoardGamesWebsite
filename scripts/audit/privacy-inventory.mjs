#!/usr/bin/env node
/**
 * Privacy inventory extractor.
 *
 * Scans codebases and produces audit/out/privacy-inventory.json
 * with all detected localStorage keys, fetch targets, Supabase
 * table interactions, and telemetry/feedback payload fields.
 *
 * Usage: node scripts/audit/privacy-inventory.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve, extname } from 'path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const TRIARCH = resolve(ROOT, '..', 'Triarch');
const OUT_DIR = join(ROOT, 'audit', 'out');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const inventory = {
  timestamp: new Date().toISOString(),
  localStorageKeys: {},
  sessionStorageKeys: {},
  fetchTargets: [],
  supabaseTableOps: [],
  migrationTables: [],
  telemetryEventNames: [],
  feedbackPayloadFields: [],
};

// ---------- File walker ----------
function walkSourceFiles(dir, excludes = ['node_modules', 'dist', '.git', 'audit', '.claude']) {
  const results = [];
  if (!existsSync(dir)) return results;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (excludes.includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkSourceFiles(full, excludes));
      } else {
        const ext = extname(entry.name);
        if (['.js', '.mjs', '.ts', '.tsx', '.jsx', '.html', '.sql', '.py'].includes(ext)) {
          results.push(full);
        }
      }
    }
  } catch { /* permission denied */ }
  return results;
}

// ---------- Detect localStorage keys ----------
function detectLocalStorageKeys(content, file) {
  // Match localStorage.setItem("key", ...) and localStorage.getItem("key")
  const setGetRe = /localStorage\.(setItem|getItem|removeItem)\s*\(\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = setGetRe.exec(content)) !== null) {
    const key = match[2];
    if (!inventory.localStorageKeys[key]) {
      inventory.localStorageKeys[key] = { files: [], operations: new Set() };
    }
    inventory.localStorageKeys[key].files.push(file);
    inventory.localStorageKeys[key].operations.add(match[1]);
  }

  // Match const KEY = "some_key"; ... localStorage.setItem(KEY, ...)
  // Detect string constants that look like storage keys
  const constKeyRe = /(?:const|let|var)\s+\w*(?:KEY|STORAGE|QUEUE)\w*\s*=\s*["'`]([a-z_][a-z0-9_]*(?:_v\d+)?)["'`]/gi;
  while ((match = constKeyRe.exec(content)) !== null) {
    const key = match[1];
    if (key.includes('_') && !key.startsWith('http')) {
      if (!inventory.localStorageKeys[key]) {
        inventory.localStorageKeys[key] = { files: [], operations: new Set(), inferredFromConstant: true };
      }
      if (!inventory.localStorageKeys[key].files.includes(file)) {
        inventory.localStorageKeys[key].files.push(file);
      }
    }
  }
}

// ---------- Detect sessionStorage keys ----------
function detectSessionStorageKeys(content, file) {
  const re = /sessionStorage\.(setItem|getItem|removeItem)\s*\(\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const key = match[2];
    if (!inventory.sessionStorageKeys[key]) {
      inventory.sessionStorageKeys[key] = { files: [], operations: new Set() };
    }
    inventory.sessionStorageKeys[key].files.push(file);
    inventory.sessionStorageKeys[key].operations.add(match[1]);
  }
}

// ---------- Detect fetch targets ----------
function detectFetchTargets(content, file) {
  // Match fetch("url", ...) and fetch(variable, ...)
  const fetchRe = /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = fetchRe.exec(content)) !== null) {
    const url = match[1];
    if (url.startsWith('#') || url.startsWith('data:')) continue;
    inventory.fetchTargets.push({ url, file });
  }

  // Match fetch(URL_VAR, ...) or fetch(`${base}/path`, ...)
  const templateRe = /fetch\s*\(\s*`([^`]+)`/g;
  while ((match = templateRe.exec(content)) !== null) {
    inventory.fetchTargets.push({ url: match[1], file, template: true });
  }

  // Match supabase.functions.invoke("name", ...)
  const invokeRe = /\.functions\.invoke\s*\(\s*["'`]([^"'`]+)["'`]/g;
  while ((match = invokeRe.exec(content)) !== null) {
    inventory.fetchTargets.push({ url: `supabase-function:${match[1]}`, file });
  }
}

// ---------- Detect Supabase table operations ----------
function detectSupabaseTableOps(content, file) {
  // Match .from("table").select/insert/update/delete/upsert
  const fromRe = /\.from\s*\(\s*["'`]([^"'`]+)["'`]\s*\)\s*\.\s*(select|insert|update|delete|upsert)\b/g;
  let match;
  while ((match = fromRe.exec(content)) !== null) {
    inventory.supabaseTableOps.push({ table: match[1], operation: match[2], file });
  }

  // Match .rpc("function_name", ...)
  const rpcRe = /\.rpc\s*\(\s*["'`]([^"'`]+)["'`]/g;
  while ((match = rpcRe.exec(content)) !== null) {
    inventory.supabaseTableOps.push({ table: `rpc:${match[1]}`, operation: 'rpc', file });
  }
}

// ---------- Detect migration tables ----------
function detectMigrationTables(content, file) {
  const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)/gi;
  let match;
  while ((match = createRe.exec(content)) !== null) {
    inventory.migrationTables.push({ table: match[1], file });
  }

  const alterRe = /ALTER\s+TABLE\s+(?:public\.)?(\w+)/gi;
  while ((match = alterRe.exec(content)) !== null) {
    inventory.migrationTables.push({ table: match[1], file, alteredOnly: true });
  }
}

// ---------- Detect telemetry event names ----------
function detectTelemetryEvents(content, file) {
  // Match track("event_name", ...) or track('event_name', ...)
  const trackRe = /track\s*\(\s*["'`]([a-z_]+)["'`]/g;
  let match;
  while ((match = trackRe.exec(content)) !== null) {
    if (!inventory.telemetryEventNames.includes(match[1])) {
      inventory.telemetryEventNames.push(match[1]);
    }
  }

  // Match VALID_EVENT_NAMES or EventMap type definitions
  const validRe = /["']([a-z_]+)["']\s*[,\]:]/g;
  if (content.includes('VALID_EVENT_NAMES') || content.includes('EventMap')) {
    while ((match = validRe.exec(content)) !== null) {
      const name = match[1];
      if (name.length > 3 && name.includes('_') && !inventory.telemetryEventNames.includes(name)) {
        inventory.telemetryEventNames.push(name);
      }
    }
  }
}

// ---------- Detect feedback payload fields ----------
function detectFeedbackFields(content, file) {
  if (!content.includes('feedback') && !content.includes('Feedback')) return;

  // Match object literal keys near feedback submission code
  const payloadRe = /(?:clientFeedbackId|feedback_text|feedback|gameId|game_id|page|source|context|context_json|ip_hash|client_feedback_id|roomCode|status|admin_note)\b/g;
  let match;
  while ((match = payloadRe.exec(content)) !== null) {
    const field = match[0];
    if (!inventory.feedbackPayloadFields.includes(field)) {
      inventory.feedbackPayloadFields.push(field);
    }
  }
}

// ---------- Main ----------
console.log('Privacy Inventory Extractor');
console.log('==========================\n');

const allFiles = [
  ...walkSourceFiles(ROOT),
  ...walkSourceFiles(TRIARCH),
];

console.log(`Scanning ${allFiles.length} source files...\n`);

for (const file of allFiles) {
  let content;
  try { content = readFileSync(file, 'utf8'); } catch { continue; }

  const relFile = file.replace(ROOT, 'website').replace(TRIARCH, 'triarch').replace(/\\/g, '/');

  detectLocalStorageKeys(content, relFile);
  detectSessionStorageKeys(content, relFile);
  detectFetchTargets(content, relFile);
  detectSupabaseTableOps(content, relFile);
  detectMigrationTables(content, relFile);
  detectTelemetryEvents(content, relFile);
  detectFeedbackFields(content, relFile);
}

// Serialize Sets to arrays for JSON output
for (const [key, val] of Object.entries(inventory.localStorageKeys)) {
  val.operations = [...val.operations];
  // Deduplicate files
  val.files = [...new Set(val.files)];
}
for (const [key, val] of Object.entries(inventory.sessionStorageKeys)) {
  val.operations = [...val.operations];
  val.files = [...new Set(val.files)];
}

// Deduplicate fetch targets
const seenFetch = new Set();
inventory.fetchTargets = inventory.fetchTargets.filter((t) => {
  const key = `${t.url}:${t.file}`;
  if (seenFetch.has(key)) return false;
  seenFetch.add(key);
  return true;
});

// Deduplicate migration tables
const seenMig = new Set();
inventory.migrationTables = inventory.migrationTables.filter((t) => {
  const key = `${t.table}:${t.file}`;
  if (seenMig.has(key)) return false;
  seenMig.add(key);
  return true;
});

writeFileSync(join(OUT_DIR, 'privacy-inventory.json'), JSON.stringify(inventory, null, 2));

console.log('Inventory summary:');
console.log(`  localStorage keys: ${Object.keys(inventory.localStorageKeys).length}`);
console.log(`  sessionStorage keys: ${Object.keys(inventory.sessionStorageKeys).length}`);
console.log(`  Fetch targets: ${inventory.fetchTargets.length}`);
console.log(`  Supabase table ops: ${inventory.supabaseTableOps.length}`);
console.log(`  Migration tables: ${inventory.migrationTables.length}`);
console.log(`  Telemetry event names: ${inventory.telemetryEventNames.length}`);
console.log(`  Feedback payload fields: ${inventory.feedbackPayloadFields.length}`);
console.log(`\nWritten to audit/out/privacy-inventory.json`);
