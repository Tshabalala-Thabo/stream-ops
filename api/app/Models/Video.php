<?php

namespace App\Models;

use App\Enums\VideoStatus;
use Database\Factories\VideoFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

#[Fillable([
    'user_id',
    'title',
    'description',
    'status',
    'duration_seconds',
    'width',
    'height',
    'source_disk',
    'source_path',
    'playback_manifest_path',
    'thumbnail_path',
    'processing_error',
])]
class Video extends Model implements HasMedia
{
    /** @use HasFactory<VideoFactory> */
    use HasFactory, HasUlids, InteractsWithMedia;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<UploadSession, $this>
     */
    public function uploadSessions(): HasMany
    {
        return $this->hasMany(UploadSession::class);
    }

    /**
     * @return HasMany<VideoProcessingRun, $this>
     */
    public function processingRuns(): HasMany
    {
        return $this->hasMany(VideoProcessingRun::class);
    }

    /**
     * @return HasMany<VideoRendition, $this>
     */
    public function renditions(): HasMany
    {
        return $this->hasMany(VideoRendition::class);
    }

    public function registerMediaCollections(): void
    {
        $disk = (string) config('streamops.media_disk', 'public');

        $this->addMediaCollection('source')->useDisk($disk)->singleFile();
        $this->addMediaCollection('thumbnails')->useDisk($disk)->singleFile();
        $this->addMediaCollection('playback_manifests')->useDisk($disk)->singleFile();
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => VideoStatus::class,
            'duration_seconds' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }
}
