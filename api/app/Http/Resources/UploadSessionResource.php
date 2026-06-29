<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UploadSessionResource extends JsonResource
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
            'provider' => $this->provider,
            'multipartUploadId' => $this->multipart_upload_id,
            'objectKey' => $this->object_key,
            'status' => $this->status->value,
            'partSize' => $this->part_size,
            'totalParts' => $this->total_parts,
            'uploadedParts' => $this->uploaded_parts ?? [],
            'expiresAt' => $this->expires_at?->toJSON(),
            'createdAt' => $this->created_at?->toJSON(),
            'updatedAt' => $this->updated_at?->toJSON(),
            'video' => new VideoResource($this->whenLoaded('video')),
        ];
    }
}
