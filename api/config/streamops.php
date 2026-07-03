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
    'thumbnail_sample_fps' => (float) env('STREAMOPS_THUMBNAIL_SAMPLE_FPS', 1),
    'thumbnail_scan_start_ratio' => (float) env('STREAMOPS_THUMBNAIL_SCAN_START_RATIO', 0.1),
    'thumbnail_max_scan_window_seconds' => (float) env('STREAMOPS_THUMBNAIL_MAX_SCAN_WINDOW_SECONDS', 60),
    'thumbnail_min_entropy' => (float) env('STREAMOPS_THUMBNAIL_MIN_ENTROPY', 0.08),
    'thumbnail_min_luma' => (float) env('STREAMOPS_THUMBNAIL_MIN_LUMA', 24),
    'thumbnail_max_luma' => (float) env('STREAMOPS_THUMBNAIL_MAX_LUMA', 232),
];
