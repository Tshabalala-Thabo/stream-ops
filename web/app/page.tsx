import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-background px-6 text-foreground">
      <section className="mx-auto w-full max-w-4xl py-20">
        <p className="mb-4 font-mono text-xs font-medium uppercase text-muted-foreground">
          StreamOps frontend
        </p>
        <h1 className="max-w-3xl font-heading text-5xl font-semibold tracking-normal sm:text-6xl">
          Cloud media operations for uploads, processing, and playback.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          The public app experience will live here. The internal theme board is available as a separate implementation reference.
        </p>
        <div className="mt-8">
          <Link className={buttonVariants()} href="/theme">
            View theme showcase
          </Link>
        </div>
      </section>
    </main>
  )
}
