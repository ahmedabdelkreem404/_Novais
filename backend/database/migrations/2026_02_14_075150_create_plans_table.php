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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // 'free', 'pro', 'elite'
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('price_egp')->default(0);
            $table->integer('course_limit')->default(1); // -1 for unlimited
            $table->string('billing_cycle')->default('monthly'); // 'monthly', 'yearly'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
