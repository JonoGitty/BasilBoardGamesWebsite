#!/usr/bin/env node
/**
 * Validates required environment variables exist for tests.
 * Sets safe defaults for unit test mode. Idempotent.
 */

const REQUIRED_FOR_UNIT = {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key-placeholder',
};

const OPTIONAL = [
  'SUPABASE_SERVICE_ROLE_KEY', // only for live contract tests
];

let exitCode = 0;

for (const [key, fallback] of Object.entries(REQUIRED_FOR_UNIT)) {
  if (process.env[key]) {
    console.log(`  [ok] ${key} is set`);
  } else {
    process.env[key] = fallback;
    console.log(`  [default] ${key} = ${fallback}`);
  }
}

for (const key of OPTIONAL) {
  if (process.env[key]) {
    console.log(`  [ok] ${key} is set`);
  } else {
    console.log(`  [skip] ${key} not set (optional)`);
  }
}

if (exitCode === 0) {
  console.log('\nTest environment ready.');
} else {
  console.error('\nTest environment setup failed.');
}

process.exit(exitCode);
