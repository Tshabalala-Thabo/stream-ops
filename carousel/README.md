# StreamOps Carousel Decks

This folder contains source files for LinkedIn carousel-style slide decks about StreamOps.

## Current Deck

- `streamops-upload-failure-v3.html`: preferred short carousel about reliable large video uploads. This version introduces StreamOps immediately after the platform context.
- `streamops-upload-failure-v2.html`: earlier short carousel version kept for comparison.

## Workflow

1. Edit slide copy and visual structure in the HTML file.
2. Replace placeholder product panels with real screenshots where useful.
3. Open the HTML file in a browser to review the deck.
4. Export each slide as PNG images or export the page as a PDF for LinkedIn.

## Export PNG Slides

Run this from the repo root:

```bash
node carousel/export-slides.js streamops-upload-failure-v3
```

The script writes PNG files to:

```text
carousel/exports/streamops-upload-failure-v2/
carousel/exports/streamops-upload-failure-v3/
```

The HTML file also supports single-slide previews:

```text
carousel/streamops-upload-failure-v2.html?slide=1
```

## Design Rules

Use the StreamOps brand direction from `../DESIGN_GUIDE.md`:

- Deep navy for main text.
- Cyan for upload progress and metadata.
- Teal for active processing.
- Blue for playback.
- Green only for success and readiness.
- Red only for failure.
- Clean operational layouts.
- No framework names in the first carousel.
