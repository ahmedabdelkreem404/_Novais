# Mobile Full Web Parity Draft Report

## Branch

`codex/mobile-full-web-parity`

Base: `origin/main` at `6435de7`, which includes PR #4 offline payments.

## Scope Decision

This PR is mobile-only. It does not add PR #3 work, web export/audio/media cleanup, or offline payment backend changes.

Admin mobile parity is documented as not ready in this draft. The current implementation focuses on normal authenticated user parity: auth, dashboard shell, course media display, pricing, Paymob checkout, offline payment requests, localization, identity, and cache foundation.

## Web-to-Mobile Parity Table

| Web Page / Flow | Mobile Screen Exists? | Same Flow? | Missing Features | Fix in This Draft |
|---|---:|---:|---|---|
| Landing | Yes | Partial | Needs pixel-level visual pass | Existing screen retained |
| Sign in | Yes | Partial | Needs emulator auth evidence | Existing screen retained |
| Sign up/register | Yes | Partial | Needs emulator auth evidence | Existing screen retained |
| Pricing | Yes | Improved | Offline payment handoff missing | Passes integer plan id, billing, amount |
| Paymob checkout | Yes | Partial | Needs emulator WebView evidence | WebView flow retained |
| Offline Vodafone Cash | No | No | Missing mobile request UI | Added mobile instructions, proof/reference submit |
| Offline InstaPay | No | No | Missing mobile request UI | Added mobile instructions, proof/reference submit |
| Offline pending status | Partial | Partial | No status list on mobile | Added recent offline status list |
| Dashboard | Yes | Improved | Drawer actions incomplete | Added language/theme actions and translated labels |
| Sidebar/drawer navigation | Yes | Improved | Hardcoded labels, route-context fragility | Added localized drawer and safer nav handling |
| Generate/create course | Yes | Partial | Needs emulator end-to-end evidence | Existing flow retained |
| Generating screen | Yes | Partial | Needs stuck-loading verification | Existing flow retained |
| My courses | Yes | Partial | Needs cached dashboard evidence | GET cache foundation added |
| Course details | Yes | Improved | Video not represented safely | Added video card/fallback behavior |
| Lesson details | Yes | Improved | Broken images could render blank | Added image fallback and cover fallback |
| Audio courses/player | Yes | Partial | Needs mobile-specific QA | Existing flow retained |
| Chat | Yes | Partial | Needs emulator evidence | Existing flow retained |
| Notes | Yes | Partial | Needs cached/offline behavior pass | Existing flow retained |
| Quiz | Yes | Partial | Needs Arabic QA | Existing flow retained |
| Certificate | Yes | Partial | Needs emulator evidence | Existing flow retained |
| PDF/PPT download | Partial | No | Needs mobile-safe download handling | Not completed in this draft |
| Profile | Yes | Partial | Needs visual parity pass | Existing screen retained |
| Admin dashboard | Partial/No | No | Mobile admin not scoped yet | Documented blocker |

## Implemented Cache Strategy

- JWT token and device id stay in `flutter_secure_storage`.
- User id is stored in secure storage after auth/profile fetch and is used to namespace cache keys.
- Non-sensitive GET JSON responses are cached in `SharedPreferences` through `ApiCache`.
- Cache entries have TTL and are removed after expiry.
- Dio serves cached GET data if a network request fails.
- Logout clears all API cache and secure storage to avoid cross-user leakage.
- Existing `cached_network_image` dependency remains available for image cache; course media display now has safe fallbacks.

## Files Changed

- Android identity/splash:
  - `mobile/android/app/src/main/AndroidManifest.xml`
  - `mobile/android/app/src/main/res/drawable/launch_background.xml`
  - `mobile/android/app/src/main/res/drawable-v21/launch_background.xml`
  - `mobile/android/app/src/main/res/values/colors.xml`
- Flutter core:
  - `mobile/lib/core/cache/api_cache.dart`
  - `mobile/lib/core/api/api_client.dart`
  - `mobile/lib/core/api/endpoints.dart`
  - `mobile/lib/core/auth/auth_provider.dart`
  - `mobile/lib/core/l10n/app_localizations.dart`
- Flutter UI:
  - `mobile/lib/features/dashboard/shell_screen.dart`
  - `mobile/lib/widgets/app_sidebar.dart`
  - `mobile/lib/features/payment/pricing_screen.dart`
  - `mobile/lib/features/course/course_screen.dart`
- Tests:
  - `mobile/test/api_cache_test.dart`
  - `mobile/test/platform_parity_test.dart`

## Validation So Far

- `flutter pub get`: passed
- `flutter test`: passed, 6 tests
- `flutter analyze`: passed, no issues
- APK build: passed after flutter clean retry. Output: mobile/build/app/outputs/flutter-apk/app-x86_64-debug.apk

## Evidence Path

`.codex-run-logs/mobile-full-web-parity`

No emulator screenshots have been captured yet. This PR must remain Draft until emulator evidence is added.

## Remaining Blockers Before Ready

- Run and capture emulator evidence for auth, image course, video course, Arabic course, payment, offline payment, and cache behavior.
- Install APK on emulator and capture screenshots/logs.
- Verify no horizontal overflow on real emulator widths.
- Decide and implement mobile admin scope, or explicitly exclude admin mobile in acceptance criteria.
- Verify Paymob WebView on emulator.
- Verify Vodafone Cash and InstaPay with backend receiver config.
- Verify PDF/PPT mobile download behavior if required for this PR.
