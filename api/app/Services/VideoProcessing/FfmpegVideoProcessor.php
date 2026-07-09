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
        $previewSpriteLocalPath = $workDirectory.'/storyboard.jpg';
        $previewTrackLocalPath = $workDirectory.'/storyboard.vtt';
        $hlsDirectory = $workDirectory.'/hls';

        try {
            $this->copySourceToLocalPath($video, $sourcePath);
            $metadata = $this->probe($sourcePath);
            $thumbnailSelection = $this->generateThumbnail($sourcePath, $thumbnailLocalPath, $metadata['durationSeconds']);
            $preview = $this->generatePreviewStoryboard(
                $video,
                $sourcePath,
                $previewSpriteLocalPath,
                $previewTrackLocalPath,
                $metadata
            );
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

            $this->storeGeneratedFile($video, $previewSpriteLocalPath, $preview['spritePath']);
            $this->storeGeneratedFile($video, $previewTrackLocalPath, $preview['trackPath']);

            return new VideoProcessingResult(
                durationSeconds: $metadata['durationSeconds'],
                width: $metadata['width'],
                height: $metadata['height'],
                codec: $metadata['codec'],
                bitrate: $metadata['bitrate'],
                frameRate: $metadata['frameRate'],
                thumbnailPath: $thumbnailPath,
                playbackManifestPath: $hls['masterManifestPath'],
                previewSpritePath: $preview['spritePath'],
                previewTrackPath: $preview['trackPath'],
                previewIntervalSeconds: $preview['intervalSeconds'],
                renditions: $hls['renditions'],
                metadata: [
                    ...$metadata,
                    'renditions' => $hls['renditions'],
                    'playbackManifestPath' => $hls['masterManifestPath'],
                    'previewSpritePath' => $preview['spritePath'],
                    'previewTrackPath' => $preview['trackPath'],
                    'previewIntervalSeconds' => $preview['intervalSeconds'],
                    'thumbnailSelection' => $thumbnailSelection,
                ],
            );
        } finally {
            File::deleteDirectory($workDirectory);
        }
    }

    /**
     * @return array{thumbnailPath: string, thumbnailSelection: array<string, mixed>}
     */
    public function regenerateThumbnail(Video $video): array
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

        try {
            $this->copySourceToLocalPath($video, $sourcePath);
            $metadata = $this->probe($sourcePath);
            $thumbnailSelection = $this->generateThumbnail($sourcePath, $thumbnailLocalPath, $metadata['durationSeconds']);
            $thumbnailPath = "videos/{$video->id}/thumbnails/default.jpg";
            $this->storeGeneratedFile($video, $thumbnailLocalPath, $thumbnailPath);

            $video->update([
                'duration_seconds' => $video->duration_seconds ?? $metadata['durationSeconds'],
                'width' => $video->width ?? $metadata['width'],
                'height' => $video->height ?? $metadata['height'],
                'thumbnail_path' => $thumbnailPath,
            ]);

            return [
                'thumbnailPath' => $thumbnailPath,
                'thumbnailSelection' => $thumbnailSelection,
            ];
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

    /**
     * @return array{strategy: string, scanStartSeconds: float, scanDurationSeconds: float, minEntropy: float, minLuma: float, maxLuma: float, usedFallback: bool}
     */
    private function generateThumbnail(string $sourcePath, string $thumbnailPath, int $durationSeconds): array
    {
        $scanStartSeconds = $this->thumbnailScanStartSeconds($durationSeconds);
        $scanDurationSeconds = $this->thumbnailScanDurationSeconds($durationSeconds, $scanStartSeconds);
        $sampleFps = max(0.1, (float) config('streamops.thumbnail_sample_fps', 1));
        $minEntropy = max(0.0, (float) config('streamops.thumbnail_min_entropy', 0.08));
        $minLuma = max(0.0, (float) config('streamops.thumbnail_min_luma', 24));
        $maxLuma = min(255.0, (float) config('streamops.thumbnail_max_luma', 232));
        $thumbnailFrameWindow = max(2, min(100, (int) ceil($sampleFps * $scanDurationSeconds)));

        $smartProcess = new Process([
            (string) config('streamops.ffmpeg_path', 'ffmpeg'),
            '-y',
            '-ss',
            (string) $scanStartSeconds,
            '-t',
            (string) $scanDurationSeconds,
            '-i',
            $sourcePath,
            '-an',
            '-vf',
            implode(',', [
                "fps={$sampleFps}",
                'format=yuv420p',
                'entropy',
                'signalstats',
                "metadata=select:key=lavfi.entropy.normalized_entropy.normal.Y:value={$minEntropy}:function=greater",
                "metadata=select:key=lavfi.signalstats.YAVG:value={$minLuma}:function=greater",
                "metadata=select:key=lavfi.signalstats.YAVG:value={$maxLuma}:function=less",
                "thumbnail={$thumbnailFrameWindow}",
            ]),
            '-frames:v',
            '1',
            '-update',
            '1',
            $thumbnailPath,
        ]);
        $smartProcess->setTimeout((int) config('streamops.processing_timeout_seconds', 300));
        $smartProcess->run();

        if ($smartProcess->isSuccessful() && is_file($thumbnailPath)) {
            return [
                'strategy' => 'entropy_signalstats_thumbnail',
                'scanStartSeconds' => $scanStartSeconds,
                'scanDurationSeconds' => $scanDurationSeconds,
                'minEntropy' => $minEntropy,
                'minLuma' => $minLuma,
                'maxLuma' => $maxLuma,
                'usedFallback' => false,
            ];
        }

        File::delete($thumbnailPath);
        $timestamp = max(0.1, min($durationSeconds - 0.1, $durationSeconds / 2));
        $process = new Process([
            (string) config('streamops.ffmpeg_path', 'ffmpeg'),
            '-y',
            '-ss',
            (string) $timestamp,
            '-i',
            $sourcePath,
            '-frames:v',
            '1',
            '-update',
            '1',
            $thumbnailPath,
        ]);
        $process->setTimeout((int) config('streamops.processing_timeout_seconds', 300));
        $process->run();

        if (! $process->isSuccessful() || ! is_file($thumbnailPath)) {
            throw new RuntimeException(trim($process->getErrorOutput()) ?: 'ffmpeg could not generate a thumbnail.');
        }

        return [
            'strategy' => 'midpoint_fallback',
            'scanStartSeconds' => $scanStartSeconds,
            'scanDurationSeconds' => $scanDurationSeconds,
            'minEntropy' => $minEntropy,
            'minLuma' => $minLuma,
            'maxLuma' => $maxLuma,
            'usedFallback' => true,
        ];
    }

    private function thumbnailScanStartSeconds(int $durationSeconds): float
    {
        $scanStartRatio = max(0.0, min(0.45, (float) config('streamops.thumbnail_scan_start_ratio', 0.1)));
        $latestStartSeconds = max(0.0, $durationSeconds - 1.0);

        return round(min($latestStartSeconds, max(0.0, $durationSeconds * $scanStartRatio)), 3);
    }

    private function thumbnailScanDurationSeconds(int $durationSeconds, float $scanStartSeconds): float
    {
        $maxScanWindowSeconds = max(1.0, (float) config('streamops.thumbnail_max_scan_window_seconds', 60));
        $tailPaddingSeconds = min(2.0, max(0.0, $durationSeconds * 0.05));
        $availableSeconds = max(1.0, $durationSeconds - $scanStartSeconds - $tailPaddingSeconds);

        return round(min($maxScanWindowSeconds, $availableSeconds), 3);
    }

    /**
     * @param  array{durationSeconds: int, width: int, height: int, codec: ?string, bitrate: ?int, frameRate: ?float, raw: array<string, mixed>}  $metadata
     * @return array{spritePath: string, trackPath: string, intervalSeconds: int}
     */
    private function generatePreviewStoryboard(
        Video $video,
        string $sourcePath,
        string $spritePath,
        string $trackPath,
        array $metadata
    ): array {
        $intervalSeconds = 10;
        $columns = 5;
        $thumbWidth = 160;
        $thumbHeight = max(90, $this->scaledWidth($metadata['height'], $metadata['width'], $thumbWidth));
        $cueCount = max(1, (int) ceil($metadata['durationSeconds'] / $intervalSeconds));
        $rows = max(1, (int) ceil($cueCount / $columns));

        $process = new Process([
            (string) config('streamops.ffmpeg_path', 'ffmpeg'),
            '-y',
            '-i',
            $sourcePath,
            '-vf',
            "fps=1/{$intervalSeconds},scale={$thumbWidth}:{$thumbHeight},tile={$columns}x{$rows}",
            '-frames:v',
            '1',
            $spritePath,
        ]);
        $process->setTimeout((int) config('streamops.processing_timeout_seconds', 300));
        $process->run();

        if (! $process->isSuccessful() || ! is_file($spritePath)) {
            throw new RuntimeException(trim($process->getErrorOutput()) ?: 'ffmpeg could not generate seek preview storyboard.');
        }

        File::put(
            $trackPath,
            $this->previewTrackContents(
                $cueCount,
                $intervalSeconds,
                $metadata['durationSeconds'],
                $columns,
                $thumbWidth,
                $thumbHeight
            )
        );

        return [
            'spritePath' => "videos/{$video->id}/previews/storyboard.jpg",
            'trackPath' => "videos/{$video->id}/previews/storyboard.vtt",
            'intervalSeconds' => $intervalSeconds,
        ];
    }

    private function previewTrackContents(
        int $cueCount,
        int $intervalSeconds,
        int $durationSeconds,
        int $columns,
        int $thumbWidth,
        int $thumbHeight
    ): string {
        $lines = ['WEBVTT', ''];

        for ($index = 0; $index < $cueCount; $index++) {
            $startSeconds = $index * $intervalSeconds;
            $endSeconds = min($durationSeconds, $startSeconds + $intervalSeconds);
            $x = ($index % $columns) * $thumbWidth;
            $y = intdiv($index, $columns) * $thumbHeight;

            $lines[] = $this->vttTimestamp($startSeconds).' --> '.$this->vttTimestamp($endSeconds);
            $lines[] = "storyboard.jpg#xywh={$x},{$y},{$thumbWidth},{$thumbHeight}";
            $lines[] = '';
        }

        return implode("\n", $lines);
    }

    private function vttTimestamp(int $seconds): string
    {
        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);
        $remainingSeconds = $seconds % 60;

        return sprintf('%02d:%02d:%02d.000', $hours, $minutes, $remainingSeconds);
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
        $this->ensureVideoStillExists($video);

        foreach (File::allFiles($hlsDirectory) as $file) {
            $this->ensureVideoStillExists($video);

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

    private function storeGeneratedFile(Video $video, string $localPath, string $targetPath): void
    {
        $this->ensureVideoStillExists($video);

        $stream = fopen($localPath, 'rb');

        if ($stream === false) {
            throw new RuntimeException("Unable to read generated file {$targetPath}.");
        }

        try {
            if (! Storage::disk($video->source_disk)->put($targetPath, $stream)) {
                throw new RuntimeException("Unable to store generated file {$targetPath}.");
            }
        } finally {
            fclose($stream);
        }
    }

    private function ensureVideoStillExists(Video $video): void
    {
        if (! $video->newQuery()->whereKey($video->getKey())->exists()) {
            throw new RuntimeException('Video was deleted before generated assets could be stored.');
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
