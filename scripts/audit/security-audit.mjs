#!/usr/bin/env node
/**
 * Security audit script for Basil Board Games platform.
 *
 * Runs automated checks defined in audit/security-audit.config.json
 * and writes reports to audit/out/.
 *
 * Usage: node scripts/audit/security-audit.mjs [--fix]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative, extname } from 'path';
import { execSync } from 'child_process';

const ROOT = resolve(import.meta.dirname, '..', '..');
const CONFIG_PATH = join(ROOT, 'audit', 'security-audit.config.json');
const OUT_DIR = join(ROOT, 'audit', 'out');
const RISKS_PATH = join(ROOT, 'audit', 'accepted-risks.json');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
const acceptedRisks = existsSync(RISKS_PATH)
  ? JSON.parse(readFileSync(RISKS_PATH, 'utf8'))
  : [];

const findings = [];
const now = new Date().toISOString();

function addFinding(check, severity, message, file, details) {
  findings.push({ check, severity, message, file: file || null, details: details || null, timestamp: now });
}

function isAccepted(check, file) {
  return acceptedRisks.some((r) => {
    if (r.check !== check) return false;
    if (r.expiresAt && new Date(r.expiresAt) <= new Date()) return false;
    if (!r.file) return true;
    if (r.file === file) return true;
    // Partial match: accepted risk file can be a prefix of the finding file
    if (file && file.startsWith(r.file.split(':')[0] + ':') && r.file.includes(':')) {
      const riskPath = r.file.split(':').slice(1).join(':');
      const findingPath = file.split(':').slice(1).join(':');
      if (findingPath.startsWith(riskPath.split(':')[0])) return true;
    }
    return false;
  });
}

// ---------- File walker ----------
function walkFiles(dir, excludes = []) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    if (excludes.some((ex) => rel.startsWith(ex) || entry.name === ex)) continue;
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, excludes));
    } else {
      results.push({ full, rel });
    }
  }
  return results;
}

function isSourceFile(rel) {
  const ext = extname(rel);
  return ['.js', '.mjs', '.ts', '.tsx', '.jsx', '.html', '.css', '.json', '.py'].includes(ext);
}

function matchesGlob(filepath, pattern) {
  // Simple glob matching for our approved files patterns
  const normalized = filepath.replace(/\\/g, '/');
  if (pattern.includes('**')) {
    const prefix = pattern.split('**')[0];
    const suffix = pattern.split('**').pop();
    return normalized.startsWith(prefix) && (suffix === '' || suffix === '/*' || normalized.endsWith(suffix.replace('/*', '').replace('/', '')));
  }
  if (pattern.includes('*')) {
    const re = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    return re.test(normalized);
  }
  return normalized === pattern || normalized.endsWith('/' + pattern) || normalized.endsWith(pattern);
}

// ---------- Check: Hardcoded URLs ----------
function checkHardcodedUrls() {
  const check = config.checks.hardcodedUrls;
  if (!check.enabled) return;
  console.log('  Checking hardcoded URLs...');

  const repos = [
    { dir: ROOT, label: 'website' },
    { dir: resolve(ROOT, config.repos.triarch.path), label: 'triarch' },
  ];

  for (const repo of repos) {
    if (!existsSync(repo.dir)) {
      addFinding('hardcodedUrls', 'low', `Repo not found: ${repo.label}`, repo.dir);
      continue;
    }
    const files = walkFiles(repo.dir, ['node_modules', 'dist', '.git', 'audit/out']);
    for (const { full, rel } of files) {
      if (!isSourceFile(rel)) continue;
      const isApproved = check.approvedFiles.some((p) => matchesGlob(rel, p));
      if (isApproved) continue;

      try {
        const content = readFileSync(full, 'utf8');
        for (const pattern of check.patterns) {
          const re = new RegExp(pattern, 'g');
          let match;
          while ((match = re.exec(content)) !== null) {
            const relPath = `${repo.label}:${rel}`;
            if (!isAccepted('hardcodedUrls', relPath)) {
              addFinding('hardcodedUrls', check.severity, `Hardcoded Supabase URL in ${relPath}`, relPath);
            }
          }
        }
      } catch { /* skip binary files */ }
    }
  }
}

// ---------- Check: Edge Function Security ----------
function checkEdgeFunctions() {
  const check = config.checks.edgeFunctionSecurity;
  if (!check.enabled) return;
  console.log('  Checking edge function security...');

  const functionsDir = join(ROOT, 'supabase', 'functions');
  if (!existsSync(functionsDir)) {
    addFinding('edgeFunctionSecurity', 'low', 'Supabase functions directory not found on disk (may be deployed separately)', functionsDir);
    return;
  }

  for (const [name, spec] of Object.entries(check.functions)) {
    const fnDir = join(functionsDir, name);
    const indexPath = join(fnDir, 'index.ts');
    if (!existsSync(indexPath)) {
      addFinding('edgeFunctionSecurity', 'medium', `Edge function source not found: ${name}`, indexPath);
      continue;
    }

    const content = readFileSync(indexPath, 'utf8');

    // Check for required secrets usage
    for (const secret of spec.requiredSecrets) {
      if (!content.includes(secret)) {
        addFinding('edgeFunctionSecurity', 'high', `Edge function ${name} does not reference required secret: ${secret}`, indexPath);
      }
      // Check for insecure fallback defaults
      const fallbackRe = new RegExp(`Deno\\.env\\.get\\(["']${secret}["']\\)\\s*\\|\\|\\s*["']`, 'g');
      if (fallbackRe.test(content)) {
        addFinding('edgeFunctionSecurity', 'high', `Edge function ${name} has insecure default fallback for ${secret}`, indexPath);
      }
    }

    // Check CORS wildcard
    if (spec.corsAllowedOrigins !== '*' && spec.corsAllowedOrigins !== 'configurable') {
      if (content.includes('"*"') && content.includes('Access-Control-Allow-Origin')) {
        if (!isAccepted('wildcardCors', name)) {
          addFinding('wildcardCors', 'medium', `Edge function ${name} uses wildcard CORS but spec says: ${spec.corsAllowedOrigins}`, indexPath);
        }
      }
    }
  }
}

// ---------- Check: RLS ----------
function checkRls() {
  const check = config.checks.rlsCheck;
  if (!check.enabled) return;
  console.log('  Checking RLS on sensitive tables...');

  const migrationsDir = join(ROOT, 'supabase', 'migrations');
  if (!existsSync(migrationsDir)) {
    addFinding('rlsCheck', 'low', 'Migrations directory not found on disk (may be deployed separately)', migrationsDir);
    return;
  }

  const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  const allSql = migrationFiles.map((f) => readFileSync(join(migrationsDir, f), 'utf8')).join('\n');

  for (const table of check.sensitiveTables) {
    const rlsRe = new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    if (!rlsRe.test(allSql)) {
      addFinding('rlsCheck', check.severity, `RLS not found for sensitive table: ${table}`, 'migrations');
    }
  }
}

// ---------- Check: Wildcard CORS ----------
function checkWildcardCors() {
  const check = config.checks.wildcardCors;
  if (!check.enabled) return;
  console.log('  Checking wildcard CORS...');

  const functionsDir = join(ROOT, 'supabase', 'functions');
  if (!existsSync(functionsDir)) return;

  const fnDirs = readdirSync(functionsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const dir of fnDirs) {
    const indexPath = join(functionsDir, dir.name, 'index.ts');
    if (!existsSync(indexPath)) continue;

    const content = readFileSync(indexPath, 'utf8');
    const hasWildcardCors = /["']Access-Control-Allow-Origin["']\s*[:,]\s*["']\*["']/.test(content);

    if (hasWildcardCors && !check.approvedWildcard.includes(dir.name)) {
      if (!isAccepted('wildcardCors', dir.name)) {
        addFinding('wildcardCors', check.severity, `Unapproved wildcard CORS in edge function: ${dir.name}`, indexPath);
      }
    }
  }
}

// ---------- Check: npm audit ----------
function checkNpmAudit() {
  const check = config.checks.npmAudit;
  if (!check.enabled) return;
  console.log('  Running npm audit...');

  const repos = [
    { dir: ROOT, label: 'website' },
    { dir: resolve(ROOT, config.repos.triarch.path), label: 'triarch' },
  ];

  for (const repo of repos) {
    if (!existsSync(join(repo.dir, 'package.json'))) continue;

    try {
      execSync('npm audit --json', { cwd: repo.dir, stdio: 'pipe', timeout: 60000 });
      // Exit code 0 means no vulnerabilities
    } catch (err) {
      try {
        const auditJson = JSON.parse(err.stdout?.toString() || '{}');
        const vulns = auditJson.vulnerabilities || {};
        for (const [pkg, info] of Object.entries(vulns)) {
          const sev = info.severity || 'low';
          if (check.failOnSeverity.includes(sev)) {
            const key = `npmAudit:${repo.label}:${pkg}`;
            if (!isAccepted('npmAudit', key)) {
              addFinding('npmAudit', sev === 'critical' ? 'critical' : 'high',
                `npm vulnerability in ${repo.label}: ${pkg} (${sev}) - ${info.via?.[0]?.title || info.via?.[0] || 'unknown'}`,
                key, { package: pkg, severity: sev, repo: repo.label });
            }
          }
        }
      } catch {
        addFinding('npmAudit', 'medium', `npm audit parse failed for ${repo.label}`, repo.dir);
      }
    }
  }
}

// ---------- Check: Risky patterns ----------
function checkRiskyPatterns() {
  const check = config.checks.riskyPatterns;
  if (!check.enabled) return;
  console.log('  Checking risky code patterns...');

  const repos = [
    { dir: ROOT, label: 'website' },
    { dir: resolve(ROOT, config.repos.triarch.path), label: 'triarch' },
  ];

  for (const repo of repos) {
    if (!existsSync(repo.dir)) continue;
    const files = walkFiles(repo.dir, check.excludePaths);
    for (const { full, rel } of files) {
      if (!isSourceFile(rel)) continue;
      // Skip very large files efficiently
      try {
        const stat = statSync(full);
        if (stat.size > 5_000_000) continue;
      } catch { continue; }

      let content;
      try { content = readFileSync(full, 'utf8'); } catch { continue; }

      for (const pat of check.patterns) {
        const re = new RegExp(pat.regex, 'gi');
        let match;
        let lineNum = 0;
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (re.test(lines[i])) {
            const relPath = `${repo.label}:${rel}`;
            if (!isAccepted('riskyPatterns', `${relPath}:${pat.label}`)) {
              addFinding('riskyPatterns', pat.severity,
                `${pat.label} at ${relPath}:${i + 1}`,
                relPath, { line: i + 1, pattern: pat.label });
            }
          }
        }
      }
    }
  }
}

// ---------- Check: Admin command architecture ----------
function checkAdminCommandArchitecture() {
  const check = config.checks.adminCommandArchitecture;
  if (!check.enabled) return;
  console.log('  Checking admin command architecture...');

  const files = walkFiles(join(ROOT, 'src'), ['node_modules']);
  for (const { full, rel } of files) {
    if (!isSourceFile(rel)) continue;
    const normalized = rel.replace(/\\/g, '/');
    const isAllowed = check.allowedFiles.some((af) => normalized.endsWith(af) || normalized.includes(af));
    if (isAllowed) continue;

    let content;
    try { content = readFileSync(full, 'utf8'); } catch { continue; }

    for (const pat of check.directWritePatterns) {
      const re = new RegExp(pat.regex, 'g');
      if (re.test(content)) {
        if (!isAccepted('adminCommandArchitecture', rel)) {
          addFinding('adminCommandArchitecture', check.severity,
            `${pat.label} in ${rel}`,
            rel, { pattern: pat.label });
        }
      }
    }
  }
}

// ---------- Main ----------
console.log('Security Audit - Basil Board Games Platform');
console.log('============================================\n');

checkHardcodedUrls();
checkEdgeFunctions();
checkRls();
checkWildcardCors();
checkNpmAudit();
checkRiskyPatterns();
checkAdminCommandArchitecture();

// ---------- Classify results ----------
const critical = findings.filter((f) => f.severity === 'critical');
const high = findings.filter((f) => f.severity === 'high');
const medium = findings.filter((f) => f.severity === 'medium');
const low = findings.filter((f) => f.severity === 'low');

const hasFail = critical.length > 0 || high.length > 0;

const report = {
  timestamp: now,
  version: config.version,
  summary: {
    total: findings.length,
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    pass: !hasFail,
  },
  findings,
};

// ---------- Write JSON report ----------
writeFileSync(join(OUT_DIR, 'security-audit-report.json'), JSON.stringify(report, null, 2));

// ---------- Write Markdown report ----------
let md = `# Security Audit Report\n\n`;
md += `**Date:** ${now}\n`;
md += `**Result:** ${hasFail ? 'FAIL' : 'PASS'}\n\n`;
md += `## Summary\n\n`;
md += `| Severity | Count |\n|----------|-------|\n`;
md += `| Critical | ${critical.length} |\n`;
md += `| High | ${high.length} |\n`;
md += `| Medium | ${medium.length} |\n`;
md += `| Low | ${low.length} |\n`;
md += `| **Total** | **${findings.length}** |\n\n`;

if (findings.length > 0) {
  md += `## Findings\n\n`;
  for (const f of findings) {
    md += `### [${f.severity.toUpperCase()}] ${f.message}\n`;
    md += `- **Check:** ${f.check}\n`;
    if (f.file) md += `- **File:** ${f.file}\n`;
    if (f.details) md += `- **Details:** \`${JSON.stringify(f.details)}\`\n`;
    md += `\n`;
  }
} else {
  md += `No findings.\n`;
}

writeFileSync(join(OUT_DIR, 'security-audit-report.md'), md);

// ---------- Console summary ----------
console.log(`\nResults: ${findings.length} findings`);
console.log(`  Critical: ${critical.length}`);
console.log(`  High:     ${high.length}`);
console.log(`  Medium:   ${medium.length}`);
console.log(`  Low:      ${low.length}`);
console.log(`\nReports written to audit/out/`);

if (hasFail) {
  console.error('\nAUDIT FAILED: critical or high severity findings detected.');
  process.exit(1);
}
console.log('\nAUDIT PASSED.');
