import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { UploadFlow } from "@/components/streamops/upload-flow-skeleton"

type UploadPageProps = {
  searchParams: Promise<{
    resumeSessionId?: string | string[]
  }>
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const params = await searchParams
  const rawResumeSessionId = params.resumeSessionId
  const resumeSessionId = Array.isArray(rawResumeSessionId)
    ? rawResumeSessionId[0]
    : rawResumeSessionId

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <CreatorPageHeader
          className="mb-6"
          description="Add your video and a few details. StreamOps will prepare it after the upload finishes."
          eyebrow="Creator upload"
          title="Upload a video"
        />
        <UploadFlow initialResumeSessionId={resumeSessionId} />
      </section>
    </main>
  )
}
