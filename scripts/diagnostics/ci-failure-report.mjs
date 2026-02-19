#!/usr/bin/env node
/**
 * CI failure reporter — wraps analyze-failure.mjs and produces
 * both JSON and human-readable markdown for CI artifacts.
 *
 * Usage:
 *   npx vitest run 2>&1 | node scripts/diagnostics/ci-failure-report.mjs
 *   node scripts/diagnostics/ci-failure-report.mjs --file test-output.txt
 *
 * Outputs:
 *   - stdout: markdown report
 *   - diagnostics/last-report.json: JSON for programmatic access
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = resolve(__dirname, "..", "..", "diagnostics", "rules");
const CATALOG_PATH = resolve(__dirname, "..", "..", "diagnostics", "error-catalog.json");
const REPORT_PATH = resolve(__dirname, "..", "..", "diagnostics", "last-report.json");

function loadRules() {
  const rules = [];
  const files = readdirSync(RULES_DIR).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const data = JSON.parse(readFileSync(resolve(RULES_DIR, file), "utf8"));
    for (const rule of data.rules) {
      rules.push({
        category: data.category,
        pattern: new RegExp(rule.pattern, "i"),
        code: rule.code,
        confidence: rule.confidence,
      });
    }
  }
  return rules;
}

function loadCatalog() {
  const data = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const map = {};
  for (const entry of data.errors) {
    map[entry.code] = entry;
  }
  return map;
}

function extractFailures(text) {
  const failures = [];
  const lines = text.split("\n");
  let currentTest = null;
  let errorBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const vitestFail = line.match(/[×✗✘]\s+(.+)/);
    if (vitestFail) {
      if (currentTest && errorBuffer.length) {
        failures.push({ test: currentTest, errorText: errorBuffer.join("\n") });
      }
      currentTest = vitestFail[1].trim();
      errorBuffer = [];
      continue;
    }
    const nodeTestFail = line.match(/not ok \d+ - (.+)/);
    if (nodeTestFail) {
      if (currentTest && errorBuffer.length) {
        failures.push({ test: currentTest, errorText: errorBuffer.join("\n") });
      }
      currentTest = nodeTestFail[1].trim();
      errorBuffer = [];
      continue;
    }
    if (currentTest) {
      if (line.match(/^\s*(✓|✔|✗|×|ok \d|not ok \d|▶|Tests|Test Files)/)) {
        if (errorBuffer.length) {
          failures.push({ test: currentTest, errorText: errorBuffer.join("\n") });
        }
        currentTest = line.match(/[×✗✘]\s+(.+)/) ? line.match(/[×✗✘]\s+(.+)/)[1].trim() : null;
        errorBuffer = [];
        if (!currentTest) continue;
      } else {
        errorBuffer.push(line);
      }
    }
  }
  if (currentTest && errorBuffer.length) {
    failures.push({ test: currentTest, errorText: errorBuffer.join("\n") });
  }
  return failures;
}

function classify(errorText, rules, catalog) {
  const matches = [];
  for (const rule of rules) {
    if (rule.pattern.test(errorText)) {
      const catalogEntry = catalog[rule.code] || {};
      matches.push({
        category: rule.category,
        code: rule.code,
        confidence: rule.confidence,
        suggestion: catalogEntry.remediation || "No remediation available.",
      });
    }
  }
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches.length > 0
    ? matches[0]
    : { category: "unknown", code: "UNKNOWN", confidence: 0, suggestion: "Inspect manually." };
}

function toMarkdown(report) {
  const lines = [];
  lines.push("# CI Failure Report");
  lines.push("");
  lines.push(`**Generated:** ${report.timestamp}`);
  lines.push(`**Total failures:** ${report.failures.length}`);
  lines.push("");

  if (report.failures.length === 0) {
    lines.push("All tests passed. No failures to report.");
    return lines.join("\n");
  }

  // Group by category
  const byCategory = {};
  for (const f of report.failures) {
    const cat = f.category || "unknown";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(f);
  }

  for (const [category, failures] of Object.entries(byCategory)) {
    lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)} (${failures.length})`);
    lines.push("");
    lines.push("| Test | Error Code | Confidence | Suggestion |");
    lines.push("|------|-----------|------------|------------|");
    for (const f of failures) {
      lines.push(
        `| ${f.test} | \`${f.code}\` | ${(f.confidence * 100).toFixed(0)}% | ${f.suggestion} |`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main() {
  let input;
  const fileArg = process.argv.indexOf("--file");
  if (fileArg !== -1 && process.argv[fileArg + 1]) {
    input = readFileSync(process.argv[fileArg + 1], "utf8");
  } else {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    input = Buffer.concat(chunks).toString("utf8");
  }

  const rules = loadRules();
  const catalog = loadCatalog();
  const failures = extractFailures(input || "");

  const classified = failures.map((f) => ({
    test: f.test,
    ...classify(f.errorText, rules, catalog),
  }));

  const report = {
    timestamp: new Date().toISOString(),
    failures: classified,
  };

  // Write JSON report
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  // Output markdown
  console.log(toMarkdown(report));
}

main().catch((err) => {
  console.error("Report error:", err.message);
  process.exit(1);
});
