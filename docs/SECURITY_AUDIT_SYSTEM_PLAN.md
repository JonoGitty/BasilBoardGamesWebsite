# Security Audit System Plan

## 1. Threat Model Scope

### Assets & Data Classes

| Class | Examples | Sensitivity |
|-------|----------|-------------|
| **Personal** | Email, hashed password, display name | High |
| **Pseudonymous** | Profile preferences, analytics events (linked to user_id) | Medium |
| **Anonymous** | Feedback text, IP hash, game context | Low |
| **Operational** | Admin command logs, rotation logs, game catalog | Internal |
| **Secrets** | Supabase service_role key, FEEDBACK_SALT, JWT signing | Critical |

### Trust Boundaries

```
┌─────────────────────────────────────────────────────┐
│  UNTRUSTED: Public Internet                         │
│  ├── basilboardgames.co.uk (static hub, GitHub Pages)│
│  ├── play.basilboardgames.co.uk (Elam online)       │
│  └── Static game bundles (public/games/*)            │
├─────────────────────────────────────────────────────┤
│  SEMI-TRUSTED: Authenticated User Session            │
│  ├── Supabase Auth JWT (access_token)                │
│  ├── Profile RLS (self-only read/write)              │
│  └── Analytics events (consent-gated)                │
├─────────────────────────────────────────────────────┤
│  TRUSTED: Admin Role                                 │
│  ├── admin-command edge function (role verified)      │
│  ├── Admin panel (client-side, server-validated)      │
│  └── Metrics RPC (admin guard in function)            │
├─────────────────────────────────────────────────────┤
│  HIGHLY TRUSTED: Service Role                        │
│  ├── Edge functions with service_role key             │
│  ├── Supabase dashboard                              │
│  └── GitHub repo (deployment pipeline)               │
└─────────────────────────────────────────────────────┘
```

### Attack Surfaces

| Surface | Vectors | Controls |
|---------|---------|----------|
| **Frontend (hub)** | XSS via game catalog data, DOM injection | React auto-escaping, CSP headers |
| **Frontend (static games)** | XSS via user input, innerHTML | Manual sanitization in game code |
| **Edge functions** | Payload injection, auth bypass, rate limit evasion | Input validation, JWT verification, IP-based rate limiting |
| **Supabase RLS** | Privilege escalation, policy bypass | Row-level security on all tables, service_role isolation |
| **Config files** | Exposed secrets, hardcoded URLs | site-config.js pattern, env vars for secrets |
| **Dependencies** | Supply chain (npm packages) | npm audit, minimal dependency set |
| **Online game server** | WebSocket hijack, session fixation | sessionToken auth, helmet headers, input validation |

## 2. Control Objectives

| ID | Objective | Automated Check |
|----|-----------|-----------------|
| C1 | No hardcoded secrets or project URLs in source | Grep scan |
| C2 | All edge functions declare correct auth mode | Config review |
| C3 | All sensitive tables have RLS enabled | Migration scan |
| C4 | No wildcard CORS on authenticated endpoints | Edge function scan |
| C5 | npm dependencies free of high/critical vulns | npm audit |
| C6 | No eval/innerHTML/unsafe DOM patterns | Grep scan |
| C7 | All admin writes go through admin-command | Architecture review |
| C8 | Privacy policy matches actual data collection | Drift checker |

## 3. Review Cadence

| Frequency | Activity |
|-----------|----------|
| Every PR | CI runs security-audit + privacy-drift-check |
| Weekly | Review accepted-risks.json expiry dates |
| Monthly | Manual review of edge function logs, rate limit effectiveness |
| Quarterly | Full threat model review, dependency major version audit |
| On change | Re-run audit after any migration, edge function, or policy update |
