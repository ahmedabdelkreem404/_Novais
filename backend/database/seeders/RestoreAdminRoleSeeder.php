<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class RestoreAdminRoleSeeder extends Seeder
{
    public function run()
    {
        $user = User::first();

        if ($user) {
            $user->role = 'admin';
            $user->save();
            $this->command->info('User role restored to admin for: ' . $user->email);
        } else {
            $this->command->error('No users found.');
        }
    }
}
