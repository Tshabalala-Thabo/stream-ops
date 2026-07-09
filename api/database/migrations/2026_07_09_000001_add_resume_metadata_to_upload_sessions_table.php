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
        Schema::table('upload_sessions', function (Blueprint $table) {
            $table->string('original_file_name')->nullable()->after('object_key');
            $table->unsignedBigInteger('original_file_size')->nullable()->after('original_file_name');
            $table->string('original_mime_type')->nullable()->after('original_file_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('upload_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'original_file_name',
                'original_file_size',
                'original_mime_type',
            ]);
        });
    }
};
