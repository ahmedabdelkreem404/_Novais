# Flutter Platform Parity Design

## Goal

Make the Flutter app feel like the same NOVAIS platform as the responsive website and desktop shell: same colors, Arabic/English behavior, navigation shape, loading states, motion language, and cached user/course data.

## Scope

This design is implemented in slices. The first slice builds the foundation that later screens can reuse safely:

- Shared Flutter design tokens matching `src/styles/tokens.css`.
- Arabic/English text that renders correctly and follows RTL/LTR.
- A dashboard shell and drawer that match the web sidebar/header behavior.
- Reusable page transitions matching the web fade/slide feel.
- A small local API cache for user profile and read-heavy JSON responses.
- No WebView replacement of the app. Flutter remains native.

## Architecture

Flutter keeps its current Riverpod, GoRouter, Dio, secure storage, and shared preferences stack. New platform parity code lives under `mobile/lib/core` and `mobile/lib/widgets` so feature screens can consume stable primitives instead of duplicating styling.

The app should degrade safely: cached data can render while fresh API data is loading, but auth tokens remain in secure storage and are cleared on logout.

## UX Rules

- Dark mode remains the default, matching the website.
- Primary blue, slate backgrounds, borders, typography scale, and card radii match the website tokens.
- App navigation uses the same mental model as web mobile: top bar, drawer, generate action, usage card, language toggle, theme toggle, logout.
- Arabic and English are first-class. Direction changes at app level.
- Page motion uses short fade + slide transitions, not platform-random transitions.
- Loading, empty, and error states use shared components so screens feel consistent.

## Cache Rules

- Cache read-heavy JSON responses with a short TTL.
- Profile cache may be shown immediately while a fresh profile request runs.
- Auth token storage stays secure.
- Logout clears secure auth data and app cache.
- Failed network refresh does not crash the UI if a valid cache entry exists.

## First Implementation Slice

1. Fix localization text and direction support.
2. Add design token helpers and shared components.
3. Add a simple JSON cache service and Dio cache interceptor for GET requests.
4. Update the dashboard shell and drawer to match the web mobile shell.
5. Add widget/unit tests around localization, cache, and shell actions.
6. Verify with `flutter test` and `flutter analyze`.
