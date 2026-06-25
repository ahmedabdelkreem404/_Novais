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
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn(['name', 'message']); // Drop old columns
            $table->string('fname')->after('id');
            $table->string('lname')->after('fname');
            $table->string('phone')->nullable()->after('email');
            $table->text('msg')->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->string('name');
            $table->text('message');
            $table->dropColumn(['fname', 'lname', 'phone', 'msg']);
        });
    }
};
