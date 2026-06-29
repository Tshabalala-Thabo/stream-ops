<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

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
            'playbackManifestUrl' => $this->storageUrl($this->playback_manifest_path),
            'thumbnailPath' => $this->thumbnail_path,
            'thumbnailUrl' => $this->storageUrl($this->thumbnail_path),
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

    private function storageUrl(?string $path): ?string
    {
        if ($path === null) {
            return null;
        }

        return Storage::disk($this->source_disk ?? config('streamops.media_disk', 'public'))->url($path);
    }
}
