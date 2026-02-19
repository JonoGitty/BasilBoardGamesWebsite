# Risk Matrix

> Auto-generated from codebase scan — 2026-02-18

## Severity Classification

| Severity | Surface | Blast Radius | Owner | Current Tests | Automation |
|----------|---------|-------------|-------|---------------|------------|
| **Critical** | engine.js `applyAction` | All online games break — invalid state corrupts rooms | Triarch | None | Phase 3 unit |
| **Critical** | engine.js `enumerateLegalActions` | Game freezes — no legal moves shown | Triarch | None | Phase 3 unit |
| **Critical** | engine.js `createGame` | Room creation fails — no games start | Triarch | None | Phase 3 unit |
| **Critical** | server.js room/join/action endpoints | Online mode completely down | Triarch | None | Phase 3 contract |
| **Critical** | Auth flow (AuthForm + useSession) | Users cannot sign in/up | Basil | None | Phase 4 E2E |
| **High** | feedbackService | User feedback lost silently | Basil | Unit tests exist | — |
| **High** | admin-command edge function | Admin panel cannot manage games/posts | Basil | None | Phase 3 contract |
| **High** | feedback-ingest edge function | Anonymous feedback from games lost | Basil | None | Phase 3 contract |
| **High** | gameLauncher.ts | Cannot start any game | Basil | None | Phase 3 unit |
| **High** | ai-policy.js `chooseBotAction` | Bot games freeze — no AI move | Triarch | None | Phase 3 unit |
| **High** | consent module | Privacy compliance violation | Basil | Unit tests exist | — |
| **High** | engine.js `shapeBeats` (combat) | Wrong capture outcomes | Triarch | None | Phase 3 unit |
| **Medium** | AdminPanel tabs | Admin-only impact — ops workflow broken | Basil | None | Phase 4 E2E |
| **Medium** | profileSync | Profile drift between auth + DB | Basil | Unit tests exist | — |
| **Medium** | WhatsNew feed | Public content not shown | Basil | None | Phase 4 E2E |
| **Medium** | GameCarousel / GameCard | Game selection broken | Basil | None | Phase 4 E2E |
| **Medium** | ConsentBanner | Privacy banner not shown | Basil | None | Phase 4 E2E |
| **Medium** | useAdminGames / useAdminPosts | Admin hooks fail | Basil | None | Phase 3 |
| **Low** | metricsApi / MetricsTab | Diagnostics only — no user impact | Basil | metricsApi tested | — |
| **Low** | analytics (track/transport) | Tracking gap — no user impact | Basil | Both tested | — |
| **Low** | sessionTracker | Session metrics only | Basil | Tested | — |
| **Low** | Footer / TopBar / LayoutShell | Cosmetic only | Basil | None | — |
