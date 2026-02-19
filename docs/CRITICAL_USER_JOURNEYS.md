# Critical User Journeys

> Auto-generated from codebase analysis — 2026-02-18

---

## Journey 1: Sign Up with Privacy Consent

**Description:** New user creates an account after accepting privacy policy.

**Preconditions:** User is not authenticated; privacy consent banner is showing.

**Steps:**
1. User visits the site
2. Privacy consent banner appears
3. User clicks "Accept" on consent banner
4. User navigates to sign-up form
5. User enters email and password
6. User submits form

**Acceptance Criteria:**
- `assert` consent accepted flag is stored in localStorage
- `assert` Supabase `auth.signUp()` called with email/password
- `assert` user is redirected to hub after verification
- `assert` profile row created in `profiles` table

**Automation Level:** E2E (Phase 4)
**Current Status:** Not tested

---

## Journey 2: Sign In

**Description:** Existing user signs into their account.

**Preconditions:** User has an account.

**Steps:**
1. User navigates to sign-in form
2. User enters email and password
3. User submits form

**Acceptance Criteria:**
- `assert` Supabase `auth.signInWithPassword()` called
- `assert` session is established (useSession returns user)
- `assert` user is redirected to hub

**Automation Level:** E2E (Phase 4)
**Current Status:** Not tested

---

## Journey 3: Launch Game (Local Mode)

**Description:** User starts a game in local/offline mode.

**Preconditions:** User is on the hub page; at least one game is active.

**Steps:**
1. User clicks a game card
2. Game mode selector appears (if applicable)
3. User selects local mode
4. Game loads in iframe or navigates to game page

**Acceptance Criteria:**
- `assert` gameLauncher.ts resolves correct game URL
- `assert` game page/iframe loads without JS errors
- `assert` game board is rendered and interactive

**Automation Level:** E2E (Phase 4)
**Current Status:** Not tested

---

## Journey 4: Launch Game (Online Mode)

**Description:** User starts an online multiplayer game.

**Preconditions:** User is authenticated; game server is running.

**Steps:**
1. User clicks game card
2. User selects online mode
3. Client calls POST /api/online/rooms
4. Room is created, user gets room code
5. Game page loads with WebSocket connection

**Acceptance Criteria:**
- `assert` POST /api/online/rooms returns 200 with roomCode
- `assert` WebSocket connection established
- `assert` room appears in server state

**Automation Level:** E2E (Phase 4) + Contract (Phase 3)
**Current Status:** Not tested

---

## Journey 5: Play Elam Turn (AI Responds)

**Description:** Human player makes a move, AI opponent responds.

**Preconditions:** Game is in play phase; it is the human player's turn.

**Steps:**
1. Human selects a piece
2. Human clicks a legal target square
3. Move is applied via engine.applyAction
4. Turn advances to AI player
5. AI calls chooseBotAction and applies result
6. Board updates, turn returns to human

**Acceptance Criteria:**
- `assert` engine.applyAction returns `{ ok: true }`
- `assert` turn index increments
- `assert` AI action is from enumerateLegalActions set
- `assert` board state is valid after AI move

**Automation Level:** Unit (Phase 3) + Simulation (Phase 5)
**Current Status:** Not tested

---

## Journey 6: Submit Anonymous Feedback

**Description:** User submits feedback from the game client.

**Preconditions:** User is in a game; feedback form is available.

**Steps:**
1. User opens feedback panel
2. User types feedback text
3. User submits
4. Client sends POST to feedback-ingest edge function
5. Feedback stored in database

**Acceptance Criteria:**
- `assert` POST body includes feedback_text and clientFeedbackId
- `assert` response is 201 with receipt shape
- `assert` feedback row created in feedback table

**Automation Level:** Contract (Phase 3)
**Current Status:** Not tested

---

## Journey 7: Admin — Publish/Unpublish Post

**Description:** Admin user publishes or unpublishes a What's New post.

**Preconditions:** User is admin; posts exist in draft/published state.

**Steps:**
1. Admin navigates to admin panel
2. Admin opens Posts tab
3. Admin clicks publish/unpublish on a post
4. Admin-command edge function called with posts.set_published

**Acceptance Criteria:**
- `assert` admin-command called with `{ name: "posts.set_published", args: { id, published } }`
- `assert` response `{ ok: true }`
- `assert` post status updated in UI

**Automation Level:** E2E (Phase 4) + Contract (Phase 3)
**Current Status:** Not tested

---

## Journey 8: Admin — Review Feedback

**Description:** Admin reviews and updates feedback status.

**Preconditions:** User is admin; feedback entries exist.

**Steps:**
1. Admin navigates to admin panel
2. Admin opens Feedback tab
3. Admin selects a feedback entry
4. Admin changes status (reviewed/resolved/dismissed)

**Acceptance Criteria:**
- `assert` admin-command called with `{ name: "feedback.update_status", args: { id, status } }`
- `assert` response `{ ok: true }`
- `assert` badge/status updates in UI

**Automation Level:** E2E (Phase 4) + Contract (Phase 3)
**Current Status:** Not tested

---

## Journey 9: Admin — Manage Game Lineup

**Description:** Admin changes the active game rotation.

**Preconditions:** User is admin; games exist with various statuses.

**Steps:**
1. Admin opens Games tab
2. Admin modifies active lineup
3. Admin saves via games.set_active_lineup command

**Acceptance Criteria:**
- `assert` admin-command called with `{ name: "games.set_active_lineup", args: { ids } }`
- `assert` response `{ ok: true }`
- `assert` game carousel reflects new lineup

**Automation Level:** E2E (Phase 4) + Contract (Phase 3)
**Current Status:** Not tested

---

## Journey 10: What's New Feed Renders Published Posts

**Description:** Published posts appear in the What's New section on the hub.

**Preconditions:** At least one post is published.

**Steps:**
1. User visits the hub
2. What's New section loads
3. Published posts are displayed

**Acceptance Criteria:**
- `assert` postsFeedApi.getPublishedPosts returns published posts
- `assert` WhatsNew component renders post titles
- `assert` unpublished posts are not shown

**Automation Level:** E2E (Phase 4)
**Current Status:** Not tested

---

## Journey 11: Privacy Consent Banner — Accept/Decline Persists

**Description:** User's privacy consent choice persists across sessions.

**Preconditions:** User has not previously set consent.

**Steps:**
1. User visits the site
2. Consent banner appears
3. User clicks Accept (or Decline)
4. User refreshes page
5. Banner does not reappear (or reappears if declined)

**Acceptance Criteria:**
- `assert` consent state stored in localStorage
- `assert` consent.ts reads persisted value
- `assert` ConsentBanner not rendered when accepted

**Automation Level:** E2E (Phase 4) + Unit (existing)
**Current Status:** Partially tested (consent.ts has unit tests)

---

## Journey 12: Game Win Detection

**Description:** A player wins and the game ends correctly.

**Preconditions:** Game is in play phase; a player carries the flag to the opposite edge.

**Steps:**
1. Player moves flag carrier to opposite home row
2. Engine detects win condition
3. Game state set to gameOver=true, winner set
4. Win modal/message displayed

**Acceptance Criteria:**
- `assert` engine.applyAction sets state.gameOver = true
- `assert` state.winnerSeat matches the winning player
- `assert` enumerateLegalActions returns empty array after game over
- `assert` no further actions accepted

**Automation Level:** Unit (Phase 3) + Simulation (Phase 5)
**Current Status:** Not tested
