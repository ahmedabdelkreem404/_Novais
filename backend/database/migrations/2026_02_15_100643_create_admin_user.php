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
        // Intentionally no-op. Admin accounts must not be created from migrations.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
