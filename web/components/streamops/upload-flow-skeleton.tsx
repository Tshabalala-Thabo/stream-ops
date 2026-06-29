"use client"

import { CheckCircle2, FileVideo, UploadCloud } from "lucide-react"
import * as React from "react"

import { StatusChip } from "@/components/streamops/status-chip"
import { formatBytes } from "@/components/streamops/video-format"
import { Button } from "@/components/ui/button"
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress"
import { dummyUploadSessions } from "@/lib/data/dummy-videos"

const uploadStates = ["pending", "active", "completed", "failed"] as const

export function UploadFlowSkeleton() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const session = dummyUploadSessions[0]
  const uploadedParts = selectedFile ? session.uploadedParts.length : 0
  const progress = selectedFile ? Math.round((uploadedParts / session.totalParts) * 100) : 0

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="rounded-lg border bg-surface p-5">
        <div className="rounded-lg border border-dashed bg-surface-overlay p-8 text-center">
          <FileVideo className="mx-auto size-10 text-info" />
          <h2 className="mt-4 font-heading text-xl font-semibold">
            Select a source video
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            This phase only reads local file metadata in the browser. No bytes are
            uploaded to Laravel or object storage.
          </p>
          <label className="mt-5 inline-flex">
            <input
              accept="video/*"
              className="sr-only"
              type="file"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-gradient-primary px-3 text-sm font-medium text-white shadow-sm">
              <UploadCloud className="size-4" />
              Choose file
            </span>
          </label>
        </div>

        {selectedFile && (
          <div className="mt-5 rounded-lg border p-4">
            <h3 className="font-heading text-sm font-semibold">Selected file</h3>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="truncate font-medium">{selectedFile.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-mono text-xs">{selectedFile.type || "unknown"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-mono text-xs">{formatBytes(selectedFile.size)}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-5 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-sm font-semibold">
                Dummy multipart progress
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Part-level state mirrors the planned upload session model.
              </p>
            </div>
            <StatusChip status={selectedFile ? "active" : "pending"} />
          </div>
          <Progress className="mt-4" value={progress}>
            <ProgressTrack>
              <ProgressIndicator className="bg-gradient-processing" />
            </ProgressTrack>
          </Progress>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {Array.from({ length: session.totalParts }).map((_, index) => {
              const partNumber = index + 1
              const isUploaded = selectedFile && partNumber <= uploadedParts

              return (
                <div
                  className="rounded-md border bg-background p-3 text-xs"
                  key={partNumber}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Part {partNumber}</span>
                    {isUploaded && <CheckCircle2 className="size-4 text-success" />}
                  </div>
                  <p className="mt-2 font-mono text-muted-foreground">
                    {isUploaded ? "uploaded" : "pending"}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border bg-surface p-4">
          <h2 className="font-heading text-sm font-semibold">Object destination</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="font-mono text-xs">{session.provider}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bucket/path</dt>
              <dd className="break-all font-mono text-xs">{session.objectKey}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Part size</dt>
              <dd className="font-mono text-xs">{formatBytes(session.partSize)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border bg-surface p-4">
          <h2 className="font-heading text-sm font-semibold">Upload states</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {uploadStates.map((state) => (
              <StatusChip key={state} status={state} />
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-gradient-ready p-4 text-brand-accent-foreground">
          <h2 className="font-heading text-sm font-semibold">Processing handoff</h2>
          <p className="mt-3 text-sm leading-6">
            After completion, the API will verify the source object, mark the
            session completed, then dispatch processing. This panel is dummy UI only.
          </p>
          <Button className="mt-4" disabled type="button" variant="outline">
            Complete upload later
          </Button>
        </section>
      </aside>
    </div>
  )
}
