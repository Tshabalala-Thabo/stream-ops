import { Filter, Search, Video } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export default function VideosPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-5 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
            Public browse
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            Video catalog
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            This page is reserved for the public searchable catalog. Typed dummy
            video records will land here in the next phases.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={buttonVariants({ className: "gap-2", variant: "outline" })}
            disabled
          >
            <Search />
            Search
          </button>
          <button
            className={buttonVariants({ className: "gap-2", variant: "outline" })}
            disabled
          >
            <Filter />
            Filters
          </button>
        </div>
      </div>

      <section className="mt-8 rounded-lg border bg-surface p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-md bg-info-light text-info-dark">
          <Video className="size-5" />
        </span>
        <h2 className="mt-4 font-heading text-xl font-semibold">
          Awaiting catalog records
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Phase 3 creates centralized domain types and dummy records. Phase 4
          turns them into the public browse and watch experience.
        </p>
      </section>
    </div>
  )
}
