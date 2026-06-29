# StreamOps Phased Achievement Plan

This plan tracks what the project has achieved from the root `README.md` vision and what still needs to be built. It is based on the current implemented upload dataflow, not only the long-term target architecture.

Legend:

- [x] Implemented
- [ ] Not implemented yet
- [~] Partially implemented

## Phase 1: Domain Foundation And Data Model

- [x] Add first-class `videos` table.
- [x] Use ULID video IDs for public video identifiers.
- [x] Add `upload_sessions` table for upload workflow state.
- [x] Add `video_processing_runs` table for processing attempts.
- [x] Add `video_renditions` table for future rendition outputs.
- [x] Add string-backed enums for video, upload session, and processing run statuses.
- [x] Add Eloquent models, factories, relationships, casts, and `User::videos()`.
- [x] Preserve metadata fields such as duration, dimensions, manifest path, thumbnail path, and processing error.
- [x] Keep HLS segment rows out of the database model.

## Phase 2: Local Upload Management

- [x] Add authenticated upload session creation with `POST /api/uploads`.
- [x] Validate upload metadata: title, description, file name, file size, and video MIME type.
- [x] Create a `videos` row when upload starts.
- [x] Set new upload video status to `uploading`.
- [x] Create an `upload_sessions` row with `active` status.
- [x] Return `partSize`, `totalParts`, `objectKey`, and nested video data to the frontend.
- [x] Cap chunk size to the active PHP upload limits.
- [x] Add local chunk upload endpoint for upload session parts.
- [x] Store temporary chunks on the private `local` disk.
- [x] Track uploaded chunks in `upload_sessions.uploaded_parts`.
- [x] Allow chunk retry by replacing the same part number.
- [x] Validate upload ownership for chunk upload and completion.
- [x] Verify all chunks exist before completion.
- [x] Assemble chunks into one original source file.
- [x] Delete temporary chunk files after successful assembly.
- [x] Mark upload session `completed`.
- [x] Move video status from `uploading` to `uploaded` to `queued`.
- [x] Replace dummy upload UI with a real chunked upload page.
- [x] Show frontend upload progress while chunks upload sequentially.
- [x] Keep the creator on the upload page after success.
- [x] Add browser-side persisted resume after page refresh.
- [x] Add parallel chunk uploads.
- [x] Add upload abort/cancel behavior.
- [x] Add cleanup for expired abandoned upload sessions and temporary chunks.

## Phase 3: Storage And Media Catalog

- [x] Install and configure Spatie Media Library.
- [x] Add Spatie media migration with ULID-compatible polymorphic model IDs.
- [x] Register single-file media collections on `Video`.
- [x] Catalog uploaded source files in the `source` collection.
- [x] Store final source files under `videos/{video_id}/source/original.{ext}`.
- [x] Support local public storage through `STREAMOPS_MEDIA_DISK=public`.
- [x] Support S3-compatible disk configuration through Laravel's `s3` disk.
- [x] Add `.env.example` documentation for local and S3-compatible storage.
- [x] Create local `public/storage` symlink for browser-accessible public disk URLs.
- [~] Object storage abstraction exists through disks, but has only been proven locally.
- [ ] Implement direct S3/R2/MinIO object writes in the upload flow.
- [ ] Implement presigned multipart upload URLs for cloud storage.
- [ ] Catalog generated thumbnails in the `thumbnails` collection.
- [ ] Catalog generated playback manifests in the `playback_manifests` collection.

## Phase 4: API And Frontend Public Experience

- [x] Add public video index endpoint.
- [x] Add public video show endpoint.
- [x] Add public video renditions endpoint.
- [x] Add authenticated creator video endpoint.
- [x] Add authenticated upload session endpoints.
- [x] Add authenticated processing run endpoint.
- [x] Return frontend-aligned camelCase API resource fields.
- [x] Redesign public `/` and `/videos` around a simple streaming catalog.
- [x] Filter public catalog to ready/playable videos.
- [x] Hide operational metadata from public browse cards.
- [x] Keep creator/dashboard pages operational.
- [x] Keep uploaded-but-not-ready videos hidden from public browsing.
- [ ] Replace remaining dummy public video data with live API data.
- [ ] Add live creator dashboard refresh after uploads.
- [ ] Add real watch playback for uploaded videos after processing exists.

## Phase 5: Queue And Processing Skeleton

- [x] Dispatch `ProcessVideo` after upload completion.
- [x] Add a queueable processing job class.
- [x] Create a `video_processing_runs` row from the job.
- [x] Preserve FFmpeg processing integration point.
- [x] Background processing pipeline exists for metadata, thumbnail, and HLS work.
- [x] Processing status tracking exists for running, completed, and failed processing attempts.
- [x] Move video from `queued` to `processing` when a worker starts.
- [x] Mark processing run `running`, `completed`, or `failed`.
- [x] Store processing errors on failed runs.
- [x] Update `videos.processing_error` when processing fails.
- [ ] Add retry controls for failed processing attempts.

## Phase 6: FFmpeg Metadata And Thumbnail Processing

- [x] Add configurable FFmpeg and ffprobe binary paths.
- [x] Read source file from `videos.source_disk` and `videos.source_path`.
- [x] Extract duration.
- [x] Extract width and height.
- [x] Extract codec, bitrate, and frame rate metadata.
- [x] Store duration, width, and height on `videos`.
- [x] Store richer processing metadata on `video_processing_runs.metadata`.
- [x] Generate default thumbnail.
- [x] Store thumbnail at `videos/{video_id}/thumbnails/default.jpg`.
- [x] Update `videos.thumbnail_path`.
- [x] Catalog thumbnail in Spatie `thumbnails` collection.
- [ ] Install FFmpeg locally or provide deployment binary paths in each runtime environment.

## Phase 7: HLS Playback And Renditions

- [x] Generate multiple playback resolutions.
- [x] Generate HLS segments for each rendition.
- [x] Generate rendition playlists at `videos/{video_id}/hls/{label}/index.m3u8`.
- [x] Generate master playlist at `videos/{video_id}/hls/master.m3u8`.
- [x] Store master manifest path on `videos.playback_manifest_path`.
- [x] Catalog master manifest in Spatie `playback_manifests` collection.
- [x] Create one `video_renditions` row per quality level.
- [x] Store rendition playlist paths and segment prefixes.
- [x] Do not create one database row per HLS segment.
- [x] Mark video `ready` only after playback assets exist.
- [x] Make newly processed uploaded videos visible in public browse/watch.
- [ ] Add browser playback using the manifest URL.

## Phase 8: Cloud Multipart Uploads

- [ ] Add upload provider strategy for local vs S3-compatible storage.
- [ ] Keep current local chunked upload as the development fallback.
- [ ] Create multipart upload with S3-compatible providers.
- [ ] Return presigned URLs for browser-to-storage part uploads.
- [ ] Upload browser parts directly to S3/R2/MinIO.
- [ ] Complete multipart upload through provider API.
- [ ] Verify final object exists before marking upload complete.
- [ ] Keep `upload_sessions.multipart_upload_id` populated for cloud multipart sessions.
- [ ] Store provider ETags in `uploaded_parts`.
- [ ] Preserve the same final object key structure across local and cloud modes.

## Phase 9: Monitoring, Operations, And Reliability

- [ ] Add processing status dashboard fed by live backend data.
- [ ] Add failed job visibility.
- [ ] Add worker retry/failure handling beyond the current queue foundation.
- [x] Add cleanup command for expired upload sessions.
- [x] Add cleanup command for orphaned chunks from expired upload sessions.
- [ ] Add cleanup or reconciliation for videos stuck in `uploading`, `uploaded`, or `queued`.
- [ ] Add operational metrics for upload throughput and processing duration.
- [ ] Add logs/events for upload started, part uploaded, upload completed, processing started, processing completed, and processing failed.
- [ ] Add Horizon if Redis queue mode is adopted.
- [ ] Add worker monitoring dashboard.

## Phase 10: Infrastructure And Deployment

- [ ] Add Dockerized development/runtime flow.
- [ ] Add Docker Compose services for API, frontend, MySQL, Redis, queue worker, and storage emulator.
- [ ] Add MinIO local object storage option.
- [ ] Add production-ready S3/R2 storage documentation.
- [ ] Add Redis-backed queue configuration.
- [ ] Add queue worker process configuration.
- [ ] Add horizontal worker scaling notes.
- [ ] Add Nginx or reverse-proxy deployment shape.
- [ ] Add deployment environment variable checklist.

## README Feature Completion Snapshot

### Upload Management

- [x] Secure upload sessions.
- [~] Multipart/chunked uploads: implemented locally through Laravel, not direct-to-object-storage yet.
- [x] Upload progress tracking.
- [x] Upload validation.
- [ ] Presigned upload URLs.
- [ ] Resumable upload recovery after browser refresh.

### Video Processing

- [x] Background processing pipeline: metadata and thumbnail processing exists.
- [x] FFmpeg-powered transcoding.
- [x] Thumbnail generation.
- [x] Metadata extraction.
- [x] Multi-resolution output generation.
- [x] HLS playlist generation.
- [x] Playback segment generation.

### Queue Processing

- [x] Queue dispatch after upload completion.
- [x] Processing run table exists.
- [~] Job execution tracking: placeholder run exists.
- [ ] Redis-backed job queues.
- [ ] Retryable processing jobs.
- [ ] Failed job handling UI.
- [ ] Worker monitoring.
- [ ] Horizontal worker scaling.

### Storage

- [x] Original video storage.
- [x] Local public storage support.
- [x] S3-compatible disk configuration.
- [x] Source file media cataloging.
- [~] Object storage abstraction: disk abstraction exists, cloud upload path pending.
- [x] Processed video storage.
- [ ] Thumbnail storage.
- [x] Playback manifest storage.
- [x] Segment storage.

### Monitoring

- [~] Processing status records exist.
- [ ] Real processing status updates.
- [ ] Queue monitoring dashboard.
- [ ] Error reporting UI.
- [ ] Worker health monitoring.

## Next Recommended Milestone

The next milestone should make the live processed videos play in the frontend:

- Replace dummy public/creator video data with API-backed data where appropriate.
- Add an HLS-capable browser player for `playbackManifestUrl`.
- Confirm public `/videos` and `/videos/{video}` show newly processed `ready` videos.
- Add creator retry controls for failed processing attempts.
