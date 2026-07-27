import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { UploadFlow } from "@/components/streamops/upload-flow"

export default function UploadPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <CreatorPageHeader
          className="mb-6"
          description="Create a mocked upload session and drive it through the local workflow before AWS services are introduced."
          eyebrow="Phase 1 local upload"
          title="Upload a video"
        />
        <UploadFlow />
      </section>
    </main>
  )
}
