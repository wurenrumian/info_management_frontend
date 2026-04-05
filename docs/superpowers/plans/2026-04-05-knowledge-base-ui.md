# Knowledge Base UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a unified knowledge base tab with student search/detail and role-gated admin CRUD/import pages, aligned with backend phase2 knowledge APIs.

**Architecture:** Add a new `knowledge` subpackage and route tree, then expand shared navigation config to include an additive `knowledge` tab for both H5 sidebar and mini-program bottom nav. Keep service-first API integration (`constants -> types -> services -> pages`), with multipart import implemented through `uni.uploadFile` in the knowledge service. Use type-check/build/manual flow verification as TDD surrogate in this uni-app project.

**Tech Stack:** uni-app (Vue3 + TypeScript), Pinia, existing request wrapper, `uni.uploadFile`, pages/subpackages routing.

---

## File Map

- Modify: `src/components/layout-shell.vue` — navigation model expands from 2 tabs to extensible tab set including knowledge
- Modify: `src/pages.json` — register `knowledge` subpackage pages
- Modify: `src/constants/api.ts` — add admin knowledge API constants
- Modify: `src/types/knowledge.ts` — define student/admin DTOs and payload types aligned with backend
- Modify: `src/services/knowledge.ts` — add admin CRUD/import service methods and request mapping (`q`/`query`)
- Modify: `src/services/profile.ts` — migrate existing knowledge quick-count caller to non-breaking method
- Create: `src/subpackages/knowledge/index.vue` — unified entry (student search + admin entry card)
- Create: `src/subpackages/knowledge/detail.vue` — knowledge detail page
- Create: `src/subpackages/knowledge/admin/index.vue` — admin list page
- Create: `src/subpackages/knowledge/admin/detail.vue` — admin detail page
- Create: `src/subpackages/knowledge/admin/form.vue` — admin create/edit shared form
- Create: `src/subpackages/knowledge/admin/import.vue` — admin import page (multipart)

## Chunk 1: API contracts and service layer

### Task 1: Add knowledge API constants

**Files:**
- Modify: `src/constants/api.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: Define target constants in failing-usage terms**

Add:

```ts
export const API_ADMIN_KNOWLEDGE_LIST = '/api/v1/admin/knowledge'
export const API_ADMIN_KNOWLEDGE_DETAIL = '/api/v1/admin/knowledge'
export const API_ADMIN_KNOWLEDGE_IMPORT = '/api/v1/admin/knowledge/import'
```

- [ ] **Step 2: Run baseline type check**

Run: `pnpm type-check`  
Expected: PASS (baseline).

- [ ] **Step 3: Implement constants**

Keep naming aligned with existing `API_*` style.

- [ ] **Step 4: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.


### Task 2: Extend knowledge types for student/admin flows

**Files:**
- Modify: `src/types/knowledge.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: Define target interfaces**

```ts
export interface KnowledgeAttachment { title: string; url: string }
export interface KnowledgeItem { ...updated_by, created_at, updated_at }
export interface KnowledgeSearchParams { q: string; limit: number; offset: number }
export interface AdminKnowledgeListParams { query?: string; limit: number; offset: number }
export interface UpsertKnowledgePayload { question: string; answer: string; keywords?: string[]; attachments?: KnowledgeAttachment[] }
export interface PatchKnowledgePayload extends Partial<UpsertKnowledgePayload> {}
```

- [ ] **Step 2: Add minimal type definitions**

Keep backward-safe shape where needed, but make service usage backend-first.

- [ ] **Step 3: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.


### Task 3: Implement admin knowledge services and multipart import

**Files:**
- Modify: `src/services/knowledge.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: Add target method signatures**

```ts
getAdminKnowledgeList(params)
getAdminKnowledgeDetail(id)
createKnowledge(payload)
patchKnowledge(id, payload)
deleteKnowledge(id)
importKnowledge(form)
```

- [ ] **Step 2: Implement student request mapping**

Map UI input to backend params:
- student search uses `q`
- admin list uses `query`

- [ ] **Step 3: Implement list-response compatibility strategy**

For knowledge list/search/admin-list endpoints, support both response shapes:
- shape A: `{ data: { data: T[], total: number } }` (legacy wrapper style)
- shape B: `{ data: T[], total: number }` (phase2 docs style)

Implementation rule:
- keep global `request.ts` unchanged
- add knowledge-service-local parsing helper to normalize into `ListResponse<T>`

- [ ] **Step 4: Implement admin CRUD detail/create/patch/delete methods**

Use existing `request` wrapper for non-list endpoints and standard auth/error behavior.

- [ ] **Step 5: Implement multipart import via `uni.uploadFile`**

Requirements:
- set `Authorization` header
- send `question/answer/keywords` as form data
- append multi-files field `files`
- parse text response into `{ data }` / `{ error }`
- normalize non-JSON or non-2xx response into friendly `Error` message

- [ ] **Step 6: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.


### Task 4: Migrate existing profile quick-count dependency

**Files:**
- Modify: `src/services/profile.ts`
- Modify: `src/services/knowledge.ts`
- Test: `pnpm type-check`

- [ ] **Step 1: Add non-breaking knowledge count method**

Add/retain a method usable without required `q` in profile fallback quick-entry path (for example, list endpoint-based count fetch).

- [ ] **Step 2: Update profile fallback call site**

Replace direct `searchKnowledge({ limit, offset })` usage with the non-breaking method so profile page remains functional after `q` alignment.

- [ ] **Step 3: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.

## Chunk 2: Routing and shared navigation

### Task 5: Register knowledge subpackage routes

**Files:**
- Modify: `src/pages.json`
- Test: `pnpm type-check`

- [ ] **Step 1: Add subpackage root and page entries**

Target pages:
- `subpackages/knowledge/index`
- `subpackages/knowledge/detail`
- `subpackages/knowledge/admin/index`
- `subpackages/knowledge/admin/detail`
- `subpackages/knowledge/admin/form`
- `subpackages/knowledge/admin/import`

- [ ] **Step 2: Verify path naming and titles**

Use concise Chinese titles; keep consistent with existing pages naming.

- [ ] **Step 3: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.


### Task 6: Expand `layout-shell` navigation to extensible tab set

**Files:**
- Modify: `src/components/layout-shell.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Extend `NavKey` and nav config**

Add `knowledge` key and route `/subpackages/knowledge/index`.

- [ ] **Step 2: Keep H5 sidebar + mini-program bottom-nav parity**

Ensure both render from same `navItems` list.

- [ ] **Step 3: Ensure current-page guard still works**

Keep `goTo` no-op when already on current route.

- [ ] **Step 4: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.

## Chunk 3: Student-facing knowledge pages

### Task 7: Implement unified knowledge entry page

**Files:**
- Create: `src/subpackages/knowledge/index.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Scaffold page with `layout-shell current="knowledge"`**

States:
- loading
- empty
- error
- list

- [ ] **Step 2: Add student search UI and request mapping**

Input model `keyword`; submit maps to `q`.

- [ ] **Step 3: Add list rendering and detail navigation**

Tap item -> `/subpackages/knowledge/detail?id=<id>`.

- [ ] **Step 4: Add role-gated admin entry card**

Show only when `role >= 2`; button to `/subpackages/knowledge/admin/index`.

- [ ] **Step 5: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.


### Task 8: Implement knowledge detail page

**Files:**
- Create: `src/subpackages/knowledge/detail.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Read route param `id` and load detail**

Call `getKnowledgeDetail(id)`.

- [ ] **Step 2: Render question/answer/keywords/attachments**

Attachment behavior:
- with `url`: clickable open/download
- without `url`: show non-clickable badge text

- [ ] **Step 3: Add loading/error/fallback states**

Invalid id or not found should display clear message.

- [ ] **Step 4: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.

## Chunk 4: Admin knowledge pages

### Task 9: Implement admin list page

**Files:**
- Create: `src/subpackages/knowledge/admin/index.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Add role guard on page enter**

If `role < 2`, show no-permission state and stop requests.

- [ ] **Step 2: Add query + paged list**

Rules:
- new search resets `offset = 0`
- keep query across paging

- [ ] **Step 3: Add row actions**

Actions:
- detail
- edit
- delete (confirm)

- [ ] **Step 4: Add create/import shortcuts**

Navigate to form/import pages.

- [ ] **Step 5: Add delete-last-item edge behavior**

If deleting last item on non-first page, decrement page and refresh list.

- [ ] **Step 6: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.


### Task 10: Implement admin detail page

**Files:**
- Create: `src/subpackages/knowledge/admin/detail.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Load item by id with guard**
- [ ] **Step 2: Render exact fields for audit and verification**

Render:
- `question`
- `answer`
- `keywords`
- `attachments`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- [ ] **Step 3: Add quick jump to edit page**
- [ ] **Step 4: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.


### Task 11: Implement admin create/edit form page

**Files:**
- Create: `src/subpackages/knowledge/admin/form.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Implement create/edit mode detection by query `id`**

`id` present -> edit mode; absent -> create mode.

- [ ] **Step 2: Build form fields and validation**

Validation:
- question required, max 200
- answer required, max 5000
- keywords max 20 entries
- attachments max 10, valid url

- [ ] **Step 3: Map keywords input and attachment rows**

Comma string <-> string[] mapping.

Normalization rules:
- trim each keyword
- drop empty values
- de-duplicate keywords

- [ ] **Step 4: Submit via create/patch service and return list**

On success show toast and `navigateBack`/redirect.

- [ ] **Step 5: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.


### Task 12: Implement admin import page

**Files:**
- Create: `src/subpackages/knowledge/admin/import.vue`
- Test: `pnpm type-check`

- [ ] **Step 1: Build import form and role guard**

Fields: `question`, `answer`, `keywords`, files list.

- [ ] **Step 2: Add file picker and client-side precheck**

Allow: `pdf/doc/docx/xls/xlsx`; max total 30MB; show filenames before upload.

- [ ] **Step 3: Submit multipart import and handle API errors**

Map backend messages (`missing files`, `unsupported file type`, etc.) to UI.

- [ ] **Step 4: On success, redirect to admin list and refresh**
- [ ] **Step 5: Re-run type check**

Run: `pnpm type-check`  
Expected: PASS.

## Chunk 5: Verification and acceptance

### Task 13: Run project verification commands

**Files:**
- Modify: none
- Test: CLI verification

- [ ] **Step 1: Lint**

Run: `pnpm lint`  
Expected: PASS with no new lint issues.

- [ ] **Step 2: Type check**

Run: `pnpm type-check`  
Expected: PASS.

- [ ] **Step 3: Build H5**

Run: `pnpm build:h5`  
Expected: PASS.

- [ ] **Step 4: Build MP Weixin**

Run: `pnpm build:mp-weixin`  
Expected: PASS.


### Task 14: Manual acceptance checklist

**Files:**
- Modify: none
- Test: manual flow

- [ ] **Step 1: Student flow**

1. Open `知识库` tab
2. Search with keyword and verify results
3. Open detail and verify attachments

- [ ] **Step 2: Admin flow**

1. Open unified entry and use admin entry card
2. Verify list/detail/create/edit/delete
3. Verify import with allowed file type

- [ ] **Step 3: Permission flow**

1. Use student role to open admin route directly
2. Verify no-permission UI and no write action available

- [ ] **Step 4: Navigation parity**

Verify `知识库` tab appears and navigates correctly on both H5 sidebar and mini-program bottom nav.

- [ ] **Step 5: Request-parameter mapping verification**

Using devtools network panel, verify:
- student search sends `q`
- admin list sends `query`
