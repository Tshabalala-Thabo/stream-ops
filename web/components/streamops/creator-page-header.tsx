import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

type CreatorPageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}

export function CreatorPageHeader({
  actions,
  backHref,
  backLabel = "Back",
  className,
  description,
  eyebrow,
  title,
}: CreatorPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div>
        {backHref && (
          <Link
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            href={backHref}
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        )}
        <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
