#!/usr/bin/env node

/**
 * auto-draft-post.mjs
 *
 * Creates an admin draft post from a commit/file change range.
 * It NEVER publishes; it only calls posts.upsert_draft.
 *
 * Usage:
 *   node scripts/auto-draft-post.mjs --dry-run
 *   node scripts/auto-draft-post.mjs --from HEAD~1 --to HEAD --dry-run
 *   SUPABASE_URL=... SUPABASE_ACCESS_TOKEN=... node scripts/auto-draft-post.mjs
 */

import { execSync } from 'node:child_process';

const SCOPE_RULES = [
  {
    scope: 'elam',
    titlePrefix: 'Elam Update Draft',
    category: 'patch',
    emoji: '🧠',
    patterns: ['public/games/elam/', 'supabase/functions/feedback-ingest/', 'supabase/functions/events-ingest/'],
  },
  {
    scope: 'almost',
    titlePrefix: 'Almost Update Draft',
    category: 'patch',
    emoji: '🃏',
    patterns: ['public/games/almost/'],
  },
  {
    scope: 'interrogate',
    titlePrefix: 'Interrogate Update Draft',
    category: 'patch',
    emoji: '🕵️',
    patterns: ['public/games/interrogate/'],
  },
  {
    scope: 'admin',
    titlePrefix: 'Admin Panel Update Draft',
    category: 'patch',
    emoji: '🛠️',
    patterns: ['src/components/Admin', 'src/services/adminApi', 'supabase/functions/admin-command/'],
  },
  {
    scope: 'privacy-security',
    titlePrefix: 'Privacy/Security Update Draft',
    category: 'announcement',
    emoji: '🔒',
    patterns: ['docs/SECURITY', 'docs/PRIVACY', 'audit/', 'scripts/audit/', 'src/components/PrivacyPolicy'],
  },
];

const FALLBACK_RULE = {
  scope: 'site',
  titlePrefix: 'Site Update Draft',
  category: 'announcement',
  emoji: '📣',
};

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function argValue(flag, fallback = '') {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return fallback;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith('--')) return fallback;
  return String(next);
}

function runGit(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function safeGit(cmd, fallback = '') {
  try {
    return runGit(cmd);
  } catch {
    return fallback;
  }
}

function changedFiles(fromRef, toRef) {
  const explicit = fromRef && toRef;
  if (explicit) {
    const out = safeGit(`git diff --name-only ${fromRef} ${toRef}`);
    if (out) return out.split(/\r?\n/).filter(Boolean);
  }
  const staged = safeGit('git diff --cached --name-only');
  if (staged) return staged.split(/\r?\n/).filter(Boolean);
  const headRange = safeGit('git diff --name-only HEAD~1 HEAD');
  if (headRange) return headRange.split(/\r?\n/).filter(Boolean);
  return [];
}

function pickScope(files) {
  if (!files.length) return { ...FALLBACK_RULE, score: 0 };
  let best = { ...FALLBACK_RULE, score: 0 };
  for (const rule of SCOPE_RULES) {
    let score = 0;
    for (const f of files) {
      if (rule.patterns.some((p) => f.includes(p))) score += 1;
    }
    if (score > best.score) best = { ...rule, score };
  }
  return best;
}

function compactDate() {
  const d = new Date();
  const y = String(d.getUTCFullYear());
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildDescription(commitSubject, files) {
  const top = files.slice(0, 5);
  const remainder = Math.max(0, files.length - top.length);
  const filePart = top.length > 0 ? top.join(', ') + (remainder > 0 ? ` (+${remainder} more)` : '') : 'no file summary available';
  return `Auto-generated draft from recent changes. Commit: ${commitSubject || 'n/a'}. Files: ${filePart}.`;
}

async function sendDraft({ url, token, payload }) {
  const endpoint = `${url.replace(/\/+$/, '')}/functions/v1/admin-command`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: 'posts.upsert_draft', args: payload }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) {
    const msg = body?.error || `HTTP ${res.status}`;
    throw new Error(`Draft creation failed: ${msg}`);
  }
  return body.result;
}

async function main() {
  const dryRun = hasFlag('--dry-run');
  const fromRef = argValue('--from', '');
  const toRef = argValue('--to', 'HEAD');

  const files = changedFiles(fromRef, toRef);
  const scopeRule = pickScope(files);

  const commitSubject = safeGit(`git log -1 --pretty=%s ${toRef || 'HEAD'}`, 'Update');
  const shortSha = safeGit(`git rev-parse --short ${toRef || 'HEAD'}`, 'nosha');

  const title = argValue('--title', `${scopeRule.titlePrefix} (${isoDate()})`);
  const description = argValue('--description', buildDescription(commitSubject, files));
  const category = argValue('--category', scopeRule.category);
  const emoji = argValue('--emoji', scopeRule.emoji);
  const id = argValue('--id', `draft-${scopeRule.scope}-${compactDate()}-${shortSha}`);

  const payload = {
    id,
    title,
    description,
    emoji,
    category,
  };

  console.log('Auto Draft Post');
  console.log('===============');
  console.log(`scope: ${scopeRule.scope}`);
  console.log(`from:  ${fromRef || '(auto)'}`);
  console.log(`to:    ${toRef}`);
  console.log(`files: ${files.length}`);
  console.log(JSON.stringify(payload, null, 2));
  console.log('Note: This creates a draft only (published=false).');

  if (dryRun) {
    console.log('Dry run: no network request made.');
    return;
  }

  const url = process.env.SUPABASE_URL || '';
  const token = process.env.SUPABASE_ACCESS_TOKEN || '';

  if (!url || !token) {
    console.log('Missing SUPABASE_URL or SUPABASE_ACCESS_TOKEN.');
    console.log('Run with --dry-run or set env vars to create the draft remotely.');
    process.exit(1);
  }

  const result = await sendDraft({ url, token, payload });
  console.log('Draft created successfully (still unpublished).');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(String(err && err.message ? err.message : err));
  process.exit(1);
});