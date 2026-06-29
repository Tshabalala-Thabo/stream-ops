<?php

return [
    'media_disk' => env('STREAMOPS_MEDIA_DISK', 'public'),
    'upload_part_size' => (int) env('STREAMOPS_UPLOAD_PART_SIZE', 8 * 1024 * 1024),
    'max_upload_size_kb' => (int) env('STREAMOPS_MAX_UPLOAD_SIZE_KB', 512 * 1024),
    'upload_session_ttl_minutes' => (int) env('STREAMOPS_UPLOAD_SESSION_TTL_MINUTES', 120),
];
