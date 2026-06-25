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
        Schema::create('media_cache', function (Blueprint $table) {
            $table->id();
            $table->string('query_hash', 64)->unique(); // md5(query + intent + constraints)
            $table->enum('type', ['image', 'video']);
            $table->text('url');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('source', 50); // 'youtube', 'unsplash'
            $table->json('metadata'); // duration, channel, views, dimensions, etc.
            $table->decimal('relevance_score', 3, 2); // 0.00-1.00
            $table->timestamp('expires_at'); // TTL: now() + 30 days
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['query_hash', 'expires_at']);
            $table->index(['type', 'relevance_score']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_cache');
    }
};
