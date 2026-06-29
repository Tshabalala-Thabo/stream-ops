<?php

namespace App\Models;

use App\Enums\UploadSessionStatus;
use Database\Factories\UploadSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'video_id',
    'provider',
    'multipart_upload_id',
    'object_key',
    'status',
    'part_size',
    'total_parts',
    'uploaded_parts',
    'expires_at',
])]
class UploadSession extends Model
{
    /** @use HasFactory<UploadSessionFactory> */
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
            'status' => UploadSessionStatus::class,
            'part_size' => 'integer',
            'total_parts' => 'integer',
            'uploaded_parts' => 'array',
            'expires_at' => 'datetime',
        ];
    }
}
