<?php

namespace App\Enums;

enum UploadSessionStatus: string
{
    case Pending = 'pending';
    case Active = 'active';
    case Completed = 'completed';
    case Aborted = 'aborted';
    case Failed = 'failed';
}
