<?php

namespace Tests\Feature;

use App\Enums\ProcessingRunStatus;
use App\Enums\VideoStatus;
use App\Jobs\ProcessVideo;
use App\Models\UploadSession;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoRendition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VideoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_video_index_only_returns_ready_playable_videos(): void
    {
        $ready = Video::factory()->ready()->create(['title' => 'Playable video']);
        $processing = Video::factory()->processing()->create(['title' => 'Processing video']);
        $readyWithoutManifest = Video::factory()->create([
            'status' => VideoStatus::Ready,
            'playback_manifest_path' => null,
        ]);

        $response = $this->getJson('/api/videos');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $ready->id)
            ->assertJsonMissing(['id' => $processing->id])
            ->assertJsonMissing(['id' => $readyWithoutManifest->id]);
    }

    public function test_public_video_show_hides_non_ready_videos(): void
    {
        $processing = Video::factory()->processing()->create();

        $this->getJson("/api/videos/{$processing->id}")
            ->assertNotFound();
    }

    public function test_public_renditions_return_playlist_level_data_without_segments(): void
    {
        $video = Video::factory()->ready()->create();
        VideoRendition::factory()->for($video)->create([
            'label' => '720p',
            'height' => 720,
            'width' => 1280,
            'playlist_path' => "videos/{$video->id}/hls/720p/index.m3u8",
            'segment_prefix' => "videos/{$video->id}/hls/720p/",
        ]);

        $response = $this->getJson("/api/videos/{$video->id}/renditions");

        $response
            ->assertOk()
            ->assertJsonPath('data.0.label', '720p')
            ->assertJsonPath('data.0.segmentPrefix', "videos/{$video->id}/hls/720p/")
            ->assertJsonMissing(['segments' => []]);
    }

    public function test_public_video_resource_returns_preview_urls_when_available(): void
    {
        Storage::fake('public');

        $video = Video::factory()->ready()->create([
            'source_disk' => 'public',
            'preview_sprite_path' => 'videos/preview-video/previews/storyboard.jpg',
            'preview_track_path' => 'videos/preview-video/previews/storyboard.vtt',
            'preview_interval_seconds' => 10,
        ]);

        $this->getJson("/api/videos/{$video->id}")
            ->assertOk()
            ->assertJsonPath('data.previewSpritePath', 'videos/preview-video/previews/storyboard.jpg')
            ->assertJsonPath('data.previewSpriteUrl', url('/api/media/videos/preview-video/previews/storyboard.jpg'))
            ->assertJsonPath('data.previewTrackPath', 'videos/preview-video/previews/storyboard.vtt')
            ->assertJsonPath('data.previewTrackUrl', url('/api/media/videos/preview-video/previews/storyboard.vtt'))
            ->assertJsonPath('data.previewIntervalSeconds', 10);
    }

    public function test_public_video_resource_serializes_ready_videos_without_previews(): void
    {
        $video = Video::factory()->ready()->create([
            'preview_sprite_path' => null,
            'preview_track_path' => null,
            'preview_interval_seconds' => null,
        ]);

        $this->getJson("/api/videos/{$video->id}")
            ->assertOk()
            ->assertJsonPath('data.previewSpritePath', null)
            ->assertJsonPath('data.previewSpriteUrl', null)
            ->assertJsonPath('data.previewTrackPath', null)
            ->assertJsonPath('data.previewTrackUrl', null)
            ->assertJsonPath('data.previewIntervalSeconds', null);
    }

    public function test_authenticated_creator_can_view_their_non_ready_video_details(): void
    {
        $user = User::factory()->create();
        $video = Video::factory()->for($user)->processing()->create([
            'title' => 'Creator processing video',
        ]);

        $response = $this->actingAs($user)->getJson("/api/me/videos/{$video->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $video->id)
            ->assertJsonPath('data.title', 'Creator processing video')
            ->assertJsonPath('data.status', VideoStatus::Processing->value);
    }

    public function test_authenticated_creator_video_detail_routes_reject_other_users(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $video = Video::factory()->for($owner)->processing()->create();

        $this->actingAs($otherUser)->getJson("/api/me/videos/{$video->id}")
            ->assertForbidden();

        $this->actingAs($otherUser)->getJson("/api/me/videos/{$video->id}/upload-sessions")
            ->assertForbidden();

        $this->actingAs($otherUser)->getJson("/api/me/videos/{$video->id}/renditions")
            ->assertForbidden();
    }

    public function test_authenticated_creator_can_list_their_upload_sessions(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $video = Video::factory()->for($user)->create();
        $otherVideo = Video::factory()->for($otherUser)->create();
        $uploadSession = UploadSession::factory()->for($video)->create([
            'object_key' => "videos/{$video->id}/source/original.mp4",
        ]);
        UploadSession::factory()->for($otherVideo)->create();

        $response = $this->actingAs($user)->getJson('/api/me/upload-sessions');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $uploadSession->id)
            ->assertJsonPath('data.0.objectKey', "videos/{$video->id}/source/original.mp4");
    }

    public function test_authenticated_creator_can_list_upload_sessions_for_their_video(): void
    {
        $user = User::factory()->create();
        $video = Video::factory()->for($user)->create();
        $uploadSession = UploadSession::factory()->for($video)->completed()->create();

        $response = $this->actingAs($user)->getJson("/api/me/videos/{$video->id}/upload-sessions");

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $uploadSession->id)
            ->assertJsonPath('data.0.status', 'completed');
    }

    public function test_authenticated_creator_can_retry_processing_for_a_stalled_video(): void
    {
        Queue::fake();
        Storage::fake('public');

        $user = User::factory()->create();
        $video = Video::factory()->for($user)->processing()->create([
            'source_disk' => 'public',
            'source_path' => 'videos/retry-video/source/original.mp4',
            'processing_error' => 'Previous worker timed out.',
            'thumbnail_path' => 'videos/retry-video/thumbnails/default.jpg',
            'playback_manifest_path' => 'videos/retry-video/hls/master.m3u8',
            'preview_sprite_path' => 'videos/retry-video/previews/storyboard.jpg',
            'preview_track_path' => 'videos/retry-video/previews/storyboard.vtt',
            'preview_interval_seconds' => 10,
        ]);
        $processingRun = $video->processingRuns()->create([
            'status' => ProcessingRunStatus::Running,
            'started_at' => now()->subMinutes(30),
            'metadata' => ['stage' => 'metadata_thumbnail_hls'],
        ]);
        VideoRendition::factory()->for($video)->create();

        Storage::disk('public')->put($video->source_path, 'source video');

        $response = $this->actingAs($user)->postJson("/api/me/videos/{$video->id}/retry-processing");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $video->id)
            ->assertJsonPath('data.status', VideoStatus::Queued->value)
            ->assertJsonPath('data.processingError', null)
            ->assertJsonPath('data.playbackManifestPath', null)
            ->assertJsonPath('data.previewSpritePath', null)
            ->assertJsonPath('data.previewTrackPath', null)
            ->assertJsonPath('data.previewIntervalSeconds', null);

        $this->assertDatabaseHas('videos', [
            'id' => $video->id,
            'status' => VideoStatus::Queued->value,
            'processing_error' => null,
            'thumbnail_path' => null,
            'playback_manifest_path' => null,
            'preview_sprite_path' => null,
            'preview_track_path' => null,
            'preview_interval_seconds' => null,
        ]);
        $this->assertDatabaseHas('video_processing_runs', [
            'id' => $processingRun->id,
            'status' => ProcessingRunStatus::Failed->value,
            'error' => 'Processing was retried by the creator after the queued job failed or stalled.',
        ]);
        $this->assertDatabaseMissing('video_renditions', [
            'video_id' => $video->id,
        ]);
        Queue::assertPushed(ProcessVideo::class, fn (ProcessVideo $job): bool => $job->video->id === $video->id);
    }

    public function test_authenticated_creator_cannot_retry_processing_without_source_file(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $video = Video::factory()->for($user)->processing()->create([
            'source_disk' => 'public',
            'source_path' => 'videos/missing-source/source/original.mp4',
        ]);

        $this->actingAs($user)->postJson("/api/me/videos/{$video->id}/retry-processing")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('video');

        Queue::assertNothingPushed();
    }

    public function test_authenticated_creator_cannot_retry_another_users_video_processing(): void
    {
        Queue::fake();

        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $video = Video::factory()->for($owner)->processing()->create();

        $this->actingAs($otherUser)->postJson("/api/me/videos/{$video->id}/retry-processing")
            ->assertForbidden();

        Queue::assertNothingPushed();
    }

    public function test_storage_urls_use_configured_public_and_s3_disks(): void
    {
        Storage::fake('public');
        Storage::fake('s3');

        $local = Video::factory()->ready()->create([
            'source_disk' => 'public',
            'thumbnail_path' => 'videos/local/thumbnails/default.jpg',
        ]);
        $s3 = Video::factory()->ready()->create([
            'source_disk' => 's3',
            'thumbnail_path' => 'videos/cloud/thumbnails/default.jpg',
        ]);

        $this->getJson("/api/videos/{$local->id}")
            ->assertOk()
            ->assertJsonPath('data.thumbnailUrl', url('/api/media/videos/local/thumbnails/default.jpg'));

        $this->getJson("/api/videos/{$s3->id}")
            ->assertOk()
            ->assertJsonPath('data.thumbnailUrl', Storage::disk('s3')->url('videos/cloud/thumbnails/default.jpg'));
    }

    public function test_public_media_proxy_serves_local_public_disk_assets_with_cors_headers(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('videos/local/hls/master.m3u8', '#EXTM3U');

        $response = $this->withHeader('Origin', 'http://localhost:3000')
            ->get('/api/media/videos/local/hls/master.m3u8');

        $response
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

        $this->assertSame('#EXTM3U', $response->streamedContent());
    }
}
