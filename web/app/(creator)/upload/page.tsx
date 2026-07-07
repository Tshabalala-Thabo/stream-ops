import { UploadFlow } from "@/components/streamops/upload-flow-skeleton"

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6">
      <section className="mx-auto max-w-6xl">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-info-dark dark:text-info">
            New upload
          </p>
          <h1 className="mt-4 font-heading text-4xl font-semibold">
            Upload a video
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Add your video and a few details. StreamOps will prepare it after the
            upload finishes.
          </p>
        </div>
        <UploadFlow />
      </section>
    </main>
  )
}
