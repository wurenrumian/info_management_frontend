# Profile Home Cross-Platform Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a usable personal home page that works with existing backend APIs first, while documenting missing APIs for future backend implementation.

**Architecture:** Keep page rendering independent from backend response details by introducing a `ProfileHomeViewModel` and a profile aggregation service. Split cross-platform navigation shell from shared profile content so mini program uses bottom navigation and H5 uses left sidebar without duplicating business logic.

**Tech Stack:** uni-app (Vue3 + TypeScript), Pinia, existing `src/services/*`, SCSS tokens/mixins.

---

## Chunk 1: API Compatibility Baseline

### Task 1: Align existing API constants with documented backend routes

**Files:**
- Modify: `src/constants/api.ts`
- Modify: `src/services/auth.ts`
- Test: `src/services/auth.ts` (type safety verification through project type-check)

- [ ] **Step 1: Write a failing compatibility checklist in plan notes**

Create a temporary checklist in your working notes (not committed) marking these expected routes as the target:
- `GET /api/v1/me`
- `POST /api/v1/wechat/bind`
- `GET /api/v1/approvals/me`

Expected: At least one mismatch with current frontend constants is identified.

- [ ] **Step 2: Run type-check to capture baseline**

Run: `npm run type-check`
Expected: Passes before API path changes (baseline confidence).

- [ ] **Step 3: Update API constants to backend-first paths**

In `src/constants/api.ts`, set backend-first canonical constants used by new profile flow:
- user info uses `/api/v1/me`
- bind uses `/api/v1/wechat/bind`
- keep legacy fallback constants if needed for compatibility service fallback

- [ ] **Step 4: Update auth service imports and calls minimally**

In `src/services/auth.ts`, keep function names stable, but call updated constants. Do not change call signatures.

- [ ] **Step 5: Re-run type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 6: Commit API baseline changes**

```bash
git add src/constants/api.ts src/services/auth.ts
git commit -m "refactor: align auth endpoints with backend docs"
```


### Task 2: Add approvals compatibility helper for profile usage

**Files:**
- Modify: `src/constants/api.ts`
- Modify: `src/services/approvals.ts`
- Create: `src/types/profile.ts`

- [ ] **Step 1: Add the approvals/me constant**

Add a dedicated constant (for example `API_APPROVAL_ME_LIST`) mapped to `/api/v1/approvals/me`.

- [ ] **Step 2: Add a new service function for my approvals**

In `src/services/approvals.ts`, add `getMyApprovalList(...)` using the new constant.

- [ ] **Step 3: Create minimal profile types shell (failing use-site)**

Create `src/types/profile.ts` with placeholder exported types used by upcoming `profile` service.

- [ ] **Step 4: Re-run type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 5: Commit approvals compatibility updates**

```bash
git add src/constants/api.ts src/services/approvals.ts src/types/profile.ts
git commit -m "feat: add approvals me endpoint support for profile"
```

---

## Chunk 2: Profile Aggregation and API Gap Documentation

### Task 3: Implement profile aggregation service with fallback and resilience

**Files:**
- Create: `src/services/profile.ts`
- Modify: `src/services/auth.ts`
- Modify: `src/types/profile.ts`
- Test: `src/services/profile.ts` (validated by type-check and manual runtime assertions)

- [ ] **Step 1: Define final `ProfileHomeViewModel` types**

In `src/types/profile.ts`, define:
- `ProfileBasicInfo`
- `ProfileAccountStatus`
- `ProfileQuickEntry`
- `ProfileExt`
- `ProfileHomeViewModel`

- [ ] **Step 2: Add user info fallback function if needed**

If `getUserInfo` currently points to a single endpoint, add an internal fallback variant for legacy path compatibility (primary `/me`, fallback legacy path).

- [ ] **Step 3: Implement `getProfileHomeViewModel()`**

In `src/services/profile.ts`, implement:
- parallel fetch for base info + enhancement modules
- hard-fail only when base info fails
- soft-fail enhancement modules and emit empty/default values

- [ ] **Step 4: Add small mapping helpers**

Add focused mapper functions in `src/services/profile.ts` to convert backend payloads into `ProfileHomeViewModel` fields.

- [ ] **Step 5: Run type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 6: Commit profile aggregation service**

```bash
git add src/services/profile.ts src/services/auth.ts src/types/profile.ts
git commit -m "feat: add profile home aggregation service with fallbacks"
```


### Task 4: Create backend required API gap directory and first document

**Files:**
- Create: `docs/api-gaps/backend-required-apis.md`
- Modify: `README.md`

- [ ] **Step 1: Create API gap document with fixed sections**

Create `docs/api-gaps/backend-required-apis.md` with sections:
- Background
- Existing reusable backend APIs
- Missing APIs
- Request/response conventions
- Priority and milestone

- [ ] **Step 2: Add first four gap entries**

Include:
- `GET /api/v1/profile/home` (P1)
- `PATCH /api/v1/me` (P1)
- `GET /api/v1/approvals/me/summary` (P2)
- `GET /api/v1/notifications/unread/count` (P2)

Each entry includes purpose, request, response example, auth, fallback.

- [ ] **Step 3: Link the new doc in README**

In `README.md`, add a docs bullet linking to `docs/api-gaps/backend-required-apis.md`.

- [ ] **Step 4: Validate formatting and type-check**

Run: `npm run type-check`
Expected: PASS (docs-only changes should not affect TS types).

- [ ] **Step 5: Commit API gap docs**

```bash
git add docs/api-gaps/backend-required-apis.md README.md
git commit -m "docs: add backend api gap tracking for profile home"
```

---

## Chunk 3: Cross-Platform Profile UI

### Task 5: Build profile page content using view model only

**Files:**
- Create: `src/pages/profile/index.vue`
- Modify: `src/pages.json`
- Test: `src/pages/profile/index.vue` (runtime verification in H5 and mini program)

- [ ] **Step 1: Add new profile page route**

In `src/pages.json`, register `pages/profile/index` with title `个人主页`.

- [ ] **Step 2: Write page scaffold with explicit loading/error/content states**

In `src/pages/profile/index.vue`, build three states:
- loading skeleton
- retryable error for base info failure
- content rendering using `ProfileHomeViewModel`

- [ ] **Step 3: Add four required modules in content layout**

Render modules:
- basic info
- account status
- quick entries
- profile extension placeholders

- [ ] **Step 4: Wire data fetching from `getProfileHomeViewModel()`**

Use `onLoad`/`onShow` lifecycle with idempotent refresh behavior.

- [ ] **Step 5: Run type-check and H5 build**

Run: `npm run type-check && npm run build:h5`
Expected: PASS.

- [ ] **Step 6: Commit profile page**

```bash
git add src/pages/profile/index.vue src/pages.json
git commit -m "feat: add profile home page with resilient data states"
```


### Task 6: Add platform-specific navigation shell behavior

**Files:**
- Modify: `src/pages/home/index.vue`
- Modify: `src/utils/platform.ts`
- Modify: `src/pages/profile/index.vue`
- Modify: `src/pages.json`

- [ ] **Step 1: Add/adjust platform helpers if required**

In `src/utils/platform.ts`, ensure helpers are safe in both H5 and mini program runtime.

- [ ] **Step 2: Implement mini program bottom navigation path**

Use uni-app tab/navigation configuration in `src/pages.json` for mini program bottom navigation behavior.

- [ ] **Step 3: Implement H5 left sidebar shell**

In `src/pages/home/index.vue` (or a lightweight shell section), add a left navigation container for H5 and route links to Home/Profile.

- [ ] **Step 4: Keep content area shared and responsive**

Ensure profile page content remains shared while shell changes by platform.

- [ ] **Step 5: Verify dual-platform behavior manually**

Run:
- `npm run dev:h5` and verify left sidebar layout
- `npm run dev:mp-weixin` and verify bottom navigation layout

Expected: navigation style differs by platform, page content consistent.

- [ ] **Step 6: Final verification and commit**

Run: `npm run type-check && npm run build:h5`
Expected: PASS.

```bash
git add src/utils/platform.ts src/pages/home/index.vue src/pages/profile/index.vue src/pages.json
git commit -m "feat: support h5 sidebar and mini-program bottom nav for profile"
```

---

## Chunk 4: Final Verification and Handoff

### Task 7: End-to-end verification and release notes

**Files:**
- Modify: `docs/superpowers/specs/2026-04-02-profile-home-cross-platform-design.md` (optional final notes)
- Create: `docs/superpowers/checklists/profile-home-acceptance.md`

- [ ] **Step 1: Create acceptance checklist document**

Add checks for:
- base info success path
- enhancement module failure path
- platform navigation behavior
- API gap doc completeness

- [ ] **Step 2: Execute verification commands**

Run: `npm run type-check && npm run build:h5`
Expected: PASS.

- [ ] **Step 3: Run targeted manual checks**

Verify:
- profile page renders with existing backend token
- fallback behavior appears when enhancement API fails
- no raw backend fields leaked to template

- [ ] **Step 4: Commit checklist and notes**

```bash
git add docs/superpowers/checklists/profile-home-acceptance.md docs/superpowers/specs/2026-04-02-profile-home-cross-platform-design.md
git commit -m "docs: add profile home acceptance checklist"
```
