import { UploadFlowSkeleton } from "@/components/streamops/upload-flow-skeleton"

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-lg border bg-gradient-dark-glow p-6">
          <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
            Authenticated upload
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            Create an upload session
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload access only requires a signed-in account. This skeleton models
            direct-to-storage multipart state without sending file bytes.
          </p>
        </div>
        <UploadFlowSkeleton />
      </section>
    </main>
  )
}
