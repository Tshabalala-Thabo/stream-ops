<?php

namespace App\Models;

use Database\Factories\VideoRenditionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'video_id',
    'label',
    'width',
    'height',
    'bitrate',
    'codec',
    'playlist_path',
    'segment_prefix',
])]
class VideoRendition extends Model
{
    /** @use HasFactory<VideoRenditionFactory> */
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
            'width' => 'integer',
            'height' => 'integer',
            'bitrate' => 'integer',
        ];
    }
}
