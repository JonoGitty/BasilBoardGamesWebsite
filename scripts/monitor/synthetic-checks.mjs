#!/usr/bin/env node
/**
 * Synthetic monitor — probes endpoints from the manifest and reports status.
 * All probes are safe, read-only operations.
 *
 * Usage:
 *   node scripts/monitor/synthetic-checks.mjs              # human-readable
 *   node scripts/monitor/synthetic-checks.mjs --json        # JSON output
 *
 * Environment:
 *   SUPABASE_URL  — replaces ${SUPABASE_URL} in endpoint URLs (optional)
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(__dirname, "endpoint-manifest.json");
const jsonMode = process.argv.includes("--json");

function resolveUrl(url) {
  if (!url.includes("${")) return url;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  if (!supabaseUrl) return null; // Signal to skip
  return url.replace(/\$\{SUPABASE_URL\}/g, supabaseUrl);
}

async function probeEndpoint(endpoint) {
  const url = resolveUrl(endpoint.url);
  const result = {
    name: endpoint.name,
    url,
    method: endpoint.method || "GET",
    status: "unknown",
    httpStatus: null,
    durationMs: null,
    error: null,
  };

  if (!url) {
    result.status = "skip";
    result.error = "URL contains unresolved variable (set SUPABASE_URL)";
    return result;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    endpoint.timeoutMs || 10000
  );

  const start = Date.now();
  try {
    const options = {
      method: endpoint.method || "GET",
      signal: controller.signal,
      headers: endpoint.headers || {},
    };
    if (endpoint.body && options.method !== "GET" && options.method !== "HEAD") {
      options.body = endpoint.body;
    }

    const response = await fetch(url, options);
    result.httpStatus = response.status;
    result.durationMs = Date.now() - start;

    const expectedStatuses = endpoint.expect || [200];
    if (!expectedStatuses.includes(response.status)) {
      result.status = "fail";
      result.error = `Expected ${expectedStatuses.join("|")}, got ${response.status}`;
      return result;
    }

    if (endpoint.contains) {
      const text = await response.text();
      if (!text.includes(endpoint.contains)) {
        result.status = "fail";
        result.error = `Response body missing expected string: "${endpoint.contains}"`;
        return result;
      }
    }

    result.status = "pass";
  } catch (err) {
    result.durationMs = Date.now() - start;
    result.status = "fail";
    result.error = err.name === "AbortError" ? "Timeout" : err.message;
  } finally {
    clearTimeout(timeout);
  }

  return result;
}

async function main() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const results = [];

  for (const endpoint of manifest.endpoints) {
    const result = await probeEndpoint(endpoint);
    results.push(result);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    allPassed: results.every((r) => r.status === "pass" || r.status === "skip"),
    total: results.length,
    passed: results.filter((r) => r.status === "pass").length,
    failed: results.filter((r) => r.status === "fail").length,
    skipped: results.filter((r) => r.status === "skip").length,
    results,
  };

  if (jsonMode) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log("Synthetic Monitor Results");
    console.log("=========================");
    for (const r of results) {
      const icon =
        r.status === "pass"
          ? "PASS"
          : r.status === "skip"
            ? "SKIP"
            : "FAIL";
      const duration = r.durationMs ? ` (${r.durationMs}ms)` : "";
      console.log(`  [${icon}] ${r.name}${duration}`);
      if (r.error) console.log(`         ${r.error}`);
    }
    console.log(
      `\n${summary.passed}/${summary.total} passed, ${summary.failed} failed, ${summary.skipped} skipped.`
    );
    if (!summary.allPassed) console.log("Some checks FAILED.");
  }

  process.exit(summary.allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Monitor error:", err.message);
  process.exit(1);
});
