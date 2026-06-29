<?php

namespace Database\Factories;

use App\Enums\ProcessingRunStatus;
use App\Models\Video;
use App\Models\VideoProcessingRun;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VideoProcessingRun>
 */
class VideoProcessingRunFactory extends Factory
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
            'status' => ProcessingRunStatus::Queued,
            'started_at' => null,
            'finished_at' => null,
            'error' => null,
            'metadata' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProcessingRunStatus::Completed,
            'started_at' => now()->subMinutes(10),
            'finished_at' => now(),
            'metadata' => [
                'durationSeconds' => 120,
                'width' => 1920,
                'height' => 1080,
            ],
        ]);
    }
}
