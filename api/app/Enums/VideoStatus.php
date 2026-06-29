<?php

namespace App\Enums;

enum VideoStatus: string
{
    case Draft = 'draft';
    case Uploading = 'uploading';
    case Uploaded = 'uploaded';
    case Queued = 'queued';
    case Processing = 'processing';
    case Ready = 'ready';
    case Failed = 'failed';
}
