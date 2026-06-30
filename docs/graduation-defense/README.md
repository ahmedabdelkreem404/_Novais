# NOVAIS Graduation Defense Guides

This folder contains standalone RTL HTML study guides for the graduation defense.
They are written in Egyptian Arabic and based on the current NOVAIS repository
state inspected on 2026-06-30. The guides are intentionally detailed for a
strict graduation defense: they include route maps, database explanations,
relationships, UML-style notes, sequence diagrams, responsive/UI visual boards,
methodology notes, testing evidence, and honest limitations.

## Files

- `ahmed-abdelkarim-backend-database-ai.html` - backend, database, AI, APIs, payments, admin, exports, security.
- `krollos-reda-frontend.html` - React web frontend, routing, state, course/document workflow, admin screens.
- `shahd-shehab-ui-testing-electron.html` - UI/UX, testing evidence, desktop Electron wrapper.
- `mariam-kholoud-mobile-app.html` - Flutter mobile app, Riverpod, Dio, GoRouter, cache, mobile flows.

## Evidence Notes

- Backend uses Laravel 12, JWT auth, DeepSeek AI service, content blueprints,
  platform settings, Paymob and offline payments, notifications, and export endpoints.
- Web uses React 18 with React Router, Material UI, local/session storage drafts,
  Axios interceptors, admin pages, and an Electron desktop bundle.
- Mobile uses Flutter with Riverpod, GoRouter, Dio, secure storage, API cache,
  Paymob WebView/offline payment screens, notifications, and parity tests.
- Existing readiness docs report passing backend tests, React build, Flutter
  analyze/test/build, Electron build, and Windows launch smoke checks.

## Honest Limitations To Remember In Defense

- PR #6 is still a draft in the repository context inspected for these guides.
- Native Android push via Firebase/FCM is documented as not fully enabled until
  Firebase credentials/configuration are added.
- Live Paymob production success is not proven by repository tests; code validates
  HMAC/webhooks and supports checkout flow.
- AI output quality still needs human review; the backend validates and normalizes
  structure but cannot guarantee perfect content.
- The current worktree has non-documentation changes outside this folder; this
  folder documents the inspected state without modifying those files.

## Methodology Note

The safest wording for the defense is that NOVAIS was built with an
iterative/incremental approach. It is not pure Waterfall because features evolved
in stages, and it is not a full DevOps project unless a real production CI/CD
pipeline is added and demonstrated. The repository does contain build/test
verification commands and readiness documentation, which are DevOps-like
engineering practices.
