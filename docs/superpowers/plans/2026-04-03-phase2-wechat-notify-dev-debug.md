# Phase2 WeChat Notify Dev Debug Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dev-only frontend panel to trigger `/api/v1/dev/login-and-send-subscribe-check` and surface notification send results for rapid WeChat subscription API verification.

**Architecture:** Reuse existing auth layering (`constants -> services -> page`) and keep all debug capability inside `pages/auth/login.vue` under `isDev`. Extend `auth` service with typed request/response contracts, and add a non-redirect auth persistence helper in login page so debug result cards remain visible after successful calls.

**Tech Stack:** uni-app (Vue3 + TypeScript), Pinia, existing `request` service wrapper, SCSS scoped styles.

---

## Chunk 1: API and Types Baseline

### Task 1: Add dev subscribe-check endpoint constant

**Files:**
- Modify: `src/constants/api.ts`
- Test: `src/constants/api.ts` (import/type validation via project type-check)

- [ ] **Step 1: Add new endpoint constant**

Add `API_AUTH_DEV_LOGIN_SUBSCRIBE_CHECK = '/api/v1/dev/login-and-send-subscribe-check'` next to existing auth/dev constants.

- [ ] **Step 2: Run baseline type-check**

Run: `npm run type-check`
Expected: PASS.


### Task 2: Add typed contracts for request/response

**Files:**
- Modify: `src/types/user.ts`
- Test: `src/types/user.ts` (compile-time type validation)

- [ ] **Step 1: Define request status type**

Add union type for request status: `'accept' | 'reject'`.

- [ ] **Step 2: Define request payload interface**

Add `DevLoginSubscribeCheckRequest` with fields:
- required: `student_id`
- optional: `role`, `template_code`, `wechat_template_id`, `status`, `open_id`, `page`, `template_data`

- [ ] **Step 3: Define response interface**

Add `DevLoginSubscribeCheckResult` with fields:
- `token`
- `user` (`id`, `student_id`, plus optional profile fields)
- `template_code`
- `subscription_status`
- `send_ok`
- `send_error`

- [ ] **Step 4: Run type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 5: Define deterministic fallback mapping for store compatibility**

In plan notes for implementation, require this rule:
- when `getUserInfo()` succeeds, use that payload for `setUserInfo`
- when it fails, map response `user` to full `UserInfo` with safe defaults (e.g., empty `name`, `class_id=0`, empty `grade/major`, default `role=1`) and call `setUserInfo(mappedUser)`

---

## Chunk 2: Service Layer Integration

### Task 3: Add auth service method for subscribe-check flow

**Files:**
- Modify: `src/services/auth.ts`
- Test: `src/services/auth.ts` (type-check + API call signature validation in page)

- [ ] **Step 1: Import new constant and types**

Import `API_AUTH_DEV_LOGIN_SUBSCRIBE_CHECK` and the newly added request/response types.

- [ ] **Step 2: Implement service method**

Add:

```ts
export function devLoginAndSendSubscribeCheck(payload: DevLoginSubscribeCheckRequest) {
  return request<DevLoginSubscribeCheckResult>({
    url: API_AUTH_DEV_LOGIN_SUBSCRIBE_CHECK,
    method: 'POST',
    withAuth: false,
    data: payload,
  })
}
```

- [ ] **Step 3: Run type-check**

Run: `npm run type-check`
Expected: PASS.

---

## Chunk 3: Login Page Dev Panel UI + Flow

### Task 4: Add dev subscribe-check form state and defaults

**Files:**
- Modify: `src/pages/auth/login.vue`

- [ ] **Step 1: Add reactive state fields**

Add refs for:
- `devTemplateCode` default `dev_login_check`
- `devWechatTemplateId` default `tmpl_dev_login_check`
- `devStatus` default `accept`
- `devOpenId` default empty
- `devPage` default `/pages/index/index`
- `devThing1Value` default `Dev登录订阅验证`
- `devSendResult` (nullable response holder)

- [ ] **Step 2: Add helper for request payload build**

Build payload from state, trim string inputs, include optional fields only when non-empty where appropriate.


### Task 5: Implement submit action and auth persistence

**Files:**
- Modify: `src/pages/auth/login.vue`
- Test: `src/pages/auth/login.vue` (runtime behavior)

- [ ] **Step 1: Add `handleDevLoginAndSendSubscribeCheck` action**

Flow:
1. Validate `devStudentId` non-empty
2. `loading=true`, clear old result
3. Call new service method
4. Persist auth via non-redirect helper (set token + try `getUserInfo`, but do not `reLaunch`)
5. If `getUserInfo` fails, fallback to mapped response `user` and still set store user info
6. Store result object for UI display
7. Show toast reflecting `send_ok`

- [ ] **Step 2: Keep existing dev login untouched**

Do not alter `handleDevLogin` behavior; add new button/action in parallel.

- [ ] **Step 3: Handle mixed success state**

If API returns 200 and `send_ok=false`, keep login success state but show non-blocking message with `send_error`.

- [ ] **Step 4: Handle documented error paths**

Ensure UI behavior explicitly covers:
- 403: show `dev login-and-send-subscribe-check is disabled`
- backend validation errors: toast exact backend message (e.g., `missing student_id`, `invalid role`, `status must be accept or reject`)


### Task 6: Render panel fields and response card

**Files:**
- Modify: `src/pages/auth/login.vue`

- [ ] **Step 1: Add form controls in `isDev` panel**

Render inputs/picker for request fields and new submit button: `登录并发送订阅验证`.

- [ ] **Step 2: Add result display block**

Show returned values:
- `template_code`
- `subscription_status`
- `send_ok`
- `send_error`
- `user.id` / `user.student_id`

- [ ] **Step 3: Add minimal scoped styles**

Add spacing/typography styles aligned with existing login page tokens and card conventions.

---

## Chunk 4: Verification

### Task 7: Validate compile and core scenarios

**Files:**
- Test only (no file changes expected unless fixes needed)

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 2: Run type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Run H5 build**

Run: `npm run build:h5`
Expected: PASS.

- [ ] **Step 4: Run mini-program build**

Run: `npm run build:mp-weixin`
Expected: PASS.

- [ ] **Step 5: Manual dev smoke check**

In dev mode on login page:
1. Trigger existing `开发登录` and confirm unchanged behavior
2. Trigger `登录并发送订阅验证` with default params
3. Confirm response card updates with `send_ok/send_error`
4. Simulate one `getUserInfo` failure path and确认 fallback `setUserInfo(mappedUser)` 生效
5. Trigger one `send_ok=false` or invalid-input case and confirm message passthrough
