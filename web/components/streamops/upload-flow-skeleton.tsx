"use client"

import {
  AlertCircle,
  CheckCircle2,
  FileVideo,
  RotateCcw,
  UploadCloud,
} from "lucide-react"
import * as React from "react"

import { formatBytes } from "@/components/streamops/video-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  completeUploadSession,
  createUploadSession,
  uploadUploadSessionPart,
} from "@/lib/api/uploads"
import type { UploadSession } from "@/lib/types"

type UploadPhase = "idle" | "uploading" | "completing" | "success" | "error"

export function UploadFlow() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [phase, setPhase] = React.useState<UploadPhase>("idle")
  const [error, setError] = React.useState<string | null>(null)
  const [progressBytes, setProgressBytes] = React.useState(0)
  const [uploadedParts, setUploadedParts] = React.useState(0)
  const [activeSession, setActiveSession] =
    React.useState<UploadSession | null>(null)
  const [completedSession, setCompletedSession] =
    React.useState<UploadSession | null>(null)

  const isUploading = phase === "uploading" || phase === "completing"
  const progress = selectedFile
    ? Math.min(100, Math.round((progressBytes / selectedFile.size) * 100))
    : 0

  function handleFileChange(file: File | null) {
    setSelectedFile(file)
    setCompletedSession(null)
    setActiveSession(null)
    setUploadedParts(0)
    setProgressBytes(0)
    setError(null)
    setPhase("idle")

    if (file && title.trim() === "") {
      setTitle(file.name.replace(/\.[^.]+$/, ""))
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      setError("Choose a video file before starting the upload.")
      return
    }

    if (title.trim() === "") {
      setError("Add a title before starting the upload.")
      return
    }

    setPhase("uploading")
    setError(null)
    setCompletedSession(null)
    setUploadedParts(0)
    setProgressBytes(0)

    try {
      const uploadSession = await createUploadSession({
        title: title.trim(),
        description: description.trim() || null,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type || "video/mp4",
      })
      setActiveSession(uploadSession)

      const partSize = uploadSession.partSize
      const totalParts = uploadSession.totalParts
      let committedBytes = 0

      for (let index = 0; index < totalParts; index++) {
        const partNumber = index + 1
        const start = index * partSize
        const end = Math.min(start + partSize, selectedFile.size)
        const chunk = selectedFile.slice(start, end, selectedFile.type)

        const nextSession = await uploadUploadSessionPart({
          uploadSessionId: uploadSession.id,
          partNumber,
          chunk,
          onProgress: (partBytes) => {
            setProgressBytes(committedBytes + partBytes)
          },
        })

        committedBytes += chunk.size
        setProgressBytes(committedBytes)
        setUploadedParts(partNumber)
        setActiveSession(nextSession)
      }

      setPhase("completing")
      const completed = await completeUploadSession(uploadSession.id)
      setProgressBytes(selectedFile.size)
      setUploadedParts(totalParts)
      setCompletedSession(completed)
      setActiveSession(completed)
      setPhase("success")
    } catch (uploadError) {
      setPhase("error")
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The upload failed. Please try again."
      )
    }
  }

  function resetUpload() {
    setSelectedFile(null)
    setTitle("")
    setDescription("")
    setPhase("idle")
    setError(null)
    setProgressBytes(0)
    setUploadedParts(0)
    setActiveSession(null)
    setCompletedSession(null)
  }

  return (
    <form className="grid gap-6 lg:grid-cols-[1fr_360px]" onSubmit={handleSubmit}>
      <section className="rounded-lg border bg-surface p-5">
        <div className="rounded-lg border border-dashed bg-surface-overlay p-8 text-center">
          <FileVideo className="mx-auto size-10 text-info" />
          <h2 className="mt-4 font-heading text-xl font-semibold">
            Select a source video
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            The browser uploads this file to Laravel in local chunks, then the API
            assembles the original source video.
          </p>
          <label className="mt-5 inline-flex">
            <input
              accept="video/*"
              className="sr-only"
              type="file"
              disabled={isUploading}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
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

        <div className="mt-5 grid gap-4 rounded-lg border p-4">
          <div>
            <label className="text-sm font-medium" htmlFor="video-title">
              Title
            </label>
            <Input
              className="mt-2"
              disabled={isUploading}
              id="video-title"
              maxLength={255}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give this video a title"
              value={title}
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="video-description">
              Description
            </label>
            <Textarea
              className="mt-2 min-h-24"
              disabled={isUploading}
              id="video-description"
              maxLength={5000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional notes for your dashboard"
              value={description}
            />
          </div>
        </div>

        <div className="mt-5 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-sm font-semibold">
                Upload progress
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeSession
                  ? `${uploadedParts} of ${activeSession.totalParts} chunks uploaded`
                  : "Progress appears after the upload session starts."}
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {progress}%
            </span>
          </div>
          <Progress className="mt-4" value={progress} />
          {activeSession && (
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              {Array.from({ length: activeSession.totalParts }).map(
                (_, index) => {
                  const partNumber = index + 1
                  const isUploaded = partNumber <= uploadedParts

                  return (
                    <div
                      className="rounded-md border bg-background p-3 text-xs"
                      key={partNumber}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">Part {partNumber}</span>
                        {isUploaded && (
                          <CheckCircle2 className="size-4 text-success" />
                        )}
                      </div>
                      <p className="mt-2 font-mono text-muted-foreground">
                        {isUploaded ? "uploaded" : "pending"}
                      </p>
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-lg border bg-surface p-4">
          <h2 className="font-heading text-sm font-semibold">Upload summary</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">{phase}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Storage</dt>
              <dd className="font-mono text-xs">
                {activeSession?.provider ?? "local public disk"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Chunk size</dt>
              <dd className="font-mono text-xs">
                {activeSession ? formatBytes(activeSession.partSize) : "set by API"}
              </dd>
            </div>
          </dl>
        </section>

        {error && (
          <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4" />
              <div>
                <h2 className="font-heading text-sm font-semibold">
                  Upload failed
                </h2>
                <p className="mt-2 text-sm leading-6">{error}</p>
              </div>
            </div>
          </section>
        )}

        {completedSession ? (
          <section className="rounded-lg border bg-gradient-ready p-4 text-brand-accent-foreground">
            <CheckCircle2 className="size-5" />
            <h2 className="mt-3 font-heading text-sm font-semibold">
              Upload queued
            </h2>
            <p className="mt-3 text-sm leading-6">
              {completedSession.video?.title ?? "Your video"} was saved and queued
              for processing.
            </p>
            <Button
              className="mt-4"
              onClick={resetUpload}
              type="button"
              variant="outline"
            >
              <RotateCcw className="size-4" />
              Upload another
            </Button>
          </section>
        ) : (
          <Button
            className="w-full"
            disabled={!selectedFile || title.trim() === "" || isUploading}
            type="submit"
          >
            <UploadCloud className="size-4" />
            {phase === "completing"
              ? "Finalizing"
              : phase === "uploading"
                ? "Uploading"
                : phase === "error"
                  ? "Try again"
                  : "Start upload"}
          </Button>
        )}
      </aside>
    </form>
  )
}
