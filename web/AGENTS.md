<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## StreamOps Frontend Rules

- Always read `../DESIGN_GUIDE.md` before creating or changing UI.
- Align UI with the StreamOps design language: operational, cloud-native, media-focused, compact, and polished.
- Use the global design tokens in `app/globals.css`; do not hard-code new brand colors in components unless a token does not exist yet.
- Use the StreamOps gradients only for their documented use cases in `app/globals.css`.
- Keep UI product-first. Do not build generic marketing pages unless explicitly requested.
- Keep all shared TypeScript types centralized in `lib/types/index.ts`.
- Do not define duplicate `User`, `Video`, `UploadSession`, `VideoProcessingRun`, or `VideoRendition` types inside components or pages.
- Keep dummy data isolated from UI components so it can be replaced by API calls later.
- Auth upload access requires login only; do not add email verification gates.
