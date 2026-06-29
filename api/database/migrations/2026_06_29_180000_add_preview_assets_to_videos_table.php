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
        Schema::table('videos', function (Blueprint $table): void {
            $table->string('preview_sprite_path')->nullable()->after('thumbnail_path');
            $table->string('preview_track_path')->nullable()->after('preview_sprite_path');
            $table->unsignedSmallInteger('preview_interval_seconds')->nullable()->after('preview_track_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('videos', function (Blueprint $table): void {
            $table->dropColumn([
                'preview_sprite_path',
                'preview_track_path',
                'preview_interval_seconds',
            ]);
        });
    }
};
