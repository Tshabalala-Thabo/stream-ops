export default async function DashboardVideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>
}) {
  const { videoId } = await params

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-5xl">
        <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
          Creator video detail
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-normal">
          Video {videoId}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Upload sessions, processing runs, and renditions will be shown here with dummy data in
          later phases.
        </p>
      </section>
    </main>
  )
}
