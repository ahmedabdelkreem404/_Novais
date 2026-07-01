# NOVAIS Cross-Platform Production Parity Matrix

Date: 2026-07-01  
Scope: PR #6 only (`codex/platform-settings-ai-blueprints`)  
Status source: local repository inspection, current PR metadata, existing readiness docs, current committed screenshots/docs, and known unverified flows.

## Executive Status

PR #6 is still **Open** and **Draft**. GitHub currently reports `mergeable: MERGEABLE` for PR #6, so the previous `mergeable=false` blocker is not active at the time of this document. This does **not** mean production-ready.

Production readiness claim: **No-Go**.

Reason: builds, unit tests, and focused web blocker closure now pass, but Android emulator parity acceptance plus installed Electron app acceptance are not yet complete across all required flows.

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

### Focused Web Blocker Closure

Evidence root:

```text
.codex-run-logs/pr6-cross-platform-parity/web/blocker-closure
```

| Gate | Result | Evidence |
|---|---:|---|
| Study Review direct `/course/:publicId` load | Passed | Neutral metadata-loading shell, no course progress/certificate/final-exam flash. |
| Study Review refresh | Passed | Document/review layout persisted after refresh. |
| Normal Course missing lesson content | Passed | No infinite spinner; retry/fallback state appears. |
| Chatbot 300x500, 320x568, 390x844, 768x1024, 1440x900 | Passed | Clamped panel, no viewport overflow, outside click closes, inside input remains usable. |
| Chatbot drag persistence | Passed | Position persisted through reload. |
| Notes CRUD | Passed | Create/list/update/delete verified through authenticated API and browser open state. |
| Notes authorization isolation | Passed | Other user received 403 for another user's course notes. |
| Download fallbacks | Passed | No clickable fake `/NOVAIS_Installer.exe` or `/NOVAIS_App.apk`; unavailable state displayed. |
| Pricing source | Passed | Browser pricing matched backend `/plans` values `0`, `60`, `85`. |

### Command Gate

| Command | Result | Notes |
|---|---:|---|
| `php artisan migrate:fresh --seed --force` | Passed | Fresh schema and seed completed after the notes index change. |
| `$env:CI='true'; npm run build` | Passed | CRA production build compiled successfully. Large bundle advisory remains. |
| `php artisan test` | Passed | 97 tests, 315 assertions during auth-closure rerun. |
| `flutter analyze` | Passed | No issues found. Dependency outdated notices remain. |
| `flutter test` | Passed | 18 tests passed. |
| `composer audit --format=json` | Passed | No advisories, no abandoned packages. |
| `npm audit --omit=dev --audit-level=high` | Passed at high threshold | No high-threshold failure. |
| Web route viewport pass | Partial pass | 192 route/viewport checks captured under `.codex-run-logs/pr6-cross-platform-parity/web`; no automated overflow/raw-key failures, but fast navigation produced aborted request noise. |
| Web live AI generation | Partial pass | 8 generated content records with PDF status 200; focused direct-load viewer blockers were closed separately under `web/blocker-closure`. |

These commands improve confidence but do not replace browser, emulator, and installed desktop acceptance evidence.

### Mobile Emulator Acceptance Phase

Evidence root:

```text
.codex-run-logs/pr6-cross-platform-parity/mobile-emulator
```

| Gate | Result | Evidence |
|---|---:|---|
| Emulator detected | Passed | Pixel_8_Pro, `emulator-5554`, Android 16 / API 36. |
| APK build with `API_URL=http://10.0.2.2:8000/api` | Passed | `mobile-emulator/apk/app-x86_64-debug-after-mobile-viewer-fix.apk`. |
| APK install | Passed | `mobile-emulator/logs/adb-install-after-mobile-viewer-fix.log`. |
| App launch | Partial pass | No native crash; debug first launch was slow before landing rendered. |
| Landing screenshot | Passed | `mobile-emulator/screenshots/02-after-120s.png`. |
| Auth interactive acceptance | Blocked/Partial | Sign-in screen opened and fields were filled, but ADB-driven interaction did not complete dashboard login reliably. |
| Auth closure rerun | Partial/Blocked | `mobile-emulator/auth-closure` evidence captured. Found real `flutter_secure_storage` `BadPaddingException` before auth request; code now catches corrupt secure storage reads and avoids token printing. Follow-up emulator run still hit an app ANR during ADB menu/login automation, so dashboard acceptance is not closed. |
| ANR closure rerun | Blocked with root cause isolated | `mobile-emulator/anr-closure` evidence captured. Debug instrumentation added for `[NOVAIS][Startup]`, `[NOVAIS][Auth]`, `[NOVAIS][API]`, `[NOVAIS][Router]`, and `[NOVAIS][Cache]`. Logs isolated long `flutter_secure_storage` reads during bootstrap plus debug/emulator startup extraction. Secure-storage reads/writes/deletes now have timeouts, public platform/plans requests skip auth/device/cache storage, and platform-settings refresh no longer invalidates while an initial request is loading. Final emulator proof is still blocked by an emulator/system ANR window, not a completed dashboard run. |
| Dashboard/content/payment/notes/notifications emulator parity | Blocked | Requires completed interactive auth session. |
| Mobile viewer logic audit | Fixed in code | `study-review` now classifies as document-style; non-course layouts no longer auto-trigger lesson preparation. |
| Mobile static-data audit | Partial | `mobile-emulator/mobile-static-data-audit.md`. |

## Auth

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Login | `/auth/login` | Implemented, needs acceptance | Partial: secure-storage corruption and timeout hardening added; emulator dashboard proof still blocked by system/emulator ANR | Same React flow, needs installed app proof | Yes | `mobile/lib/core/auth/auth_provider.dart`, `mobile/lib/core/api/api_client.dart`, `mobile-emulator/auth-closure`, `mobile-emulator/anr-closure` | Need successful emulator dashboard screenshot/log after emulator/system ANR is cleared. |
| Register | `/auth/register` | Implemented, needs acceptance | Implemented, needs emulator proof | Same React flow, needs installed app proof | Yes | API inventory/routes | Need real register flow or test account proof. |
| Logout | `/auth/logout` | Implemented, needs acceptance | Implemented, needs emulator proof | Same React flow, needs installed app proof | Yes | Auth providers/interceptors | Need stale-cache check after logout. |
| Token/session refresh | `/auth/refresh`, `/auth/user-profile` | Partially implemented | Partially implemented | Same React flow | Yes | JWT auth code | Need force refresh/reopen proof. |
| Device id | `X-Device-ID` via middleware | Implemented | Implemented with corrupt-storage fallback | Same as web | Yes | `FingerprintService`, mobile Dio interceptor, auth-closure secure storage fix | Need successful network log proof from emulator login. |

## Platform Settings / Branding

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Platform settings | `/platform-settings` | Implemented | Implemented with startup hardening | Same React bundle | Yes | `App.js`, mobile providers, backend settings, `mobile-emulator/anr-closure/logs/logcat-startup-v3-after-60s.txt` | Need admin-change propagation proof after emulator dashboard access is stable. |
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
| Study Review | `/generate-course` with `study-review` | Passed focused web acceptance | Code fixed, emulator proof still blocked | Same React flow | Yes | `web/blocker-closure/study-review-direct-load.png`, `study-review-refresh.png`; mobile code fix in `course_screen.dart` | Mobile interactive viewer proof still blocked by auth. |
| Academic Course | `/generate-course` with `academic-course` | Implemented | Needs evidence | Same React flow | Yes | Blueprint defaults | Need live generation proof. |
| Interactive Course | `/generate-course` with `interactive-practical-course` | Implemented | Needs evidence | Same React flow | Yes | Blueprint defaults | Need live generation proof. |
| Egyptian Arabic content | language option + prompt instruction | Fixed and generated | Needs evidence | Same React flow | Yes | `public_id=16d74c1ce998219f1b4437da` | Backend now preserves `Egyptian Arabic`; mobile/desktop proof still missing. |

## Viewer Modes

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Course mode | `/courses/{id}`, lesson endpoints | Passed focused missing-content fallback | Implemented, needs emulator proof | Same React bundle | Yes | `web/blocker-closure/normal-course-missing-lesson.png` | Mobile/desktop live saved-content proof still missing. |
| Document/book mode | `/courses/{id}` + document layout | Passed focused direct-load proof | Code fixed for Study Review/doc classification, needs emulator proof | Same React bundle | Yes | Viewer screenshots plus `web/blocker-closure/study-review-direct-load.png`; mobile code fix | Mobile/desktop proof still missing. |
| Question/exam mode | `/courses/{id}` | Partial browser proof | Partially implemented | Same React bundle | Yes | Viewer screenshots for question bank and exam | Need answer-key interaction proof and mobile proof. |
| Story mode | `/courses/{id}` | Implemented in web | Partially implemented | Same React bundle | Yes | `course.js` story reader | Need real generated story proof. |
| Terminology labels | metadata/display terms | Partially implemented | Partially implemented | Same React bundle | Mostly | i18n changes and dynamic labels | Need raw-key/course-wording sweep. |
| PDF export | `/courses/{id}/export/pdf` | Implemented | Endpoint known, mobile proof needed | Same React bundle | Yes | `ExportController`, `document_pdf.blade.php` | Need export file evidence for each mode. |
| Word export | Not active | Disabled coming soon | Not implemented | Disabled same as web | N/A | `ExportModal.js` | Must not claim available. |

## User Data

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Dashboard counts | `/auth/user-profile`, `/courses` | Implemented | Blocked pending interactive auth | Same React bundle | Yes | Mobile API/profile evidence captured, dashboard screenshot not completed | Need web/mobile same-user comparison. |
| Usage limits | profile/subscription endpoints | Implemented | Implemented, needs comparison | Same React bundle | Yes | Backend subscription code | Need no fake/stale values proof. |
| Subscriptions | payments/subscriptions | Implemented | Partially implemented | Same React bundle | Yes | Backend payment code | Need active plan comparison. |
| My content list | `/courses` | Implemented | Implemented | Same React bundle | Yes | Code inspected | Need same-user web/mobile evidence. |
| Content cards | `/courses` | Implemented | Needs evidence | Same React bundle | Yes | Code inspected | Need stale cache/logout check. |
| Notes/notebook | notes endpoints | Passed focused CRUD/security acceptance | Partially implemented; course tab uses filtered endpoint | Same React bundle | Yes | `web/blocker-closure/focused-results.json`, `PersonalNoteTest`; `course_screen.dart` uses `/notes?course_id=` | Mobile CRUD emulator proof blocked by auth. |
| Chatbot | chat endpoint | Passed focused viewport/drag/outside-click acceptance | Needs evidence | Same React bundle | Yes | `web/blocker-closure/chatbot-final-checks.json` | Mobile/desktop proof still missing. |
| Notifications | `/notifications`, `/notification-devices` | Implemented | Implemented in-app | Same React bundle | Yes | Notification docs/tests | Native push not proven. |

## Payments

| Feature | Backend API | Web status | Mobile status | Desktop status | Same data source? | Evidence | Blockers |
|---|---|---:|---:|---:|---:|---|---|
| Pricing | `/plans`, platform config | Passed backend-source web acceptance | Implemented/needs emulator evidence | Same React bundle | Yes | `web/blocker-closure/pricing-recheck.png`; mobile pricing code uses `/plans` | Mobile pricing screenshot blocked by auth; landing fallback constants remain risk. |
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
| Download page | `/download`, platform settings app URLs | Passed no-fake-link web acceptance | Needs evidence | Same React bundle | Yes | `web/blocker-closure/download-recheck.png` | Need mobile/desktop unavailable-state proof. |

## Same Backend Data Source Audit

| Area | Current judgment | Notes |
|---|---:|---|
| Web business data | Focused blocker closure passed | Download fallbacks and pricing source were rechecked under `web/blocker-closure`; broader mobile/desktop parity still pending. |
| Mobile business data | Partial / blocked | APK build/install/launch and API source checks passed; interactive auth/dashboard parity still blocked. |
| Desktop business data | Needs evidence | Should match web because Electron wraps React, but installed app proof required. |
| Static pricing | Web passed; mobile partial | Web pricing matched backend `/plans`; mobile pricing screen uses `/plans`, but landing still has fallback legacy constants if plan data is missing. |
| Static blueprint options | Mostly backend-driven | Mobile/web fetch blueprints; still verify no stale hardcoded options. |
| Static legal/download config | Download passed focused web audit | Fake installer/APK fallbacks removed; legal pages still need full platform acceptance. |
| Cache after logout | Needs evidence | Must verify no previous-user data on mobile/web; mobile logout/cache isolation blocked by incomplete interactive auth. |

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

1. Mobile emulator acceptance is **Partial/Blocked**: APK build/install/launch passed. Auth closure found and fixed a corrupt secure-storage `BadPaddingException` path. ANR closure isolated additional long secure-storage bootstrap reads and added timeout hardening, but final dashboard proof is still blocked because the emulator produced a `Application Not Responding: system` window during the proof run.
2. Mobile viewer logic was fixed for Study Review/document mode, but still needs emulator screenshots after auth is accepted.
3. Desktop needs built installed app launch evidence, not just Electron dev/wrapper screenshot.
4. Legal/CMS/contact/social/payment flows still need cross-platform acceptance screenshots and network proof.
5. Broader static-data sweep should continue during mobile/desktop parity, even though web download/pricing blockers were closed.
6. PR is still Draft and should remain Draft until mobile and installed desktop evidence passes.

## Production Readiness Score

Current confidence as a Draft PR: **88-90% implementation progress**.

Current production-proven confidence: **78-82%**, because focused web blockers are closed but mobile/desktop acceptance is still missing.

Mobile production-proven confidence after ANR-closure work: **55-62%**. Build/install/launch, source checks, secure-storage corruption handling, secure-storage timeout hardening, public startup request hardening, and tests passed. Core authenticated emulator parity is still not complete because dashboard proof remains blocked by emulator/system ANR and unstable UI automation.

Production decision: **No-Go** until web + mobile emulator + installed desktop acceptance evidence is complete.
