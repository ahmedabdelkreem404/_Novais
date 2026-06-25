<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
class RestoreAdminRoleSeeder extends Seeder
{
    public function run()
    {
        $this->command?->warn('RestoreAdminRoleSeeder is disabled. Promote admins explicitly through a controlled admin workflow.');
    }
}
