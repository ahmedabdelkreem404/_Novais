# NOVAIS Notification Readiness

## Implemented and Testable

- Backend in-app notifications with read/unread state.
- Admin broadcast notifications to all users.
- Admin user-specific notifications.
- Admin scheduling through `scheduled_at`; users only receive notifications when the scheduled time is due.
- English and Arabic notification content through `data.localized`.
- Mobile notification inbox and unread badge.
- Mobile device registration endpoint with optional `push_token` storage.
- Login-triggered welcome notification, created once per user.
- Course-created notification after a generated course is saved.

## Android Push Notification Status

Android notification-shade push is not enabled until Firebase Cloud Messaging is configured for the production app.

Required before claiming push delivery:

- Add Firebase project configuration for Android.
- Add `google-services.json` to the mobile Android app.
- Add Flutter Firebase Messaging dependencies and Android notification channel setup.
- Send and verify FCM tokens through `/notification-devices`.
- Add a backend sender for FCM delivery, retries, and failure logging.

Until those prerequisites are present, NOVAIS supports reliable API-backed in-app notifications and badges, not native push notifications.
