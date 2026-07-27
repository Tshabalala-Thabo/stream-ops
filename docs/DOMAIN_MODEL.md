# Domain Model

The domain model is intentionally small.

## Video

Represents one creator-owned uploaded video.

Fields:

- `id`
- `ownerId`
- `title`
- `description`
- `status`
- `sourceKey`
- `thumbnailKey`
- `playbackManifestKey`
- `durationSeconds`
- `width`
- `height`
- `processingError`
- `createdAt`
- `updatedAt`

Statuses:

- `uploading`
- `uploaded`
- `queued`
- `processing`
- `ready`
- `failed`
- `cancelled`

## UploadSession

Represents one upload attempt.

Fields:

- `id`
- `videoId`
- `ownerId`
- `status`
- `objectKey`
- `multipartUploadId`
- `partSize`
- `totalParts`
- `uploadedParts`
- `expiresAt`
- `createdAt`
- `updatedAt`

Statuses:

- `active`
- `completed`
- `aborted`
- `failed`
- `expired`

## ProcessingRun

Represents one processing attempt.

Fields:

- `id`
- `videoId`
- `status`
- `stage`
- `metadata`
- `error`
- `startedAt`
- `finishedAt`

Statuses:

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`

## VideoRendition

Represents one generated playback rendition.

Fields:

- `videoId`
- `label`
- `width`
- `height`
- `bitrate`
- `playlistKey`
- `segmentPrefix`

## DynamoDB Access Patterns

Initial access patterns:

- Get a video by ID.
- List videos for an owner.
- List ready public videos.
- Get active upload session.
- List processing runs for a video.
- List renditions for a video.

Suggested single-table keys:

```text
PK=USER#{ownerId}   SK=VIDEO#{videoId}
PK=VIDEO#{videoId}  SK=METADATA
PK=VIDEO#{videoId}  SK=UPLOAD#{uploadSessionId}
PK=VIDEO#{videoId}  SK=RUN#{runId}
PK=VIDEO#{videoId}  SK=RENDITION#{label}
```

Add indexes only after access patterns require them.

