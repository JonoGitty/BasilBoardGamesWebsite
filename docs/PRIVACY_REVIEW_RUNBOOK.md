# Privacy Review Runbook

## Overview

This runbook describes the process for reviewing and maintaining the privacy policy,
privacy contract, and data inventory for the Basil Board Games platform.

## Quick Commands

```bash
# Run privacy inventory extraction + drift check
npm run audit:privacy

# Run full audit (security + privacy)
npm run audit:all

# Individual steps
node scripts/audit/privacy-inventory.mjs     # Extract data inventory from code
node scripts/audit/privacy-drift-check.mjs   # Compare inventory vs contract vs policy
node scripts/audit/security-audit.mjs        # Run security checks
```

## Review Checklist

### Before Every PR

- [ ] Run `npm run audit:all` locally
- [ ] If adding new localStorage/sessionStorage keys: add to `audit/privacy-policy.contract.json`
- [ ] If adding new Supabase tables: add to contract `dataCategories[].storageLocations`
- [ ] If adding new edge functions or fetch targets: add to contract `ingestionEndpoints`
- [ ] If changing data collection: update `src/components/PrivacyPolicy.tsx`
- [ ] CI will enforce these checks automatically

### Monthly Review

- [ ] Run `npm run audit:all` and review reports in `audit/out/`
- [ ] Review `audit/accepted-risks.json` for expired exemptions
- [ ] Check Supabase function logs for anomalies
- [ ] Verify rate limits are effective (feedback-ingest, events-ingest)
- [ ] Confirm no new subdomains or services have been added without policy update

### Quarterly Review

- [ ] Full threat model review (`docs/SECURITY_AUDIT_SYSTEM_PLAN.md`)
- [ ] Review all edge function permissions and secrets
- [ ] npm dependency major version audit
- [ ] Check data processors (Supabase, GitHub Pages, Cloudflare) for policy changes
- [ ] Review GDPR/UK data protection developments

## Policy Update Flow

### When to Update the Privacy Policy

Update `src/components/PrivacyPolicy.tsx` when:
1. A new data category is collected (new table, new localStorage key, new endpoint)
2. A data processor changes (new hosting, new CDN)
3. Retention periods change
4. Legal basis changes
5. User rights mechanisms change (new export/delete features)
6. Scope changes (new domain, new subdomain, new game)

### Steps to Update

1. **Update the contract first**: Edit `audit/privacy-policy.contract.json`
   - Add/modify `dataCategories`, `localStorageKeys`, `ingestionEndpoints`, etc.
   - Update `last_reviewed_date` to today

2. **Update the policy text**: Edit `src/components/PrivacyPolicy.tsx`
   - Add/modify relevant sections
   - Update `Last updated: <date>` to match contract review date

3. **Run drift check**: `npm run audit:privacy`
   - Must pass with 0 high/critical findings

4. **Run full CI**: `npm run ci && npm run audit:all`
   - All checks must pass

### Last Updated Date Rule

The privacy policy `Last updated` date must be:
- Greater than or equal to `last_reviewed_date` in the contract
- Updated whenever policy text changes
- The drift checker will fail CI if the policy date is older than the contract review date

Format: `Last updated: Month DD, YYYY` (e.g., `Last updated: February 18, 2026`)

## Release Gate Process

### Pre-release Checklist

1. `npm run ci` passes (typecheck, lint, test, build)
2. `npm run audit:all` passes (security + privacy)
3. No expired accepted risks in `audit/accepted-risks.json`
4. Privacy policy date is current
5. All new data collection paths are documented

### Handling Drift Failures

If `npm run audit:privacy` fails:

1. Read `audit/out/privacy-drift-report.md` for details
2. For **undeclared_storage_key**: Add the key to `audit/privacy-policy.contract.json`
3. For **orphaned_contract_key**: Remove from contract if truly removed from code
4. For **policy_date_stale**: Update date in PrivacyPolicy.tsx
5. For **undeclared_table**: Add to contract dataCategories
6. For **policy_key_missing**: Add key mention to PrivacyPolicy.tsx

### Handling Security Failures

If `npm run audit:security` fails:

1. Read `audit/out/security-audit-report.md` for details
2. Fix actionable findings directly
3. For findings that cannot be immediately fixed, add to `audit/accepted-risks.json`:
   ```json
   {
     "check": "checkName",
     "file": "optional-file-path",
     "reason": "Why this is acceptable",
     "expiresAt": "2026-06-18",
     "addedBy": "your-name",
     "addedAt": "2026-02-18"
   }
   ```

## Scope

The privacy policy and audit system cover:

| Domain | Purpose |
|--------|---------|
| basilboardgames.co.uk | Primary hub (static React app) |
| play.basilboardgames.co.uk | Elam online multiplayer |
| *.basilboardgames.co.uk | Future subdomains |

All game surfaces served from these domains are in scope:
- Hub pages (React SPA)
- Static game bundles (public/games/*)
- Online game clients (Elam online-client.js)
- Edge function endpoints (Supabase)

## File Reference

| File | Purpose |
|------|---------|
| `audit/privacy-policy.contract.json` | Machine-readable source of truth |
| `audit/security-audit.config.json` | Security check configuration |
| `audit/accepted-risks.json` | Accepted risk exemptions |
| `scripts/audit/security-audit.mjs` | Security audit runner |
| `scripts/audit/privacy-inventory.mjs` | Codebase data inventory extractor |
| `scripts/audit/privacy-drift-check.mjs` | Contract vs code vs policy comparator |
| `src/components/PrivacyPolicy.tsx` | User-facing privacy policy |
| `docs/SECURITY_AUDIT_SYSTEM_PLAN.md` | Threat model and audit plan |
| `.github/workflows/security-privacy-audit.yml` | CI workflow |
