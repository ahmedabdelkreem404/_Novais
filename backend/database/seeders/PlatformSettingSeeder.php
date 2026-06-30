<?php

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class PlatformSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Delete any existing platform configuration
        PlatformSetting::where('key', PlatformSetting::CONFIG_KEY)->delete();
        Cache::forget(PlatformSetting::CACHE_KEY);

        // Force initialize with new default values from PlatformSetting::defaults()
        PlatformSetting::currentConfig();
    }
}
