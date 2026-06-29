import { AlertTriangle, Loader2, Video } from "lucide-react"

import { cn } from "@/lib/utils"

type StatePanelProps = {
  title: string
  description: string
  className?: string
}

export function EmptyState({ title, description, className }: StatePanelProps) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-surface p-8 text-center text-sm",
        className
      )}
    >
      <span className="mx-auto grid size-12 place-items-center rounded-md bg-info-light text-info-dark">
        <Video className="size-5" />
      </span>
      <h2 className="mt-4 font-heading text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md leading-6 text-muted-foreground">
        {description}
      </p>
    </section>
  )
}

export function ErrorState({ title, description, className }: StatePanelProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-destructive-border bg-destructive-light p-8 text-sm text-destructive-dark",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" />
        <div>
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <p className="mt-2 leading-6">{description}</p>
        </div>
      </div>
    </section>
  )
}

export function LoadingState({ title, description, className }: StatePanelProps) {
  return (
    <section className={cn("rounded-lg border bg-surface p-8", className)}>
      <div className="flex items-center gap-3 text-sm">
        <Loader2 className="size-5 animate-spin text-primary" />
        <div>
          <h2 className="font-heading font-semibold">{title}</h2>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
      </div>
    </section>
  )
}
