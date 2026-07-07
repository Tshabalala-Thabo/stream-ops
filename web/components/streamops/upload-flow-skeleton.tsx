"use client"

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Film,
  ImageIcon,
  RotateCcw,
  UploadCloud,
  X,
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
  | "paused"
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

function formatLocalDuration(durationSeconds: number | null) {
  if (!durationSeconds || Number.isNaN(durationSeconds)) {
    return null
  }

  const rounded = Math.round(durationSeconds)
  const minutes = Math.floor(rounded / 60)
  const seconds = rounded % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")} long`
}

function getPrimaryButtonLabel({
  canResume,
  phase,
}: {
  canResume: boolean
  phase: UploadPhase
}) {
  if (phase === "completing") {
    return "Finalizing"
  }

  if (phase === "uploading") {
    return "Uploading"
  }

  if (phase === "paused") {
    return "Resume upload"
  }

  if (phase === "error" && !canResume) {
    return "Try again"
  }

  if (canResume) {
    return "Resume upload"
  }

  return "Start upload"
}

export function UploadFlow() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [phase, setPhase] = React.useState<UploadPhase>("idle")
  const [error, setError] = React.useState<string | null>(null)
  const [progressBytes, setProgressBytes] = React.useState(0)
  const [, setUploadedPartNumbers] = React.useState<number[]>([])
  const [activeSession, setActiveSession] =
    React.useState<UploadSession | null>(null)
  const [completedSession, setCompletedSession] =
    React.useState<UploadSession | null>(null)
  const [resumeDraft, setResumeDraft] = React.useState<ResumeDraft | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [fileDuration, setFileDuration] = React.useState<number | null>(null)

  const abortControllerRef = React.useRef<AbortController | null>(null)
  const objectUrlRef = React.useRef<string | null>(null)
  const previewRequestRef = React.useRef(0)
  const resumeProgressRequestRef = React.useRef(0)
  const pauseRequestedRef = React.useRef(false)

  const isUploading = phase === "uploading" || phase === "completing"
  const canResume = fileMatchesDraft(selectedFile, resumeDraft)
  const progressTotalBytes = selectedFile?.size ?? resumeDraft?.fileSize ?? 0
  const progress = progressTotalBytes
    ? Math.min(100, Math.round((progressBytes / progressTotalBytes) * 100))
    : 0
  const durationLabel = formatLocalDuration(fileDuration)

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  function clearLocalPreview() {
    previewRequestRef.current += 1
    setPreviewUrl(null)
    setFileDuration(null)

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  function createLocalPreview(file: File) {
    const requestId = previewRequestRef.current + 1
    previewRequestRef.current = requestId
    setPreviewUrl(null)
    setFileDuration(null)

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl

    const video = document.createElement("video")
    video.preload = "metadata"
    video.muted = true
    video.playsInline = true
    video.src = objectUrl

    const finish = (nextPreviewUrl: string | null, duration: number | null) => {
      if (previewRequestRef.current !== requestId) {
        return
      }

      setPreviewUrl(nextPreviewUrl)
      setFileDuration(duration)
    }

    const cleanup = () => {
      video.removeAttribute("src")
      video.load()
    }

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : null
      const seekTarget = duration ? Math.min(Math.max(duration * 0.08, 0.5), 4) : 0

      if (!duration || seekTarget === 0) {
        finish(null, duration)
        cleanup()
        return
      }

      video.currentTime = seekTarget
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth || 1280
        canvas.height = video.videoHeight || 720

        const context = canvas.getContext("2d")

        if (!context) {
          finish(null, Number.isFinite(video.duration) ? video.duration : null)
          cleanup()
          return
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        finish(
          canvas.toDataURL("image/jpeg", 0.82),
          Number.isFinite(video.duration) ? video.duration : null
        )
      } catch {
        finish(null, Number.isFinite(video.duration) ? video.duration : null)
      } finally {
        cleanup()
      }
    }

    video.onerror = () => {
      finish(null, null)
      cleanup()
    }
  }

  const applyUploadSessionProgress = React.useCallback((session: UploadSession) => {
    const uploadedNumbers = session.uploadedParts
      .map((part) => part.partNumber)
      .sort((first, second) => first - second)
    const uploadedBytes = session.uploadedParts.reduce(
      (total, part) => total + part.size,
      0
    )

    setActiveSession(session)
    setUploadedPartNumbers(uploadedNumbers)
    setProgressBytes(uploadedBytes)
  }, [])

  const refreshResumeProgress = React.useCallback(async (draft: ResumeDraft) => {
    const requestId = resumeProgressRequestRef.current + 1
    resumeProgressRequestRef.current = requestId

    try {
      const session = await getUploadSession(draft.uploadSessionId)

      if (resumeProgressRequestRef.current !== requestId) {
        return
      }

      if (session.status !== "active") {
        clearResumeDraft()
        setResumeDraft(null)
        setActiveSession(null)
        setUploadedPartNumbers([])
        setProgressBytes(0)
        return
      }

      applyUploadSessionProgress(session)
    } catch {
      if (resumeProgressRequestRef.current !== requestId) {
        return
      }

      setActiveSession(null)
      setUploadedPartNumbers([])
      setProgressBytes(0)
    }
  }, [applyUploadSessionProgress])

  React.useEffect(() => {
    const draft = readResumeDraft()

    if (draft) {
      setResumeDraft(draft)
      setTitle(draft.title)
      setDescription(draft.description)
      void refreshResumeProgress(draft)
    }
  }, [refreshResumeProgress])

  function handleFileChange(file: File | null) {
    setSelectedFile(file)
    setCompletedSession(null)
    setActiveSession(null)
    setUploadedPartNumbers([])
    setProgressBytes(0)
    setError(null)
    setPhase("idle")

    if (file) {
      createLocalPreview(file)
    } else {
      clearLocalPreview()
    }

    const draft = readResumeDraft()
    setResumeDraft(draft)

    if (draft && fileMatchesDraft(file, draft)) {
      setTitle(draft.title)
      setDescription(draft.description)
      void refreshResumeProgress(draft)
      return
    }

    if (file && title.trim() === "") {
      setTitle(file.name.replace(/\.[^.]+$/, ""))
    }
  }

  function handleFileDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault()

    if (isUploading) {
      return
    }

    handleFileChange(event.dataTransfer.files?.[0] ?? null)
  }

  async function resolveUploadSession(file: File): Promise<UploadSession> {
    const draft = resumeDraft

    if (fileMatchesDraft(file, draft) && draft) {
      const session =
        activeSession?.id === draft.uploadSessionId
          ? activeSession
          : await getUploadSession(draft.uploadSessionId)

      if (session.status !== "active") {
        clearResumeDraft()
        setResumeDraft(null)
        throw new Error("The saved upload is no longer active.")
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
      setError("Choose a video before starting the upload.")
      return
    }

    if (title.trim() === "") {
      setError("Add a title before starting the upload.")
      return
    }

    const file = selectedFile
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    pauseRequestedRef.current = false
    setPhase("uploading")
    setError(null)
    setCompletedSession(null)

    if (!canResume) {
      setProgressBytes(0)
    }

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
      ).filter((partNumber) => !uploadedParts.has(partNumber))

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
        if (pauseRequestedRef.current) {
          const draft = readResumeDraft()

          setPhase("paused")
          setError(null)

          if (draft) {
            void refreshResumeProgress(draft)
          } else if (activeSession) {
            applyUploadSessionProgress(activeSession)
          }

          return
        }

        setPhase("cancelled")
        setError(null)
        return
      }

      setPhase("error")
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The upload did not finish. Please try again."
      )
    } finally {
      abortControllerRef.current = null
      pauseRequestedRef.current = false
    }
  }

  function pauseUpload() {
    pauseRequestedRef.current = true
    abortControllerRef.current?.abort()
    setPhase("paused")
    setError(null)
  }

  async function cancelUpload() {
    pauseRequestedRef.current = false
    abortControllerRef.current?.abort()

    const sessionToAbort = activeSession ?? resumeDraft

    if (!sessionToAbort) {
      setPhase("cancelled")
      return
    }

    try {
      await abortUploadSession(
        "uploadSessionId" in sessionToAbort
          ? sessionToAbort.uploadSessionId
          : sessionToAbort.id
      )
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Unable to cancel the upload."
      )
      setPhase("error")
      return
    }

    clearResumeDraft()
    setResumeDraft(null)
    setUploadedPartNumbers([])
    setProgressBytes(0)
    setActiveSession(null)
    setCompletedSession(null)
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
    clearLocalPreview()
  }

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <section>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {!selectedFile ? (
              <label
                className="group grid min-h-80 cursor-pointer place-items-center rounded-lg border border-dashed border-info/70 bg-info-light/45 p-8 text-center transition hover:border-primary hover:bg-info-light dark:bg-info-light/30"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input
                  accept="video/*"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] ?? null)
                  }
                  type="file"
                />
                <span className="flex max-w-md flex-col items-center">
                  <span className="grid size-16 place-items-center rounded-lg bg-gradient-primary text-white shadow-sm transition group-hover:scale-[1.02]">
                    <UploadCloud className="size-7" />
                  </span>
                  <span className="mt-5 font-heading text-xl font-semibold">
                    Drag your video in, or browse
                  </span>
                  <span className="mt-2 text-sm leading-6 text-muted-foreground">
                    Pick the video you are ready to upload. StreamOps will take
                    care of the preparation after it is in.
                  </span>
                  <span className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-medium text-white shadow-sm">
                    <Film className="size-4" />
                    Choose a video
                  </span>
                </span>
              </label>
            ) : (
              <section className="rounded-lg border bg-background p-4">
                <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
                  <div className="relative aspect-video overflow-hidden rounded-md border bg-surface-overlay">
                    {previewUrl ? (
                      <div
                        aria-label={`${selectedFile.name} preview`}
                        className="size-full bg-cover bg-center"
                        role="img"
                        style={{ backgroundImage: `url(${previewUrl})` }}
                      />
                    ) : (
                      <div className="grid size-full place-items-center bg-gradient-dark-glow">
                        <ImageIcon className="size-9 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-foreground/75 px-3 py-2 text-xs font-medium text-background">
                      Preview
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-heading text-lg font-semibold">
                          {selectedFile.name}
                        </h3>
                        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span>{formatBytes(selectedFile.size)}</span>
                          {durationLabel && <span>{durationLabel}</span>}
                          <span>{selectedFile.type || "Video file"}</span>
                        </p>
                      </div>
                      {!isUploading && phase !== "success" && (
                        <button
                          aria-label="Remove selected video"
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          onClick={() => handleFileChange(null)}
                          type="button"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>

                    {canResume && (
                      <div className="mt-4 rounded-md border border-info/30 bg-info-light p-3 text-sm text-info-dark dark:bg-info-light/40 dark:text-info-dark">
                        This video matches your saved upload. You can resume
                        without starting over.
                      </div>
                    )}

                    {phase === "success" && completedSession && (
                      <div className="mt-4 rounded-md border border-success/30 bg-success-light p-3 text-sm text-success-dark dark:bg-success-light/40 dark:text-success-dark">
                        {completedSession.video?.title ?? "Your video"} is uploaded
                        and waiting for processing.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {resumeDraft && !selectedFile && (
              <section className="rounded-lg border border-info/30 bg-info-light p-4">
                <h3 className="font-heading text-sm font-semibold text-info-dark dark:text-info-dark">
                  Resume available
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Choose {resumeDraft.fileName} again to continue the saved upload.
                </p>
              </section>
            )}

            <section className="grid gap-4 rounded-lg border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-base font-semibold">
                  Video details
                </h3>
                <span className="text-xs text-muted-foreground">
                  Title required
                </span>
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="video-title">
                  Give it a title
                </label>
                <Input
                  className="mt-2"
                  disabled={isUploading || phase === "success"}
                  id="video-title"
                  maxLength={255}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: Launch recap"
                  value={title}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="video-description">
                  Add a description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  className="mt-2 min-h-28"
                  disabled={isUploading || phase === "success"}
                  id="video-description"
                  maxLength={5000}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Add a short note for your dashboard."
                  value={description}
                />
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border bg-background p-4">
              <h3 className="font-heading text-base font-semibold">
                Upload status
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {phase === "idle" && !selectedFile
                  ? activeSession && resumeDraft
                    ? "Choose the same video to continue from saved progress."
                    : "Choose a video to get started."
                  : phase === "success"
                    ? "Upload complete. Processing is pending."
                    : phase === "cancelled"
                      ? "The upload was cancelled."
                      : phase === "error"
                        ? "The upload needs your attention."
                        : phase === "paused"
                          ? "Paused. Resume when you are ready."
                        : isUploading
                          ? "Upload in progress."
                          : canResume && progress > 0
                            ? "Ready to continue from saved progress."
                          : "Everything looks ready."}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{progress}% done</span>
                  <span className="text-muted-foreground">
                    {phase === "success"
                      ? "Done"
                      : phase === "cancelled"
                        ? "Cancelled"
                        : phase === "paused"
                          ? "Paused"
                        : isUploading
                          ? "Uploading"
                          : canResume && progress > 0
                            ? "Saved"
                          : "Ready"}
                  </span>
                </div>
                <Progress className="mt-3" value={progress} />
              </div>
            </section>

            {error && (
              <section className="rounded-lg border border-destructive/30 bg-destructive-light p-4 text-destructive-dark dark:bg-destructive-light/70 dark:text-destructive-dark">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <h3 className="font-heading text-sm font-semibold">
                      Upload needs a retry
                    </h3>
                    <p className="mt-2 text-sm leading-6">{error}</p>
                  </div>
                </div>
              </section>
            )}

            {phase === "cancelled" && (
              <section className="rounded-lg border bg-muted p-4">
                <Ban className="size-5 text-muted-foreground" />
                <h3 className="mt-3 font-heading text-sm font-semibold">
                  Nothing was published
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  You can start again when you are ready.
                </p>
              </section>
            )}

            {completedSession ? (
              <section className="rounded-lg border border-success/30 bg-success-light p-4 text-success-dark dark:bg-success-light/40 dark:text-success-dark">
                <CheckCircle2 className="size-6" />
                <h3 className="mt-3 font-heading text-base font-semibold">
                  Upload complete
                </h3>
                <p className="mt-2 text-sm leading-6">
                  Your video is now pending processing. You do not need to wait
                  here while StreamOps prepares it.
                </p>
                <Button
                  className="mt-4 w-full"
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
                  className="w-full bg-gradient-primary text-white shadow-sm hover:opacity-95"
                  disabled={!selectedFile || title.trim() === "" || isUploading}
                  type="submit"
                >
                  <UploadCloud className="size-4" />
                  {getPrimaryButtonLabel({ canResume, phase })}
                </Button>
                {isUploading && (
                  <Button
                    className="w-full"
                    onClick={pauseUpload}
                    type="button"
                    variant="outline"
                  >
                    <Ban className="size-4" />
                    Pause upload
                  </Button>
                )}
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
        </div>
      </section>
    </form>
  )
}
