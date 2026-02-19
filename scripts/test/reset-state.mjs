#!/usr/bin/env node
/**
 * Resets test state to a clean baseline. Idempotent.
 * - Clears any localStorage stubs (for jsdom tests, this is a no-op since jsdom resets per suite)
 * - Could clear test DB state if SUPABASE_SERVICE_ROLE_KEY is set
 */

console.log('Resetting test state...');

// In unit test mode, jsdom handles localStorage reset per suite.
// This script exists for CI and integration test scenarios.

if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_URL) {
  console.log('  [info] Service role key detected — live state reset available');
  console.log('  [skip] Live reset not implemented yet (Phase 3)');
} else {
  console.log('  [info] No service role key — unit test mode only');
}

console.log('Test state reset complete.');
