export default function UploadPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto max-w-5xl rounded-xl border border-border bg-gradient-dark-glow p-8">
        <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
          Authenticated upload
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-normal">
          Create an upload session.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Upload access only requires a signed-in account. No email verification gate is applied.
        </p>
      </section>
    </main>
  )
}
