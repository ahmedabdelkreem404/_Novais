<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if user exists first to avoid duplicate entry errors
        if (!\App\Models\User::where('email', 'admin@novais.com')->exists()) {
            \App\Models\User::create([
                'name' => 'Admin User',
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'admin@novais.com',
                'password' => \Illuminate\Support\Facades\Hash::make('21072003'),
                'role' => 'admin',
                'sub_status' => 'premium', // Admin should have premium access
                'email_verified_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \App\Models\User::where('email', 'admin@novais.com')->delete();
    }
};
