<?php

namespace Tests\Feature;

use App\Enums\UploadSessionStatus;
use App\Enums\VideoStatus;
use App\Jobs\ProcessVideo;
use App\Models\UploadSession;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoProcessingRun;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UploadApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_upload_session(): void
    {
        config(['streamops.media_disk' => 'public']);
        Sanctum::actingAs($user = User::factory()->create());

        $response = $this->postJson('/api/uploads', [
            'title' => 'Local upload',
            'description' => 'A source file upload',
            'fileName' => 'launch.mp4',
            'fileSize' => 10_000_000,
            'mimeType' => 'video/mp4',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.provider', 'public')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.video.title', 'Local upload');

        $this->assertDatabaseHas('videos', [
            'user_id' => $user->id,
            'title' => 'Local upload',
            'status' => VideoStatus::Uploading->value,
            'source_disk' => 'public',
        ]);

        $this->assertDatabaseHas('upload_sessions', [
            'provider' => 'public',
            'status' => UploadSessionStatus::Active->value,
        ]);
    }

    public function test_users_cannot_access_another_users_creator_media_records(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $otherVideo = Video::factory()->create();
        $otherUploadSession = UploadSession::factory()->for($otherVideo)->create();
        VideoProcessingRun::factory()->for($otherVideo)->create();

        $this->getJson("/api/uploads/{$otherUploadSession->id}")
            ->assertForbidden();

        $this->getJson("/api/videos/{$otherVideo->id}/processing-runs")
            ->assertForbidden();
    }

    public function test_upload_completion_updates_states_catalogs_existing_source_and_dispatches_processing(): void
    {
        Queue::fake();
        Storage::fake('public');
        Sanctum::actingAs($user = User::factory()->create());

        $video = Video::factory()->for($user)->create([
            'status' => VideoStatus::Uploading,
            'source_disk' => 'public',
            'source_path' => 'videos/test-video/source/original.mp4',
        ]);
        Storage::disk('public')->put($video->source_path, 'fake-video-bytes');
        $uploadSession = UploadSession::factory()->for($video)->create([
            'object_key' => $video->source_path,
        ]);

        $response = $this->postJson("/api/uploads/{$uploadSession->id}/complete", [
            'uploadedParts' => [
                ['partNumber' => 1, 'etag' => 'etag-1', 'size' => 1024],
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.video.status', 'queued');

        $this->assertSame(UploadSessionStatus::Completed, $uploadSession->fresh()->status);
        $this->assertSame(VideoStatus::Queued, $video->fresh()->status);
        $this->assertCount(1, $video->fresh()->getMedia('source'));
        Queue::assertPushed(ProcessVideo::class);
    }
}
