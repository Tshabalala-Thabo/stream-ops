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
