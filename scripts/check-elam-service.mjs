#!/usr/bin/env node
/**
 * Check if the Elam (Triarch) service is reachable.
 *
 * Usage:
 *   node scripts/check-elam-service.mjs [url]
 *
 * If no URL is provided, checks the production URL.
 */

const DEFAULT_URL = 'https://play.basilboardgames.co.uk';

const baseUrl = process.argv[2] || DEFAULT_URL;

async function check(label, url, expect200 = true) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (expect200 && res.status !== 200) {
      console.error(`  FAIL  ${label}: HTTP ${res.status}`);
      return false;
    }
    console.log(`  OK    ${label}: HTTP ${res.status}`);
    return true;
  } catch (err) {
    console.error(`  FAIL  ${label}: ${err.cause?.code ?? err.message}`);
    return false;
  }
}

console.log(`Checking Elam service at ${baseUrl}\n`);

const results = await Promise.all([
  check('online.html', `${baseUrl}/online.html`),
  check('health API', `${baseUrl}/api/online/health`),
]);

const allOk = results.every(Boolean);

if (allOk) {
  // Fetch and display health details
  try {
    const res = await fetch(`${baseUrl}/api/online/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    const health = await res.json();
    console.log(`\nHealth: ${JSON.stringify(health, null, 2)}`);
  } catch {
    // Already reported above
  }
}

console.log(allOk ? '\nAll checks passed.' : '\nSome checks failed.');
process.exit(allOk ? 0 : 1);
