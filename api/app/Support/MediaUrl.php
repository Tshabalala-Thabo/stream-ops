<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

class MediaUrl
{
    public static function for(?string $path, ?string $disk): ?string
    {
        if ($path === null) {
            return null;
        }

        $disk ??= (string) config('streamops.media_disk', 'public');

        if ($disk === 'public') {
            return url('/api/media/'.ltrim($path, '/'));
        }

        return Storage::disk($disk)->url($path);
    }
}
