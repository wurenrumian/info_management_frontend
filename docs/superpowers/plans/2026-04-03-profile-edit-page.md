# Profile Edit Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split profile editing out of the current profile home page into a dedicated edit page, aligned with Phase1 backend profile APIs.

**Architecture:** Keep `pages/profile/index` focused on display and navigation, then move editable concerns into `pages/profile/edit`. Add profile-focused service methods for `GET/PATCH /api/v1/me`, plus typed payloads to keep page logic thin. Use type-check-driven red/green loops and page-level manual verification as the TDD surrogate in this uni-app project.

**Tech Stack:** uni-app (Vue3 + TypeScript), Pinia, existing `request`/service layer, uni file upload API.

---

## File Map

- Create: `src/pages/profile/edit.vue` — profile edit form page (fields, upload, submit)
- Modify: `src/pages/profile/index.vue` — keep display-only + add navigation to edit page
- Modify: `src/pages.json` — register `pages/profile/edit`
- Modify: `src/services/profile.ts` — add editable info fetch/update service methods
- Modify: `src/types/profile.ts` — add edit payload and editable response types
- Modify: `src/types/user.ts` — align with backend fields (`real_name`, `nickname`, `college`, `enrollment_year`, `bio`, `avatar_url`)

## Chunk 1: Service and type contracts

### Task 1: Add profile edit types

**Files:**
- Modify: `src/types/profile.ts`
- Modify: `src/types/user.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: Write failing type usage target**

Define the target interfaces to be consumed by page/service:

```ts
export interface ProfileEditableInfo { ... }
export interface UpdateProfilePayload { ... }
```

- [ ] **Step 2: Run type check to capture baseline**

Run: `pnpm type-check`
Expected: PASS before new usage is introduced (baseline safety).

- [ ] **Step 3: Add minimal type definitions**

Add optional backend-aligned fields in `UserInfo` and dedicated profile edit interfaces in `types/profile.ts`.

- [ ] **Step 4: Re-run type check**

Run: `pnpm type-check`
Expected: PASS.


### Task 2: Add profile edit service methods

**Files:**
- Modify: `src/services/profile.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: Write failing usage expectation in plan context**

Target methods:

```ts
getProfileEditableInfo(): Promise<ProfileEditableInfo>
updateProfile(payload: UpdateProfilePayload): Promise<ProfileEditableInfo>
```

- [ ] **Step 2: Implement minimal service wrappers**

Use existing `request` wrapper and `API_AUTH_USER_INFO` + `API_PROFILE_UPDATE` constants.

- [ ] **Step 3: Run type check**

Run: `pnpm type-check`
Expected: PASS.

## Chunk 2: New profile edit page

### Task 3: Register route and scaffold page

**Files:**
- Modify: `src/pages.json`
- Create: `src/pages/profile/edit.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Add `pages/profile/edit` route**

Title: `编辑资料`.

- [ ] **Step 2: Create page scaffold with loading/error/form states**

Initial form fields:
- nickname
- real_name (readonly)
- major
- college
- enrollment_year
- bio
- avatar_url

- [ ] **Step 3: Wire initial fetch from `getProfileEditableInfo()`**

On mounted, load form defaults from `/me`.

- [ ] **Step 4: Run type check**

Run: `pnpm type-check`
Expected: PASS.


### Task 4: Add validation, upload, and submit flow

**Files:**
- Modify: `src/pages/profile/edit.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Add local validators**

Rules:
- nickname length 1-20 (trimmed, optional)
- bio length <= 100
- enrollment year in [2000, currentYear + 1]

- [ ] **Step 2: Add avatar picker + upload action**

Use `uni.chooseImage` then existing `uploadFile` service; map upload result into `avatar_url`.

- [ ] **Step 3: Add dirty-check and submit**

Submit only changed fields to `updateProfile(payload)`; show toast on success/failure.

- [ ] **Step 4: Save-and-back behavior**

After success, navigate back to profile home (`uni.navigateBack` or fallback redirect).

- [ ] **Step 5: Run type check**

Run: `pnpm type-check`
Expected: PASS.

## Chunk 3: Profile home simplification

### Task 5: Add entry and reduce non-core controls

**Files:**
- Modify: `src/pages/profile/index.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Add display name and profile rows aligned with new fields**

Display rule: `nickname || real_name || name`.

- [ ] **Step 2: Add “编辑资料” button**

Navigate to `pages/profile/edit`.

- [ ] **Step 3: Keep existing page stable while de-emphasizing dev-only clutter**

Retain needed existing logic but keep primary content readable and user-facing.

- [ ] **Step 4: Run type check**

Run: `pnpm type-check`
Expected: PASS.

## Chunk 4: Verification

### Task 6: Project verification and manual flow

**Files:**
- Modify: none (verification)
- Test: CLI scripts + manual profile flow

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: PASS with no new lint errors.

- [ ] **Step 2: Type check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Build H5**

Run: `pnpm build:h5`
Expected: Build succeeds.

- [ ] **Step 4: Build MP Weixin**

Run: `pnpm build:mp-weixin`
Expected: Build succeeds.

- [ ] **Step 5: Manual acceptance**

Flow:
1. Open profile home and click edit
2. Edit nickname/major/college/year/bio and save
3. Upload avatar and save
4. Return to home and confirm new values render
5. Try invalid year and verify error toast
