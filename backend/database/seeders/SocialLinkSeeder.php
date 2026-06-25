<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SocialLinkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\SocialLink::create([
            'platform' => 'facebook',
            'url' => 'https://facebook.com',
        ]);
        \App\Models\SocialLink::create([
            'platform' => 'twitter',
            'url' => 'https://twitter.com',
        ]);
        \App\Models\SocialLink::create([
            'platform' => 'linkedin',
            'url' => 'https://linkedin.com',
        ]);
    }
}
