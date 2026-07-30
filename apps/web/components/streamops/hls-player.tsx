"use client"

import Hls from "hls.js"
import { AlertCircle, PlayCircle } from "lucide-react"
import * as React from "react"

type HlsPlayerProps = {
  src: string | null
  poster?: string | null
}

export function HlsPlayer({ src, poster }: HlsPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    const video = videoRef.current

    if (!video || !src) {
      return
    }

    const media = video
    const streamSrc = src
    let isActive = true
    let hls: Hls | null = null

    setError(null)
    setIsReady(false)

    async function loadStream() {
      const response = await fetch(streamSrc)

      if (!response.ok) {
        const message = await response.text().catch(() => "")

        if (isActive) {
          setError(`Playback manifest request failed: ${response.status} ${message}`)
        }

        return
      }

      if (!isActive) {
        return
      }

      if (media.canPlayType("application/vnd.apple.mpegurl")) {
        media.src = streamSrc
        media.load()
        return
      }

      if (!Hls.isSupported()) {
        setError("This browser does not support HLS playback.")
        return
      }

      hls = new Hls()
      hls.loadSource(streamSrc)
      hls.attachMedia(media)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsReady(true)
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(`Playback failed while loading the HLS stream: ${data.details}`)
        }
      })
    }

    void loadStream().catch((nextError) => {
      if (isActive) {
        setError(nextError instanceof Error ? nextError.message : "Playback failed while loading the HLS stream.")
      }
    })

    return () => {
      isActive = false
      video.removeAttribute("src")
      video.load()
      hls?.destroy()
    }
  }, [src])

  if (!src) {
    return (
      <div className="grid aspect-video place-items-center rounded-md border bg-surface-overlay text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <PlayCircle className="size-4" />
          Playback appears after processing is ready.
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border bg-black">
      <div className="relative">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-black"
          controls
          onCanPlay={() => setIsReady(true)}
          onError={() => setError("The browser video element could not play this stream.")}
          playsInline
          poster={poster ?? undefined}
        />
        {!isReady && !error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40 text-sm text-white">
            Loading stream
          </div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 border-t border-white/10 bg-black p-3 text-sm text-white">
          <AlertCircle className="size-4 text-red-300" />
          {error}
        </div>
      )}
    </div>
  )
}
