# StreamOps Design Guide

StreamOps is a portfolio project designed to showcase modern backend engineering concepts commonly used in media platforms such as YouTube, Vimeo, TikTok, and enterprise video management systems.

The visual design should feel like a serious cloud media operations platform: technical, fast, reliable, and polished. It should not feel like a generic SaaS landing page. The interface should communicate upload orchestration, object storage, queue processing, transcoding, and playback readiness with clarity.

## Design Direction

- [ ] Use a clean, operational interface with confident technical details.
- [ ] Prioritize dashboard readability over decorative marketing sections.
- [ ] Make the product feel cloud-native, media-aware, and engineering-focused.
- [ ] Use the StreamOps logo colors as the foundation for the visual system.
- [ ] Keep the UI calm enough for repeated operational use.
- [ ] Use motion and color to communicate streaming, processing, progress, and readiness.
- [ ] Avoid purple-blue gradient SaaS styling.
- [ ] Avoid beige, brown, or overly warm palettes.
- [ ] Avoid decorative blobs, floating orbs, and generic abstract backgrounds.
- [ ] Avoid card-heavy marketing layouts where the actual tool feels secondary.

## Brand Keywords

- [ ] Fast
- [ ] Cloud-native
- [ ] Operational
- [ ] Reliable
- [ ] Media-focused
- [ ] Technical
- [ ] Scalable
- [ ] Precise
- [ ] Portfolio-grade

## Color System

The palette is based on the existing StreamOps logo: deep navy text, green-to-teal motion accents, cyan-blue playback energy, and a clean white workspace.

### Primary Colors

| Token | Hex | Usage |
| --- | --- | --- |
| `--color-ink` | `#031127` | Primary text, headings, strong UI labels |
| `--color-ink-soft` | `#4B5873` | Secondary text, metadata, captions |
| `--color-surface` | `#FFFFFF` | Main page background |
| `--color-surface-muted` | `#F5F8FB` | Subtle section backgrounds and table bands |
| `--color-border` | `#DDE5EF` | Borders, dividers, input outlines |

### StreamOps Accent Colors

| Token | Hex | Usage |
| --- | --- | --- |
| `--color-green` | `#35D33F` | Success, completed, healthy pipeline states |
| `--color-lime` | `#72D900` | Upload activity, positive progress accents |
| `--color-teal` | `#12C6B0` | Processing, active media operations |
| `--color-cyan` | `#0CAFD3` | Metadata, thumbnails, generated assets |
| `--color-blue` | `#1565F6` | Playback, streaming, primary actions |
| `--color-blue-deep` | `#0649D8` | Active states, focused controls, chart emphasis |

### Status Colors

| Status | Hex | Usage |
| --- | --- | --- |
| Draft | `#6B7280` | Created but not active |
| Uploading | `#0CAFD3` | Browser/object storage upload progress |
| Uploaded | `#12C6B0` | Source object exists |
| Queued | `#64748B` | Waiting for workers |
| Processing | `#1565F6` | Worker is generating outputs |
| Ready | `#35D33F` | Playback assets available |
| Failed | `#DC2626` | Upload or processing failure |
| Warning | `#F59E0B` | Retryable issues, degraded state |

### Suggested CSS Tokens

```css
:root {
  --color-ink: #031127;
  --color-ink-soft: #4b5873;
  --color-surface: #ffffff;
  --color-surface-muted: #f5f8fb;
  --color-border: #dde5ef;

  --color-green: #35d33f;
  --color-lime: #72d900;
  --color-teal: #12c6b0;
  --color-cyan: #0cafd3;
  --color-blue: #1565f6;
  --color-blue-deep: #0649d8;

  --color-danger: #dc2626;
  --color-warning: #f59e0b;
}
```

## Color Usage Rules

- [ ] Use deep navy for most text, not pure black.
- [ ] Use white and very light blue-gray surfaces for the main workspace.
- [ ] Use green only for success, health, and completion.
- [ ] Use teal for processing and active transformation states.
- [ ] Use blue for primary actions and playback-related UI.
- [ ] Use cyan for upload progress, generated assets, and metadata surfaces.
- [ ] Use red sparingly and only for actual failures or destructive actions.
- [ ] Do not use every accent color at once in one component.
- [ ] Keep charts and timelines readable by assigning each pipeline stage a consistent color.

## Typography

The UI should feel technical and modern without becoming cold.

Recommended pairing:

- [ ] Display and headings: `Sora`, `Manrope`, or `Aptos Display`.
- [ ] Body and interface: `IBM Plex Sans`, `Source Sans 3`, or `Manrope`.
- [ ] Monospace values: `IBM Plex Mono`, `JetBrains Mono`, or `Geist Mono`.

Rules:

- [ ] Use strong, compact headings.
- [ ] Use sentence case for labels and controls.
- [ ] Use monospace for object keys, IDs, queue names, codecs, file paths, and timestamps.
- [ ] Avoid oversized hero typography inside application screens.
- [ ] Avoid negative letter spacing.
- [ ] Keep body copy concise and operational.

## Layout Principles

- [ ] Build the product UI first, not a marketing page.
- [ ] Use dense but organized layouts for dashboards and admin views.
- [ ] Prefer full-width sections and structured panels over nested cards.
- [ ] Keep cards for repeated entities such as videos, jobs, renditions, and upload sessions.
- [ ] Use tables for operational data that users need to scan or compare.
- [ ] Use timelines for upload and processing workflows.
- [ ] Use split panes when inspecting one video and its related jobs/assets.
- [ ] Keep spacing consistent with an 8px base grid.
- [ ] Keep border radius at `6px` or `8px` for most UI elements.

## Core Screens

### Video Library

- [ ] Show uploaded videos with title, status, duration, resolution, owner, and updated time.
- [ ] Provide filters for status, upload date, processing state, and readiness.
- [ ] Provide search by title, ID, object key, or owner.
- [ ] Use status chips with consistent colors.
- [ ] Show thumbnail previews only when available.

### Upload Flow

- [ ] Show selected file details before upload starts.
- [ ] Show multipart upload progress.
- [ ] Show part retry states when a chunk fails.
- [ ] Show object storage destination metadata.
- [ ] Make the upload flow feel direct-to-storage, not server-uploaded.
- [ ] Use cyan and teal progress indicators.

### Processing View

- [ ] Show pipeline stages: uploaded, queued, processing, thumbnail, renditions, HLS, ready.
- [ ] Show current worker state and processing run status.
- [ ] Show retry/failure details clearly.
- [ ] Use timeline or stepper UI for processing state.
- [ ] Use blue for active processing and green for completed stages.

### Video Detail

- [ ] Show video metadata.
- [ ] Show source file details.
- [ ] Show thumbnail.
- [ ] Show playback manifest path.
- [ ] Show generated renditions.
- [ ] Show latest processing run.
- [ ] Show related Spatie media records only where useful.
- [ ] Keep HLS segment lists out of the main UI unless debugging tools are added later.

### Playback Preview

- [ ] Show the video player as the primary object in the view.
- [ ] Show playback readiness and manifest URL nearby.
- [ ] Show available renditions.
- [ ] Show player errors in a clear technical format.
- [ ] Avoid decorative framing around the video player.

### Queue And Worker Monitoring

- [ ] Show queue depth.
- [ ] Show active jobs.
- [ ] Show failed jobs.
- [ ] Show retry attempts.
- [ ] Show worker health.
- [ ] Use compact tables and small charts.

## Components

### Buttons

- [ ] Primary buttons use blue.
- [ ] Success actions use green only when the action confirms completion.
- [ ] Destructive actions use red.
- [ ] Include icons where they improve recognition.
- [ ] Keep button labels short and action-oriented.

Examples:

- [ ] `Create upload`
- [ ] `Retry processing`
- [ ] `Copy manifest URL`
- [ ] `Abort upload`
- [ ] `View renditions`

### Status Chips

- [ ] Use consistent status colors from the status palette.
- [ ] Keep labels short.
- [ ] Use solid text and subtle tinted backgrounds.
- [ ] Do not rely on color alone; always include readable text.

### Tables

- [ ] Use tables for videos, upload sessions, processing runs, renditions, and jobs.
- [ ] Use sticky headers when lists are long.
- [ ] Use monospace text for IDs and object paths.
- [ ] Keep row height compact but readable.
- [ ] Show empty states that explain the next operational action.

### Forms

- [ ] Group fields by task.
- [ ] Use clear labels.
- [ ] Show validation close to the field.
- [ ] Use helper text for technical values such as chunk size or storage disk.
- [ ] Avoid long explanatory blocks inside forms.

### Progress Indicators

- [ ] Use progress bars for upload completion.
- [ ] Use segmented progress for multipart uploads.
- [ ] Use timelines for processing stages.
- [ ] Show exact numeric progress where available.
- [ ] Show retrying and failed states separately.

### Charts

- [ ] Use charts sparingly.
- [ ] Prefer small operational charts over decorative analytics.
- [ ] Good chart candidates: queue depth, processing duration, upload throughput, failure rate.
- [ ] Keep chart colors tied to the StreamOps palette.

## Icon Direction

- [ ] Use simple line icons.
- [ ] Prefer icons that communicate operational concepts: upload, cloud, database, queue, play, image, file, activity, alert, check, refresh.
- [ ] Keep icon stroke widths consistent.
- [ ] Do not use illustrative icons as decoration.

## Motion And Interaction

- [ ] Use short transitions between `120ms` and `220ms`.
- [ ] Use motion to show state changes, not decoration.
- [ ] Animate upload progress smoothly.
- [ ] Animate pipeline step completion subtly.
- [ ] Use hover and focus states consistently.
- [ ] Respect reduced-motion preferences.

## Voice And Copy

StreamOps copy should sound precise and technical, but not academic.

Rules:

- [ ] Use direct operational language.
- [ ] Prefer verbs over explanations.
- [ ] Keep UI copy short.
- [ ] Mention real system concepts when useful: upload session, object key, worker, queue, rendition, manifest.
- [ ] Avoid vague marketing claims.
- [ ] Avoid casual slang in product UI.

Good examples:

- [ ] `Upload session created`
- [ ] `Waiting for worker`
- [ ] `Generating 720p rendition`
- [ ] `Master playlist ready`
- [ ] `Multipart upload failed`
- [ ] `Retry processing`

Avoid:

- [ ] `Supercharge your videos`
- [ ] `Magical AI-powered streaming`
- [ ] `Unlock your content potential`
- [ ] `Everything you need in one place`

## Accessibility

- [ ] Maintain at least WCAG AA contrast for text.
- [ ] Do not communicate status by color alone.
- [ ] Ensure all controls have visible focus states.
- [ ] Use readable font sizes.
- [ ] Keep tables navigable by keyboard.
- [ ] Provide clear error messages.
- [ ] Use accessible names for icon-only buttons.

## Implementation Guidance

- [ ] Define design tokens early.
- [ ] Keep colors centralized in CSS variables or Tailwind theme tokens.
- [ ] Create reusable status chip components.
- [ ] Create reusable progress components.
- [ ] Create reusable metadata row components.
- [ ] Create reusable table patterns for operational screens.
- [ ] Keep object paths and IDs copyable.
- [ ] Build empty, loading, success, failed, and retrying states for every async workflow.

## Design QA Checklist

- [ ] Does the UI look like a media operations platform?
- [ ] Are upload, processing, and playback states visually distinct?
- [ ] Are technical values easy to scan?
- [ ] Are failures obvious without being visually overwhelming?
- [ ] Are the logo colors used intentionally rather than everywhere?
- [ ] Is the first screen a useful product surface?
- [ ] Can a viewer understand the backend architecture from the UI?
- [ ] Does the design support the portfolio goal of showing engineering depth?

