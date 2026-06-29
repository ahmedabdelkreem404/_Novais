# Spec: Platform Control and Parity Hardening Design

## Goal
Implement end-to-end dynamic, admin-driven control over platform settings, branding, homepage hero media behavior (video controls, looping, autoplay, mute, poster/loading states), dark/light theme lock vs. user-toggle, payment checkout page visibility, and feature toggles. Both the React website and Flutter mobile app must consume these configurations from the same backend APIs with robust caching, localizations, and validation.

## 1. Database & Backend API Design

We will extend `PlatformSetting` model defaults and add validation rules in `PlatformConfigController.php`.

### Platform Settings Schema Additions
We will add the following key-value configurations under the `platform_config` key:

*   **Branding & Identity**:
    *   `branding_platform_name_en` / `branding_platform_name_ar` (strings)
    *   `branding_logo_url` (string / upload path)
    *   `branding_favicon_url` (string / upload path)
*   **Theme Behavior**:
    *   `system_theme_mode`: `'user_choice' | 'system_default' | 'light_only' | 'dark_only'`
    *   `theme_default_mode`: `'light' | 'dark'`
*   **Hero Media & Video Customizer**:
    *   `hero_media_type`: `'image' | 'video'`
    *   `hero_media_url` (string)
    *   `hero_video_enabled`: boolean (if false, fallback to image/poster)
    *   `hero_video_autoplay`: boolean
    *   `hero_video_loop_mode`: `'loop_forever' | 'play_once' | 'play_once_then_image'`
    *   `hero_video_fallback_image`: string (URL of image to show if video fails to load or ends)
    *   `hero_video_poster`: string (URL of image shown until video loads)
    *   `hero_video_controls_hidden`: boolean (hides default player UI controls)
    *   `hero_video_display_target`: `'both' | 'web_only' | 'mobile_only'`
    *   `hero_video_replace_low_bandwidth`: boolean (replaces video with static image on mobile network/low connection)
*   **Payment & Visibility Behavior**:
    *   `payment_methods_visible`: boolean (toggles checkout & upgrade UI pages)
    *   `offline_payment_instructions_en` / `offline_payment_instructions_ar` (text)
*   **Feature Flags**:
    *   `feature_pdf_export_enabled` (boolean)
    *   `feature_ppt_export_enabled` (boolean)
    *   `feature_notes_enabled` (boolean)
    *   `feature_quiz_enabled` (boolean)
    *   `feature_chat_enabled` (boolean)
    *   `feature_audio_courses_enabled` (boolean)
*   **SEO / Social**:
    *   `seo_meta_title_en` / `seo_meta_title_ar` (strings)
    *   `seo_meta_description_en` / `seo_meta_description_ar` (text)
    *   `seo_meta_keywords_en` / `seo_meta_keywords_ar` (text)

### Endpoints
*   `GET /api/platform-settings`: Public endpoint. Returns filtered config (excludes admin secrets or backend-only params). Cached using Laravel Cache facade with automatic invalidation on updates.
*   `GET /api/admin/platform-settings`: Authenticated admin endpoint. Returns the entire configuration.
*   `PUT /api/admin/platform-settings`: Authenticated admin update endpoint. Rebuilds public cache.

---

## 2. Admin Dashboard Redesign

The admin platform settings view (`/admin/platform-settings`) will be restructured into a responsive, tabbed grid interface using modern Tailwind, glassmorphism, and custom icons.

### Tabs
1.  **Identity & Branding**: Configures site name, logo, favicon, and upload handlers.
2.  **Theme Config**: Controls light/dark/default mode locks.
3.  **Hero Media**: Controls image/video URLs, autoplay, loop modes, sound, poster image, target, and bandwidth fallbacks.
4.  **Localization & Content**: Handles language lists, free vs premium flags, levels, depths, and modules limits.
5.  **Visibility & Payments**: Controls checkout visibility toggle and offline payment instructions.
6.  **Feature Flags**: Checkboxes for enabling/disabling PDF exports, PPT, notes, quiz, chat, and audio courses.
7.  **SEO & Socials**: Sets meta titles, descriptions, keywords for SEO optimization.
8.  **Desktop & Mobile**: Configures app installer URLs and mobile copies.

### Responsiveness Rules
*   Form grids collapse to `grid-cols-1` under 640px.
*   Horizontal pill navigation wraps or becomes scrollable with hidden scrollbars.
*   Modals and upload buttons scale down padding and fonts under 350px width.
*   Save bar floats sticky at the bottom with keyboard-safe margins.

---

## 3. Web & Mobile Integration Flows

### Web Theme Behavior
React `App.js` fetches `/api/platform-settings` on mount and stores settings.
*   If `light_only`: Set HTML class `theme-light`, remove `dark`, hide theme toggle.
*   If `dark_only`: Set HTML class `dark`, hide theme toggle.
*   If `system_default`: Check `window.matchMedia('(prefers-color-scheme: dark)')` to apply dark class.
*   If `user_choice`: Default to stored user theme or OS preference, allow toggle.

### Web Video Behavior
*   If video is enabled, render `<video>` without `controls` if `hero_video_controls_hidden` is true.
*   Autoplay/muted/loop tags are applied dynamically.
*   `onEnded` event: if `loop_mode` is `'play_once_then_image'`, hide video element and display `hero_video_fallback_image`.
*   Show `hero_video_poster` during loading. On error, fallback to `hero_video_fallback_image`.

### Mobile Flutter Behavior
*   Flutter app reads `GET /api/platform-settings` on splash/auth state check.
*   Theme settings apply directly to `MaterialApp` themeMode.
*   Landing screen hero media checks `hero_video_display_target` and `hero_video_enabled`.
    *   If enabled, uses `video_player` plugin to load video.
    *   If play-once is set, stops playing after 1 cycle.
    *   Hides controls overlay.
    *   On mobile data / low bandwidth (detected using connectivity plugin or simple fallback), falls back to static image if `hero_video_replace_low_bandwidth` is active.

---

## 4. Testing & Verification Plan

### Automated Tests
*   Laravel PHPUnit integration tests for private settings protection.
*   React production build checks.
*   Flutter analyze and build checks.

### Manual Verification
*   Test responsive layouts on Google Chrome devtools down to 300x500.
*   Test video toggle options, loop controls, and poster uploaders.
*   Test theme mode toggling and locking.
