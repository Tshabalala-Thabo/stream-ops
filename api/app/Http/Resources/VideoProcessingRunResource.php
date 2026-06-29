<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VideoProcessingRunResource extends JsonResource
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
            'status' => $this->status->value,
            'startedAt' => $this->started_at?->toJSON(),
            'finishedAt' => $this->finished_at?->toJSON(),
            'error' => $this->error,
            'metadata' => $this->metadata,
            'createdAt' => $this->created_at?->toJSON(),
            'updatedAt' => $this->updated_at?->toJSON(),
        ];
    }
}
