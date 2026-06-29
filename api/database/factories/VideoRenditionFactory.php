<?php

namespace Database\Factories;

use App\Models\Video;
use App\Models\VideoRendition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VideoRendition>
 */
class VideoRenditionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $label = fake()->randomElement(['480p', '720p', '1080p']);
        $height = (int) str_replace('p', '', $label);
        $width = match ($height) {
            480 => 854,
            720 => 1280,
            default => 1920,
        };

        return [
            'video_id' => Video::factory(),
            'label' => $label,
            'width' => $width,
            'height' => $height,
            'bitrate' => fake()->numberBetween(1_200_000, 5_500_000),
            'codec' => 'h264',
            'playlist_path' => "videos/test-video/hls/{$label}/index.m3u8",
            'segment_prefix' => "videos/test-video/hls/{$label}/",
        ];
    }
}
