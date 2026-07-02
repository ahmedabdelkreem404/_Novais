# PR6B Web UX And Product Viewer Parity

## Scope

PR 6B extracts the focused web experience from umbrella PR #6 after PR 6A established the backend contracts.

Included:

- Web create/generating/course viewer updates for backend-driven content blueprints.
- Product-aware viewer language for courses, books, reviews, question banks, exams, stories, graduation projects, lesson plans, assignments, and project-based learning.
- Admin platform settings UX updates.
- Admin content blueprint UX.
- Chatbot viewport positioning fix.
- Notes sidebar UX updates.
- Download/legal/static page polish that belongs to the web UX gate.
- Runtime branding/platform settings consumption by web.
- npm install reproducibility fix via `.npmrc` and lockfile sync.

Excluded:

- Backend feature code.
- Flutter/mobile files.
- Electron packaging/installer changes.
- Notifications implementation.
- Blog/CMS authoring changes.
- Graduation defense docs/screenshots.
- PR #3 changes.

## Verification

- `npm ci`: passed after adding `.npmrc` with `legacy-peer-deps=true`.
- `CI=true npm run build`: passed.
- `npm audit --omit=dev --audit-level=high`: passed with exit code 0.

Known audit notes:

- The production audit still reports moderate advisories in `quill`/`react-quill` and development-server dependencies.
- The available automated fix is breaking and is intentionally left out of this focused PR.

## Production Status

Draft web UX split only. This PR does not claim full product readiness, mobile readiness, desktop installed readiness, or final AI output QA.

## Relation To PR #6

PR #6 remains the draft umbrella PR and should not be merged or marked ready. PR 6B is the second split PR from the accepted Option B plan.

