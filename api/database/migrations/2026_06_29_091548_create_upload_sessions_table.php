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
        Schema::create('upload_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('video_id')->constrained()->cascadeOnDelete();
            $table->string('provider');
            $table->string('multipart_upload_id')->nullable();
            $table->string('object_key');
            $table->string('status')->index();
            $table->unsignedInteger('part_size');
            $table->unsignedInteger('total_parts');
            $table->json('uploaded_parts');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['video_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('upload_sessions');
    }
};
