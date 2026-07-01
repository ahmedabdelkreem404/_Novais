# PR6A Backend Platform And AI Foundation

## Scope

PR 6A extracts the backend foundation from umbrella PR #6 into a focused draft PR based on `main`.

Included:

- Platform settings public/admin backend contract.
- Content blueprint public/admin backend contract.
- Blueprint-aware AI generation payloads using `blueprint_slug` and `blueprint_fields`.
- Product-type-aware prompt/schema rules for courses, books, exams, question banks, graduation projects, theses, lesson plans, assignments, stories, and project-based learning.
- Backend course metadata support for persisted blueprint identity and fields.
- Document-style PDF export foundation for book/thesis/graduation-project outputs.
- Backend tests for platform settings and content blueprints.

Excluded:

- Flutter, Electron, and React UI work.
- Chatbot, notes, notifications, blog, legal/CMS, social, or graduation defense docs.
- Build outputs and local acceptance artifacts.
- PR #3 changes.

## Production Status

Backend foundation only. This PR does not claim full product readiness, mobile readiness, desktop readiness, web UI readiness, or 100% AI factual accuracy.

## Relation To PR #6

PR #6 remains the draft umbrella PR and is not ready to merge. PR 6A is the first split PR from the accepted Option B plan.

