<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class VideoRenditionResource extends JsonResource
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
            'videoId' => $this->video_id,
            'label' => $this->label,
            'width' => $this->width,
            'height' => $this->height,
            'bitrate' => $this->bitrate,
            'codec' => $this->codec,
            'playlistPath' => $this->playlist_path,
            'playlistUrl' => Storage::disk($this->video->source_disk ?? config('streamops.media_disk', 'public'))->url($this->playlist_path),
            'segmentPrefix' => $this->segment_prefix,
            'createdAt' => $this->created_at?->toJSON(),
            'updatedAt' => $this->updated_at?->toJSON(),
        ];
    }
}
