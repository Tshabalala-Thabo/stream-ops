# Acceptance Scenarios

These scenarios define the first useful rebuild target. They are intentionally
small and should pass locally with mocked AWS adapters before real AWS services
are introduced.

## Creator Upload

Given an authenticated creator,
when the creator starts an upload,
then the app creates a `Video` in `uploading` status and an active
`UploadSession`.

## Upload Completion

Given an active upload session,
when the upload is completed,
then the upload session becomes `completed` and the video becomes `uploaded`.

## Processing Queue

Given an uploaded video,
when the app queues processing,
then the video becomes `queued` and a processing run is created in `queued`
status.

## Processing Success

Given a queued processing run,
when processing completes successfully,
then the run becomes `completed`, the video becomes `ready`, and generated
thumbnail and playback asset keys are recorded.

## Processing Failure

Given a queued or running processing run,
when processing fails,
then the run becomes `failed`, the video becomes `failed`, and a useful error is
recorded.

## Ownership

Given two creators,
when one creator requests another creator's video or upload session,
then the app denies access.

## Expired Upload

Given an upload session past its expiry time,
when the session is checked or cleaned up,
then it becomes `expired` and cannot be completed.
