# StreamOps LinkedIn Carousel Ideas

This document tracks simple, non-technical LinkedIn carousel concepts for explaining StreamOps to recruiters, HR teams, hiring managers, and people who may not have software development knowledge.

The goal is not to explain frameworks or implementation details. The goal is to make the project easy to understand as a real-world media platform concept: reliable uploads, video processing, playback preparation, dashboards, and public browsing.

## Audience

- Recruiters
- HR teams
- Hiring managers
- Non-technical viewers
- Technical viewers who want the high-level story first

## Tone

- Plain English
- Curious and practical
- Visual
- Portfolio-focused
- Avoid deep jargon unless it is explained immediately

## Chosen Direction

Use **Version 3: StreamOps Earlier** as the preferred first production version.

Version 3 keeps the shorter v2 content, but moves the StreamOps introduction earlier in the story:

1. Hook: failed 10GB upload.
2. Big-platform context.
3. Introduce StreamOps.
4. Explain splitting uploads into pieces.
5. Explain retrying one failed piece.
6. Show video preparation for playback.
7. Show the surrounding product experience.
8. Close with the bigger engineering question.

Use a hybrid workflow:

1. Keep the slide copy, screenshot plan, and brand rules in this repo.
2. Create a clean source version of the slides from the repo content.
3. Export the slides as images or a PDF.
4. Optionally polish the exported slides in ChatGPT, Canva, Figma, or another design tool.

This keeps the content tied to the project while still allowing visual polish outside the codebase.

## Core Hook

Recommended hook:

```text
If a 10GB video upload fails at 73%, should you really have to start again?
```

Other options:

```text
What happens when a huge video upload fails halfway?
```

```text
Why doesn't YouTube make you restart a massive upload from zero?
```

```text
How do platforms like YouTube, TikTok, and Vimeo handle large video uploads without breaking?
```

## Version 1: Full Carousel

### Slide 1

```text
If a 10GB video upload fails at 73%, should you really have to start again?
```

### Slide 2

```text
On modern video platforms, the answer is usually no.

Platforms like YouTube, TikTok, Vimeo, and enterprise media systems use engineering patterns that make large uploads more reliable.
```

### Slide 3

```text
Instead of treating one video as one giant upload, the file can be split into smaller pieces.

If one piece fails, only that piece needs to be retried.
```

### Slide 4

```text
That idea is called a chunked upload.

It helps with large files, slow networks, browser refreshes, and failed connections.
```

### Slide 5

```text
I am building a project called StreamOps to explore these kinds of media-platform engineering concepts.

It is a video processing platform focused on upload reliability, background processing, and playback readiness.
```

### Slide 6

```text
StreamOps can create upload sessions.

That means the system keeps track of an upload while it is happening, including what has already been received.
```

### Slide 7

```text
Uploads can be resumed or cancelled.

If something goes wrong, the user does not always have to start from zero.
```

### Slide 8

```text
After upload, StreamOps processes the video.

It extracts video details, generates a thumbnail, and prepares the video for streaming.
```

### Slide 9

```text
It also creates multiple video versions for playback.

This is similar to how platforms support different quality levels depending on the viewer's device or internet speed.
```

### Slide 10

```text
StreamOps includes a creator dashboard, public video catalog, and video player experience.

The goal is to show how a real video platform works behind the scenes.
```

### Slide 11

```text
This project is helping me practice the engineering behind large-scale media systems:

Reliable uploads. Background processing. Video playback. Operational dashboards.
```

### Slide 12

```text
The next time a huge upload continues after a failure, there is a lot of engineering quietly making that feel simple.
```

## Version 1 Caption

```text
What happens when a large video upload fails halfway?

That question led me to build StreamOps, a portfolio project where I am exploring engineering concepts used in modern video platforms like YouTube, TikTok, Vimeo, and enterprise media systems.

The project focuses on reliable uploads, resumable upload sessions, video processing, thumbnails, multiple playback versions, creator dashboards, public video browsing, and video playback.

The goal is simple: understand what happens behind the scenes when media platforms make huge video workflows feel smooth.
```

## Version 2: Short Carousel

This version is tighter and better if the design should move quickly with fewer slides.

This was the selected first carousel version before Version 3 moved the StreamOps introduction earlier.

### Slide 1

```text
If a 10GB video upload fails at 73%, should you really have to start again?
```

### Slide 2

```text
Modern video platforms usually avoid that.

YouTube, TikTok, Vimeo, and enterprise media systems use patterns that make large uploads more reliable.
```

### Slide 3

```text
One common idea is simple:

Split the large video into smaller pieces.
```

### Slide 4

```text
If one piece fails, only that piece needs to be retried.

The entire upload does not have to start from zero.
```

### Slide 5

```text
I am building StreamOps to explore this kind of media-platform engineering.

It handles chunked uploads, resumable sessions, cancellation, and upload progress.
```

### Slide 6

```text
After upload, StreamOps prepares the video for playback.

It extracts video details, creates a thumbnail, and generates different playback versions.
```

### Slide 7

```text
StreamOps also includes the product experience around the pipeline:

Creator dashboard. Public video catalog. Video player.
```

### Slide 8

```text
The project is about one simple question:

What engineering makes large video platforms feel smooth to use?
```

## Version 2 Caption

```text
I am building StreamOps, a portfolio project inspired by the engineering concepts behind platforms like YouTube, TikTok, Vimeo, and enterprise media systems.

The project explores reliable large-file uploads, resumable upload sessions, video processing, thumbnails, playback versions, creator dashboards, public video browsing, and video playback.

The point is not just to upload a video.

The point is to understand the system behind making large video workflows feel simple.
```

## Version 3: StreamOps Earlier

This is the preferred first carousel version.

It introduces StreamOps on slide 3, then uses the project as the bridge into chunk-based uploads and the rest of the media workflow.

### Slide 1

```text
If a 10GB video upload fails at 73%, should you really have to start again?
```

### Slide 2

```text
Modern video platforms usually avoid that.

YouTube, TikTok, Vimeo, and enterprise media systems use patterns that make large uploads more reliable.
```

### Slide 3

```text
I am building StreamOps to explore this kind of media-platform engineering.

It handles chunked uploads, resumable sessions, cancellation, and upload progress.
```

### Slide 4

```text
One common idea is simple:

Split the large video into smaller pieces.
```

### Slide 5

```text
If one piece fails, only that piece needs to be retried.

The entire upload does not have to start from zero.
```

### Slide 6

```text
After upload, StreamOps prepares the video for playback.

It extracts video details, creates a thumbnail, and generates different playback versions.
```

### Slide 7

```text
StreamOps also includes the product experience around the pipeline:

Creator dashboard. Public video catalog. Video player.
```

### Slide 8

```text
The project is about one simple question:

What engineering makes large video platforms feel smooth to use?
```

## Version 2 Visual Plan

### Slide 1: Hook

Visual idea:

- Large upload progress bar stuck at `73%`.
- Small warning state showing the upload failed.
- StreamOps logo in the corner.

Brand notes:

- Use deep navy text.
- Use cyan or teal for the progress bar.
- Use red only for the failure marker.

### Slide 2: Big Platform Context

Visual idea:

- Simple row of generic platform cards labeled `Video platforms`, `Creator apps`, and `Enterprise media`.
- Avoid using official YouTube, TikTok, or Vimeo logos unless the design clearly treats them as references.

Brand notes:

- Use a clean white workspace.
- Keep the slide calm and professional, not flashy.

### Slide 3: Split The Large Upload

Visual idea:

- One large file block turning into smaller numbered pieces.
- The key message should be visual before the viewer reads the text.

Brand notes:

- Use cyan for upload pieces.
- Use light blue-gray backgrounds and subtle borders.

### Slide 4: Retry Only The Failed Piece

Visual idea:

- Multiple pieces are successful.
- One piece fails, then gets retried.
- Show that the whole upload does not restart.

Brand notes:

- Use green for successful pieces.
- Use red only for the failed piece.
- Use teal or blue for the retry action.

### Slide 5: Introduce StreamOps

Visual idea:

- Use an actual StreamOps logo from `web/public/logo`.
- Show a simple product-style panel with upload progress, resume, cancel, and status indicators.

Possible screenshot:

- StreamOps upload page.
- Upload progress section.
- Resume/cancel upload controls if available in the current UI state.

Brand notes:

- Make the slide feel like a serious media operations product.
- Avoid a marketing landing-page feel.

### Slide 6: Prepare The Video For Playback

Visual idea:

- Use a simple before/after flow:
  - Uploaded video
  - Video details
  - Thumbnail
  - Playback versions

Possible screenshot:

- Creator video detail page.
- Processing timeline.
- Rendition list or video details panel.

Brand notes:

- Use blue for active processing.
- Use green for ready/completed states.
- Use cyan for metadata and thumbnail-related elements.

### Slide 7: Product Experience

Visual idea:

- Three visual panels:
  - Creator dashboard
  - Public video catalog
  - Video player

Possible screenshots:

- Creator dashboard.
- Public video catalog.
- Video player page.

Brand notes:

- Use real system screenshots where possible.
- Keep screenshots cropped and readable.
- Do not overcrowd the slide.

### Slide 8: Closing Question

Visual idea:

- A clean closing slide with the StreamOps logo.
- Small pipeline line: Upload -> Process -> Play.
- End with the question as the main text.

Brand notes:

- Use strong deep navy typography.
- Use a simple cyan-to-green progress line.
- Keep the slide minimal and memorable.

## Screenshot Asset Plan

Capture screenshots from the real StreamOps frontend for slides 5, 6, and 7.

Recommended screenshots:

- Upload page showing selected file and upload controls.
- Upload progress state if easy to reproduce.
- Creator dashboard with status counts and video rows.
- Creator video detail page with processing timeline, renditions, or player.
- Public video catalog.
- Public/player view.

Screenshot rules:

- Crop to the feature being explained.
- Hide or avoid sensitive personal information.
- Prefer clean sample data with polished video titles.
- Keep screenshots large enough to read on a phone.
- Do not show code, terminal output, database tables, or framework names in this carousel.

## StreamOps Brand Rules For The Slides

Use the concepts from `DESIGN_GUIDE.md` throughout the carousel:

- Make the slides feel technical, fast, reliable, polished, and media-focused.
- Use StreamOps logo colors as the foundation.
- Use deep navy for primary text: `#031127`.
- Use soft navy/gray for secondary text: `#4B5873`.
- Use white and light blue-gray surfaces: `#FFFFFF`, `#F5F8FB`.
- Use cyan for upload progress and metadata: `#0CAFD3`.
- Use teal for active processing and transformation: `#12C6B0`.
- Use blue for playback and primary actions: `#1565F6`.
- Use green only for success, completion, and readiness: `#35D33F`.
- Use red only for real failures: `#DC2626`.
- Avoid purple-blue SaaS gradients.
- Avoid beige, brown, warm palettes, decorative blobs, and generic abstract backgrounds.
- Keep layouts structured and operational.
- Prefer simple panels, timelines, progress indicators, and product screenshots.

## Visual Direction

- Use one idea per slide.
- Keep text large and readable.
- Use simple diagrams: upload progress, broken connection, retrying one piece, dashboard, video player.
- Use StreamOps colors from `DESIGN_GUIDE.md`: deep navy, cyan, teal, blue, and green.
- Use green only for success/readiness.
- Use red only for failure.
- Avoid framework names in the slides.
- Keep technical terms only when explained in plain English.
- Use real screenshots on selected slides, but crop them around the product capability being explained.
