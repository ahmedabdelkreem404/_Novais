# Flutter Platform Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Flutter foundation that makes NOVAIS mobile feel like the same platform as web and desktop, with cache and without analyzer errors.

**Architecture:** Add reusable Flutter design tokens, localized strings, app transitions, shared shell widgets, and a small JSON cache layer. Keep the current Riverpod, GoRouter, Dio, secure storage, shared preferences, and native Flutter screens.

**Tech Stack:** Flutter, Riverpod, GoRouter, Dio, shared_preferences, flutter_secure_storage, flutter_test.

---

### Task 1: Localization And Direction

**Files:**
- Modify: `mobile/lib/core/l10n/app_localizations.dart`
- Modify: `mobile/lib/main.dart`
- Test: `mobile/test/platform_parity_test.dart`

- [ ] Write tests that Arabic strings render readable Arabic and app locale controls direction.
- [ ] Replace mojibake Arabic strings with correct UTF-8 Arabic.
- [ ] Ensure `MaterialApp.router` uses locale-aware direction through Flutter localization delegates.
- [ ] Run `flutter test test/platform_parity_test.dart`.

### Task 2: Design Tokens And Motion

**Files:**
- Modify: `mobile/lib/core/theme/app_theme.dart`
- Modify: `mobile/lib/core/router/app_router.dart`
- Create: `mobile/lib/core/theme/app_motion.dart`
- Test: `mobile/test/platform_parity_test.dart`

- [ ] Write tests for token values used by the shell.
- [ ] Align Flutter colors with `src/styles/tokens.css`.
- [ ] Add fade + slide page transitions for GoRouter pages.
- [ ] Run `flutter test test/platform_parity_test.dart`.

### Task 3: API Cache

**Files:**
- Create: `mobile/lib/core/cache/api_cache.dart`
- Modify: `mobile/lib/core/api/api_client.dart`
- Modify: `mobile/lib/core/auth/auth_provider.dart`
- Test: `mobile/test/api_cache_test.dart`

- [ ] Write tests for cache set/get, TTL expiry, and clear.
- [ ] Add `ApiCache` backed by `SharedPreferences`.
- [ ] Add Dio GET caching that serves valid cache on network failure.
- [ ] Clear cache on logout.
- [ ] Run `flutter test test/api_cache_test.dart`.

### Task 4: Dashboard Shell And Drawer

**Files:**
- Modify: `mobile/lib/features/dashboard/shell_screen.dart`
- Modify: `mobile/lib/widgets/app_sidebar.dart`
- Test: `mobile/test/platform_parity_test.dart`

- [ ] Write widget tests for menu, language toggle, theme toggle, and logout action availability.
- [ ] Match web mobile header and drawer layout.
- [ ] Bind language and theme buttons to existing Riverpod notifiers.
- [ ] Replace hardcoded English drawer labels with localizations.
- [ ] Run `flutter test test/platform_parity_test.dart`.

### Task 5: Verification

**Files:**
- No new files.

- [ ] Run `flutter test`.
- [ ] Run `flutter analyze`.
- [ ] Check `git status --short` and report changed files.
