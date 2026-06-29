<?php

namespace App\Support;

class UploadPartSize
{
    public static function effective(): int
    {
        $configuredPartSize = (int) config('streamops.upload_part_size', 8 * 1024 * 1024);
        $uploadMaxSize = self::phpIniBytes((string) ini_get('upload_max_filesize'));
        $postMaxSize = self::phpIniBytes((string) ini_get('post_max_size'));
        $multipartOverhead = 64 * 1024;
        $phpLimit = min($uploadMaxSize, $postMaxSize);

        if ($phpLimit <= 0) {
            return $configuredPartSize;
        }

        return min($configuredPartSize, max(256 * 1024, $phpLimit - $multipartOverhead));
    }

    private static function phpIniBytes(string $value): int
    {
        $value = trim($value);

        if ($value === '') {
            return 0;
        }

        $unit = strtolower($value[strlen($value) - 1]);
        $bytes = (int) $value;

        return match ($unit) {
            'g' => $bytes * 1024 * 1024 * 1024,
            'm' => $bytes * 1024 * 1024,
            'k' => $bytes * 1024,
            default => $bytes,
        };
    }
}
