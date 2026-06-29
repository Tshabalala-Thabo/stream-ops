<?php

namespace App\Services\VideoProcessing;

class VideoProcessingResult
{
    /**
     * @param  array<string, mixed>  $metadata
     * @param  array<int, array{label: string, width: int, height: int, bitrate: int, codec: ?string, playlistPath: string, segmentPrefix: string}>  $renditions
     */
    public function __construct(
        public readonly int $durationSeconds,
        public readonly int $width,
        public readonly int $height,
        public readonly ?string $codec,
        public readonly ?int $bitrate,
        public readonly ?float $frameRate,
        public readonly string $thumbnailPath,
        public readonly string $playbackManifestPath,
        public readonly string $previewSpritePath,
        public readonly string $previewTrackPath,
        public readonly int $previewIntervalSeconds,
        public readonly array $renditions,
        public readonly array $metadata,
    ) {}
}
