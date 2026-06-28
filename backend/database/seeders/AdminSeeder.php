<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminEmail = env('ADMIN_SEED_EMAIL');
        $adminPassword = env('ADMIN_SEED_PASSWORD');

        if (!$adminEmail || !$adminPassword) {
            $this->command?->warn('AdminSeeder skipped. Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to create an admin intentionally.');
            return;
        }
        
        $admin = User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'Super Admin',
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'sub_status' => 'premium',
                'language' => 'en',
                'country' => 'Global',
                'total_credits' => 999999999,
                'remaining_credits' => 999999999,
                'email_verified_at' => now(),
            ]
        );

        if ($admin->wasRecentlyCreated) {
            $this->command->info('Super Admin created successfully.');
        } else {
            $this->command->info('Super Admin updated successfully.');
        }
    }
}
