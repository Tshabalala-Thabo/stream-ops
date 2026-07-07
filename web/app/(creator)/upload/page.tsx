import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { UploadFlow } from "@/components/streamops/upload-flow-skeleton"

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-7xl">
        <CreatorPageHeader
          className="mb-6"
          description="Add your video and a few details. StreamOps will prepare it after the upload finishes."
          eyebrow="Creator upload"
          title="Upload a video"
        />
        <UploadFlow />
      </section>
    </main>
  )
}
