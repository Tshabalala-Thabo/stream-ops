<?php

use App\Enums\UploadSessionStatus;
use App\Enums\VideoStatus;
use App\Models\UploadSession;
use App\Support\UploadSessionFiles;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('streamops:cleanup-uploads', function (): int {
    $expiredSessions = UploadSession::query()
        ->with('video')
        ->where('status', UploadSessionStatus::Active)
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->get();

    foreach ($expiredSessions as $uploadSession) {
        $uploadSession->update([
            'status' => UploadSessionStatus::Failed,
        ]);

        $uploadSession->video->update([
            'status' => VideoStatus::Failed,
            'processing_error' => 'Upload session expired before completion.',
        ]);

        UploadSessionFiles::deleteTemporaryChunks($uploadSession);
    }

    $this->info("Cleaned {$expiredSessions->count()} expired upload session(s).");

    return 0;
})->purpose('Clean up expired StreamOps upload sessions and temporary chunks');

Schedule::command('streamops:cleanup-uploads')->hourly();
