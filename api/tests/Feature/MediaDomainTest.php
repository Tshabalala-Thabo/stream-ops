<?php

namespace Tests\Feature;

use App\Enums\ProcessingRunStatus;
use App\Enums\UploadSessionStatus;
use App\Enums\VideoStatus;
use App\Models\UploadSession;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoProcessingRun;
use App\Models\VideoRendition;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MediaDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_media_domain_relationships_are_wired(): void
    {
        $user = User::factory()->create();
        $video = Video::factory()->for($user)->ready()->create();
        $uploadSession = UploadSession::factory()->for($video)->completed()->create();
        $processingRun = VideoProcessingRun::factory()->for($video)->completed()->create();
        $rendition = VideoRendition::factory()->for($video)->create();

        $this->assertTrue($user->videos->contains($video));
        $this->assertTrue($video->uploadSessions->contains($uploadSession));
        $this->assertTrue($video->processingRuns->contains($processingRun));
        $this->assertTrue($video->renditions->contains($rendition));
    }

    public function test_media_domain_enum_casts_are_wired(): void
    {
        $video = Video::factory()->ready()->create();
        $uploadSession = UploadSession::factory()->for($video)->completed()->create();
        $processingRun = VideoProcessingRun::factory()->for($video)->completed()->create();

        $this->assertSame(VideoStatus::Ready, $video->fresh()->status);
        $this->assertSame(UploadSessionStatus::Completed, $uploadSession->fresh()->status);
        $this->assertSame(ProcessingRunStatus::Completed, $processingRun->fresh()->status);
    }
}
