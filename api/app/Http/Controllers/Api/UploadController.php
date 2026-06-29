<?php

namespace App\Http\Controllers\Api;

use App\Enums\UploadSessionStatus;
use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteUploadRequest;
use App\Http\Requests\StoreUploadRequest;
use App\Http\Resources\UploadSessionResource;
use App\Jobs\ProcessVideo;
use App\Models\UploadSession;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(StoreUploadRequest $request): JsonResponse
    {
        $disk = (string) config('streamops.media_disk', 'public');
        $partSize = (int) config('streamops.upload_part_size', 8 * 1024 * 1024);
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

    public function complete(CompleteUploadRequest $request, UploadSession $uploadSession): UploadSessionResource
    {
        $this->authorizeUploadSession($uploadSession);

        DB::transaction(function () use ($request, $uploadSession): void {
            $uploadSession->update([
                'status' => UploadSessionStatus::Completed,
                'uploaded_parts' => $request->input('uploadedParts', $uploadSession->uploaded_parts ?? []),
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

        return new UploadSessionResource($uploadSession->refresh()->load('video.user'));
    }

    private function authorizeUploadSession(UploadSession $uploadSession): void
    {
        $uploadSession->loadMissing('video');

        abort_unless($uploadSession->video->user_id === request()->user()->id, 403);
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
