<?php

namespace App\Http\Resources;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'playlistUrl' => MediaUrl::for($this->playlist_path, $this->video->source_disk ?? config('streamops.media_disk', 'public')),
            'segmentPrefix' => $this->segment_prefix,
            'createdAt' => $this->created_at?->toJSON(),
            'updatedAt' => $this->updated_at?->toJSON(),
        ];
    }
}
