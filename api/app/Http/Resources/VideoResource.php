<?php

namespace App\Http\Resources;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VideoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status->value,
            'durationSeconds' => $this->duration_seconds,
            'width' => $this->width,
            'height' => $this->height,
            'sourceDisk' => $this->source_disk,
            'sourcePath' => $this->source_path,
            'playbackManifestPath' => $this->playback_manifest_path,
            'playbackManifestUrl' => MediaUrl::for($this->playback_manifest_path, $this->source_disk),
            'thumbnailPath' => $this->thumbnail_path,
            'thumbnailUrl' => MediaUrl::for($this->thumbnail_path, $this->source_disk),
            'previewSpritePath' => $this->preview_sprite_path,
            'previewSpriteUrl' => MediaUrl::for($this->preview_sprite_path, $this->source_disk),
            'previewTrackPath' => $this->preview_track_path,
            'previewTrackUrl' => MediaUrl::for($this->preview_track_path, $this->source_disk),
            'previewIntervalSeconds' => $this->preview_interval_seconds,
            'processingError' => $this->processing_error,
            'owner' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ],
            'createdAt' => $this->created_at?->toJSON(),
            'updatedAt' => $this->updated_at?->toJSON(),
        ];
    }
}
