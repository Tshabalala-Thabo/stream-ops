<?php

namespace Database\Factories;

use App\Enums\UploadSessionStatus;
use App\Models\UploadSession;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<UploadSession>
 */
class UploadSessionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'video_id' => Video::factory(),
            'provider' => config('streamops.media_disk', 'public'),
            'multipart_upload_id' => null,
            'object_key' => 'videos/'.Str::ulid().'/source/original.mp4',
            'status' => UploadSessionStatus::Active,
            'part_size' => config('streamops.upload_part_size', 8 * 1024 * 1024),
            'total_parts' => 1,
            'uploaded_parts' => [],
            'expires_at' => now()->addMinutes((int) config('streamops.upload_session_ttl_minutes', 120)),
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => UploadSessionStatus::Completed,
            'uploaded_parts' => [
                ['partNumber' => 1, 'etag' => 'test-etag', 'size' => 1024],
            ],
        ]);
    }
}
