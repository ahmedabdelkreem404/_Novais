# Platform Control Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement fully dynamic, backend-driven controls for platform settings, theme locking, homepage hero video customizable actions, payment visibilities, feature flags, and mobile/web syncing parity.

**Architecture:** Extend Laravel backend `PlatformSetting` configuration defaults, filter public JSON payloads, rebuild React Admin interface into a fully responsive tabbed dashboard, lock web/app theme dynamically, support low-bandwidth static fallbacks, and build Flutter app client configuration sync.

**Tech Stack:** PHP (Laravel), React.js, Tailwind CSS, Dart (Flutter / Riverpod)

## Global Constraints
- Keep all designs fully responsive from 300x500 to 1920x1080.
- No horizontal overflows, clipped buttons, or hidden primary actions on small viewports.
- Validate all incoming parameters on Laravel backend.
- Rebuild/invalidate cache automatically when settings are updated.

---

### Task 1: Backend Database Defaults & Public API Filtering

**Files:**
- Modify: `backend/app/Models/PlatformSetting.php`
- Modify: `backend/app/Http/Controllers/PlatformConfigController.php`
- Test: `backend/tests/Feature/PlatformConfigTest.php`

**Interfaces:**
- Consumes: None
- Produces: Safe platform settings JSON via public `/api/platform-config` endpoint.

- [ ] **Step 1: Write a failing test in PHPUnit**
  Ensure public config filters out admin/system-only keys.
  Edit `backend/tests/Feature/PlatformConfigTest.php` to add:
  ```php
  public function test_public_config_excludes_admin_only_fields()
  {
      $response = $this->getJson('/api/platform-config');
      $response->assertStatus(200);
      $response->assertJsonMissing(['secret_private_key']);
  }
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `php artisan test --filter=PlatformConfigTest`

- [ ] **Step 3: Update PlatformSetting.php defaults**
  Open `backend/app/Models/PlatformSetting.php` and append the new configurations:
  ```php
            'hero_video_enabled' => true,
            'hero_video_autoplay' => true,
            'hero_video_loop_mode' => 'loop_forever', // 'loop_forever' | 'play_once' | 'play_once_then_image'
            'hero_video_fallback_image' => null,
            'hero_video_poster' => null,
            'hero_video_controls_hidden' => true,
            'hero_video_display_target' => 'both', // 'both' | 'web_only' | 'mobile_only'
            'hero_video_replace_low_bandwidth' => true,
            'branding_platform_name_en' => 'NOVAIS',
            'branding_platform_name_ar' => 'نوفايس',
            'branding_logo_url' => null,
            'branding_favicon_url' => null,
            'theme_default_mode' => 'dark',
            'payment_methods_visible' => true,
            'offline_payment_instructions_en' => 'Please send subscription price to bank account XXXX.',
            'offline_payment_instructions_ar' => 'الرجاء إرسال قيمة الاشتراك إلى الحساب البنكي XXXX.',
            'feature_pdf_export_enabled' => true,
            'feature_ppt_export_enabled' => true,
            'feature_notes_enabled' => true,
            'feature_quiz_enabled' => true,
            'feature_chat_enabled' => true,
            'feature_audio_courses_enabled' => true,
            'seo_meta_title_en' => 'NOVAIS - AI Learning platform',
            'seo_meta_title_ar' => 'نوفايس - منصة التعلم بالذكاء الاصطناعي',
            'seo_meta_description_en' => 'Generate personalized courses using AI.',
            'seo_meta_description_ar' => 'ولد كورسات مخصصة باستخدام الذكاء الاصطناعي.',
            'seo_meta_keywords_en' => 'ai, course, learn',
            'seo_meta_keywords_ar' => 'ذكاء اصطناعي, كورس, تعلم',
            'secret_private_key' => 'super_secret_value',
  ```

- [ ] **Step 4: Update PlatformConfigController.php**
  Expose public vs. admin configurations separately and add validator rules:
  ```php
    public function show()
    {
        $config = PlatformSetting::currentConfig();
        unset($config['secret_private_key']);
        return response()->json($config);
    }
  ```
  Also update `update()` validation list to include all new parameters as validation types.

- [ ] **Step 5: Run tests to verify they pass**
  Run: `php artisan test --filter=PlatformConfigTest`

- [ ] **Step 6: Commit changes**
  ```bash
  git add backend/
  git commit -m "feat: add platform configuration options and public endpoint filtering"
  ```

---

### Task 2: Redesign Admin Platform Settings Page (React)

**Files:**
- Modify: `src/admin/platformsettings.js`

**Interfaces:**
- Consumes: `/api/admin/platform-config`
- Produces: Redesigned Dashboard tab panels.

- [ ] **Step 1: Replace layout with a grid-tabbed design**
  Create tabs for: Identity, Theme, Hero Media, Localization, Payments, Feature Flags, SEO, Apps.
  Collapse side-by-side components to vertical blocks under `md` (768px) boundary.
  Wrap tag pills on mobile.

- [ ] **Step 2: Add uploaders and selectors for video poster, low bandwidth fallback, and logo/favicons**
  Implement file uploads targeting `/admin/media/upload` for:
  - Branding Logo
  - Branding Favicon
  - Hero Video Fallback Image
  - Hero Video Poster

- [ ] **Step 3: Test responsiveness on Chrome DevTools**
  Scale width to 300x500, verify no text overlapping or horizontal scrolling.

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/admin/platformsettings.js
  git commit -m "feat: redesign platform settings admin panel with dynamic tabs and media fields"
  ```

---

### Task 3: React Web App Theme & Video Lock Implementation

**Files:**
- Modify: `src/App.js`
- Modify: `src/pages/landing.js`
- Modify: `src/components/DarkModeToggle.js`

- [ ] **Step 1: Check and apply theme locks**
  Update `src/App.js`'s theme listener to fetch config and enforce `light_only` or `dark_only` dynamically.
  Hide toggle button in `DarkModeToggle.js` if locked.

- [ ] **Step 2: Update landing.js hero player**
  Respect `hero_video_enabled`, `hero_video_autoplay`, `hero_video_loop_mode`, `hero_video_fallback_image`, `hero_video_poster`, `hero_video_controls_hidden` options.
  Bind `onEnded` event on the `<video>` element. If loop mode is `'play_once_then_image'`, hide the video and show `hero_video_fallback_image`.

- [ ] **Step 3: Run web production build to ensure warning-free compilation**
  Run: `npm run build`

- [ ] **Step 4: Commit changes**
  ```bash
  git add src/
  git commit -m "feat: enforce platform settings theme locks and media behaviors on web client"
  ```

---

### Task 4: Flutter Mobile App Parity Implementation

**Files:**
- Modify: `mobile/lib/models/platform_config.dart`
- Modify: `mobile/lib/main.dart`
- Modify: `mobile/lib/features/landing/landing_screen.dart`
- Modify: `mobile/lib/widgets/app_sidebar.dart`
- Modify: `mobile/lib/features/profile/profile_screen.dart`
- Modify: `mobile/lib/features/dashboard/shell_screen.dart`

- [ ] **Step 1: Update PlatformConfig model**
  Read all new branding, theme, video customizer, feature flags, and payment visibility options from JSON payload.

- [ ] **Step 2: Bind theme settings dynamically in main.dart**
  Enforce theme locks globally when `platformConfigProvider` updates.
  Hide theme toggles inside:
  - `mobile/lib/widgets/app_sidebar.dart`
  - `mobile/lib/features/profile/profile_screen.dart`
  - `mobile/lib/features/dashboard/shell_screen.dart`

- [ ] **Step 3: Implement Video Customizer on landing_screen.dart**
  Use Flutter's `video_player` plugin to load and display hero video based on backend config.
  Respect autoplay, loop/once constraints, and hide controls.
  Implement a low-bandwidth fallback check: if mobile connectivity is slow or `hero_video_replace_low_bandwidth` is active, display the static fallback image.

- [ ] **Step 4: Run flutter analysis and unit tests**
  Run: `flutter analyze`
  Run: `flutter test`

- [ ] **Step 5: Commit changes**
  ```bash
  git add mobile/
  git commit -m "feat: sync platform settings, theme locking, and hero video parameters to mobile app"
  ```

---

### Task 5: Create API Inventory Documentation

**Files:**
- Create: `docs/api-inventory.md`

- [ ] **Step 1: Document all API contracts**
  Detail endpoint, method, auth state, web/mobile consumption status, request, response, and cache TTL for:
  - Auth, Profile, Dashboards, Courses, Lessons
  - AI Course Generation, Audio Courses, Chat, Notes, Quiz, Certificates
  - Payments (Paymob, Offline payment instructions)
  - Platform settings (Public and Admin endpoints)

- [ ] **Step 2: Commit documentation**
  ```bash
  git add docs/api-inventory.md
  git commit -m "docs: add comprehensive API inventory for web and mobile clients"
  ```
