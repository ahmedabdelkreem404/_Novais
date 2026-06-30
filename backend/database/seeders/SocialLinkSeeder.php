<?php

namespace Database\Seeders;

use App\Models\SocialLink;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SocialLinkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SocialLink::updateOrCreate(
            ['platform' => 'facebook'],
            ['url' => 'https://facebook.com/novais']
        );
        SocialLink::updateOrCreate(
            ['platform' => 'twitter'],
            ['url' => 'https://twitter.com/novais_ai']
        );
        SocialLink::updateOrCreate(
            ['platform' => 'instagram'],
            ['url' => 'https://instagram.com/novais.learning']
        );
        SocialLink::updateOrCreate(
            ['platform' => 'linkedin'],
            ['url' => 'https://linkedin.com/company/novais-learning']
        );
        SocialLink::updateOrCreate(
            ['platform' => 'github'],
            ['url' => 'https://github.com/novais-education']
        );
        SocialLink::updateOrCreate(
            ['platform' => 'youtube'],
            ['url' => 'https://youtube.com/c/NovaisLearning']
        );
    }
}
