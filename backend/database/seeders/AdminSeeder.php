<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if admin exists
        $adminEmail = 'admin@novais.com';
        
        $admin = User::where('email', $adminEmail)->first();
        
        if (!$admin) {
            User::create([
                'name' => 'Super Admin',
                'email' => $adminEmail,
                'password' => Hash::make('21072003'),
                'role' => 'admin',
                'sub_status' => 'premium',
                'language' => 'en',
                'country' => 'Global',
                'email_verified_at' => Carbon::now(),
            ]);
            $this->command->info('Super Admin created successfully.');
        } else {
            $this->command->info('Super Admin already exists.');
        }
    }
}
