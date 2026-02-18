#!/usr/bin/env node
/**
 * Privacy drift checker.
 *
 * Compares:
 *   1. audit/out/privacy-inventory.json  (actual codebase state)
 *   2. audit/privacy-policy.contract.json (declared contract)
 *   3. src/components/PrivacyPolicy.tsx   (user-facing policy text)
 *
 * Fails if drift is detected. Writes reports to audit/out/.
 *
 * Usage: node scripts/audit/privacy-drift-check.mjs
 *   Prerequisite: run privacy-inventory.mjs first.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const OUT_DIR = join(ROOT, 'audit', 'out');
const INVENTORY_PATH = join(OUT_DIR, 'privacy-inventory.json');
const CONTRACT_PATH = join(ROOT, 'audit', 'privacy-policy.contract.json');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

if (!existsSync(INVENTORY_PATH)) {
  console.error('ERROR: privacy-inventory.json not found. Run privacy-inventory.mjs first.');
  process.exit(1);
}

const inventory = JSON.parse(readFileSync(INVENTORY_PATH, 'utf8'));
const contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));

const drifts = [];
const now = new Date().toISOString();

function addDrift(severity, category, message, details) {
  drifts.push({ severity, category, message, details: details || null, timestamp: now });
}

// ---------- 1. Check localStorage keys: code vs contract ----------
console.log('Privacy Drift Checker');
console.log('=====================\n');
console.log('  Checking localStorage keys...');

const contractLsKeys = new Set(Object.keys(contract.localStorageKeys));
const codeLsKeys = new Set(Object.keys(inventory.localStorageKeys));

for (const key of codeLsKeys) {
  if (!contractLsKeys.has(key)) {
    // Allow inferred constants that are not real localStorage keys
    const entry = inventory.localStorageKeys[key];
    if (entry.inferredFromConstant && entry.operations.length === 0) continue;
    addDrift('high', 'undeclared_storage_key',
      `localStorage key "${key}" found in code but not declared in contract`,
      { key, files: entry.files });
  }
}

for (const key of contractLsKeys) {
  if (!codeLsKeys.has(key)) {
    addDrift('medium', 'orphaned_contract_key',
      `localStorage key "${key}" declared in contract but not found in code`,
      { key });
  }
}

// ---------- 2. Check sessionStorage keys: code vs contract ----------
console.log('  Checking sessionStorage keys...');

const contractSsKeys = new Set(Object.keys(contract.sessionStorageKeys));
const codeSsKeys = new Set(Object.keys(inventory.sessionStorageKeys));

for (const key of codeSsKeys) {
  if (!contractSsKeys.has(key)) {
    addDrift('high', 'undeclared_session_key',
      `sessionStorage key "${key}" found in code but not declared in contract`,
      { key, files: inventory.sessionStorageKeys[key].files });
  }
}

// ---------- 3. Check policy "Last updated" date vs contract review date ----------
console.log('  Checking policy date...');

const policyPath = join(ROOT, contract.policyFile);
let policyContent = '';
try {
  policyContent = readFileSync(policyPath, 'utf8');
} catch {
  addDrift('critical', 'policy_missing', `Privacy policy file not found: ${contract.policyFile}`);
}

if (policyContent) {
  const dateRe = new RegExp(contract.policyDatePattern);
  const dateMatch = policyContent.match(dateRe);
  if (!dateMatch) {
    addDrift('high', 'policy_date_missing', 'Could not find "Last updated" date in privacy policy');
  } else {
    const policyDate = new Date(dateMatch[1]);
    const reviewDate = new Date(contract.last_reviewed_date);
    if (policyDate < reviewDate) {
      addDrift('high', 'policy_date_stale',
        `Privacy policy date (${dateMatch[1]}) is older than contract review date (${contract.last_reviewed_date})`,
        { policyDate: dateMatch[1], reviewDate: contract.last_reviewed_date });
    }
  }
}

// ---------- 4. Check storage keys listed in policy vs actual code ----------
console.log('  Checking policy storage key mentions...');

if (policyContent) {
  const allContractKeys = [
    ...Object.keys(contract.localStorageKeys),
    ...Object.keys(contract.sessionStorageKeys),
  ];

  for (const key of allContractKeys) {
    // Check if key is mentioned in the policy file
    if (!policyContent.includes(key)) {
      // Some keys may be grouped (e.g., Supabase auth tokens)
      // Only flag if they're in the explicit listed keys
      const category = contract.localStorageKeys[key]?.category ||
                       contract.sessionStorageKeys[key]?.category;
      // basil_sessions and basil_active_session are local-only, not necessarily in policy
      // elam_online_session_v1 and elam_playtest_notice_ack_v1 are game-internal
      const exemptCategories = ['session_tracking', 'elam_online_session', 'playtest_acknowledgment'];
      if (!exemptCategories.includes(category)) {
        addDrift('medium', 'policy_key_missing',
          `Storage key "${key}" is in contract but not mentioned in privacy policy`,
          { key, category });
      }
    }
  }

  // Check code keys that should be in policy
  for (const key of codeLsKeys) {
    const entry = inventory.localStorageKeys[key];
    if (entry.inferredFromConstant && entry.operations.length === 0) continue;
    if (!policyContent.includes(key) && contractLsKeys.has(key)) {
      // Already checked above, skip
    }
  }
}

// ---------- 5. Check data categories: any table in code not in contract? ----------
console.log('  Checking Supabase table coverage...');

const contractTables = new Set();
for (const cat of contract.dataCategories) {
  for (const loc of cat.storageLocations) {
    if (loc.startsWith('supabase:')) {
      contractTables.add(loc.replace('supabase:', ''));
    }
  }
}

const codeTables = new Set(inventory.supabaseTableOps.map((op) => op.table));
for (const table of codeTables) {
  if (table.startsWith('rpc:')) continue; // RPCs are function calls, not tables
  if (!contractTables.has(table)) {
    addDrift('high', 'undeclared_table',
      `Supabase table "${table}" accessed in code but not declared in contract`,
      { table });
  }
}

// ---------- 6. Check processors mentioned in policy ----------
console.log('  Checking processor declarations...');

if (policyContent) {
  for (const proc of contract.processors) {
    if (!policyContent.includes(proc.name)) {
      addDrift('medium', 'processor_not_in_policy',
        `Processor "${proc.name}" in contract but not mentioned in privacy policy`,
        { processor: proc.name });
    }
  }
}

// ---------- 7. Check scope: domains mentioned in policy ----------
console.log('  Checking scope coverage...');

if (policyContent) {
  if (!policyContent.includes('basilboardgames.co.uk')) {
    addDrift('high', 'scope_incomplete', 'Primary domain not mentioned in privacy policy');
  }
  if (!policyContent.includes('play.basilboardgames.co.uk') && !policyContent.includes('subdomain')) {
    addDrift('medium', 'scope_subdomain_missing', 'play.basilboardgames.co.uk not explicitly mentioned in policy scope');
  }
}

// ---------- 8. Check retention declarations exist ----------
console.log('  Checking retention coverage...');

if (policyContent) {
  const retentionTerms = ['90 days', '12 months', 'deletion', 'delete'];
  const hasRetention = retentionTerms.some((t) => policyContent.toLowerCase().includes(t));
  if (!hasRetention) {
    addDrift('high', 'retention_missing', 'No retention periods found in privacy policy');
  }
}

// ---------- Classify results ----------
const critical = drifts.filter((d) => d.severity === 'critical');
const high = drifts.filter((d) => d.severity === 'high');
const medium = drifts.filter((d) => d.severity === 'medium');
const low = drifts.filter((d) => d.severity === 'low');

const hasFail = critical.length > 0 || high.length > 0;

const report = {
  timestamp: now,
  summary: {
    total: drifts.length,
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    pass: !hasFail,
  },
  drifts,
};

// ---------- Write JSON report ----------
writeFileSync(join(OUT_DIR, 'privacy-drift-report.json'), JSON.stringify(report, null, 2));

// ---------- Write Markdown report ----------
let md = `# Privacy Drift Report\n\n`;
md += `**Date:** ${now}\n`;
md += `**Result:** ${hasFail ? 'FAIL' : 'PASS'}\n\n`;
md += `## Summary\n\n`;
md += `| Severity | Count |\n|----------|-------|\n`;
md += `| Critical | ${critical.length} |\n`;
md += `| High | ${high.length} |\n`;
md += `| Medium | ${medium.length} |\n`;
md += `| Low | ${low.length} |\n`;
md += `| **Total** | **${drifts.length}** |\n\n`;

if (drifts.length > 0) {
  md += `## Drift Items\n\n`;
  for (const d of drifts) {
    md += `### [${d.severity.toUpperCase()}] ${d.message}\n`;
    md += `- **Category:** ${d.category}\n`;
    if (d.details) md += `- **Details:** \`${JSON.stringify(d.details)}\`\n`;
    md += `\n`;
  }
} else {
  md += `No drift detected.\n`;
}

writeFileSync(join(OUT_DIR, 'privacy-drift-report.md'), md);

// ---------- Console summary ----------
console.log(`\nResults: ${drifts.length} drift items`);
console.log(`  Critical: ${critical.length}`);
console.log(`  High:     ${high.length}`);
console.log(`  Medium:   ${medium.length}`);
console.log(`  Low:      ${low.length}`);
console.log(`\nReports written to audit/out/`);

if (hasFail) {
  console.error('\nDRIFT CHECK FAILED: critical or high severity drift detected.');
  process.exit(1);
}
console.log('\nDRIFT CHECK PASSED.');
