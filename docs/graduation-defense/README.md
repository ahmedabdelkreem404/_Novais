# NOVAIS Graduation Defense Guides

This folder contains standalone RTL HTML study guides for the graduation defense.
They are written in Egyptian Arabic and based on the current NOVAIS repository
state inspected on 2026-06-30.

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
