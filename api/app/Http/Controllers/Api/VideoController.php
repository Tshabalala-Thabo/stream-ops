<?php

namespace App\Http\Controllers\Api;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\VideoProcessingRunResource;
use App\Http\Resources\VideoRenditionResource;
use App\Http\Resources\VideoResource;
use App\Models\Video;
use Illuminate\Http\Request;

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

    public function processingRuns(Request $request, Video $video)
    {
        abort_unless($video->user_id === $request->user()->id, 403);

        return VideoProcessingRunResource::collection(
            $video->processingRuns()->latest()->get()
        );
    }
}
