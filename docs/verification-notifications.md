# Notifications Verification

Date: 2026-06-30
Branch: `codex/platform-settings-ai-blueprints`

## Scope

- Backend in-app notification APIs.
- Admin notification composer.
- Mobile notification inbox, unread badge, read/read-all actions, and device registration.
- Cross-platform smoke checks after the notification work.

## Results

| Check | Result |
| --- | --- |
| `php artisan test` | Passed: 93 tests, 300 assertions |
| `CI=true npm run build` | Passed |
| `flutter analyze` | Passed: no issues found |
| `flutter test` | Passed: 18 tests |
| Android x64 debug APK build | Passed |
| Electron Windows build | Passed |
| Local API `/api/platform-settings` | HTTP 200 |
| Local API `/api/content-blueprints` | HTTP 200 |
| Install APK on `emulator-5554` | Passed |
| Launch `com.inolty.novais` on emulator | Passed, process stayed running |
| Launch `dist/win-unpacked/NOVAIS.exe` | Passed, process stayed running during smoke check |

## Runtime Evidence

Local screenshots were captured under `.codex-run-logs/platform-settings-ai-blueprints/notifications/`:

- `emulator-launch.png`: NOVAIS splash screen.
- `emulator-after-wait.png`: NOVAIS mobile landing screen rendered after splash.

Those local run logs are intentionally ignored by git, so this document records the PR-trackable verification summary.

## Notification Notes

This PR implements in-app notifications and mobile device registration. External provider push delivery through Firebase/APNs is not included because the repository does not currently contain Firebase/APNs configuration or provider credentials.
