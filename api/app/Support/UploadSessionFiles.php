<?php

namespace App\Support;

use App\Models\UploadSession;
use Illuminate\Support\Facades\Storage;

class UploadSessionFiles
{
    public static function chunkDirectory(UploadSession $uploadSession): string
    {
        return "upload-sessions/{$uploadSession->id}";
    }

    public static function chunkPath(UploadSession $uploadSession, int $partNumber): string
    {
        return self::chunkDirectory($uploadSession)."/parts/{$partNumber}.part";
    }

    public static function deleteTemporaryChunks(UploadSession $uploadSession): void
    {
        Storage::disk('local')->deleteDirectory(self::chunkDirectory($uploadSession));
    }
}
