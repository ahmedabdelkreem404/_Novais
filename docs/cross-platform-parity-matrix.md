# NOVAIS Cross-Platform Production Parity Matrix

Date: 2026-07-01  
Scope: PR #6 only (`codex/platform-settings-ai-blueprints`)  
Status source: local repository inspection, current PR metadata, existing readiness docs, current committed screenshots/docs, and known unverified flows.

## Executive Status

PR #6 is still **Open** and **Draft**. GitHub currently reports `mergeable: MERGEABLE` for PR #6, so the previous `mergeable=false` blocker is not active at the time of this document. This does **not** mean production-ready.

Production readiness claim: **No-Go**.

Reason: builds and unit tests are useful, but full browser acceptance, Android emulator parity acceptance, and installed Electron app acceptance are not yet complete across all required flows.

## Status Legend

- Implemented: code path exists and is integrated.
- Partially implemented: code exists but parity, UX, or edge cases are incomplete.
- Needs evidence: implementation appears present, but no real acceptance proof is attached for this matrix yet.
- Blocked: cannot be claimed until missing config, evidence, or behavior is fixed.
- Not implemented: no meaningful implementation found.

## PR / Repository Gate

| Gate | Current status | Evidence | Blockers / Notes |
|---|---:|---|---|
| PR #6 state | Open Draft | `gh pr view 6` | Keep Draft. |
| Mergeability | MERGEABLE | `gh pr view 6 --json mergeable` on 2026-07-01 | Still needs acceptance evidence before ready. |
| PR size | Very large | 115 changed files, 12014 additions, 1697 deletions | Consider split plan if review becomes unsafe. |
| Production readiness | No-Go | This matrix | Needs web/mobile/desktop acceptance. |
| Existing docs preserved | Implemented | `docs/graduation-defense/*` | No issue found. |

## Verification Run On 2026-07-01

| Command | Result | Notes |
|---|---:|---|
| `$env:CI='true'; npm run build` | Passed | CRA production build compiled successfully. Large bundle advisory remains. |
| `php artisan test` | Passed | 96 tests, 307 assertions. |
| `flutter analyze` | Passed | No issues found. Dependency outdated notices remain. |
| `flutter test` | Passed | 18 tests passed. |
| `composer audit --format=json` | Passed | No advisories, no abandoned packages. |
| `npm audit --omit=dev --audit-level=high` | Passed at high threshold | 5 moderate advisories remain in `quill/react-quill` and `webpack-dev-server/react-scripts`; breaking-force upgrades not applied. |

These commands improve confidence but do not replace browser, emulator, and installed desktop acceptance evidence.

## Auth

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Login | `/auth/login` | Implemented, needs acceptance | Implemented, needs emulator proof | Same React flow, needs installed app proof | Yes | Code/routes inspected | Need real login flow screenshots/logs on all platforms. |
| Register | `/auth/register` | Implemented, needs acceptance | Implemented, needs emulator proof | Same React flow, needs installed app proof | Yes | API inventory/routes | Need real register flow or test account proof. |
| Logout | `/auth/logout` | Implemented, needs acceptance | Implemented, needs emulator proof | Same React flow, needs installed app proof | Yes | Auth providers/interceptors | Need stale-cache check after logout. |
| Token/session refresh | `/auth/refresh`, `/auth/user-profile` | Partially implemented | Partially implemented | Same React flow | Yes | JWT auth code | Need force refresh/reopen proof. |
| Device id | `X-Device-ID` via middleware | Implemented | Implemented | Same as web | Yes | `FingerprintService`, mobile Dio interceptor | Need network log proof. |

## Platform Settings / Branding

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Platform settings | `/platform-settings` | Implemented | Implemented | Same React bundle | Yes | `App.js`, mobile providers, backend settings | Need admin-change propagation proof. |
| Theme | `/platform-settings` | Implemented | Partially implemented | Same React bundle | Yes | Web screenshots show real theme; mobile screenshot shows light Arabic dashboard | Need admin toggle and refresh proof. |
| Language | `Accept-Language`, i18n | Implemented | Implemented | Same React bundle | Partially | Web/mobile code | Need full Arabic/English acceptance and no raw keys. |
| Branding logo/favicon/title | `/platform-settings` | Implemented | Partially implemented | Same React bundle | Yes | `LogoComponent`, `App.js`, real assets in docs | Need admin upload/update proof. |
| Feature flags/visibility | `/platform-settings` | Partially implemented | Needs evidence | Same React bundle | Yes | Settings/admin code | Need matrix per flag. |

## Content Blueprints / Creation

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Content blueprints list | `/content-blueprints` | Implemented | Implemented | Same React bundle | Yes | Backend model/routes, create pages | Need side-by-side API response proof. |
| Normal Course | `/generate-course`, `/courses` | Implemented, needs browser acceptance | Implemented, needs emulator acceptance | Same React flow, needs launch proof | Yes | Code/tests | Need live generation/save proof. |
| Graduation Project Book non-software | `/generate-course` with `graduation-project` | Implemented prompt rules | Needs evidence | Same React flow | Yes | `ContentBlueprint`, `DeepSeekService` | Need live AI/browser acceptance. |
| Graduation Project Book software | `/generate-course` with software indicators | Implemented prompt rules | Needs evidence | Same React flow | Yes | `DeepSeekService` software constraints | Need live AI/browser acceptance. |
| Full Book | `/generate-course` with `book` | Implemented | Needs evidence | Same React flow | Yes | Blueprint defaults | Need live generation proof. |
| Question Bank | `/generate-course` with `question-bank` | Implemented | Needs evidence | Same React flow | Yes | Blueprint/layout code | Need UI proof and answers proof. |
| Exam Builder | `/generate-course` with `exam-builder` | Implemented | Needs evidence | Same React flow | Yes | Blueprint/layout code | Need marks/sections proof. |
| Study Review | `/generate-course` with `study-review` | Implemented | Needs evidence | Same React flow | Yes | Blueprint defaults | Need live generation proof. |
| Academic Course | `/generate-course` with `academic-course` | Implemented | Needs evidence | Same React flow | Yes | Blueprint defaults | Need live generation proof. |
| Interactive Course | `/generate-course` with `interactive-practical-course` | Implemented | Needs evidence | Same React flow | Yes | Blueprint defaults | Need live generation proof. |
| Egyptian Arabic content | language option + prompt instruction | Implemented | Needs evidence | Same React flow | Yes | Language/prompt code | Need live output review. |

## Viewer Modes

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Course mode | `/courses/{id}`, lesson endpoints | Implemented | Implemented | Same React bundle | Yes | Existing screenshots/sample asset | Need live saved content proof. |
| Document/book mode | `/courses/{id}` + document layout | Implemented in current PR | Partially implemented | Same React bundle | Yes | `course.js`, mobile filter, PDF template | Need browser and emulator proof. |
| Question/exam mode | `/courses/{id}` | Implemented in web | Partially implemented | Same React bundle | Yes | `course.js` answer toggle | Need browser and mobile proof. |
| Story mode | `/courses/{id}` | Implemented in web | Partially implemented | Same React bundle | Yes | `course.js` story reader | Need real generated story proof. |
| Terminology labels | metadata/display terms | Partially implemented | Partially implemented | Same React bundle | Mostly | i18n changes and dynamic labels | Need raw-key/course-wording sweep. |
| PDF export | `/courses/{id}/export/pdf` | Implemented | Endpoint known, mobile proof needed | Same React bundle | Yes | `ExportController`, `document_pdf.blade.php` | Need export file evidence for each mode. |
| Word export | Not active | Disabled coming soon | Not implemented | Disabled same as web | N/A | `ExportModal.js` | Must not claim available. |

## User Data

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Dashboard counts | `/auth/user-profile`, `/courses` | Implemented | Implemented, needs comparison | Same React bundle | Yes | Mobile screenshot shows usage card | Need web/mobile same-user comparison. |
| Usage limits | profile/subscription endpoints | Implemented | Implemented, needs comparison | Same React bundle | Yes | Backend subscription code | Need no fake/stale values proof. |
| Subscriptions | payments/subscriptions | Implemented | Partially implemented | Same React bundle | Yes | Backend payment code | Need active plan comparison. |
| My content list | `/courses` | Implemented | Implemented | Same React bundle | Yes | Code inspected | Need same-user web/mobile evidence. |
| Content cards | `/courses` | Implemented | Needs evidence | Same React bundle | Yes | Code inspected | Need stale cache/logout check. |
| Notes/notebook | notes endpoints | Implemented, needs acceptance | Partially implemented | Same React bundle | Yes | Recent PR commits mention notes | Need course_id/content_id filter proof. |
| Chatbot | chat endpoint | Implemented, needs UX acceptance | Needs evidence | Same React bundle | Yes | Recent PR commits mention viewport-safe chatbot | Need drag/RTL/outside-click proof. |
| Notifications | `/notifications`, `/notification-devices` | Implemented | Implemented in-app | Same React bundle | Yes | Notification docs/tests | Native push not proven. |

## Payments

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Pricing | `/plans`, platform config | Implemented | Implemented/needs evidence | Same React bundle | Yes | Real web pricing screenshot | Need mobile pricing proof. |
| Paymob card | `/payment/checkout`, webhook | Implemented | Partially implemented | Same React bundle | Yes | Payment controller/tests | Need safe checkout/browser proof, no production claim. |
| Wallet | Paymob wallet integration | Implemented in backend | Needs evidence | Same React bundle | Yes | Paymob service | Need config/checkout proof. |
| Vodafone Cash offline | `/offline-payments` | Implemented | Needs emulator proof | Same React bundle | Yes | Offline controller/tests | Need receiver config/unavailable proof. |
| InstaPay offline | `/offline-payments` | Implemented | Needs emulator proof | Same React bundle | Yes | Offline controller/tests | Need duplicate pending proof. |
| Offline payment status | `/offline-payments` | Implemented | Needs emulator proof | Same React bundle | Yes | Offline payment code | Need status list screenshots. |

## CMS / Legal / Download

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Terms | `/pages/terms` or public page route | Implemented | Public route/stub needs evidence | Same React bundle | Yes for web/desktop | Seeder/PR commits | Need AR/EN responsive proof. |
| Privacy | public pages | Implemented | Needs evidence | Same React bundle | Yes for web/desktop | Seeder/PR commits | Need proof. |
| Refund | public pages | Implemented | Needs evidence | Same React bundle | Yes for web/desktop | Seeder/PR commits | Need proof. |
| Cancellation | public pages | Implemented | Needs evidence | Same React bundle | Yes for web/desktop | Seeder/PR commits | Need proof. |
| Billing | public pages | Implemented | Needs evidence | Same React bundle | Yes for web/desktop | Seeder/PR commits | Need proof. |
| Acceptable Use | Unknown / needs audit | Needs audit | Needs audit | Needs audit | Unknown | Not confirmed | Add only if present. |
| Contact/support | `/contact` | Implemented | Needs evidence | Same React bundle | Yes | Contact code/PR commits | Need submit proof. |
| Social links | `/social-links` | Implemented | Needs evidence | Same React bundle | Yes | Routes/admin social links | Need admin/public proof. |
| Download page | `/download`, platform settings app URLs | Implemented, needs link validation | Needs evidence | Same React bundle | Yes | Download route, platform settings | Need broken/unavailable states proof. |

## Same Backend Data Source Audit

| Area | Current judgment | Notes |
|---|---:|---|
| Web business data | Partially implemented, needs audit | Many routes use backend, but static fallback/old labels need sweep. |
| Mobile business data | Needs evidence | API client exists, cache exists, but emulator parity comparison still required. |
| Desktop business data | Needs evidence | Should match web because Electron wraps React, but installed app proof required. |
| Static pricing | Needs audit | Pricing screenshot exists, but source must be verified against `/plans` or config. |
| Static blueprint options | Mostly backend-driven | Mobile/web fetch blueprints; still verify no stale hardcoded options. |
| Static legal/download config | Needs audit | Backend CMS/settings exists; verify pages do not rely on stale hardcoded values. |
| Cache after logout | Needs evidence | Must verify no previous-user data on mobile/web. |

## Required Evidence Paths

Planned evidence root:

```text
.codex-run-logs/pr6-cross-platform-parity/
```

Required subfolders:

```text
.codex-run-logs/pr6-cross-platform-parity/web
.codex-run-logs/pr6-cross-platform-parity/mobile-emulator
.codex-run-logs/pr6-cross-platform-parity/desktop
```

Current committed screenshot evidence:

```text
docs/graduation-defense/screenshots/
```

Those screenshots prove that some surfaces can render, but they are **not** a complete parity acceptance suite.

## Current Blockers Before Ready For Review

1. Full web acceptance matrix is not complete across all requested viewport sizes.
2. Live AI browser acceptance is not complete for all requested blueprints and Egyptian Arabic.
3. Mobile emulator acceptance needs same-user comparison with web for dashboard, settings, blueprints, viewer modes, payments, notes, and notifications.
4. Desktop needs built installed app launch evidence, not just Electron dev/wrapper screenshot.
5. Static/fake business data audit is incomplete.
6. Course-only terminology sweep is incomplete across web/mobile/admin/public pages.
7. Moderate npm advisories remain; no high-severity audit failure at requested threshold.
8. PR is still Draft and should remain Draft until evidence passes.

## Production Readiness Score

Current confidence as a Draft PR: **82-86% implementation progress**.

Current production-proven confidence: **lower than implementation progress**, because parity evidence is incomplete.

Production decision: **No-Go** until web + mobile emulator + installed desktop acceptance evidence is complete.
