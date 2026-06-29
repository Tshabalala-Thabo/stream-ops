<?php

namespace App\Http\Controllers\Api;

use App\Enums\UploadSessionStatus;
use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteUploadRequest;
use App\Http\Requests\StoreUploadPartRequest;
use App\Http\Requests\StoreUploadRequest;
use App\Http\Resources\UploadSessionResource;
use App\Jobs\ProcessVideo;
use App\Models\UploadSession;
use App\Models\Video;
use App\Support\UploadPartSize;
use App\Support\UploadSessionFiles;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class UploadController extends Controller
{
    public function store(StoreUploadRequest $request): JsonResponse
    {
        $disk = (string) config('streamops.media_disk', 'public');
        $partSize = UploadPartSize::effective();
        $fileSize = (int) $request->integer('fileSize');

        $uploadSession = DB::transaction(function () use ($request, $disk, $partSize, $fileSize): UploadSession {
            $video = Video::create([
                'user_id' => $request->user()->id,
                'title' => $request->string('title')->toString(),
                'description' => $request->input('description'),
                'status' => VideoStatus::Uploading,
                'source_disk' => $disk,
            ]);

            $sourcePath = $this->sourcePath($video, $request->string('fileName')->toString());

            $video->update([
                'source_path' => $sourcePath,
            ]);

            return UploadSession::create([
                'video_id' => $video->id,
                'provider' => $disk,
                'multipart_upload_id' => null,
                'object_key' => $sourcePath,
                'status' => UploadSessionStatus::Active,
                'part_size' => $partSize,
                'total_parts' => max(1, (int) ceil($fileSize / $partSize)),
                'uploaded_parts' => [],
                'expires_at' => now()->addMinutes((int) config('streamops.upload_session_ttl_minutes', 120)),
            ]);
        });

        return (new UploadSessionResource($uploadSession->load('video.user')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(UploadSession $uploadSession): UploadSessionResource
    {
        $this->authorizeUploadSession($uploadSession);

        return new UploadSessionResource($uploadSession->load('video.user'));
    }

    public function storePart(
        StoreUploadPartRequest $request,
        UploadSession $uploadSession,
        int $partNumber
    ): UploadSessionResource {
        $this->authorizeUploadSession($uploadSession);
        $this->ensureActiveUploadSession($uploadSession);
        $this->ensureValidPartNumber($uploadSession, $partNumber);

        $chunk = $request->file('chunk');

        if ($chunk === null || ! $chunk->isValid()) {
            throw ValidationException::withMessages([
                'chunk' => 'The uploaded chunk is invalid.',
            ]);
        }

        $chunkPath = UploadSessionFiles::chunkPath($uploadSession, $partNumber);
        $etag = hash_file('sha256', $chunk->getRealPath()) ?: sha1($uploadSession->id.'-'.$partNumber);
        $size = (int) $chunk->getSize();

        Storage::disk('local')->put($chunkPath, $chunk->getContent());

        $uploadSession->update([
            'uploaded_parts' => $this->mergeUploadedPart($uploadSession, [
                'partNumber' => $partNumber,
                'etag' => $etag,
                'size' => $size,
            ]),
        ]);

        return new UploadSessionResource($uploadSession->refresh()->load('video.user'));
    }

    public function complete(CompleteUploadRequest $request, UploadSession $uploadSession): UploadSessionResource
    {
        $this->authorizeUploadSession($uploadSession);
        $this->ensureActiveUploadSession($uploadSession);
        $request->validated();

        $this->ensureAllPartsExist($uploadSession);
        $this->assembleSourceFile($uploadSession);

        DB::transaction(function () use ($uploadSession): void {
            $uploadSession->update([
                'status' => UploadSessionStatus::Completed,
            ]);

            $video = $uploadSession->video;

            $video->update([
                'status' => VideoStatus::Uploaded,
            ]);

            $this->catalogSourceMedia($video);

            $video->update([
                'status' => VideoStatus::Queued,
            ]);

            ProcessVideo::dispatch($video);
        });

        UploadSessionFiles::deleteTemporaryChunks($uploadSession);

        return new UploadSessionResource($uploadSession->refresh()->load('video.user'));
    }

    public function abort(UploadSession $uploadSession): UploadSessionResource
    {
        $this->authorizeUploadSession($uploadSession);
        $this->ensureActiveUploadSession($uploadSession);

        DB::transaction(function () use ($uploadSession): void {
            $uploadSession->update([
                'status' => UploadSessionStatus::Aborted,
            ]);

            $uploadSession->video->update([
                'status' => VideoStatus::Failed,
                'processing_error' => 'Upload was cancelled before completion.',
            ]);
        });

        UploadSessionFiles::deleteTemporaryChunks($uploadSession);

        return new UploadSessionResource($uploadSession->refresh()->load('video.user'));
    }

    private function authorizeUploadSession(UploadSession $uploadSession): void
    {
        $uploadSession->loadMissing('video');

        abort_unless($uploadSession->video->user_id === request()->user()->id, 403);
    }

    private function ensureActiveUploadSession(UploadSession $uploadSession): void
    {
        if ($uploadSession->status !== UploadSessionStatus::Active) {
            throw ValidationException::withMessages([
                'uploadSession' => 'Only active upload sessions can receive file chunks.',
            ]);
        }
    }

    private function ensureValidPartNumber(UploadSession $uploadSession, int $partNumber): void
    {
        if ($partNumber < 1 || $partNumber > $uploadSession->total_parts) {
            throw ValidationException::withMessages([
                'partNumber' => 'The upload part number is outside this session range.',
            ]);
        }
    }

    /**
     * @param  array{partNumber: int, etag: string, size: int}  $part
     * @return array<int, array{partNumber: int, etag: string, size: int}>
     */
    private function mergeUploadedPart(UploadSession $uploadSession, array $part): array
    {
        $parts = collect($uploadSession->uploaded_parts ?? [])
            ->reject(fn (array $uploadedPart): bool => (int) $uploadedPart['partNumber'] === $part['partNumber'])
            ->push($part)
            ->sortBy('partNumber')
            ->values();

        return $parts->all();
    }

    private function ensureAllPartsExist(UploadSession $uploadSession): void
    {
        $uploadedPartNumbers = collect($uploadSession->uploaded_parts ?? [])
            ->map(fn (array $part): int => (int) $part['partNumber'])
            ->unique()
            ->sort()
            ->values();

        $missingParts = collect(range(1, $uploadSession->total_parts))
            ->filter(
                fn (int $partNumber): bool => ! $uploadedPartNumbers->contains($partNumber)
                    || ! Storage::disk('local')->exists(UploadSessionFiles::chunkPath($uploadSession, $partNumber))
            )
            ->values()
            ->all();

        if ($missingParts !== []) {
            throw ValidationException::withMessages([
                'uploadedParts' => 'Upload is missing part(s): '.implode(', ', $missingParts).'.',
            ]);
        }
    }

    private function assembleSourceFile(UploadSession $uploadSession): void
    {
        $video = $uploadSession->video;

        if ($video->source_disk === null || $video->source_path === null) {
            throw ValidationException::withMessages([
                'video' => 'The upload session is missing a source destination.',
            ]);
        }

        $source = fopen('php://temp', 'w+b');

        if ($source === false) {
            throw ValidationException::withMessages([
                'uploadSession' => 'Unable to prepare the uploaded source file.',
            ]);
        }

        try {
            for ($partNumber = 1; $partNumber <= $uploadSession->total_parts; $partNumber++) {
                $chunkStream = Storage::disk('local')->readStream(UploadSessionFiles::chunkPath($uploadSession, $partNumber));

                if ($chunkStream === false) {
                    throw ValidationException::withMessages([
                        'uploadedParts' => "Upload part {$partNumber} could not be read.",
                    ]);
                }

                stream_copy_to_stream($chunkStream, $source);
                fclose($chunkStream);
            }

            rewind($source);

            if (! Storage::disk($video->source_disk)->put($video->source_path, $source)) {
                throw ValidationException::withMessages([
                    'video' => 'Unable to store the assembled source video.',
                ]);
            }
        } finally {
            fclose($source);
        }
    }

    private function sourcePath(Video $video, string $fileName): string
    {
        $extension = strtolower((string) pathinfo($fileName, PATHINFO_EXTENSION));
        $extension = preg_match('/^[a-z0-9]+$/', $extension) === 1 ? $extension : 'bin';

        return "videos/{$video->id}/source/original.{$extension}";
    }

    private function catalogSourceMedia(Video $video): void
    {
        if ($video->source_path === null || $video->source_disk === null) {
            return;
        }

        if (! Storage::disk($video->source_disk)->exists($video->source_path)) {
            return;
        }

        if ($video->getFirstMedia('source') !== null) {
            return;
        }

        $video
            ->addMediaFromDisk($video->source_path, $video->source_disk)
            ->preservingOriginal()
            ->withCustomProperties([
                'storage_provider' => $video->source_disk,
                'object_key' => $video->source_path,
            ])
            ->toMediaCollection('source', $video->source_disk);
    }
}
