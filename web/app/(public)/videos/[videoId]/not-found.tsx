import Link from "next/link"

import { ErrorState } from "@/components/streamops/state-panels"
import { buttonVariants } from "@/components/ui/button"

export default function VideoNotFound() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <ErrorState
        title="Video not found"
        description="This public video record does not exist in the dummy catalog."
      />
      <Link className={buttonVariants({ className: "mt-4" })} href="/videos">
        Back to catalog
      </Link>
    </div>
  )
}
