# PR #6 Stabilization And Split Plan

Date: 2026-07-01

Scope: PR #6 only, `codex/platform-settings-ai-blueprints`.

Current decision: **Option B - split PR #6 into smaller draft PRs before attempting production readiness**.

PR #6 remains Open / Draft / mergeable / No-Go. Do not merge it and do not mark it Ready.

Current PR #6 state:

- Draft: yes
- Mergeable: yes / clean at the latest local `gh pr view 6` check
- Production readiness: No-Go
- Readiness score: 55/100
- Changed files: 124
- Commits: 37

## Why Split

PR #6 is too broad to review or stabilize safely as one production gate:

- 124 changed files
- 37 commits
- 13,167 additions and 1,794 deletions against `origin/main`
- touches backend generation, platform settings, content blueprints, exports, notes, notifications, web UX, Flutter mobile, Electron desktop, docs, and proof artifacts
- final readiness gate is still No-Go at 55/100

Keeping it as one PR would make blocker fixes harder to review and would increase the chance of merging unrelated instability. The safer path is to preserve the current PR as the evidence umbrella, then split work into focused PRs with independent acceptance gates.

## Proposed Split

### PR 6A - Backend Platform And AI Foundations

Purpose: land the backend contract first.

Include:

- platform settings schema and API changes
- content blueprint model, migrations, seeders, admin API
- AI generation schema and prompt rules
- course/document normalization rules
- export foundation, including document PDF support
- backend tests for platform settings, blueprints, notifications, notes, generation validation, and export contracts

Acceptance:

- `php artisan test`
- `composer audit --format=json`
- API contract samples for blueprints, platform settings, generation, notes, notifications, exports
- no frontend/mobile behavior claims beyond API compatibility

### PR 6B - Web UX And Product-Type Viewer Parity

Purpose: land the web experience after backend contracts are stable.

Include:

- React create/generating/course viewer changes
- document/book/review/question/exam UI modes
- chatbot viewport fixes
- notes UI
- legal/download/static-data fixes
- pricing and platform settings UX
- admin content-blueprint and platform-settings screens

Acceptance:

- `CI=true npm run build`
- `npm audit --omit=dev --audit-level=high`
- browser proof for course, book, graduation project, question bank, exam, study review
- no course-only UI on non-course products
- notes CRUD/security evidence
- download page has no fake installer/APK links

### PR 6C - Flutter Mobile Stabilization And Parity

Purpose: fix mobile startup/auth/cache first, then prove dashboard parity.

Include:

- mobile startup performance changes
- secure-storage timeout/non-blocking cleanup
- dashboard auth/session/logout recovery
- cache isolation and user-scoped cache fixes
- mobile shell and blueprint UI parity
- mobile diagnostics required for proof
- removal of expensive mobile-only animation loops where relevant

Do not test content creation/viewer/payments/notes/notifications until dashboard proof passes.

Acceptance:

- `flutter pub get`
- `flutter analyze`
- `flutter test`
- debug APK build
- fresh emulator API 34/35 or physical Android proof
- first visible UI quickly
- no ANR
- login reaches dashboard
- session restore works
- logout works
- User A/User B cache isolation proven
- dashboard values match backend/web

Evidence root:

`.codex-run-logs/pr6-cross-platform-parity/mobile-emulator/device-proof-v2`

### PR 6D - Electron Desktop Installed Acceptance

Purpose: isolate packaging/install issues from app logic.

Include:

- Electron packaging fixes only
- installer build reproducibility
- installed-app launch checks
- preload/security verification
- backend URL behavior in installed shell

Acceptance:

- close all NOVAIS/Electron processes before build
- safely clean `dist` and temp output folders
- `npm run electron:build` exits 0
- generated installer installs
- installed app launches
- no blank screen
- no fatal console/preload errors
- login/dashboard/open content proof
- security settings remain:
  - `nodeIntegration: false`
  - `contextIsolation: true`
  - limited preload bridge
  - external links open externally
  - unsafe navigation blocked

Evidence root:

`.codex-run-logs/pr6-cross-platform-parity/desktop-installed/v2`

### PR 6E - AI Output QA Evidence

Purpose: keep live AI quality evidence separate from implementation changes.

Include:

- QA scripts, screenshots, payloads, public IDs, exports, and reports only
- no feature code unless a QA blocker is confirmed and routed back to 6A/6B/6C

Required cases:

1. Normal Course
2. Full Book
3. Graduation Project Book, non-software
4. Graduation Project Book, software
5. Question Bank
6. Exam Builder
7. Study Review
8. Egyptian Arabic
9. Academic Course
10. Interactive Practical Course

Acceptance:

- request payload recorded
- response status recorded
- public ID recorded
- viewer screenshot recorded
- PDF export status recorded
- structure matches blueprint
- viewer mode matches blueprint
- book/exam/question bank/graduation project never render as course
- course remains course
- no fabricated DOI/URLs claimed as real sources
- no claim of factual perfection

Evidence root:

`.codex-run-logs/pr6-ai-output-qa/v2`

## Safe Split Procedure

1. Keep PR #6 Draft as the umbrella record until split PRs exist.
2. Create new branches from current `main`, not from a dirty worktree.
3. Cherry-pick or re-apply changes by scope, not by blindly replaying all commits.
4. For each split PR, include only its relevant code and evidence.
5. Preserve evidence docs by copying the matching `.codex-run-logs` reports into the relevant PR when useful.
6. Do not include generated build outputs such as `dist-pr6-test/` in Git.
7. Do not touch PR #3.
8. Do not merge any split PR until its own gates pass.
9. After split PRs are open and validated, decide whether to close PR #6 or keep it as historical Draft evidence.

## Blocker Order

1. PR 6A backend foundation.
2. PR 6B web acceptance.
3. PR 6C mobile stabilization, including dashboard/auth/cache proof.
4. PR 6D desktop installed acceptance.
5. PR 6E AI QA evidence.
6. Only then rerun final cross-platform readiness.

No child PR may be marked Ready unless its own acceptance gate passes.

## Current Gate Status

| Gate | Status | Notes |
|---|---:|---|
| Web blocker closure | Pass | Focused web evidence exists. |
| Mobile | Partial / Blocked | APK installs and first UI appears, but dashboard/auth/session/logout proof failed. |
| Desktop | Partial / Blocked | Unpacked exe launched; installed acceptance not proven. |
| AI output QA | Blocked / Not Completed | Full product-type matrix not run. |
| PR #6 readiness | No-Go | Score remains 55/100. |

## Next Action

Prepare PR 6A first. Do not add more unrelated features to PR #6.
