<?php

namespace App\Models;

use App\Enums\ProcessingRunStatus;
use Database\Factories\VideoProcessingRunFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'video_id',
    'status',
    'started_at',
    'finished_at',
    'error',
    'metadata',
])]
class VideoProcessingRun extends Model
{
    /** @use HasFactory<VideoProcessingRunFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Video, $this>
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ProcessingRunStatus::class,
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'metadata' => 'array',
        ];
    }
}
