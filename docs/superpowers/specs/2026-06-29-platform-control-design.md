# NOVAIS Platform Control Design

## Goal

Make the admin dashboard the source of truth for commercial and access-control behavior across the website and Flutter app. Prices, subscription limits, enabled languages, free/pro feature access, course creation availability, and primary public content should come from the backend instead of hardcoded frontend defaults.

## Current Context

The Laravel backend already has `plans`, public `/api/plans`, and admin `/api/admin/plans` endpoints. The React pricing page and Flutter pricing screen both read `/api/plans`, but React still falls back to fixed values such as `50`, `80`, and yearly multipliers. React and Flutter course creation screens also make local premium decisions, such as non-English languages requiring Pro and video courses requiring Pro.

The React admin dashboard already has a `Plans` page. Public auth pages currently render their own `Header` and `Footers` rather than using the same public shell consistently.

## Recommended Approach

Extend the existing dashboard and backend instead of creating a large new admin system.

Keep plan management in the existing Admin Plans page, and add a small Platform Settings admin section for feature access and language/course-type control. Expose the combined public runtime configuration through a public backend endpoint used by both React and Flutter.

## Backend Design

Add a persistent platform configuration model, backed by a migration and seeded defaults.

The configuration should include:

- `course_creation_enabled`
- `all_languages_free`
- `video_courses_enabled`
- `video_courses_free`
- `enabled_languages`
- `free_languages`
- `enabled_course_types`
- `free_course_types`

The backend will expose:

- `GET /api/platform-config`: public runtime config for website and app.
- `GET /api/admin/platform-config`: admin view of the full config.
- `PUT /api/admin/platform-config`: admin update endpoint.

The backend must enforce these settings when creating or generating courses. The frontend can hide locked options, but Laravel remains authoritative. If course creation is disabled or a user attempts a non-free feature without an eligible plan, the API returns a clear 403 response.

Plans remain in the existing `plans` table. `SubscriptionService` should continue reading from database plans, but fixed env price fallbacks should not be used for normal frontend display. If there are no plans, the public API should return an empty/config error state rather than silently inventing prices.

## Admin Dashboard Design

Extend the existing `src/admin/plans.js` page for commercial plan values:

- Name, description, features in Arabic and English.
- EGP price.
- Course limit, where `-1` means unlimited.

Add a focused Platform Settings admin page or section:

- Toggle course creation on/off.
- Toggle all languages free.
- Toggle video courses on/off.
- Toggle video courses free.
- Manage available languages.
- Mark each language as free or Pro.
- Manage available course types.
- Mark each course type as free or Pro.

The page should save directly to Laravel and refetch after saving. Existing admin auth and `is_admin` middleware should be used.

## React Website Design

Pricing:

- Fetch `/api/plans`.
- Remove hardcoded frontend prices and plan fallback prices.
- Show loading, empty, or error states if backend plans are unavailable.
- Yearly pricing should come from backend data if supported, or use an explicit backend-owned multiplier/config value. It should not be an invisible frontend assumption.

Course creation:

- Fetch `/api/platform-config`.
- Render language and course type options from backend config.
- Show upgrade badges/modals only when the backend config marks an option as Pro for the current user.
- If config says all languages or video courses are free, unlock them immediately.

Public auth pages:

- Make sign in and sign up use the same public navigation/mobile menu shell as the rest of the site.
- Preserve the white centered auth card, logo, field styling, and mobile visual style shown in the screenshots.
- Remove unnecessary visual drift between sign in and sign up while keeping their form-specific requirements.

## Flutter App Design

Add an API endpoint constant and provider for `/platform-config`.

Pricing:

- Continue using `/plans`.
- Remove any fixed price assumptions from display and payment payloads.
- Show backend-driven empty/error states.

Course creation:

- Load platform config before rendering selectable languages and course types.
- Replace local checks like "non-English is premium" and "video is premium" with backend config decisions.
- Keep the final create request guarded by the backend response.

## Data Flow

1. Admin updates plans or platform settings in dashboard.
2. Laravel persists the values.
3. Website and Flutter fetch `/api/plans` and `/api/platform-config`.
4. UI updates on page open or refresh.
5. Course creation requests are validated again by Laravel using the same config.

## Error Handling

If `/api/platform-config` fails, course creation should fail closed for paid-only or disabled behavior and show a retry/error message. Pricing should not invent prices if `/api/plans` fails.

If a user attempts a locked feature, the API should return 403 with a message key that both React and Flutter can localize.

## Testing

Backend tests:

- Public platform config returns seeded defaults.
- Admin can update config.
- Non-admin cannot update config.
- Course creation respects disabled creation.
- Free user cannot use Pro-only language/type.
- Free user can use a language/type after admin marks it free.

Frontend checks:

- React pricing has no hardcoded price fallback.
- React create page unlocks languages/video when config allows them.
- Flutter create page unlocks languages/video when config allows them.
- Auth pages render inside the shared public shell and remain responsive on mobile.

## Out of Scope

This design does not replace the whole dashboard with a new CMS. It also does not rebuild payment providers. It only makes existing plan, feature, language, and course-type behavior backend-driven and consistent across website and app.
