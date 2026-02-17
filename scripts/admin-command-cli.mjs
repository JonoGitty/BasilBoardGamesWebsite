#!/usr/bin/env node

/**
 * admin-command-cli.mjs — Send deterministic admin commands to the Basil Board Games backend.
 *
 * Environment variables:
 *   SUPABASE_URL          — Supabase project URL (e.g. https://xxx.supabase.co)
 *   SUPABASE_ACCESS_TOKEN — Bearer token for an admin user (get from supabase auth session)
 *
 * Usage:
 *   node scripts/admin-command-cli.mjs <command-name> '<args-json>'
 *
 * Examples:
 *   # Set the active lineup
 *   node scripts/admin-command-cli.mjs games.set_active_lineup '{"activeGameIds":["elam","interrogate","almost","sidequests"]}'
 *
 *   # Patch a game field
 *   node scripts/admin-command-cli.mjs games.patch '{"gameId":"almost","changes":{"pinned":true}}'
 *
 *   # Publish a post
 *   node scripts/admin-command-cli.mjs posts.set_published '{"postId":"my-post","published":true}'
 *
 *   # Delete a post
 *   node scripts/admin-command-cli.mjs posts.delete '{"postId":"old-post"}'
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL) {
  console.error('Error: SUPABASE_URL environment variable is required');
  process.exit(1);
}
if (!TOKEN) {
  console.error('Error: SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('Hint: Sign in via Supabase dashboard, copy your access_token from the session.');
  process.exit(1);
}

const [commandName, argsJson] = process.argv.slice(2);

if (!commandName) {
  console.error('Usage: node scripts/admin-command-cli.mjs <command-name> \'<args-json>\'');
  console.error('');
  console.error('Commands: games.patch, games.set_active_lineup, posts.upsert_draft,');
  console.error('          posts.patch, posts.set_published, posts.delete');
  process.exit(1);
}

let args;
try {
  args = argsJson ? JSON.parse(argsJson) : {};
} catch {
  console.error('Error: Invalid JSON in args parameter');
  process.exit(1);
}

const url = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/admin-command`;

console.log(`→ ${commandName}`);
console.log(`  args: ${JSON.stringify(args)}`);
console.log(`  url:  ${url}`);
console.log('');

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ name: commandName, args }),
  });

  const body = await res.json();
  const status = res.status;

  if (body.ok) {
    console.log(`✓ Success (${status})`);
    console.log(JSON.stringify(body.result, null, 2));
  } else {
    console.error(`✗ Failed (${status})`);
    console.error(`  code:  ${body.code ?? 'unknown'}`);
    console.error(`  error: ${body.error ?? 'Unknown error'}`);
    process.exit(1);
  }
} catch (err) {
  console.error('Network error:', err.message);
  process.exit(1);
}
