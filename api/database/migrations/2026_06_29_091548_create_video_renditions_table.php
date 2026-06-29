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
        Schema::create('video_renditions', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('video_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->unsignedInteger('width');
            $table->unsignedInteger('height');
            $table->unsignedInteger('bitrate')->nullable();
            $table->string('codec')->nullable();
            $table->string('playlist_path');
            $table->string('segment_prefix');
            $table->timestamps();

            $table->index(['video_id', 'label']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('video_renditions');
    }
};
