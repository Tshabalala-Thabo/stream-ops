import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type CreatorPageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function CreatorPageHeader({
  actions,
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
