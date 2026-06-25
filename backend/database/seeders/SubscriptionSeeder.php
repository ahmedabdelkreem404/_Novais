<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
class SubscriptionSeeder extends Seeder
{
    public function run()
    {
        $this->command?->warn('SubscriptionSeeder is disabled. Test subscriptions must be created explicitly in tests or controlled admin workflows.');
    }
}
