"use client"

import {
  AlertCircle,
  Ban,
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
  abortUploadSession,
  completeUploadSession,
  createUploadSession,
  getUploadSession,
  uploadUploadSessionPart,
} from "@/lib/api/uploads"
import type { UploadSession } from "@/lib/types"

type UploadPhase =
  | "idle"
  | "uploading"
  | "completing"
  | "success"
  | "error"
  | "cancelled"

type ResumeDraft = {
  uploadSessionId: UploadSession["id"]
  videoId: UploadSession["videoId"]
  fileName: string
  fileSize: number
  lastModified: number
  title: string
  description: string
  updatedAt: string
}

const RESUME_STORAGE_KEY = "streamops.activeUpload"
const PARALLEL_UPLOADS = 4

function readResumeDraft(): ResumeDraft | null {
  if (typeof window === "undefined") {
    return null
  }

  const rawDraft = window.localStorage.getItem(RESUME_STORAGE_KEY)

  if (!rawDraft) {
    return null
  }

  try {
    return JSON.parse(rawDraft) as ResumeDraft
  } catch {
    window.localStorage.removeItem(RESUME_STORAGE_KEY)
    return null
  }
}

function writeResumeDraft(draft: ResumeDraft) {
  window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(draft))
}

function clearResumeDraft() {
  window.localStorage.removeItem(RESUME_STORAGE_KEY)
}

function fileMatchesDraft(file: File | null, draft: ResumeDraft | null) {
  return Boolean(
    file &&
      draft &&
      file.name === draft.fileName &&
      file.size === draft.fileSize &&
      file.lastModified === draft.lastModified
  )
}

export function UploadFlow() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [phase, setPhase] = React.useState<UploadPhase>("idle")
  const [error, setError] = React.useState<string | null>(null)
  const [progressBytes, setProgressBytes] = React.useState(0)
  const [uploadedPartNumbers, setUploadedPartNumbers] = React.useState<number[]>(
    []
  )
  const [activeSession, setActiveSession] =
    React.useState<UploadSession | null>(null)
  const [completedSession, setCompletedSession] =
    React.useState<UploadSession | null>(null)
  const [resumeDraft, setResumeDraft] = React.useState<ResumeDraft | null>(null)

  const abortControllerRef = React.useRef<AbortController | null>(null)
  const isUploading = phase === "uploading" || phase === "completing"
  const canResume = fileMatchesDraft(selectedFile, resumeDraft)
  const uploadedPartSet = React.useMemo(
    () => new Set(uploadedPartNumbers),
    [uploadedPartNumbers]
  )
  const progress = selectedFile
    ? Math.min(100, Math.round((progressBytes / selectedFile.size) * 100))
    : 0

  React.useEffect(() => {
    const draft = readResumeDraft()

    if (draft) {
      setResumeDraft(draft)
      setTitle(draft.title)
      setDescription(draft.description)
    }
  }, [])

  function handleFileChange(file: File | null) {
    setSelectedFile(file)
    setCompletedSession(null)
    setActiveSession(null)
    setUploadedPartNumbers([])
    setProgressBytes(0)
    setError(null)
    setPhase("idle")

    const draft = readResumeDraft()
    setResumeDraft(draft)

    if (fileMatchesDraft(file, draft)) {
      setTitle(draft?.title ?? "")
      setDescription(draft?.description ?? "")
      return
    }

    if (file && title.trim() === "") {
      setTitle(file.name.replace(/\.[^.]+$/, ""))
    }
  }

  async function resolveUploadSession(file: File): Promise<UploadSession> {
    const draft = resumeDraft

    if (fileMatchesDraft(file, draft) && draft) {
      const session = await getUploadSession(draft.uploadSessionId)

      if (session.status !== "active") {
        clearResumeDraft()
        setResumeDraft(null)
        throw new Error("The saved upload session is no longer active.")
      }

      return session
    }

    const session = await createUploadSession({
      title: title.trim(),
      description: description.trim() || null,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "video/mp4",
    })

    const nextDraft: ResumeDraft = {
      uploadSessionId: session.id,
      videoId: session.videoId,
      fileName: file.name,
      fileSize: file.size,
      lastModified: file.lastModified,
      title: title.trim(),
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    }

    writeResumeDraft(nextDraft)
    setResumeDraft(nextDraft)

    return session
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

    const file = selectedFile
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setPhase("uploading")
    setError(null)
    setCompletedSession(null)
    setProgressBytes(0)

    try {
      const uploadSession = await resolveUploadSession(file)
      setActiveSession(uploadSession)

      const uploadedParts = new Map(
        uploadSession.uploadedParts.map((part) => [part.partNumber, part.size])
      )
      const uploadedNumbers = Array.from(uploadedParts.keys()).sort(
        (first, second) => first - second
      )
      const inFlightProgress = new Map<number, number>()
      let committedBytes = Array.from(uploadedParts.values()).reduce(
        (total, size) => total + size,
        0
      )

      setUploadedPartNumbers(uploadedNumbers)
      setProgressBytes(committedBytes)

      const updateProgress = () => {
        const activeBytes = Array.from(inFlightProgress.values()).reduce(
          (total, size) => total + size,
          0
        )
        setProgressBytes(committedBytes + activeBytes)
      }

      const missingParts = Array.from(
        { length: uploadSession.totalParts },
        (_, index) => index + 1
      ).filter((partNumber) => ! uploadedParts.has(partNumber))

      let nextPartIndex = 0

      async function uploadWorker() {
        while (nextPartIndex < missingParts.length) {
          if (abortController.signal.aborted) {
            return
          }

          const partNumber = missingParts[nextPartIndex]
          nextPartIndex += 1

          const start = (partNumber - 1) * uploadSession.partSize
          const end = Math.min(start + uploadSession.partSize, file.size)
          const chunk = file.slice(start, end, file.type)

          const nextSession = await uploadUploadSessionPart({
            uploadSessionId: uploadSession.id,
            partNumber,
            chunk,
            signal: abortController.signal,
            onProgress: (partBytes) => {
              inFlightProgress.set(partNumber, partBytes)
              updateProgress()
            },
          })

          inFlightProgress.delete(partNumber)
          committedBytes += chunk.size
          uploadedParts.set(partNumber, chunk.size)
          setUploadedPartNumbers(
            Array.from(uploadedParts.keys()).sort(
              (first, second) => first - second
            )
          )
          setActiveSession(nextSession)
          updateProgress()
        }
      }

      await Promise.all(
        Array.from({
          length: Math.min(PARALLEL_UPLOADS, Math.max(1, missingParts.length)),
        }).map(() => uploadWorker())
      )

      if (abortController.signal.aborted) {
        return
      }

      setPhase("completing")
      const completed = await completeUploadSession(uploadSession.id)
      clearResumeDraft()
      setResumeDraft(null)
      setProgressBytes(file.size)
      setUploadedPartNumbers(
        Array.from({ length: uploadSession.totalParts }, (_, index) => index + 1)
      )
      setCompletedSession(completed)
      setActiveSession(completed)
      setPhase("success")
    } catch (uploadError) {
      if (uploadError instanceof DOMException && uploadError.name === "AbortError") {
        setPhase("cancelled")
        setError(null)
        return
      }

      setPhase("error")
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The upload failed. Please try again."
      )
    } finally {
      abortControllerRef.current = null
    }
  }

  async function cancelUpload() {
    abortControllerRef.current?.abort()

    const sessionToAbort = activeSession ?? resumeDraft

    if (!sessionToAbort) {
      setPhase("cancelled")
      return
    }

    try {
      const aborted = await abortUploadSession(
        "uploadSessionId" in sessionToAbort
          ? sessionToAbort.uploadSessionId
          : sessionToAbort.id
      )
      setActiveSession(aborted)
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unable to cancel the upload session."
      )
      setPhase("error")
      return
    }

    clearResumeDraft()
    setResumeDraft(null)
    setUploadedPartNumbers([])
    setProgressBytes(0)
    setPhase("cancelled")
  }

  function resetUpload() {
    clearResumeDraft()
    setResumeDraft(null)
    setSelectedFile(null)
    setTitle("")
    setDescription("")
    setPhase("idle")
    setError(null)
    setProgressBytes(0)
    setUploadedPartNumbers([])
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
              disabled={isUploading}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-gradient-primary px-3 text-sm font-medium text-white shadow-sm">
              <UploadCloud className="size-4" />
              Choose file
            </span>
          </label>
        </div>

        {resumeDraft && !selectedFile && (
          <div className="mt-5 rounded-lg border border-info/30 bg-info/10 p-4">
            <h3 className="font-heading text-sm font-semibold">
              Resume available
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Choose {resumeDraft.fileName} again to continue the saved upload.
            </p>
          </div>
        )}

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
            {canResume && (
              <p className="mt-3 text-xs font-medium text-info">
                This file matches the saved upload and will resume missing chunks.
              </p>
            )}
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
                  ? `${uploadedPartNumbers.length} of ${activeSession.totalParts} chunks uploaded`
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
                  const isUploaded = uploadedPartSet.has(partNumber)

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
            <div>
              <dt className="text-muted-foreground">Parallel uploads</dt>
              <dd className="font-mono text-xs">{PARALLEL_UPLOADS}</dd>
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

        {phase === "cancelled" && (
          <section className="rounded-lg border bg-surface p-4">
            <Ban className="size-5 text-muted-foreground" />
            <h2 className="mt-3 font-heading text-sm font-semibold">
              Upload cancelled
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The temporary chunks were removed and the upload session was closed.
            </p>
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
          <div className="grid gap-3">
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
                    ? canResume
                      ? "Resume upload"
                      : "Try again"
                    : canResume
                      ? "Resume upload"
                      : "Start upload"}
            </Button>
            {(isUploading || activeSession || resumeDraft) && (
              <Button
                className="w-full"
                disabled={phase === "success"}
                onClick={cancelUpload}
                type="button"
                variant="destructive"
              >
                <Ban className="size-4" />
                Cancel upload
              </Button>
            )}
          </div>
        )}
      </aside>
    </form>
  )
}
