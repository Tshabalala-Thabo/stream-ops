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
use Illuminate\Http\UploadedFile;
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
        config(['streamops.upload_part_size' => 5_000]);
        Sanctum::actingAs($user = User::factory()->create());

        $response = $this->postJson('/api/uploads', [
            'title' => 'Local upload',
            'description' => 'A source file upload',
            'fileName' => 'launch.mp4',
            'fileSize' => 10_000,
            'mimeType' => 'video/mp4',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.provider', 'public')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.totalParts', 2)
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

    public function test_upload_completion_assembles_chunks_catalogs_source_and_dispatches_processing(): void
    {
        Queue::fake();
        Storage::fake('local');
        Storage::fake('public');
        config(['streamops.media_disk' => 'public']);
        config(['streamops.upload_part_size' => 5]);
        Sanctum::actingAs($user = User::factory()->create());

        $sessionResponse = $this->postJson('/api/uploads', [
            'title' => 'Chunked local upload',
            'description' => null,
            'fileName' => 'clip.mp4',
            'fileSize' => 11,
            'mimeType' => 'video/mp4',
        ]);
        $uploadSession = UploadSession::findOrFail($sessionResponse->json('data.id'));

        $this->put("/api/uploads/{$uploadSession->id}/parts/1", [
            'chunk' => UploadedFile::fake()->createWithContent('1.part', 'hello'),
        ])->assertOk();
        $this->put("/api/uploads/{$uploadSession->id}/parts/2", [
            'chunk' => UploadedFile::fake()->createWithContent('2.part', '-stre'),
        ])->assertOk();
        $this->put("/api/uploads/{$uploadSession->id}/parts/3", [
            'chunk' => UploadedFile::fake()->createWithContent('3.part', 'am'),
        ])->assertOk();

        $response = $this->postJson("/api/uploads/{$uploadSession->id}/complete");

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.video.status', 'queued');

        $this->assertSame(UploadSessionStatus::Completed, $uploadSession->fresh()->status);
        $video = $uploadSession->fresh()->video;
        $this->assertSame(VideoStatus::Queued, $video->status);
        $this->assertSame('hello-stream', Storage::disk('public')->get($video->source_path));
        $this->assertFalse(Storage::disk('local')->exists("upload-sessions/{$uploadSession->id}"));
        $this->assertCount(1, $video->fresh()->getMedia('source'));
        Queue::assertPushed(ProcessVideo::class);
    }

    public function test_upload_completion_fails_when_parts_are_missing(): void
    {
        Queue::fake();
        Storage::fake('local');
        Storage::fake('public');
        config(['streamops.media_disk' => 'public']);
        config(['streamops.upload_part_size' => 5]);
        Sanctum::actingAs(User::factory()->create());

        $sessionResponse = $this->postJson('/api/uploads', [
            'title' => 'Missing chunk upload',
            'description' => null,
            'fileName' => 'clip.mp4',
            'fileSize' => 11,
            'mimeType' => 'video/mp4',
        ]);
        $uploadSession = UploadSession::findOrFail($sessionResponse->json('data.id'));

        $this->put("/api/uploads/{$uploadSession->id}/parts/1", [
            'chunk' => UploadedFile::fake()->createWithContent('1.part', 'hello'),
        ])->assertOk();

        $this->postJson("/api/uploads/{$uploadSession->id}/complete")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('uploadedParts');

        $this->assertSame(UploadSessionStatus::Active, $uploadSession->fresh()->status);
        $this->assertSame(VideoStatus::Uploading, $uploadSession->fresh()->video->status);
        Queue::assertNothingPushed();
    }

    public function test_upload_part_retry_replaces_existing_part(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        config(['streamops.upload_part_size' => 10]);
        Sanctum::actingAs($user = User::factory()->create());

        $video = Video::factory()->for($user)->create([
            'status' => VideoStatus::Uploading,
            'source_disk' => 'public',
            'source_path' => 'videos/test-video/source/original.mp4',
        ]);
        $uploadSession = UploadSession::factory()->for($video)->create([
            'part_size' => 10,
            'total_parts' => 1,
            'uploaded_parts' => [],
            'object_key' => $video->source_path,
            'status' => UploadSessionStatus::Active,
        ]);

        $this->put("/api/uploads/{$uploadSession->id}/parts/1", [
            'chunk' => UploadedFile::fake()->createWithContent('1.part', 'first'),
        ])->assertOk();
        $this->put("/api/uploads/{$uploadSession->id}/parts/1", [
            'chunk' => UploadedFile::fake()->createWithContent('1.part', 'second'),
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data.uploadedParts')
            ->assertJsonPath('data.uploadedParts.0.size', 6);

        $this->assertSame('second', Storage::disk('local')->get("upload-sessions/{$uploadSession->id}/parts/1.part"));
    }

    public function test_users_cannot_upload_parts_or_complete_another_users_session(): void
    {
        Storage::fake('local');
        Sanctum::actingAs(User::factory()->create());

        $otherVideo = Video::factory()->create([
            'status' => VideoStatus::Uploading,
            'source_disk' => 'public',
            'source_path' => 'videos/test-video/source/original.mp4',
        ]);
        $otherUploadSession = UploadSession::factory()->for($otherVideo)->create([
            'status' => UploadSessionStatus::Active,
        ]);

        $this->put("/api/uploads/{$otherUploadSession->id}/parts/1", [
            'chunk' => UploadedFile::fake()->createWithContent('1.part', 'hello'),
        ])->assertForbidden();

        $this->postJson("/api/uploads/{$otherUploadSession->id}/complete")
            ->assertForbidden();
    }
}
