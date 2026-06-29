<?php

namespace Database\Factories;

use App\Enums\VideoStatus;
use App\Models\User;
use App\Models\Video;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Video>
 */
class VideoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'status' => VideoStatus::Uploaded,
            'duration_seconds' => fake()->numberBetween(90, 1800),
            'width' => 1920,
            'height' => 1080,
            'source_disk' => config('streamops.media_disk', 'public'),
            'source_path' => null,
            'playback_manifest_path' => null,
            'thumbnail_path' => null,
            'processing_error' => null,
        ];
    }

    public function ready(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VideoStatus::Ready,
            'source_path' => 'videos/ready-video/source/original.mp4',
            'playback_manifest_path' => 'videos/ready-video/hls/master.m3u8',
            'thumbnail_path' => 'videos/ready-video/thumbnails/default.jpg',
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VideoStatus::Processing,
            'playback_manifest_path' => null,
        ]);
    }
}
