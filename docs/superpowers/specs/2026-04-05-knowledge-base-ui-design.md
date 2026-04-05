# Knowledge Base UI Design

Date: 2026-04-05
Scope: Frontend (uni-app + Vue3) knowledge base student/admin UI.

Backend contract source used for this spec:

- `https://raw.githubusercontent.com/wurenrumian/info_management/main/docs/api/phase2-knowledge-api.md`
- This spec treats that URL content as the contract snapshot for implementation.

## 1. Goals

- Add a scalable knowledge base module with a unified entry for all users.
- Keep student search/read flow simple and fast.
- Expose complete admin operations (list/detail/create/edit/delete/import) for `role >= 2`.
- Keep navigation extensible for future modules (additive tab config, not fixed-tab assumption).

## 2. Information Architecture

Unified entry and role-based capability:

- Navigation adds one new tab: `知识库` (H5 sidebar + mini-program bottom nav both updated via `layout-shell` config).
- All users open the same knowledge home page from that tab.
- Admin users see an extra "管理入口" area on the same page.
- Non-admin users do not see admin actions.

Page map:

- `src/subpackages/knowledge/index.vue` (student-first unified entry)
- `src/subpackages/knowledge/detail.vue` (knowledge detail)
- `src/subpackages/knowledge/admin/index.vue` (admin list)
- `src/subpackages/knowledge/admin/detail.vue` (admin detail)
- `src/subpackages/knowledge/admin/form.vue` (create/edit shared form)
- `src/subpackages/knowledge/admin/import.vue` (multipart import)

## 3. Route and Navigation Design

- Register `knowledge` as a subpackage in `src/pages.json`.
- Extend navigation config in `src/components/layout-shell.vue` from static 2-item shape to extensible config list and include knowledge tab.
- Keep current behavior (`uni.reLaunch`) and active state by `current` key.

Route registration target:

- subpackage root: `subpackages/knowledge`
- pages: `index`, `detail`, `admin/index`, `admin/detail`, `admin/form`, `admin/import`
- tab target path: `/subpackages/knowledge/index`

## 4. API Alignment

Response envelope (all endpoints):

- Success: `{ "data": ... }`
- List success: `{ "data": T[], "total": number }`
- Error: `{ "error": string }`

Student APIs:

- `GET /api/v1/knowledge/search?q=&limit=&offset=`
- `GET /api/v1/knowledge/:id`

Student search params and defaults:

- `q` required by backend (empty input on UI does not request)
- default `limit = 20`, `offset = 0`

Student list item shape:

- `id: number`
- `question: string`
- `answer: string`
- `keywords: string[]`
- `attachments: Array<{ title: string; url: string }>`
- `created_by: number`
- `updated_by: number`
- `created_at: string`
- `updated_at: string`

Admin APIs:

- `GET /api/v1/admin/knowledge?query=&limit=&offset=`
- `GET /api/v1/admin/knowledge/:id`
- `POST /api/v1/admin/knowledge`
- `PATCH /api/v1/admin/knowledge/:id`
- `DELETE /api/v1/admin/knowledge/:id`
- `POST /api/v1/admin/knowledge/import` (multipart)

Admin endpoint response contracts:

- `GET /admin/knowledge` -> `{ data: KnowledgeItem[], total: number }`
- `GET /admin/knowledge/:id` -> `{ data: KnowledgeItem }`
- `POST /admin/knowledge` -> `{ data: KnowledgeItem }`
- `PATCH /admin/knowledge/:id` -> `{ data: { updated: true } }`
- `DELETE /admin/knowledge/:id` -> `{ data: { deleted: true } }`
- `POST /admin/knowledge/import` -> `{ data: KnowledgeItem }` (created/imported entry)

Admin list params and defaults:

- `query` optional
- default `limit = 20`, `offset = 0`

Admin create payload:

- `question: string` (required)
- `answer: string` (required)
- `keywords: string[]` (optional)
- `attachments: Array<{ title: string; url: string }>` (optional)

Admin patch payload:

- Partial update, at least one field required

Admin import multipart fields:

- `question` required
- `answer` required
- `keywords` optional, comma-separated string
- `files` required, multi-file

Import file constraints (from backend docs):

- supported: `pdf`, `doc`, `docx`, `xls`, `xlsx`
- size limit follows backend file constraints (currently 30MB)

Frontend contracts:

- `src/constants/api.ts`: add admin knowledge constants.
- `src/types/knowledge.ts`: split/extend DTOs for student search, admin list, create/patch payload, attachments.
- `src/services/knowledge.ts`: add full admin service methods and multipart import helper.

Multipart transport strategy:

- Add `uploadKnowledgeImport(form)` in `src/services/knowledge.ts` using `uni.uploadFile`.
- Inject `Authorization: Bearer <token>` from storage.
- Parse backend envelope from `uploadFile` response text (`{ data }` / `{ error }`).
- Normalize thrown errors to match `request.ts` behavior for page-level handling.

Compatibility migration note:

- Existing frontend attachment type (`file_id + title`) is replaced by knowledge contract (`title + url`) for this module.
- If historical data still returns `file_id`, frontend shows `title` with "暂不可直接下载" badge; when `url` exists, show clickable link.

## 5. UI/Interaction Design

Student knowledge home:

- Search input (UI model `keyword`, request mapped to backend `q`) + trigger button.
- Result list with question/keywords/updated time.
- Tap to detail page.
- Empty result state with guidance text.

Knowledge detail:

- Show `question`, `answer`, `keywords`, attachments.
- Attachment click opens link/file url.

Admin list:

- Query input (UI model `keyword`, request mapped to backend `query`) + search/reset.
- Paged list with entry actions: detail/edit/delete.
- Primary actions: create/import.

Admin form:

- Shared for create/edit.
- Fields: `question`, `answer`, `keywords` (comma-separated input mapped to string array), optional attachments (URL + title pairs).

Field validation constraints:

- `question`: required, max 200 chars
- `answer`: required, max 5000 chars
- `keywords`: optional, max 20 items
- `attachments`: optional, max 10 items, each requires non-empty `title` and valid URL format

Admin import:

- Fields: `question`, `answer`, `keywords` (comma string), `files` (multi-file).
- Use multipart upload; on success return to list and refresh.
- Show selected file names and client-side type precheck before submit.

## 6. Permission and Error Handling

- Client-side role gating by `userStore.userInfo.role`.
- Admin pages perform guard check on load and on deep-link open; role < 2 shows no-permission UI and disables write actions.
- Global 401/403 remains in `request.ts`; page-level message for validation/operation errors.
- Delete requires explicit confirmation.

Knowledge-specific error mapping:

- search: `missing q` -> show "请输入关键词"
- import: `missing files` / `unsupported file type` -> show inline form error
- admin detail/patch/delete: `knowledge not found` -> toast + back to list

## 7. State and Data Rules

- Page-local state for search inputs, table/list, loading, pagination, and form drafts.
- Keep global store unchanged except reading role/user info.
- Normalize keyword parsing: trim, drop empties, de-duplicate.
- Pagination rules: new search resets `offset=0`; page change keeps current query; delete on non-first page with last item refreshes previous page.

## 8. Testing and Verification Targets

- Navigation: knowledge tab visible and routable on H5 + WeChat mini-program.
- Student flow: search -> list -> detail works with backend response shape.
- Admin flow: list/detail/create/edit/delete/import all pass with auth.
- Status UX: loading/empty/error/no-permission states are visible and correct.

## 9. Out of Scope

- Non-knowledge modules.
- Rich text editor or AI answer generation.
- Backend API changes.

## 10. Implementation Decision Summary

- Chosen approach: single module with dual user/admin views and role-based entry.
- Navigation strategy: additive/extensible tabs, not fixed count.
- Entry strategy: unified knowledge tab for all users; admin capability exposed inside knowledge module.
