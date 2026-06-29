# Platform Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make plans, prices, language access, course-type access, and course creation controls backend-driven across the React website and Flutter app.

**Architecture:** Add a Laravel `PlatformSetting` model plus public/admin config endpoints. React and Flutter consume `/api/platform-config` for runtime feature access, while Laravel enforces the same config during course generation and saving. Existing Admin Plans remain the plan editor; a new Admin Platform Settings page manages feature gates.

**Tech Stack:** Laravel/PHP, PHPUnit, React, axios, react-router, Flutter, Riverpod, Dio.

---

## File Structure

- Create `backend/database/migrations/2026_06_29_000001_create_platform_settings_table.php`: stores singleton platform config rows.
- Create `backend/app/Models/PlatformSetting.php`: JSON-cast config model with defaults and merge/update helpers.
- Create `backend/app/Http/Controllers/PlatformConfigController.php`: public and admin platform config endpoints.
- Modify `backend/routes/api.php`: register public and admin platform-config routes.
- Modify `backend/app/Http/Controllers/CourseController.php`: enforce course creation, language, and course-type gates.
- Modify `backend/app/Http/Controllers/CMSController.php`: remove public plan fallback behavior if present and return DB-backed plans.
- Create `backend/tests/Feature/PlatformConfigTest.php`: config API and enforcement tests.
- Modify `src/App.js`: add admin route for platform settings and wrap auth routes in shared public shell.
- Modify `src/admin/components/AdminLayout.js`: add Platform Settings menu item.
- Create `src/admin/platformsettings.js`: admin editor for feature/language/course-type gates.
- Modify `src/pages/pricing.js`: remove hardcoded price fallbacks and handle empty/error plans.
- Modify `src/pages/create.js`: fetch platform config and replace local language/type gating.
- Modify `src/pages/signin.js` and `src/pages/signup.js`: remove duplicate standalone header/footer usage so shared public layout owns navigation/footer.
- Modify `mobile/lib/core/api/endpoints.dart`: add `platformConfig`.
- Create `mobile/lib/models/platform_config.dart`: typed runtime config model.
- Create `mobile/lib/core/platform/platform_config_provider.dart`: Riverpod fetch provider.
- Modify `mobile/lib/features/create/create_screen.dart`: replace local language/type gating with backend config.
- Modify `mobile/lib/features/payment/pricing_screen.dart`: keep pricing display strictly backend-driven.

---

### Task 1: Backend Platform Config Schema And Model

**Files:**
- Create: `backend/database/migrations/2026_06_29_000001_create_platform_settings_table.php`
- Create: `backend/app/Models/PlatformSetting.php`
- Test: `backend/tests/Feature/PlatformConfigTest.php`

- [ ] **Step 1: Write failing schema/defaults tests**

Create `backend/tests/Feature/PlatformConfigTest.php` with:

```php
<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PlatformConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_settings_table_exists(): void
    {
        $this->assertTrue(Schema::hasTable('platform_settings'));
        $this->assertTrue(Schema::hasColumns('platform_settings', [
            'key',
            'value',
        ]));
    }

    public function test_platform_setting_defaults_are_available(): void
    {
        $config = PlatformSetting::currentConfig();

        $this->assertTrue($config['course_creation_enabled']);
        $this->assertFalse($config['all_languages_free']);
        $this->assertTrue($config['video_courses_enabled']);
        $this->assertFalse($config['video_courses_free']);
        $this->assertContains('English', $config['enabled_languages']);
        $this->assertContains('English', $config['free_languages']);
        $this->assertContains('Theory & Image Course', $config['enabled_course_types']);
        $this->assertContains('Theory & Image Course', $config['free_course_types']);
    }
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
cd backend
php artisan test --filter=PlatformConfigTest
```

Expected: fail because `platform_settings` table and `PlatformSetting` model do not exist.

- [ ] **Step 3: Add migration**

Create `backend/database/migrations/2026_06_29_000001_create_platform_settings_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
```

- [ ] **Step 4: Add model with defaults**

Create `backend/app/Models/PlatformSetting.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    public const CONFIG_KEY = 'platform_config';

    public static function defaults(): array
    {
        return [
            'course_creation_enabled' => true,
            'all_languages_free' => false,
            'video_courses_enabled' => true,
            'video_courses_free' => false,
            'enabled_languages' => [
                'English',
                'Arabic',
                'French',
                'Spanish',
                'German',
                'Italian',
                'Portuguese',
                'Russian',
                'Japanese',
                'Chinese',
                'Korean',
                'Hindi',
                'Turkish',
                'Polish',
                'Dutch',
            ],
            'free_languages' => ['English'],
            'enabled_course_types' => [
                'Theory & Image Course',
                'Video & Theory Course',
            ],
            'free_course_types' => ['Theory & Image Course'],
        ];
    }

    public static function currentConfig(): array
    {
        $row = static::firstOrCreate(
            ['key' => self::CONFIG_KEY],
            ['value' => static::defaults()]
        );

        return array_replace_recursive(static::defaults(), $row->value ?? []);
    }

    public static function updateConfig(array $value): array
    {
        $config = array_replace_recursive(static::currentConfig(), $value);

        static::updateOrCreate(
            ['key' => self::CONFIG_KEY],
            ['value' => $config]
        );

        return $config;
    }
}
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```powershell
cd backend
php artisan test --filter=PlatformConfigTest
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add backend/database/migrations/2026_06_29_000001_create_platform_settings_table.php backend/app/Models/PlatformSetting.php backend/tests/Feature/PlatformConfigTest.php
git commit -m "feat: add platform config model"
```

---

### Task 2: Backend Platform Config API

**Files:**
- Create: `backend/app/Http/Controllers/PlatformConfigController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/PlatformConfigTest.php`

- [ ] **Step 1: Add failing API tests**

Append these tests to `PlatformConfigTest`:

```php
public function test_public_platform_config_endpoint_returns_config(): void
{
    $response = $this->getJson('/api/platform-config');

    $response->assertOk()
        ->assertJsonPath('course_creation_enabled', true)
        ->assertJsonPath('all_languages_free', false)
        ->assertJsonPath('video_courses_enabled', true);
}

public function test_admin_can_update_platform_config(): void
{
    $admin = \App\Models\User::factory()->create(['role' => 'admin']);
    $token = auth('api')->login($admin);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/admin/platform-config', [
            'all_languages_free' => true,
            'video_courses_free' => true,
            'free_languages' => ['English', 'Arabic'],
            'free_course_types' => ['Theory & Image Course', 'Video & Theory Course'],
        ]);

    $response->assertOk()
        ->assertJsonPath('all_languages_free', true)
        ->assertJsonPath('video_courses_free', true);

    $this->assertTrue(\App\Models\PlatformSetting::currentConfig()['all_languages_free']);
}

public function test_non_admin_cannot_update_platform_config(): void
{
    $user = \App\Models\User::factory()->create(['role' => 'user']);
    $token = auth('api')->login($user);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson('/api/admin/platform-config', [
            'all_languages_free' => true,
        ]);

    $response->assertForbidden();
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
cd backend
php artisan test --filter=PlatformConfigTest
```

Expected: fail because routes/controller do not exist.

- [ ] **Step 3: Add controller**

Create `backend/app/Http/Controllers/PlatformConfigController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use Illuminate\Http\Request;

class PlatformConfigController extends Controller
{
    public function show()
    {
        return response()->json(PlatformSetting::currentConfig());
    }

    public function adminShow()
    {
        return response()->json(PlatformSetting::currentConfig());
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'course_creation_enabled' => 'sometimes|boolean',
            'all_languages_free' => 'sometimes|boolean',
            'video_courses_enabled' => 'sometimes|boolean',
            'video_courses_free' => 'sometimes|boolean',
            'enabled_languages' => 'sometimes|array',
            'enabled_languages.*' => 'string',
            'free_languages' => 'sometimes|array',
            'free_languages.*' => 'string',
            'enabled_course_types' => 'sometimes|array',
            'enabled_course_types.*' => 'string',
            'free_course_types' => 'sometimes|array',
            'free_course_types.*' => 'string',
        ]);

        return response()->json(PlatformSetting::updateConfig($data));
    }
}
```

- [ ] **Step 4: Register routes**

In `backend/routes/api.php`, add after public CMS routes:

```php
Route::get('/platform-config', [\App\Http\Controllers\PlatformConfigController::class, 'show']);
```

Inside the existing admin route group, add:

```php
Route::get('/platform-config', [\App\Http\Controllers\PlatformConfigController::class, 'adminShow']);
Route::put('/platform-config', [\App\Http\Controllers\PlatformConfigController::class, 'update']);
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```powershell
cd backend
php artisan test --filter=PlatformConfigTest
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add backend/app/Http/Controllers/PlatformConfigController.php backend/routes/api.php backend/tests/Feature/PlatformConfigTest.php
git commit -m "feat: expose platform config api"
```

---

### Task 3: Backend Course Enforcement

**Files:**
- Modify: `backend/app/Http/Controllers/CourseController.php`
- Test: `backend/tests/Feature/PlatformConfigTest.php`

- [ ] **Step 1: Add failing enforcement tests**

Append to `PlatformConfigTest`:

```php
public function test_course_generation_can_be_disabled(): void
{
    \App\Models\PlatformSetting::updateConfig(['course_creation_enabled' => false]);
    $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
    $token = auth('api')->login($user);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/generate-course', [
            'topic' => 'Python',
            'type' => 'Theory & Image Course',
            'language' => 'English',
            'numModules' => 5,
        ]);

    $response->assertForbidden()
        ->assertJsonPath('message', 'platform.course_creation_disabled');
}

public function test_free_user_cannot_generate_locked_language(): void
{
    \App\Models\PlatformSetting::updateConfig([
        'all_languages_free' => false,
        'free_languages' => ['English'],
    ]);
    $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
    $token = auth('api')->login($user);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/generate-course', [
            'topic' => 'Python',
            'type' => 'Theory & Image Course',
            'language' => 'Arabic',
            'numModules' => 5,
        ]);

    $response->assertForbidden()
        ->assertJsonPath('message', 'platform.language_requires_upgrade');
}

public function test_free_user_can_generate_language_when_marked_free(): void
{
    \App\Models\PlatformSetting::updateConfig([
        'free_languages' => ['English', 'Arabic'],
    ]);
    $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
    $token = auth('api')->login($user);

    $this->mock(\App\Services\CourseService::class, function ($mock) {
        $mock->shouldReceive('generateOutline')->once()->andReturn([
            'title' => 'Python',
            'chapters' => [],
        ]);
    });

    $this->mock(\App\Services\CurriculumValidator::class, function ($mock) {
        $mock->shouldReceive('normalize')->andReturnUsing(fn ($value) => $value);
    });

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/generate-course', [
            'topic' => 'Python',
            'type' => 'Theory & Image Course',
            'language' => 'Arabic',
            'numModules' => 5,
        ]);

    $response->assertOk()
        ->assertJsonPath('success', true);
}

public function test_free_user_cannot_generate_locked_video_course(): void
{
    \App\Models\PlatformSetting::updateConfig([
        'video_courses_enabled' => true,
        'video_courses_free' => false,
        'free_course_types' => ['Theory & Image Course'],
    ]);
    $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
    $token = auth('api')->login($user);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/generate-course', [
            'topic' => 'Python',
            'type' => 'Video & Theory Course',
            'language' => 'English',
            'numModules' => 5,
        ]);

    $response->assertForbidden()
        ->assertJsonPath('message', 'platform.course_type_requires_upgrade');
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
cd backend
php artisan test --filter=PlatformConfigTest
```

Expected: fail because `CourseController` does not enforce platform config.

- [ ] **Step 3: Add enforcement helpers**

In `backend/app/Http/Controllers/CourseController.php`, add imports:

```php
use App\Models\PlatformSetting;
use App\Services\SubscriptionService;
```

Add private methods inside `CourseController`:

```php
private function isPaidUser($user): bool
{
    return $user->role === 'admin'
        || $user->role === 'premium'
        || (new SubscriptionService())->isPaidStatus($user->sub_status);
}

private function platformGateResponse(Request $request)
{
    $user = auth('api')->user();
    $config = PlatformSetting::currentConfig();
    $language = $request->input('language', 'English');
    $type = $request->input('type', 'Theory & Image Course');
    $isVideo = str_contains(strtolower($type), 'video');
    $isPaid = $this->isPaidUser($user);

    if (!$config['course_creation_enabled']) {
        return response()->json(['message' => 'platform.course_creation_disabled'], 403);
    }

    if (!in_array($language, $config['enabled_languages'], true)) {
        return response()->json(['message' => 'platform.language_disabled'], 403);
    }

    if (!in_array($type, $config['enabled_course_types'], true)) {
        return response()->json(['message' => 'platform.course_type_disabled'], 403);
    }

    if ($isVideo && !$config['video_courses_enabled']) {
        return response()->json(['message' => 'platform.video_courses_disabled'], 403);
    }

    if (!$isPaid && !$config['all_languages_free'] && !in_array($language, $config['free_languages'], true)) {
        return response()->json(['message' => 'platform.language_requires_upgrade'], 403);
    }

    $freeTypes = $config['free_course_types'];
    if ($isVideo && $config['video_courses_free'] && !in_array($type, $freeTypes, true)) {
        $freeTypes[] = $type;
    }

    if (!$isPaid && !in_array($type, $freeTypes, true)) {
        return response()->json(['message' => 'platform.course_type_requires_upgrade'], 403);
    }

    return null;
}
```

- [ ] **Step 4: Call enforcement in `generateCourse` and `store`**

At the top of `generateCourse`, immediately after validation, add:

```php
if ($response = $this->platformGateResponse($request)) {
    return $response;
}
```

At the top of `store`, immediately after validation, add the same block:

```php
if ($response = $this->platformGateResponse($request)) {
    return $response;
}
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```powershell
cd backend
php artisan test --filter=PlatformConfigTest
```

Expected: pass.

- [ ] **Step 6: Commit**

```powershell
git add backend/app/Http/Controllers/CourseController.php backend/tests/Feature/PlatformConfigTest.php
git commit -m "feat: enforce platform course gates"
```

---

### Task 4: React Admin Platform Settings Page

**Files:**
- Create: `src/admin/platformsettings.js`
- Modify: `src/App.js`
- Modify: `src/admin/components/AdminLayout.js`

- [ ] **Step 1: Add admin page component**

Create `src/admin/platformsettings.js`:

```javascript
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { serverURL } from '../constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const textList = (value) => Array.isArray(value) ? value.join('\n') : '';
const lines = (value) => value.split('\n').map((item) => item.trim()).filter(Boolean);

const PlatformSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    course_creation_enabled: true,
    all_languages_free: false,
    video_courses_enabled: true,
    video_courses_free: false,
    enabled_languages: '',
    free_languages: '',
    enabled_course_types: '',
    free_course_types: '',
  });

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${serverURL}/admin/platform-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({
        course_creation_enabled: !!res.data.course_creation_enabled,
        all_languages_free: !!res.data.all_languages_free,
        video_courses_enabled: !!res.data.video_courses_enabled,
        video_courses_free: !!res.data.video_courses_free,
        enabled_languages: textList(res.data.enabled_languages),
        free_languages: textList(res.data.free_languages),
        enabled_course_types: textList(res.data.enabled_course_types),
        free_course_types: textList(res.data.free_course_types),
      });
    } catch (error) {
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const toggle = (key) => {
    setForm((current) => ({ ...current, [key]: !current[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${serverURL}/admin/platform-config`, {
        course_creation_enabled: form.course_creation_enabled,
        all_languages_free: form.all_languages_free,
        video_courses_enabled: form.video_courses_enabled,
        video_courses_free: form.video_courses_free,
        enabled_languages: lines(form.enabled_languages),
        free_languages: lines(form.free_languages),
        enabled_course_types: lines(form.enabled_course_types),
        free_course_types: lines(form.free_course_types),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Platform settings saved');
      fetchConfig();
    } catch (error) {
      toast.error('Failed to save platform settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">Loading platform settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ['course_creation_enabled', 'Course creation enabled'],
            ['all_languages_free', 'All languages free'],
            ['video_courses_enabled', 'Video courses enabled'],
            ['video_courses_free', 'Video courses free'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition ${form[key] ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 bg-white text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300'}`}
            >
              <span>{label}</span>
              <span>{form[key] ? 'ON' : 'OFF'}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Editor label="Enabled languages" value={form.enabled_languages} onChange={(value) => setForm({ ...form, enabled_languages: value })} />
        <Editor label="Free languages" value={form.free_languages} onChange={(value) => setForm({ ...form, free_languages: value })} />
        <Editor label="Enabled course types" value={form.enabled_course_types} onChange={(value) => setForm({ ...form, enabled_course_types: value })} />
        <Editor label="Free course types" value={form.free_course_types} onChange={(value) => setForm({ ...form, free_course_types: value })} />
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save platform settings'}
        </Button>
      </div>
    </div>
  );
};

const Editor = ({ label, value, onChange }) => (
  <Card className="p-5">
    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">{label}</label>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-h-[180px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
      placeholder="One item per line"
    />
  </Card>
);

export default PlatformSettings;
```

- [ ] **Step 2: Add route**

In `src/App.js`, import:

```javascript
import PlatformSettings from './admin/platformsettings';
```

Inside the `/admin` route group, add:

```javascript
<Route path="platform-settings" element={<PlatformSettings />} />
```

- [ ] **Step 3: Add menu item**

In `src/admin/components/AdminLayout.js`, add `LuSettings` to the icon imports and add this item after plans:

```javascript
{ name: t('admin.platform_settings') || 'Platform Settings', icon: LuSettings, path: '/admin/platform-settings' },
```

- [ ] **Step 4: Run frontend build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```powershell
git add src/admin/platformsettings.js src/App.js src/admin/components/AdminLayout.js
git commit -m "feat: add platform settings admin"
```

---

### Task 5: React Pricing And Course Creation Runtime Config

**Files:**
- Modify: `src/pages/pricing.js`
- Modify: `src/pages/create.js`

- [ ] **Step 1: Add platform config fetch in create page**

In `src/pages/create.js`, add state:

```javascript
const [platformConfig, setPlatformConfig] = useState(null);
const [platformError, setPlatformError] = useState('');
```

Add an effect:

```javascript
useEffect(() => {
  const fetchPlatformConfig = async () => {
    try {
      const res = await axios.get(`${serverURL}/platform-config`);
      setPlatformConfig(res.data);
    } catch (error) {
      setPlatformError(t('common.error'));
    }
  };
  fetchPlatformConfig();
}, [t]);
```

- [ ] **Step 2: Replace local language/type premium checks**

Add helper functions in `src/pages/create.js`:

```javascript
const isLanguageLocked = (language) => {
  if (!platformConfig || isPremiumUser) return false;
  if (platformConfig.all_languages_free) return false;
  return !(platformConfig.free_languages || []).includes(language);
};

const isTypeLocked = (type) => {
  if (!platformConfig || isPremiumUser) return false;
  const freeTypes = platformConfig.free_course_types || [];
  if (type.includes('Video') && platformConfig.video_courses_free) return false;
  return !freeTypes.includes(type);
};

const availableLanguages = platformConfig?.enabled_languages?.length
  ? platformConfig.enabled_languages.map((name) => ({ name }))
  : languagesList;

const availableTypes = platformConfig?.enabled_course_types?.length
  ? platformConfig.enabled_course_types
  : ['Theory & Image Course', 'Video & Theory Course'];
```

Update `handleFeatureClick` so language/type decisions use these helpers:

```javascript
const isPremiumFeature =
  (feature === 'type' && isTypeLocked(value)) ||
  (feature === 'language' && isLanguageLocked(value)) ||
  (feature === 'modules' && value > 5);
```

Update language rendering to iterate `availableLanguages` and use `isLanguageLocked(lang.name)` for badge display.

Update type rendering to iterate `availableTypes` and use `isTypeLocked(val)` for badge display.

- [ ] **Step 3: Add disabled course creation guard**

Before allowing generate submit in `src/pages/create.js`, add:

```javascript
if (platformConfig && platformConfig.course_creation_enabled === false) {
  toast.error(t('platform.course_creation_disabled', 'Course creation is currently disabled.'));
  return;
}

if (platformError) {
  toast.error(platformError);
  return;
}
```

- [ ] **Step 4: Remove pricing hardcoded fallbacks**

In `src/pages/pricing.js`, replace price fields so they depend only on backend plan values:

```javascript
price: billingCycle === 'monthly'
  ? Number(getDBPlan('pro').price_egp ?? 0)
  : Number(getDBPlan('pro').price_egp ?? 0) * 10,
```

Repeat for `elite`. Remove fallback values like `50`, `80`, `500`, and `800`. Keep `free` at `0`.

Add an empty state before rendering cards:

```javascript
if (!plansData.length) {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
      {t('pricing.unavailable', 'Pricing is unavailable right now.')}
    </div>
  );
}
```

- [ ] **Step 5: Run build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```powershell
git add src/pages/create.js src/pages/pricing.js
git commit -m "feat: consume platform config on web"
```

---

### Task 6: React Auth Shared Shell

**Files:**
- Modify: `src/App.js`
- Modify: `src/pages/signin.js`
- Modify: `src/pages/signup.js`

- [ ] **Step 1: Move auth routes into public layout**

In `src/App.js`, remove standalone auth routes for `/signin`, `/signup`, `/forgotpassword`, and reset password. Add them inside `<Route element={<PublicLayout />}>`:

```javascript
<Route path="/signin" element={<SignIn />} />
<Route path="/signup" element={<SignUp />} />
<Route path="/forgotpassword" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
```

Keep `/auth/social/callback` standalone if it should avoid layout during token handling.

- [ ] **Step 2: Remove duplicated shell imports from signin**

In `src/pages/signin.js`, remove imports:

```javascript
import Header from '../components/header';
import Footers from '../components/footers';
import MouseBackground from '../components/common/MouseBackground';
```

Remove `<MouseBackground />`, `<Header isHome={false} />`, and `<Footers />` from the component JSX. Keep the centered auth card and change the outer wrapper padding from `pt-24` to `py-12` because `PublicLayout` now owns the navbar spacing.

- [ ] **Step 3: Remove duplicated shell imports from signup**

Apply the same cleanup in `src/pages/signup.js`: remove `Header`, `Footers`, `MouseBackground`, remove their JSX, and keep the centered auth card.

- [ ] **Step 4: Run build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```powershell
git add src/App.js src/pages/signin.js src/pages/signup.js
git commit -m "feat: align auth pages with public shell"
```

---

### Task 7: Flutter Platform Config Consumption

**Files:**
- Modify: `mobile/lib/core/api/endpoints.dart`
- Create: `mobile/lib/models/platform_config.dart`
- Create: `mobile/lib/core/platform/platform_config_provider.dart`
- Modify: `mobile/lib/features/create/create_screen.dart`
- Modify: `mobile/lib/features/payment/pricing_screen.dart`

- [ ] **Step 1: Add endpoint**

In `mobile/lib/core/api/endpoints.dart`, add:

```dart
static const platformConfig = '/platform-config';
```

- [ ] **Step 2: Add model**

Create `mobile/lib/models/platform_config.dart`:

```dart
class PlatformConfig {
  final bool courseCreationEnabled;
  final bool allLanguagesFree;
  final bool videoCoursesEnabled;
  final bool videoCoursesFree;
  final List<String> enabledLanguages;
  final List<String> freeLanguages;
  final List<String> enabledCourseTypes;
  final List<String> freeCourseTypes;

  const PlatformConfig({
    required this.courseCreationEnabled,
    required this.allLanguagesFree,
    required this.videoCoursesEnabled,
    required this.videoCoursesFree,
    required this.enabledLanguages,
    required this.freeLanguages,
    required this.enabledCourseTypes,
    required this.freeCourseTypes,
  });

  factory PlatformConfig.fromJson(Map<String, dynamic> json) {
    List<String> list(String key) =>
        (json[key] as List? ?? []).map((e) => e.toString()).toList();

    return PlatformConfig(
      courseCreationEnabled: json['course_creation_enabled'] != false,
      allLanguagesFree: json['all_languages_free'] == true,
      videoCoursesEnabled: json['video_courses_enabled'] != false,
      videoCoursesFree: json['video_courses_free'] == true,
      enabledLanguages: list('enabled_languages'),
      freeLanguages: list('free_languages'),
      enabledCourseTypes: list('enabled_course_types'),
      freeCourseTypes: list('free_course_types'),
    );
  }

  bool isLanguageLocked(String language, bool isPro) {
    if (isPro || allLanguagesFree) return false;
    return !freeLanguages.contains(language);
  }

  bool isCourseTypeLocked(String type, bool isPro) {
    if (isPro) return false;
    if (type.contains('Video') && videoCoursesFree) return false;
    return !freeCourseTypes.contains(type);
  }
}
```

- [ ] **Step 3: Add provider**

Create `mobile/lib/core/platform/platform_config_provider.dart`:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/endpoints.dart';
import '../auth/auth_provider.dart';
import '../../models/platform_config.dart';

final platformConfigProvider = FutureProvider<PlatformConfig>((ref) async {
  final api = ref.watch(apiClientProvider);
  final res = await api.dio.get(ApiEndpoints.platformConfig);
  return PlatformConfig.fromJson((res.data as Map).cast<String, dynamic>());
});
```

- [ ] **Step 4: Update create screen**

In `mobile/lib/features/create/create_screen.dart`, import:

```dart
import '../../core/platform/platform_config_provider.dart';
```

In `build`, add:

```dart
final configAsync = ref.watch(platformConfigProvider);
```

Wrap the current body in `configAsync.when(...)`. In the `data` branch, use:

```dart
final availableLanguages = config.enabledLanguages.isNotEmpty
    ? config.enabledLanguages
    : _languages;
final availableTypes = config.enabledCourseTypes.isNotEmpty
    ? config.enabledCourseTypes
    : ['Theory & Image Course', 'Video & Theory Course'];
```

Update `_onFeatureSelect` to accept `PlatformConfig config`:

```dart
void _onFeatureSelect(PlatformConfig config, String feature, dynamic value) {
  final user = ref.read(authProvider).user;
  final isPro = user?.isPro == true;

  bool isPremiumFeature = false;
  if (feature == 'modules' && value > 5) isPremiumFeature = true;
  if (feature == 'type' && config.isCourseTypeLocked(value.toString(), isPro)) {
    isPremiumFeature = true;
  }
  if (feature == 'level' && value == 'Professional') isPremiumFeature = true;
  if (feature == 'language' && config.isLanguageLocked(value.toString(), isPro)) {
    isPremiumFeature = true;
  }

  if (isPremiumFeature && !isPro) {
    _showPremiumDialog();
    return;
  }

  setState(() {
    if (feature == 'modules') _modules = value;
    if (feature == 'type') _type = value;
    if (feature == 'level') _level = value;
    if (feature == 'language') _language = value;
  });
}
```

Update language dropdown and type cards to call `_onFeatureSelect(config, ...)` and display premium icons based on config helpers.

In `_generate`, guard:

```dart
final config = ref.read(platformConfigProvider).valueOrNull;
if (config != null && !config.courseCreationEnabled) {
  showSnack(context, 'Course creation is currently disabled.', error: true);
  return;
}
```

- [ ] **Step 5: Check Flutter pricing amount**

In `mobile/lib/features/payment/pricing_screen.dart`, keep `_amountFor` based on `plan.priceEgp`; do not add any fallback fixed prices.

- [ ] **Step 6: Run Flutter analysis**

Run:

```powershell
cd mobile
flutter analyze
```

Expected: no new errors from edited files.

- [ ] **Step 7: Commit**

```powershell
git add mobile/lib/core/api/endpoints.dart mobile/lib/models/platform_config.dart mobile/lib/core/platform/platform_config_provider.dart mobile/lib/features/create/create_screen.dart mobile/lib/features/payment/pricing_screen.dart
git commit -m "feat: consume platform config on mobile"
```

---

### Task 8: Final Verification

**Files:**
- Verify all touched files.

- [ ] **Step 1: Run backend tests**

Run:

```powershell
cd backend
php artisan test --filter=PlatformConfigTest
php artisan test
```

Expected: `PlatformConfigTest` passes, then full backend suite passes or only unrelated existing failures are documented.

- [ ] **Step 2: Run React build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Run Flutter analysis**

Run:

```powershell
cd mobile
flutter analyze
```

Expected: no new errors from edited files.

- [ ] **Step 4: Search for frontend fixed price fallbacks**

Run:

```powershell
rg -n "price_egp \\|\\| 50|price_egp \\|\\| 80|\\|\\| 500|\\|\\| 800|non-English|Video.*premium|English.*premium" src mobile/lib
```

Expected: no remaining fixed pricing or language/video premium assumptions in the edited surfaces.

- [ ] **Step 5: Final status**

Run:

```powershell
git status --short
```

Expected: only intentional uncommitted changes remain. Existing unrelated mobile changes from before this work must not be reverted.
