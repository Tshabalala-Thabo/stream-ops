import type {
  ProcessingRunStatus,
  UploadSessionStatus,
  VideoStatus,
} from "@/lib/types"
import { cn } from "@/lib/utils"

type StatusChipProps = {
  status: VideoStatus | UploadSessionStatus | ProcessingRunStatus
  className?: string
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground ring-border",
  uploading: "bg-info-light text-info-dark ring-info-border",
  uploaded: "bg-accent text-accent-foreground ring-border",
  queued: "bg-muted text-muted-foreground ring-border",
  processing: "bg-primary/10 text-primary ring-primary/25",
  ready: "bg-success-light text-success-dark ring-success-border",
  failed: "bg-destructive-light text-destructive-dark ring-destructive-border",
  pending: "bg-muted text-muted-foreground ring-border",
  active: "bg-info-light text-info-dark ring-info-border",
  completed: "bg-success-light text-success-dark ring-success-border",
  aborted: "bg-warning-light text-warning-dark ring-warning-border",
  running: "bg-primary/10 text-primary ring-primary/25",
  cancelled: "bg-muted text-muted-foreground ring-border",
}

export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ring-1",
        statusStyles[status],
        className
      )}
    >
      {status}
    </span>
  )
}
