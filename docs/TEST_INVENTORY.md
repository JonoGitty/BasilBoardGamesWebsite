# Test Inventory

> Auto-generated from codebase scan — 2026-02-18

## BasilBoardGamesWebsite

### Services (8 total, 7 tested)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| adminApi | src/services/adminApi.ts | adminApi.test.ts (yes) | — | — |
| feedbackService | src/services/feedbackService.ts | feedbackService.test.ts (yes) | — | — |
| gameCatalogApi | src/services/gameCatalogApi.ts | gameCatalogApi.test.ts (yes) | — | — |
| gameLauncher | src/services/gameLauncher.ts | **None** | No unit tests | Phase 3 |
| metricsApi | src/services/metricsApi.ts | metricsApi.test.ts (yes) | — | — |
| postsFeedApi | src/services/postsFeedApi.ts | postsFeedApi.test.ts (yes) | — | — |
| profileSync | src/services/profileSync.ts | profileSync.test.ts (yes) | — | — |
| sessionTracker | src/services/sessionTracker.ts | sessionTracker.test.ts (yes) | — | — |

### Components (22 total, 0 tested)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| AboutPage | src/components/AboutPage.tsx | None | No component tests | Phase 4 |
| AccountDrawer | src/components/AccountDrawer.tsx | None | No component tests | Phase 4 |
| AdminFeedbackTab | src/components/AdminFeedbackTab.tsx | None | No component tests | Phase 4 |
| AdminGamesTab | src/components/AdminGamesTab.tsx | None | No component tests | Phase 4 |
| AdminPanel | src/components/AdminPanel.tsx | None | No component tests | Phase 4 |
| AdminPostsTab | src/components/AdminPostsTab.tsx | None | No component tests | Phase 4 |
| AdminSettingsTab | src/components/AdminSettingsTab.tsx | None | No component tests | Phase 4 |
| AuthForm | src/components/AuthForm.tsx | None | Critical — auth flow | Phase 4 |
| ConsentBanner | src/components/ConsentBanner.tsx | None | Privacy compliance | Phase 4 |
| Footer | src/components/Footer.tsx | None | Low priority | — |
| GameCard | src/components/GameCard.tsx | None | No component tests | Phase 4 |
| GameCarousel | src/components/GameCarousel.tsx | None | No component tests | Phase 4 |
| GameLaunch | src/components/GameLaunch.tsx | None | No component tests | Phase 4 |
| GameLauncher | src/components/GameLauncher.tsx | None | Critical — game launch | Phase 4 |
| GameModeSelector | src/components/GameModeSelector.tsx | None | No component tests | Phase 4 |
| LayoutShell | src/components/LayoutShell.tsx | None | Low priority | — |
| MetricsTab | src/components/MetricsTab.tsx | None | Admin-only | — |
| PrivacyPolicy | src/components/PrivacyPolicy.tsx | None | Low priority | — |
| SettingsPanel | src/components/SettingsPanel.tsx | None | No component tests | — |
| TopBar | src/components/TopBar.tsx | None | Low priority | — |
| WhatsNew | src/components/WhatsNew.tsx | None | No component tests | Phase 4 |
| WhatsNewItem | src/components/WhatsNewItem.tsx | None | No component tests | Phase 4 |

### Hooks (11 total, 1 tested)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| useAdmin | src/hooks/useAdmin.ts | useAdmin.test.ts (yes) | — | — |
| useAdminGames | src/hooks/useAdminGames.ts | None | No unit tests | Phase 3 |
| useAdminPosts | src/hooks/useAdminPosts.ts | None | No unit tests | Phase 3 |
| useFeaturedGames | src/hooks/useFeaturedGames.ts | None | No unit tests | Phase 3 |
| useLocalStorage | src/hooks/useLocalStorage.ts | None | No unit tests | Phase 3 |
| useMetrics | src/hooks/useMetrics.ts | None | No unit tests | — |
| useNicknameCheck | src/hooks/useNicknameCheck.ts | None | No unit tests | Phase 3 |
| useProfile | src/hooks/useProfile.ts | None | No unit tests | Phase 3 |
| useSession | src/hooks/useSession.ts | None | No unit tests | Phase 3 |
| useWhatsNewFeed | src/hooks/useWhatsNewFeed.ts | None | No unit tests | Phase 3 |

### Edge Functions (4 total, 0 contract tests)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| admin-command | supabase/functions/admin-command/index.ts | None | No contract tests | Phase 3 |
| feedback-ingest | supabase/functions/feedback-ingest/index.ts | None | No contract tests | Phase 3 |
| events-ingest | supabase/functions/events-ingest/index.ts | None | No contract tests | — |
| rotation-run | supabase/functions/rotation-run/index.ts | None | No contract tests | — |

### Migrations (17 files, 0 schema tests)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| 014_feedback | supabase/migrations/014_feedback.sql | None | Schema contract test | Phase 3 |
| 015_privacy_consent | supabase/migrations/015_privacy_consent.sql | None | Schema contract test | Phase 3 |
| 016_friendly_announcement | supabase/migrations/016_friendly_announcement.sql | None | Schema contract test | Phase 3 |
| 001–013, 017 | Various | None | Lower priority | — |

### Lib (7 files, 3 tested)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| authRedirect | src/lib/authRedirect.ts | authRedirect.test.ts (yes) | — | — |
| consent | src/lib/consent.ts | consent.test.ts (yes) | — | — |
| elamUrl | src/lib/elamUrl.ts | elamUrl.test.ts (yes) | — | — |
| supabase | src/lib/supabase.ts | None | Client init — low priority | — |

### Utils (8 files, 4 tested)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| date | src/utils/date.ts | date.test.ts (yes) | — | — |
| format | src/utils/format.ts | format.test.ts (yes) | — | — |
| nickname | src/utils/nickname.ts | nickname.test.ts (yes) | — | — |
| seededRandom | src/utils/seededRandom.ts | seededRandom.test.ts (yes) | — | — |

### Data (4 files, 2 tested)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| games | src/data/games.ts | games.test.ts (yes) | — | — |
| whatsNew | src/data/whatsNew.ts | whatsNew.test.ts (yes) | — | — |

### Analytics (4 files, 2 tested)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| track | src/analytics/track.ts | track.test.ts (yes) | — | — |
| transport | src/analytics/transport.ts | transport.test.ts (yes) | — | — |
| queue | src/analytics/queue.ts | None | Low priority | — |
| schema | src/analytics/schema.ts | None | Type defs only | — |

---

## Triarch

### Modules (4 major)

| Surface | File | Current Tests | Gap | Phase |
|---------|------|--------------|-----|-------|
| engine.js | online/engine.js (793 lines) | **None** (syntax check only) | 13 exports, 40+ functions, 0 unit tests | Phase 3 |
| server.js | online/server.js (1483 lines) | **None** (syntax check only) | 17 endpoints, 0 contract tests | Phase 3 |
| ai-policy.js | online/ai-policy.js (329 lines) | **None** (syntax check only) | 3 exports, 0 unit tests | Phase 3 |
| main.js | main.js (2829 lines) | 5 Playwright E2E tests | E2E only — no unit tests | Phase 5 |
| db.js | online/db.js | None | Persistence layer | — |
| online-client.js | online-client.js | Syntax check only | Client-side logic | — |

### Summary

| Repo | Tested | Untested | Coverage |
|------|--------|----------|----------|
| BasilBoardGamesWebsite | 19 test files, ~111 tests | 50+ surfaces | ~28% of surfaces |
| Triarch | 5 E2E tests + syntax checks | 4 major modules | ~5% of surfaces |
