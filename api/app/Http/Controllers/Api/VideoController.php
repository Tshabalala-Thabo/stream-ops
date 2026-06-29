<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProcessingRunStatus;
use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\UploadSessionResource;
use App\Http\Resources\VideoProcessingRunResource;
use App\Http\Resources\VideoRenditionResource;
use App\Http\Resources\VideoResource;
use App\Jobs\ProcessVideo;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class VideoController extends Controller
{
    public function index(Request $request)
    {
        $videos = Video::query()
            ->with('user')
            ->where('status', VideoStatus::Ready)
            ->whereNotNull('playback_manifest_path')
            ->when($request->string('q')->isNotEmpty(), function ($query) use ($request): void {
                $search = $request->string('q')->toString();

                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->get();

        return VideoResource::collection($videos);
    }

    public function show(Video $video): VideoResource
    {
        abort_unless($video->status === VideoStatus::Ready && $video->playback_manifest_path !== null, 404);

        return new VideoResource($video->load('user'));
    }

    public function renditions(Video $video)
    {
        abort_unless($video->status === VideoStatus::Ready && $video->playback_manifest_path !== null, 404);

        return VideoRenditionResource::collection(
            $video->renditions()->with('video')->orderBy('height')->get()
        );
    }

    public function mine(Request $request)
    {
        $videos = $request->user()
            ->videos()
            ->with('user')
            ->latest()
            ->get();

        return VideoResource::collection($videos);
    }

    public function creatorShow(Request $request, Video $video): VideoResource
    {
        abort_unless($video->user_id === $request->user()->id, 403);

        return new VideoResource($video->load('user'));
    }

    public function creatorRenditions(Request $request, Video $video)
    {
        abort_unless($video->user_id === $request->user()->id, 403);

        return VideoRenditionResource::collection(
            $video->renditions()->with('video')->orderBy('height')->get()
        );
    }

    public function uploadSessions(Request $request, Video $video)
    {
        abort_unless($video->user_id === $request->user()->id, 403);

        return UploadSessionResource::collection(
            $video->uploadSessions()->latest()->get()
        );
    }

    public function retryProcessing(Request $request, Video $video): VideoResource
    {
        abort_unless($video->user_id === $request->user()->id, 403);

        if ($video->status === VideoStatus::Ready) {
            throw ValidationException::withMessages([
                'video' => 'Ready videos do not need processing retry.',
            ]);
        }

        if ($video->source_disk === null || $video->source_path === null) {
            throw ValidationException::withMessages([
                'video' => 'This video does not have a source file to process.',
            ]);
        }

        if (! Storage::disk($video->source_disk)->exists($video->source_path)) {
            throw ValidationException::withMessages([
                'video' => 'The source file is missing from storage.',
            ]);
        }

        DB::transaction(function () use ($video): void {
            $video->processingRuns()
                ->whereIn('status', [
                    ProcessingRunStatus::Queued,
                    ProcessingRunStatus::Running,
                ])
                ->update([
                    'status' => ProcessingRunStatus::Failed,
                    'finished_at' => now(),
                    'error' => 'Processing was retried by the creator after the queued job failed or stalled.',
                ]);

            $video->renditions()->delete();

            $video->update([
                'status' => VideoStatus::Queued,
                'processing_error' => null,
                'duration_seconds' => null,
                'width' => null,
                'height' => null,
                'thumbnail_path' => null,
                'playback_manifest_path' => null,
                'preview_sprite_path' => null,
                'preview_track_path' => null,
                'preview_interval_seconds' => null,
            ]);

            ProcessVideo::dispatch($video->fresh());
        });

        return new VideoResource($video->refresh()->load('user'));
    }

    public function processingRuns(Request $request, Video $video)
    {
        abort_unless($video->user_id === $request->user()->id, 403);

        return VideoProcessingRunResource::collection(
            $video->processingRuns()->latest()->get()
        );
    }
}
