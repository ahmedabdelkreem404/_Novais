# NOVAIS API Inventory

This inventory documents the web, Flutter mobile, and desktop-web-wrapper API surface. Desktop consumes the same web frontend bundle, so it receives the same API behavior as web unless Electron networking is changed.

| Area | Method | Endpoint | Auth | Admin | Web | Mobile | Request fields | Response fields | Cache | Security notes | Related screen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | POST | `/api/auth/login` | No | No | Yes | Yes | email, password | token, user | No | Device throttled | Login |
| Auth | POST | `/api/auth/register` | No | No | Yes | Yes | name/email/password/profile | token/user/status | No | Device throttled, validates email | Register |
| Auth | POST | `/api/auth/logout` | Yes | No | Yes | Yes | none | success | No | Clears client auth cache | Profile/sidebar |
| Auth | GET | `/api/auth/user-profile` | Yes | No | Yes | Yes | none | user, subscription_usage | Mobile GET cache | User plan/profile |
| Profile | POST/PUT | `/api/auth/user-profile` | Yes | No | Yes | Yes | profile fields | user | No | Own profile only | Profile |
| Dashboard | GET | `/api/user` | Yes | No | Yes | Yes | none | user | Mobile GET cache | Dashboard |
| Courses | GET | `/api/courses` | Yes | No | Yes | Yes | none | courses[] | Mobile GET cache | Dashboard/courses |
| Courses | POST | `/api/generate-course` | Yes | No | Yes | Yes | topic, type, language, numModules, subTopics, level, blueprint_slug | success, data outline | No | Device check, platform gates, blueprint must be enabled | Create/generating |
| Courses | POST | `/api/course` | Yes | No | Yes | Yes | mainTopic, type, language, content, blueprint_slug | courseId, success | No | Stores selected blueprint on course | Topic review/save |
| Courses | GET | `/api/courses/{id}` | Yes | No | Yes | Yes | id/public_id | course, lessons | Mobile GET cache | Course details |
| Lessons | GET | `/api/courses/{courseId}/lessons/{lessonId}` | Yes | No | Yes | Yes | ids | lesson content/media | Mobile GET cache | Lesson player |
| AI | POST | `/api/generate` | Yes | No | Yes | Partial | prompt/context | generated text | No | Auth required | Chat/tools |
| AI | POST | `/api/generate-lesson` | Yes | No | Yes | Yes | lesson/course context | lesson payload | No | Auth required | Lazy lesson generation |
| Chat | POST | `/api/chat` | Yes | No | Yes | Yes | course_id, message | assistant message | No | Own course context | Course chat |
| Chat | GET | `/api/courses/{courseId}/chat/history` | Yes | No | Yes | Yes | course id | messages[] | Mobile GET cache | Course chat |
| Notes | REST | `/api/notes` | Yes | No | Yes | Yes | course_id, lesson_id, content | note(s) | Mobile GET cache for GET | Own notes only | Notes |
| Quiz | POST | `/api/courses/{id}/quiz` | Yes | No | Yes | Yes | course id | quiz/questions | No | Own course only | Quiz |
| Quiz | GET | `/api/courses/{id}/quiz` | Yes | No | Yes | Yes | course id | quizzes[] | Mobile GET cache | Quiz |
| Certificate | POST | `/api/courses/{id}/certificate` | Yes | No | Yes | Yes | course id | certificate/download | No | Own course completion | Certificate |
| Exports | GET | `/api/courses/{id}/export/pdf` | Yes | No | Yes | Planned | course id | PDF file | No | Feature flag controls visibility | PDF export |
| Exports | GET | `/api/courses/{id}/export/ppt` | Yes | No | Yes | Planned | course id | PPTX file | No | Feature flag controls visibility | PPT export |
| Pricing | GET | `/api/plans` | No | No | Yes | Yes | none | plans[] | Mobile GET cache | Public safe | Pricing |
| Paymob | POST | `/api/payment/checkout` | Yes | No | Yes | Yes | plan/payment method | checkout URL/status | No | Payment secrets server-side only | Payment |
| Paymob | POST | `/api/payment/webhook` | No | No | Server | No | Paymob payload | status | No | Signature validation expected | Payment callback |
| Offline payments | GET | `/api/offline-payments/instructions` | Yes | No | Yes | Yes | none | instructions/methods | Mobile GET cache | Public user-safe instructions | Offline payment |
| Offline payments | GET/POST | `/api/offline-payments` | Yes | No | Yes | Yes | plan/proof/reference | requests/request | GET cached mobile | Own requests only | Offline payment |
| Notifications | GET | `/api/notifications` | Yes | No | Planned | Yes | per_page | notifications, unread_count | Mobile GET cache | Own notifications only | Mobile notifications |
| Notifications | POST | `/api/notifications/{id}/read` | Yes | No | Planned | Yes | id | success, notification | No | Own notification only | Mobile notifications |
| Notifications | POST | `/api/notifications/read-all` | Yes | No | Planned | Yes | none | success | No | Own notifications only | Mobile notifications |
| Notification devices | POST | `/api/notification-devices` | Yes | No | No | Yes | device_id, platform, push_token | device | No | User-scoped device registration; push token optional | Mobile bootstrap |
| Platform settings | GET | `/api/platform-settings` | No | No | Yes | Yes | none | safe platform settings | Backend cache 5 min, mobile GET cache | Secrets stripped by key policy | All clients |
| Platform settings legacy | GET | `/api/platform-config` | No | No | Yes legacy | Yes legacy | none | same as platform-settings | Same | Compatibility alias | Existing screens |
| Admin settings | GET | `/api/admin/platform-settings` | Yes | Yes | Yes | No | none | editable settings | No | Admin middleware | Admin platform settings |
| Admin settings | PUT | `/api/admin/platform-settings` | Yes | Yes | Yes | No | validated settings | saved settings | Clears backend cache | Rejects unknown invalid values; secret fields not accepted | Admin platform settings |
| Content blueprints | GET | `/api/content-blueprints` | No | No | Yes | Yes | none | enabled public blueprints | Mobile GET cache | Prompt instructions hidden | Create screens |
| Admin blueprints | GET | `/api/admin/content-blueprints` | Yes | Yes | Yes | No | none | full blueprints | No | Admin only | Admin AI blueprints |
| Admin blueprints | POST | `/api/admin/content-blueprints` | Yes | Yes | Yes | No | blueprint schema | blueprint | No | Validates slug uniqueness and JSON fields | Admin AI blueprints |
| Admin blueprints | PUT | `/api/admin/content-blueprints/{id}` | Yes | Yes | Yes | No | blueprint schema | blueprint | No | Admin only | Admin AI blueprints |
| Admin blueprints | DELETE | `/api/admin/content-blueprints/{id}` | Yes | Yes | Yes | No | id | disabled=true | No | Disables instead of destructive delete | Admin AI blueprints |
| Admin users | GET/DELETE | `/api/admin/users` | Yes | Yes | Yes | No | optional id | users/status | No | Admin only | Admin users |
| Admin courses | GET/PUT/DELETE | `/api/admin/courses` | Yes | Yes | Yes | No | metadata/status | courses/status | No | Admin only | Admin courses |
| Admin payments | GET | `/api/admin/paid-users` | Yes | Yes | Yes | No | none | users/payments | No | Admin only | Admin payments |
| Admin offline payments | GET/POST | `/api/admin/offline-payments` | Yes | Yes | Yes | No | status/admin_note | requests/status | No | Admin only, proof endpoint protected | Admin offline payments |
| Admin notifications | GET | `/api/admin/notifications` | Yes | Yes | Yes | No | none | notifications | No | Admin only | Admin notifications |
| Admin notifications | POST | `/api/admin/notifications` | Yes | Yes | Yes | No | target, user_id, title, body, type, data | created_count, notification | No | Admin only; broadcast creates per-user rows | Admin notifications |
| Admin plans | GET/PUT | `/api/admin/plans` | Yes | Yes | Yes | No | plan fields | plans/status | No | Admin only | Admin plans |
| CMS blogs | GET | `/api/blogs`, `/api/blogs/{slug}` | No | No | Yes | Yes | slug | blog(s) | Mobile GET cache | Public | Blog |
| CMS pages | GET | `/api/pages/{slug}`, `/api/policies` | No | No | Yes | Yes | slug | page/policies | Mobile GET cache | Public | Policy pages |
| Admin CMS | POST/PUT/DELETE | `/api/admin/blogs`, `/api/admin/pages/{slug}` | Yes | Yes | Yes | No | content fields | status | No | Admin only | Admin CMS |

## Platform Settings Schema

Settings are stored in `platform_settings` with `key`, JSON `value`, `group`, `is_public`, `description`, timestamps. The current aggregate key is `platform_config`. Public responses are sanitized and cached under `platform_settings.public`.

Main groups include identity, branding, language, theme behavior (`system`, `system_default`, `light_only`, `dark_only`, `user_choice`), hero media/video behavior, feature visibility, payment visibility, download links, and SEO.

## Content Blueprint Schema

Blueprints are stored in `content_blueprints` with name, slug, enabled, sort_order, language_support, target_academic_level, output_structure, required_sections, optional_sections, default_count, assessment_rules, media_rules, citation_rules, tone_rules, output_format_rules, prompt_instructions, validation_schema, timestamps.

Public clients receive enabled blueprints without prompt instructions. Admins receive full editable records.
