<?php

return [
    'media_disk' => env('STREAMOPS_MEDIA_DISK', 'public'),
    'upload_part_size' => (int) env('STREAMOPS_UPLOAD_PART_SIZE', 8 * 1024 * 1024),
    'max_upload_size_kb' => (int) env('STREAMOPS_MAX_UPLOAD_SIZE_KB', 20 * 1024 * 1024),
    'upload_session_ttl_minutes' => (int) env('STREAMOPS_UPLOAD_SESSION_TTL_MINUTES', 120),
    'ffmpeg_path' => env('STREAMOPS_FFMPEG_PATH', env('FFMPEG_PATH', 'ffmpeg')),
    'ffprobe_path' => env('STREAMOPS_FFPROBE_PATH', env('FFPROBE_PATH', 'ffprobe')),
    'processing_timeout_seconds' => (int) env('STREAMOPS_PROCESSING_TIMEOUT_SECONDS', 7200),
    'processing_job_timeout_seconds' => (int) env('STREAMOPS_PROCESSING_JOB_TIMEOUT_SECONDS', 14400),
];
