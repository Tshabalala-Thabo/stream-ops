"use client"

import { CheckCircle2, FileVideo, UploadCloud, XCircle } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { formatBytes } from "@/components/streamops/video-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { completeUpload, createUpload, expireUpload } from "@/lib/workflow/client"
import type { UploadSession, UploadedPart, Video } from "@/lib/types"

type UploadPhase = "idle" | "creating" | "uploading" | "completed" | "failed"

export function UploadFlow() {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [phase, setPhase] = React.useState<UploadPhase>("idle")
  const [progress, setProgress] = React.useState(0)
  const [video, setVideo] = React.useState<Video | null>(null)
  const [session, setSession] = React.useState<UploadSession | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const canStart = title.trim().length > 0 && Boolean(file) && phase !== "creating" && phase !== "uploading"

  async function startUpload() {
    if (!file) {
      return
    }

    setError(null)
    setPhase("creating")
    setProgress(8)

    try {
      const created = await createUpload({
        title,
        description,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "video/mp4",
      })

      setVideo(created.video)
      setSession(created.uploadSession)
      setPhase("uploading")

      let uploadedParts: UploadedPart[] | undefined
      if (created.presignedParts?.length) {
        uploadedParts = await uploadFileParts(
          file,
          created.uploadSession.partSize,
          created.presignedParts,
          setProgress
        )
        setProgress(98)
      } else {
        for (const nextProgress of [22, 41, 63, 84, 100]) {
          await new Promise((resolve) => window.setTimeout(resolve, 180))
          setProgress(nextProgress)
        }
      }

      const completed = await completeUpload(created.uploadSession.id, uploadedParts)
      setVideo(completed.video)
      setSession(completed.session)
      setProgress(100)
      setPhase("completed")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Upload failed.")
      setPhase("failed")
    }
  }

  async function markExpired() {
    if (!session) {
      return
    }

    try {
      const expired = await expireUpload(session.id)
      setVideo(expired.video)
      setSession(expired.session)
      setPhase("failed")
      setError("Upload session expired.")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to expire upload.")
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-lg border bg-surface p-5">
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Title</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Launch recap" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Description</span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional local workflow notes"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Source file</span>
            <Input
              accept="video/*"
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {file && (
            <div className="flex items-center gap-3 rounded-md border bg-surface-overlay p-3 text-sm">
              <FileVideo className="size-5 text-info" />
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-muted-foreground">{formatBytes(file.size)} · {file.type || "video/*"}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Multipart upload</span>
              <span className="font-mono text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-destructive-border bg-destructive-light p-3 text-sm text-destructive-dark">
              <XCircle className="size-4" />
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button className="gap-2" disabled={!canStart} onClick={startUpload}>
              <UploadCloud />
              {phase === "creating" || phase === "uploading" ? "Uploading" : "Start upload"}
            </Button>
            <Button disabled={!session || session.status !== "active"} onClick={markExpired} variant="outline">
              Expire session
            </Button>
            {video && (
              <Button variant="outline" render={<Link href={`/dashboard/videos/${video.id}`} />}>
                Open video
              </Button>
            )}
          </div>
        </div>
      </section>

      <aside className="rounded-lg border bg-surface p-5">
        <p className="font-heading text-sm font-semibold">Upload session</p>
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Video ID</p>
            <p className="font-mono">{video?.id ?? "Not created"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Upload session</p>
            <p className="font-mono">{session?.id ?? "Not created"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Object key</p>
            <p className="break-all font-mono text-xs">{session?.objectKey ?? "Pending"}</p>
          </div>
          {phase === "completed" && (
            <div className="flex items-center gap-2 rounded-md border border-success-border bg-success-light p-3 text-success-dark">
              <CheckCircle2 className="size-4" />
              Upload completed
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

async function uploadFileParts(
  file: File,
  partSize: number,
  presignedParts: Array<{ partNumber: number; url: string }>,
  onProgress: (progress: number) => void
): Promise<UploadedPart[]> {
  let uploadedBytes = 0
  const orderedParts = presignedParts.slice().sort((a, b) => a.partNumber - b.partNumber)
  const uploadedParts: UploadedPart[] = []

  for (const part of orderedParts) {
    const start = (part.partNumber - 1) * partSize
    const end = Math.min(start + partSize, file.size)
    const body = file.slice(start, end)

    if (body.size <= 0) {
      throw new Error(`Upload part ${part.partNumber} is empty.`)
    }

    const response = await fetch(part.url, {
      method: "PUT",
      body,
    })

    if (!response.ok) {
      throw new Error(`Upload part ${part.partNumber} failed with status ${response.status}.`)
    }

    const etag = response.headers.get("etag")
    if (!etag) {
      throw new Error("S3 did not expose an ETag header. Check the bucket CORS ExposeHeaders setting.")
    }

    uploadedBytes += body.size
    uploadedParts.push({
      partNumber: part.partNumber,
      etag,
      size: body.size,
    })
    onProgress(Math.min(94, 8 + Math.round((uploadedBytes / file.size) * 86)))
  }

  return uploadedParts
}
