#!/usr/bin/env node
/**
 * Failure analyzer — reads test output and classifies failures
 * using pattern-matching rules from diagnostics/rules/*.json.
 *
 * Usage:
 *   npx vitest run 2>&1 | node scripts/diagnostics/analyze-failure.mjs
 *   node scripts/diagnostics/analyze-failure.mjs < test-output.txt
 *   node scripts/diagnostics/analyze-failure.mjs --file test-output.txt
 */
import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = resolve(__dirname, "..", "..", "diagnostics", "rules");
const CATALOG_PATH = resolve(__dirname, "..", "..", "diagnostics", "error-catalog.json");

// Load all rule files
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

// Load error catalog for remediation lookup
function loadCatalog() {
  const data = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));
  const map = {};
  for (const entry of data.errors) {
    map[entry.code] = entry;
  }
  return map;
}

// Extract test failures from vitest/node:test output
function extractFailures(text) {
  const failures = [];
  const lines = text.split("\n");

  // Pattern: vitest FAIL lines
  let currentTest = null;
  let errorBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Vitest failure marker
    const vitestFail = line.match(/[×✗✘]\s+(.+)/);
    if (vitestFail) {
      if (currentTest && errorBuffer.length) {
        failures.push({ test: currentTest, errorText: errorBuffer.join("\n") });
      }
      currentTest = vitestFail[1].trim();
      errorBuffer = [];
      continue;
    }

    // node:test failure marker
    const nodeTestFail = line.match(/not ok \d+ - (.+)/);
    if (nodeTestFail) {
      if (currentTest && errorBuffer.length) {
        failures.push({ test: currentTest, errorText: errorBuffer.join("\n") });
      }
      currentTest = nodeTestFail[1].trim();
      errorBuffer = [];
      continue;
    }

    // Collect error context lines after a failure
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

  // Flush last failure
  if (currentTest && errorBuffer.length) {
    failures.push({ test: currentTest, errorText: errorBuffer.join("\n") });
  }

  return failures;
}

// Classify a failure using rules
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

  // Return highest confidence match, or "unknown"
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches.length > 0
    ? matches[0]
    : { category: "unknown", code: "UNKNOWN", confidence: 0, suggestion: "Inspect the full error output manually." };
}

// Main
async function main() {
  let input;
  const fileArg = process.argv.indexOf("--file");
  if (fileArg !== -1 && process.argv[fileArg + 1]) {
    input = readFileSync(process.argv[fileArg + 1], "utf8");
  } else {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    input = Buffer.concat(chunks).toString("utf8");
  }

  if (!input.trim()) {
    console.log(JSON.stringify({ failures: [], summary: "No input provided." }));
    return;
  }

  const rules = loadRules();
  const catalog = loadCatalog();
  const failures = extractFailures(input);

  if (failures.length === 0) {
    console.log(JSON.stringify({ failures: [], summary: "No failures detected." }));
    return;
  }

  const classified = failures.map((f) => {
    const classification = classify(f.errorText, rules, catalog);
    return {
      test: f.test,
      ...classification,
    };
  });

  console.log(JSON.stringify({ failures: classified }, null, 2));
}

main().catch((err) => {
  console.error("Analyzer error:", err.message);
  process.exit(1);
});
