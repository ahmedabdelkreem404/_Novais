<?php

namespace Database\Seeders;

use App\Models\ContentBlueprint;
use Illuminate\Database\Seeder;

class ContentBlueprintSeeder extends Seeder
{
    public function run(): void
    {
        foreach (ContentBlueprint::defaults() as $blueprint) {
            ContentBlueprint::updateOrCreate(
                ['slug' => $blueprint['slug']],
                $blueprint
            );
        }
    }
}
