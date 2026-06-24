# StreamOps Frontend Structure And App Shell Plan

## Summary
Build a new `web/` frontend as a Next.js App Router application with TypeScript and Tailwind CSS v4. The app should center the public video library and playback experience, while authenticated users get upload and creator-management tools through the same shell.

All videos are public. Guests can browse and watch. Any logged-in account can upload immediately; email verification is not required for upload in v1.

## Key Changes
- Create a separate `web/` app using Next.js App Router, TypeScript, Tailwind CSS v4, `next/font`, `next/image`, and `lucide-react`.
- Use the existing StreamOps design guide: deep navy text, white/light surfaces, green/teal/cyan/blue accents, compact operational UI, and no marketing-heavy landing page.
- Use Laravel Sanctum cookie-based SPA auth against the existing API:
  - `NEXT_PUBLIC_API_URL=http://localhost:8000`
  - Fetch with `credentials: "include"`.
  - Call `/sanctum/csrf-cookie` before login/register/logout mutations.
  - Send the decoded `XSRF-TOKEN` cookie back as the `X-XSRF-TOKEN` header when using native `fetch`.
  - Use `/api/user` to resolve the current authenticated user.
- Configure Laravel env later to match:
  - `FRONTEND_URL=http://localhost:3000`
  - `SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000`

## App Structure
Use these route groups:

```text
web/app
  layout.tsx
  globals.css
  page.tsx                         -> public video library home

  (public)/
    videos/page.tsx                 -> public browse/search page
    videos/[videoId]/page.tsx       -> public watch page
    videos/[videoId]/loading.tsx
    videos/[videoId]/not-found.tsx

  (guest)/
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx

  (creator)/
    dashboard/page.tsx              -> authenticated creator overview
    dashboard/videos/page.tsx       -> current user's uploaded videos
    dashboard/videos/[videoId]/page.tsx
    upload/page.tsx                 -> dedicated multipart upload flow
    settings/page.tsx

  _components/
  _lib/
  _types/
```

Use `proxy.ts` to protect creator routes. Guests can access `/`, `/videos`, and `/videos/[videoId]`. Authenticated users can also access everything public, plus `/dashboard`, `/upload`, and settings.

## App Shell
- Use one global shell with a top navigation bar.
- Public nav items: `Videos`, `Browse`, `Sign in`.
- Authenticated nav items: `Videos`, `Upload`, `Dashboard`, user menu.
- Use a right-side drawer or compact account menu for authenticated creator actions.
- Logged-in users should still land on the public video library by default, with visible access to the creator dashboard.
- The upload CTA should be prominent only when authenticated; guests clicking upload should be redirected to login and then back to `/upload`.

Primary shell components:
- `AppHeader`
- `UserMenu`
- `MobileNavDrawer`
- `StatusChip`
- `VideoCard`
- `VideoTable`
- `PipelineTimeline`
- `UploadDropzone`
- `MultipartProgress`
- `RenditionList`
- `EmptyState`
- `ErrorState`

## Data And API Interfaces
Create a small typed API client in `web/app/_lib/api.ts`.

Minimum frontend types:

```ts
type User = {
  id: number;
  name: string;
  email: string;
};

type VideoStatus =
  | "draft"
  | "uploading"
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

type Video = {
  id: string;
  title: string;
  description: string | null;
  status: VideoStatus;
  thumbnailUrl: string | null;
  playbackManifestUrl: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  owner: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
};

type Rendition = {
  id: string;
  label: string;
  width: number;
  height: number;
  bitrate: number | null;
  codec: string | null;
  playlistUrl: string;
};
```

Expected API capabilities for the frontend:
- Public:
  - `GET /api/videos`
  - `GET /api/videos/{video}`
  - `GET /api/videos/{video}/renditions`
- Authenticated:
  - `GET /api/user`
  - `GET /api/me/videos`
  - `POST /api/uploads`
  - `POST /api/uploads/{uploadSession}/complete`
  - `GET /api/uploads/{uploadSession}`
  - `GET /api/videos/{video}/processing-runs`

Use Server Components for public read pages where practical. Use Client Components for auth forms, upload progress, multipart upload state, dashboard filters, and playback controls.

## Screen Behavior
- Home `/`: public video library with search, status filters, featured ready videos, and recent uploads.
- Public video detail `/videos/[videoId]`: video player first, then metadata, renditions, manifest status, and owner.
- Login/register: clean guest forms, redirect authenticated users away from guest pages.
- Dashboard `/dashboard`: creator overview showing uploaded count, processing count, ready count, failed count, and recent uploads.
- Upload `/upload`: dedicated flow with file selection, upload session creation, multipart progress, retry state, object key details, and post-upload processing status.
- Creator video detail: same video identity as the public page, plus upload session, processing runs, rendition details, and retry controls when supported by the API.

## Test Plan
- Verify guests can browse `/` and `/videos/[videoId]` without authentication.
- Verify guests cannot access `/dashboard` or `/upload`; they are redirected to `/login`.
- Verify authenticated users can access `/upload`, `/dashboard`, and their own video management views.
- Verify login, register, logout, and current-user fetch use Sanctum cookies correctly.
- Verify upload flow handles selected file, upload session creation, progress, completion, failure, and retry UI states.
- Verify public video pages handle ready, processing, failed, and missing videos.
- Run frontend checks: typecheck, lint, production build, and responsive visual review for mobile and desktop.

## Assumptions
- The frontend will be created in `web/`.
- The backend remains the Laravel API in `api/`.
- All videos are public in v1.
- Upload requires login only, not verified email.
- The public video library is the default landing experience for guests and logged-in users.
- Creator dashboard is available from the authenticated shell, but is not the default landing page.
- HLS segments are not listed in normal UI; the frontend shows manifest and rendition-level information only.

## Phased Implementation Checklist

Use this checklist to implement the frontend in small, reviewable phases. Keep frontend types aligned with the existing Laravel `User` model and the planned backend models in `MEDIA_LIBRARY_ARCHITECTURE_PLAN.md`.

### Phase 1: Auth Foundation

- [x] Create `web/lib/api/client.ts` with a shared `apiFetch` helper.
- [x] Read `NEXT_PUBLIC_API_URL` from env and default local development to `http://localhost:8000`.
- [x] Always send Sanctum requests with `credentials: "include"`.
- [x] Add a `getCsrfCookie()` helper that calls `/sanctum/csrf-cookie` before auth mutations.
- [x] Send the decoded `XSRF-TOKEN` cookie as the `X-XSRF-TOKEN` header for Sanctum CSRF protection.
- [x] Add `getCurrentUser()` using `GET /api/user`.
- [x] Add `login()` using `POST /login`.
- [x] Add `register()` using `POST /register`.
- [x] Add `logout()` using `POST /logout`.
- [x] Do not implement email verification gating.
- [x] Do not block upload access based on `email_verified_at`.
- [x] Create frontend auth types that match the current Laravel `users` table:

```ts
export type User = {
  id: number;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};
```

- [x] Create `AuthProvider` or equivalent session context for client-side auth state.
- [x] Load the current user once when the app shell mounts.
- [x] Expose `user`, `isAuthenticated`, `isLoadingUser`, `login`, `register`, and `logout`.
- [x] Make logout clear frontend auth state immediately after the API confirms success.
- [x] Add guest pages: `/login`, `/register`, `/forgot-password`, `/reset-password`.
- [x] Add authenticated route protection for `/dashboard`, `/dashboard/videos`, `/dashboard/videos/[videoId]`, `/upload`, and `/settings`.
- [x] Redirect guests trying to access creator routes to `/login`.
- [x] Preserve the intended destination with a `redirectTo` query param.
- [x] After login/register, redirect to `redirectTo` when present, otherwise `/`.
- [x] Redirect authenticated users away from `/login` and `/register`.
- [x] Add basic form-level and field-level error states.
- [x] Add loading states for login, register, current-user fetch, and logout.
- [ ] Add empty fallback UI for when the API is unavailable.

### Phase 2: Shared App Shell

- [x] Create a global app shell with top navigation.
- [x] Add public nav links: `Videos`, `Browse`, and `Sign in`.
- [x] Add authenticated nav links: `Videos`, `Upload`, `Dashboard`, and user menu.
- [x] Show `Upload` CTA only when authenticated.
- [x] If a guest clicks an upload CTA, send them to `/login?redirectTo=/upload`.
- [x] Add a mobile drawer using the existing shadcn components.
- [x] Keep `/` as the public video library landing experience.
- [x] Keep `/theme` as an internal design reference page.
- [x] Use StreamOps global CSS tokens and gradient utilities from `web/app/globals.css`.
- [x] Use `bg-gradient-primary` only for high-intent actions.
- [x] Use `bg-gradient-brand` only for special sections or polished empty states.
- [ ] Use `bg-gradient-processing` for active worker or upload progress states.
- [ ] Use `bg-gradient-ready` for completion and playback-ready moments.
- [x] Use `bg-gradient-dark-glow` only for restrained dark preview or hero panels.

### Phase 3: Frontend Domain Types And Dummy Data

- [ ] Create `web/lib/types/domain.ts`.
- [ ] Create dummy data in `web/lib/data/dummy-videos.ts`.
- [ ] Keep dummy data field names aligned with planned API response casing, not raw database snake_case.
- [ ] Include enough dummy records to cover every video status.
- [ ] Use public URLs or placeholder paths for thumbnails and playback manifests.
- [ ] Do not create dummy HLS segment records.
- [ ] Represent HLS segments only through rendition playlist URLs and segment prefixes.

Recommended frontend domain types:

```ts
export type VideoStatus =
  | "draft"
  | "uploading"
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type UploadSessionStatus =
  | "pending"
  | "active"
  | "completed"
  | "aborted"
  | "failed";

export type ProcessingRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type Video = {
  id: number | string;
  userId: number;
  title: string;
  description: string | null;
  status: VideoStatus;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  sourceDisk: string | null;
  sourcePath: string | null;
  playbackManifestPath: string | null;
  playbackManifestUrl: string | null;
  thumbnailPath: string | null;
  thumbnailUrl: string | null;
  processingError: string | null;
  owner: Pick<User, "id" | "name" | "email">;
  createdAt: string;
  updatedAt: string;
};

export type UploadSession = {
  id: number | string;
  videoId: number | string;
  provider: "s3" | "r2" | "minio" | string;
  multipartUploadId: string | null;
  objectKey: string;
  status: UploadSessionStatus;
  partSize: number;
  totalParts: number;
  uploadedParts: Array<{
    partNumber: number;
    etag: string;
    size: number;
  }>;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VideoProcessingRun = {
  id: number | string;
  videoId: number | string;
  status: ProcessingRunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  metadata: {
    durationSeconds?: number;
    width?: number;
    height?: number;
    codec?: string;
    bitrate?: number;
    frameRate?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type VideoRendition = {
  id: number | string;
  videoId: number | string;
  label: "480p" | "720p" | "1080p" | string;
  width: number;
  height: number;
  bitrate: number | null;
  codec: string | null;
  playlistPath: string;
  playlistUrl: string;
  segmentPrefix: string;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] Add dummy `Video` records for `draft`, `uploading`, `uploaded`, `queued`, `processing`, `ready`, and `failed`.
- [ ] Add dummy `UploadSession` records for at least one active upload and one completed upload.
- [ ] Add dummy `VideoProcessingRun` records for queued, running, completed, and failed states.
- [ ] Add dummy `VideoRendition` records for `480p`, `720p`, and `1080p`.
- [ ] Make dummy relationships coherent: `video.id` should match related `videoId` values.
- [ ] Use the same owner/user shape across all dummy videos.

### Phase 4: Public Video Pages With Dummy Data

- [ ] Build `/` as the public video library landing page.
- [ ] Build `/videos` as the full public browse/search page.
- [ ] Build `/videos/[videoId]` as the public watch page.
- [ ] Use dummy data for all video pages until backend endpoints exist.
- [ ] Show only public-safe information on public pages.
- [ ] Show video title, description, thumbnail, owner, duration, resolution, status, and updated date.
- [ ] Show a playback preview/player area on ready videos.
- [ ] Show manifest readiness on video detail pages.
- [ ] Show rendition-level data, not segment-level data.
- [ ] Add status filters for `ready`, `processing`, `queued`, and `failed`.
- [ ] Add text search over title, description, owner name, and object key/path when available.
- [ ] Add empty states for no videos and no search results.
- [ ] Add not-found UI for unknown video IDs.
- [ ] Add loading skeletons for video cards and video detail.

### Phase 5: Creator Dashboard Pages With Dummy Data

- [ ] Build `/dashboard` using dummy aggregates.
- [ ] Show uploaded count, processing count, ready count, failed count, and active upload count.
- [ ] Build `/dashboard/videos` as the authenticated user's video management table.
- [ ] Build `/dashboard/videos/[videoId]` as creator video detail.
- [ ] Show upload session details on creator video detail.
- [ ] Show processing run details on creator video detail.
- [ ] Show rendition details on creator video detail.
- [ ] Show processing errors when `processingError` is present.
- [ ] Add dummy retry buttons, but do not wire backend mutations yet.
- [ ] Add dummy copy buttons for source path, manifest path, and playlist paths.
- [ ] Keep creator pages route-protected even while data is dummy.
- [ ] Use `bg-gradient-processing` for active pipeline states.
- [ ] Use `bg-gradient-ready` for ready-state summary panels.

### Phase 6: Upload Page Skeleton With Dummy Flow

- [ ] Build `/upload` as an authenticated-only page.
- [ ] Add file selection/dropzone UI.
- [ ] Show selected file metadata before upload starts.
- [ ] Add a dummy multipart upload progress view.
- [ ] Show part-level progress using dummy parts, but do not persist parts.
- [ ] Show object storage destination details: provider, bucket/path/object key.
- [ ] Show upload states: pending, active, completed, failed.
- [ ] Show a dummy post-upload processing handoff state.
- [ ] Do not implement real presigned URL upload yet.
- [ ] Do not send file bytes to Laravel in this phase.

### Phase 7: Settings And Supporting Pages

- [ ] Build `/settings` as an authenticated-only account settings placeholder.
- [ ] Show current user name and email from auth state.
- [ ] Add placeholder sections for profile, password, and storage preferences.
- [ ] Keep profile update and password update buttons disabled or clearly marked as not wired.
- [ ] Add consistent `EmptyState`, `ErrorState`, and `LoadingState` components.
- [ ] Add shared `StatusChip` component for video, upload session, and processing run statuses.
- [ ] Add shared `PipelineTimeline` component for upload/processing/playback state.
- [ ] Add shared `RenditionList` component for rendition-level display.

### Phase 8: Backend Integration Swap-In

- [ ] Keep dummy data isolated behind data-access functions.
- [ ] Replace dummy reads with real API calls one endpoint at a time.
- [ ] Preserve the frontend domain types unless backend API resources intentionally differ.
- [ ] When Laravel `Video` APIs exist, map raw API fields into the frontend `Video` type.
- [ ] When upload session APIs exist, replace dummy upload creation with `POST /api/uploads`.
- [ ] When upload completion APIs exist, replace dummy completion with `POST /api/uploads/{uploadSession}/complete`.
- [ ] When processing APIs exist, replace dummy processing runs with `GET /api/videos/{video}/processing-runs`.
- [ ] Keep dummy data available for local UI development if the API is unavailable.

### Phase 9: Acceptance Checklist

- [ ] Guest can browse `/` and `/videos`.
- [ ] Guest can view `/videos/[videoId]`.
- [x] Guest cannot access `/dashboard`, `/upload`, or `/settings`.
- [x] Authenticated user can access `/dashboard`, `/dashboard/videos`, `/upload`, and `/settings`.
- [x] Authenticated user can still browse all public videos.
- [ ] Login works without requiring email verification.
- [x] Register works without requiring email verification.
- [ ] Logout clears the frontend session.
- [ ] All dummy video statuses render with correct labels and colors.
- [ ] All dummy upload session statuses render with correct labels and colors.
- [ ] All dummy processing run statuses render with correct labels and colors.
- [ ] Ready videos show playback and rendition information.
- [ ] HLS segments are never listed as individual records.
- [x] `npm run build` passes.
- [ ] Responsive review passes for mobile and desktop.
