<?php

namespace App\Services\VideoProcessing;

use App\Models\Video;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\Process;

class FfmpegVideoProcessor
{
    /**
     * @var array<int, array{label: string, height: int, bitrate: int}>
     */
    private array $renditionProfiles = [
        ['label' => '480p', 'height' => 480, 'bitrate' => 1_200_000],
        ['label' => '720p', 'height' => 720, 'bitrate' => 2_800_000],
        ['label' => '1080p', 'height' => 1080, 'bitrate' => 5_000_000],
    ];

    public function process(Video $video): VideoProcessingResult
    {
        if ($video->source_disk === null || $video->source_path === null) {
            throw new RuntimeException('Video source disk or path is missing.');
        }

        if (! Storage::disk($video->source_disk)->exists($video->source_path)) {
            throw new RuntimeException('Video source file does not exist.');
        }

        $workDirectory = storage_path("app/private/streamops-processing/{$video->id}/".uniqid('', true));
        File::ensureDirectoryExists($workDirectory);

        $sourcePath = $workDirectory.'/source.'.pathinfo($video->source_path, PATHINFO_EXTENSION);
        $thumbnailLocalPath = $workDirectory.'/default.jpg';
        $hlsDirectory = $workDirectory.'/hls';

        try {
            $this->copySourceToLocalPath($video, $sourcePath);
            $metadata = $this->probe($sourcePath);
            $this->generateThumbnail($sourcePath, $thumbnailLocalPath, $metadata['durationSeconds']);
            $hls = $this->generateHls($video, $sourcePath, $hlsDirectory, $metadata);

            $thumbnailPath = "videos/{$video->id}/thumbnails/default.jpg";
            $thumbnailStream = fopen($thumbnailLocalPath, 'rb');

            if ($thumbnailStream === false) {
                throw new RuntimeException('Generated thumbnail could not be opened.');
            }

            try {
                if (! Storage::disk($video->source_disk)->put($thumbnailPath, $thumbnailStream)) {
                    throw new RuntimeException('Generated thumbnail could not be stored.');
                }
            } finally {
                fclose($thumbnailStream);
            }

            return new VideoProcessingResult(
                durationSeconds: $metadata['durationSeconds'],
                width: $metadata['width'],
                height: $metadata['height'],
                codec: $metadata['codec'],
                bitrate: $metadata['bitrate'],
                frameRate: $metadata['frameRate'],
                thumbnailPath: $thumbnailPath,
                playbackManifestPath: $hls['masterManifestPath'],
                renditions: $hls['renditions'],
                metadata: [
                    ...$metadata,
                    'renditions' => $hls['renditions'],
                    'playbackManifestPath' => $hls['masterManifestPath'],
                ],
            );
        } finally {
            File::deleteDirectory($workDirectory);
        }
    }

    private function copySourceToLocalPath(Video $video, string $targetPath): void
    {
        $sourceStream = Storage::disk($video->source_disk)->readStream($video->source_path);

        if ($sourceStream === false) {
            throw new RuntimeException('Video source file could not be read.');
        }

        $targetStream = fopen($targetPath, 'wb');

        if ($targetStream === false) {
            fclose($sourceStream);

            throw new RuntimeException('Local processing source file could not be created.');
        }

        try {
            stream_copy_to_stream($sourceStream, $targetStream);
        } finally {
            fclose($sourceStream);
            fclose($targetStream);
        }
    }

    /**
     * @return array{durationSeconds: int, width: int, height: int, codec: ?string, bitrate: ?int, frameRate: ?float, raw: array<string, mixed>}
     */
    private function probe(string $sourcePath): array
    {
        $process = new Process([
            (string) config('streamops.ffprobe_path', 'ffprobe'),
            '-v',
            'error',
            '-print_format',
            'json',
            '-show_format',
            '-show_streams',
            $sourcePath,
        ]);
        $process->setTimeout((int) config('streamops.processing_timeout_seconds', 300));
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException(trim($process->getErrorOutput()) ?: 'ffprobe could not read video metadata.');
        }

        $payload = json_decode($process->getOutput(), true);

        if (! is_array($payload)) {
            throw new RuntimeException('ffprobe returned invalid JSON.');
        }

        $videoStream = collect($payload['streams'] ?? [])
            ->first(fn (array $stream): bool => ($stream['codec_type'] ?? null) === 'video');

        if (! is_array($videoStream)) {
            throw new RuntimeException('ffprobe did not find a video stream.');
        }

        $duration = (float) ($payload['format']['duration'] ?? $videoStream['duration'] ?? 0);
        $width = (int) ($videoStream['width'] ?? 0);
        $height = (int) ($videoStream['height'] ?? 0);

        if ($duration <= 0 || $width <= 0 || $height <= 0) {
            throw new RuntimeException('ffprobe metadata is missing duration or dimensions.');
        }

        return [
            'durationSeconds' => max(1, (int) ceil($duration)),
            'width' => $width,
            'height' => $height,
            'codec' => $videoStream['codec_name'] ?? null,
            'bitrate' => isset($payload['format']['bit_rate']) ? (int) $payload['format']['bit_rate'] : null,
            'frameRate' => $this->parseFrameRate($videoStream['avg_frame_rate'] ?? null),
            'raw' => $payload,
        ];
    }

    private function generateThumbnail(string $sourcePath, string $thumbnailPath, int $durationSeconds): void
    {
        $timestamp = max(0.1, min(1.0, $durationSeconds / 2));
        $process = new Process([
            (string) config('streamops.ffmpeg_path', 'ffmpeg'),
            '-y',
            '-ss',
            (string) $timestamp,
            '-i',
            $sourcePath,
            '-frames:v',
            '1',
            $thumbnailPath,
        ]);
        $process->setTimeout((int) config('streamops.processing_timeout_seconds', 300));
        $process->run();

        if (! $process->isSuccessful() || ! is_file($thumbnailPath)) {
            throw new RuntimeException(trim($process->getErrorOutput()) ?: 'ffmpeg could not generate a thumbnail.');
        }
    }

    /**
     * @param  array{durationSeconds: int, width: int, height: int, codec: ?string, bitrate: ?int, frameRate: ?float, raw: array<string, mixed>}  $metadata
     * @return array{masterManifestPath: string, renditions: array<int, array{label: string, width: int, height: int, bitrate: int, codec: ?string, playlistPath: string, segmentPrefix: string}>}
     */
    private function generateHls(Video $video, string $sourcePath, string $hlsDirectory, array $metadata): array
    {
        File::ensureDirectoryExists($hlsDirectory);

        $renditions = [];

        foreach ($this->supportedRenditionProfiles($metadata['height']) as $profile) {
            $renditionDirectory = $hlsDirectory.'/'.$profile['label'];
            File::ensureDirectoryExists($renditionDirectory);

            $playlistLocalPath = $renditionDirectory.'/index.m3u8';
            $segmentLocalPattern = $renditionDirectory.'/segment_%03d.ts';
            $width = $this->scaledWidth($metadata['width'], $metadata['height'], $profile['height']);
            $bitrate = $profile['bitrate'];

            $process = new Process([
                (string) config('streamops.ffmpeg_path', 'ffmpeg'),
                '-y',
                '-i',
                $sourcePath,
                '-map',
                '0:v:0',
                '-map',
                '0:a?',
                '-vf',
                "scale={$width}:{$profile['height']}",
                '-c:v',
                'libx264',
                '-preset',
                'veryfast',
                '-crf',
                '23',
                '-maxrate',
                (string) $bitrate,
                '-bufsize',
                (string) ($bitrate * 2),
                '-c:a',
                'aac',
                '-b:a',
                '128k',
                '-hls_time',
                '6',
                '-hls_playlist_type',
                'vod',
                '-hls_segment_filename',
                $segmentLocalPattern,
                $playlistLocalPath,
            ]);
            $process->setTimeout((int) config('streamops.processing_timeout_seconds', 300));
            $process->run();

            if (! $process->isSuccessful() || ! is_file($playlistLocalPath)) {
                throw new RuntimeException(trim($process->getErrorOutput()) ?: "ffmpeg could not generate {$profile['label']} HLS output.");
            }

            $renditions[] = [
                'label' => $profile['label'],
                'width' => $width,
                'height' => $profile['height'],
                'bitrate' => $bitrate,
                'codec' => $metadata['codec'],
                'playlistPath' => "videos/{$video->id}/hls/{$profile['label']}/index.m3u8",
                'segmentPrefix' => "videos/{$video->id}/hls/{$profile['label']}",
            ];
        }

        if ($renditions === []) {
            throw new RuntimeException('No supported HLS rendition profiles were generated.');
        }

        $masterManifestPath = $hlsDirectory.'/master.m3u8';
        File::put($masterManifestPath, $this->masterManifestContents($renditions));
        $this->storeHlsDirectory($video, $hlsDirectory);

        return [
            'masterManifestPath' => "videos/{$video->id}/hls/master.m3u8",
            'renditions' => $renditions,
        ];
    }

    /**
     * @return array<int, array{label: string, height: int, bitrate: int}>
     */
    private function supportedRenditionProfiles(int $sourceHeight): array
    {
        $profiles = array_values(array_filter(
            $this->renditionProfiles,
            fn (array $profile): bool => $profile['height'] <= $sourceHeight
        ));

        if ($profiles !== []) {
            return $profiles;
        }

        return [[
            'label' => "{$sourceHeight}p",
            'height' => $sourceHeight,
            'bitrate' => 1_000_000,
        ]];
    }

    private function scaledWidth(int $sourceWidth, int $sourceHeight, int $targetHeight): int
    {
        $width = (int) round(($sourceWidth / $sourceHeight) * $targetHeight);

        return $width % 2 === 0 ? $width : $width + 1;
    }

    /**
     * @param  array<int, array{label: string, width: int, height: int, bitrate: int, codec: ?string, playlistPath: string, segmentPrefix: string}>  $renditions
     */
    private function masterManifestContents(array $renditions): string
    {
        $lines = ['#EXTM3U', '#EXT-X-VERSION:3'];

        foreach ($renditions as $rendition) {
            $lines[] = "#EXT-X-STREAM-INF:BANDWIDTH={$rendition['bitrate']},RESOLUTION={$rendition['width']}x{$rendition['height']}";
            $lines[] = "{$rendition['label']}/index.m3u8";
        }

        return implode("\n", $lines)."\n";
    }

    private function storeHlsDirectory(Video $video, string $hlsDirectory): void
    {
        foreach (File::allFiles($hlsDirectory) as $file) {
            $relativePath = $file->getRelativePathname();
            $targetPath = "videos/{$video->id}/hls/{$relativePath}";
            $stream = fopen($file->getPathname(), 'rb');

            if ($stream === false) {
                throw new RuntimeException("Unable to read generated HLS file {$relativePath}.");
            }

            try {
                if (! Storage::disk($video->source_disk)->put($targetPath, $stream)) {
                    throw new RuntimeException("Unable to store generated HLS file {$relativePath}.");
                }
            } finally {
                fclose($stream);
            }
        }
    }

    private function parseFrameRate(?string $frameRate): ?float
    {
        if ($frameRate === null || $frameRate === '0/0') {
            return null;
        }

        if (! str_contains($frameRate, '/')) {
            return (float) $frameRate;
        }

        [$numerator, $denominator] = array_map('floatval', explode('/', $frameRate, 2));

        if ($denominator <= 0.0) {
            return null;
        }

        return round($numerator / $denominator, 3);
    }
}
