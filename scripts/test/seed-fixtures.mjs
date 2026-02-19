#!/usr/bin/env node
/**
 * Creates stable fixture data for integration tests.
 * Idempotent — running twice produces the same state.
 *
 * For unit tests, use the TypeScript fixture factories in
 * src/test/fixtures/supabase-rows.ts instead.
 *
 * This script is for seeding a live/local Supabase instance.
 */

const fixtures = {
  users: [
    { email: 'admin@test.local', role: 'admin', nickname: 'TestAdmin' },
    { email: 'user@test.local', role: 'user', nickname: 'TestUser' },
  ],
  games: [
    { id: 'fixture-game-active', title: 'Active Game', status: 'live', vault: false, enabled: true },
    { id: 'fixture-game-vaulted', title: 'Vaulted Game', status: 'polished', vault: true, enabled: true },
    { id: 'fixture-game-beta', title: 'Beta Game', status: 'beta', vault: false, enabled: false },
  ],
  posts: [
    { id: 'fixture-post-published', title: 'Published Post', category: 'patch', published: true },
    { id: 'fixture-post-draft-patch', title: 'Draft Patch', category: 'patch', published: false },
    { id: 'fixture-post-draft-exp', title: 'Draft Experiment', category: 'experiment', published: false },
    { id: 'fixture-post-announcement', title: 'Announcement', category: 'announcement', published: true },
  ],
  feedback: [
    { client_feedback_id: 'fix-fb-new', status: 'new', feedback_text: 'New feedback' },
    { client_feedback_id: 'fix-fb-reviewed', status: 'reviewed', feedback_text: 'Reviewed feedback' },
    { client_feedback_id: 'fix-fb-resolved', status: 'resolved', feedback_text: 'Resolved feedback' },
    { client_feedback_id: 'fix-fb-dismissed', status: 'dismissed', feedback_text: 'Dismissed feedback' },
    { client_feedback_id: 'fix-fb-noted', status: 'new', feedback_text: 'Feedback with note', admin_note: 'Admin note' },
  ],
};

async function main() {
  console.log('Seed fixtures — stable test data');
  console.log('================================');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VITE_SUPABASE_URL) {
    console.log('\nNo Supabase credentials found.');
    console.log('Printing fixture manifest (dry run):\n');
    console.log(JSON.stringify(fixtures, null, 2));
    console.log('\nTo seed a live instance, set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return;
  }

  console.log('\nLive seeding not yet implemented (Phase 3).');
  console.log('Fixture manifest:');
  console.log(JSON.stringify(fixtures, null, 2));
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
