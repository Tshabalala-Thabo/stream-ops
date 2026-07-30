"use client"

import { CheckCircle2, ImageIcon, RotateCcw, UploadCloud, XCircle } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { formatBytes } from "@/components/streamops/video-format"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { completeUpload, createUpload, expireUpload } from "@/lib/workflow/client"
import type { UploadSession, UploadedPart, Video } from "@/lib/types"
import { cn } from "@/lib/utils"

type UploadPhase = "idle" | "creating" | "uploading" | "completed" | "failed"

function getUploadStatusText(
  phase: UploadPhase,
  file: File | null,
  session: UploadSession | null,
  uploadedPartCount: number
) {
  if (phase === "creating") {
    return "Creating the S3 multipart upload session."
  }

  if (phase === "uploading") {
    return session
      ? `Uploading ${Math.max(session.uploadedParts.length, uploadedPartCount)}/${session.totalParts} parts.`
      : "Sending file parts directly to S3."
  }

  if (phase === "completed") {
    return "Upload complete. The video can now be queued for processing."
  }

  if (phase === "failed") {
    return "The upload needs attention before it can continue."
  }

  return file ? "Ready to create the upload session." : "Choose a source video to start."
}

export function UploadFlow() {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [phase, setPhase] = React.useState<UploadPhase>("idle")
  const [progress, setProgress] = React.useState(0)
  const [video, setVideo] = React.useState<Video | null>(null)
  const [session, setSession] = React.useState<UploadSession | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [uploadedPartCount, setUploadedPartCount] = React.useState(0)

  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const canStart = title.trim().length > 0 && Boolean(file) && phase !== "creating" && phase !== "uploading"
  const statusText = getUploadStatusText(phase, file, session, uploadedPartCount)

  function selectFile(nextFile: File | null) {
    setFile(nextFile)
    setError(null)
    setProgress(0)
    setUploadedPartCount(0)
    setPhase("idle")

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null)

    if (nextFile && title.trim() === "") {
      setTitle(nextFile.name.replace(/\.[^.]+$/, ""))
    }
  }

  function handleFileDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault()

    if (phase === "creating" || phase === "uploading") {
      return
    }

    selectFile(event.dataTransfer.files?.[0] ?? null)
  }

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
      setUploadedPartCount(0)

      let uploadedParts: UploadedPart[] | undefined
      if (created.presignedParts?.length) {
        uploadedParts = await uploadFileParts(
          file,
          created.uploadSession.partSize,
          created.presignedParts,
          setProgress,
          setUploadedPartCount
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
        <div className="grid gap-5">
          <label
            className={cn(
              "group grid min-h-64 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed bg-surface-overlay text-center transition",
              "hover:border-primary hover:bg-info-light/40",
              file && "border-solid p-3 text-left"
            )}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleFileDrop}
          >
            <Input
              accept="video/*"
              className="sr-only"
              disabled={phase === "creating" || phase === "uploading"}
              type="file"
              onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            />
            {!file ? (
              <span className="flex max-w-md flex-col items-center px-6 py-10">
                <span className="grid size-14 place-items-center rounded-md bg-gradient-primary text-white shadow-sm transition group-hover:scale-[1.02]">
                  <UploadCloud className="size-6" />
                </span>
                <span className="mt-4 font-heading text-xl font-semibold">Drop a video here</span>
                <span className="mt-2 text-sm leading-6 text-muted-foreground">
                  Browse or drag in the source file. The upload will go directly to S3 in multipart chunks.
                </span>
              </span>
            ) : (
              <span className="grid w-full gap-4 sm:grid-cols-[220px_1fr]">
                <span className="relative aspect-video overflow-hidden rounded-md border bg-background">
                  {previewUrl ? (
                    <video className="size-full object-cover" muted playsInline preload="metadata" src={previewUrl} />
                  ) : (
                    <span className="grid size-full place-items-center bg-gradient-dark-glow">
                      <ImageIcon className="size-8 text-muted-foreground" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-foreground/75 px-3 py-2 text-xs font-medium text-background">
                    Source preview
                  </span>
                </span>
                <span className="min-w-0 self-center">
                  <span className="block truncate font-heading text-lg font-semibold">{file.name}</span>
                  <span className="mt-2 block text-sm text-muted-foreground">{formatBytes(file.size)} · {file.type || "video/*"}</span>
                  <span className="mt-4 inline-flex text-xs font-medium text-primary">Choose a different file</span>
                </span>
              </span>
            )}
          </label>

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

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{statusText}</span>
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
              <Link className={buttonVariants({ variant: "outline" })} href={`/dashboard/videos/${video.id}`}>
                Open video
              </Link>
            )}
            {phase === "completed" && (
              <Button onClick={() => {
                selectFile(null)
                setVideo(null)
                setSession(null)
                setUploadedPartCount(0)
                setPhase("idle")
              }} variant="outline">
                <RotateCcw />
                Upload another
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
            <p className="text-muted-foreground">Session status</p>
            <p className="font-mono">{session?.status ?? "Pending"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Parts recorded</p>
            <p className="font-mono">{session ? `${Math.max(session.uploadedParts.length, uploadedPartCount)}/${session.totalParts}` : "Pending"}</p>
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
  onProgress: (progress: number) => void,
  onPartUploaded: (partCount: number) => void
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
    onPartUploaded(uploadedParts.length)
    onProgress(Math.min(94, 8 + Math.round((uploadedBytes / file.size) * 86)))
  }

  return uploadedParts
}
