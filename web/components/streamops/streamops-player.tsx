"use client"

import Hls from "hls.js"
import {
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react"
import * as React from "react"

import { formatDuration } from "@/components/streamops/video-format"
import { Button } from "@/components/ui/button"
import type { Video, VideoRendition } from "@/lib/types"
import { cn } from "@/lib/utils"

type StreamOpsPlayerProps = {
  video: Video
  renditions: VideoRendition[]
}

type PreviewCue = {
  start: number
  end: number
  x: number
  y: number
  width: number
  height: number
}

function parseTimestamp(value: string) {
  const [hours = "0", minutes = "0", seconds = "0"] = value.split(":")

  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number.parseFloat(seconds)
  )
}

function parsePreviewTrack(contents: string): PreviewCue[] {
  const lines = contents.split(/\r?\n/)
  const cues: PreviewCue[] = []

  for (let index = 0; index < lines.length; index++) {
    if (!lines[index]?.includes("-->")) {
      continue
    }

    const [start, end] = lines[index].split("-->").map((item) => item.trim())
    const region = lines[index + 1]?.match(/#xywh=(\d+),(\d+),(\d+),(\d+)/)

    if (!start || !end || !region) {
      continue
    }

    cues.push({
      start: parseTimestamp(start),
      end: parseTimestamp(end),
      x: Number(region[1]),
      y: Number(region[2]),
      width: Number(region[3]),
      height: Number(region[4]),
    })
  }

  return cues
}

function qualityLabel(rendition: VideoRendition) {
  return rendition.label || `${rendition.height}p`
}

export function StreamOpsPlayer({ video, renditions }: StreamOpsPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const shellRef = React.useRef<HTMLDivElement | null>(null)
  const hlsRef = React.useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [volume, setVolume] = React.useState(0.85)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(video.durationSeconds ?? 0)
  const [selectedQuality, setSelectedQuality] = React.useState("auto")
  const [hlsLevels, setHlsLevels] = React.useState<{ height: number; index: number }[]>(
    []
  )
  const [isQualityOpen, setIsQualityOpen] = React.useState(false)
  const [previewCues, setPreviewCues] = React.useState<PreviewCue[]>([])
  const [hoverTime, setHoverTime] = React.useState<number | null>(null)
  const [hoverPercent, setHoverPercent] = React.useState(0)
  const activeCue = previewCues.find(
    (cue) => hoverTime !== null && hoverTime >= cue.start && hoverTime < cue.end
  )
  const canPlay = Boolean(video.playbackManifestUrl)

  React.useEffect(() => {
    const player = videoRef.current
    const manifestUrl = video.playbackManifestUrl

    if (!player || !manifestUrl) {
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true })
      hls.loadSource(manifestUrl)
      hls.attachMedia(player)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setHlsLevels(
          hls.levels.map((level, index) => ({
            height: level.height,
            index,
          }))
        )
      })
      hlsRef.current = hls

      return () => {
        hls.destroy()
        hlsRef.current = null
        setHlsLevels([])
      }
    }

    if (player.canPlayType("application/vnd.apple.mpegurl")) {
      player.src = manifestUrl
    }
  }, [video.playbackManifestUrl])

  React.useEffect(() => {
    let isMounted = true

    async function loadPreviewTrack() {
      if (!video.previewTrackUrl) {
        return
      }

      try {
        const response = await fetch(video.previewTrackUrl)
        const contents = await response.text()

        if (isMounted) {
          setPreviewCues(parsePreviewTrack(contents))
        }
      } catch {
        if (isMounted) {
          setPreviewCues([])
        }
      }
    }

    void loadPreviewTrack()

    return () => {
      isMounted = false
    }
  }, [video.previewTrackUrl])

  React.useEffect(() => {
    const player = videoRef.current

    if (!player) {
      return
    }

    player.volume = volume
    player.muted = isMuted
  }, [isMuted, volume])

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if ([" ", "k", "K"].includes(event.key)) {
        event.preventDefault()
        void togglePlayback()
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()
        seekBy(-10)
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()
        seekBy(10)
      }

      if (event.key === "m" || event.key === "M") {
        setIsMuted((current) => !current)
      }

      if (event.key === "f" || event.key === "F") {
        void toggleFullscreen()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  async function togglePlayback() {
    const player = videoRef.current

    if (!player || !canPlay) {
      return
    }

    if (player.paused) {
      await player.play()
      setIsPlaying(true)
      return
    }

    player.pause()
    setIsPlaying(false)
  }

  function seekBy(offset: number) {
    const player = videoRef.current

    if (!player) {
      return
    }

    player.currentTime = Math.min(
      Math.max(player.currentTime + offset, 0),
      duration || player.duration || 0
    )
  }

  function handleSeek(value: string) {
    const player = videoRef.current
    const nextTime = Number(value)

    if (!player) {
      return
    }

    player.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  function handleTimelinePointerMove(event: React.PointerEvent<HTMLInputElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const percent = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
    const nextTime = percent * (duration || 0)

    setHoverPercent(percent * 100)
    setHoverTime(nextTime)
  }

  async function toggleFullscreen() {
    const shell = shellRef.current

    if (!shell) {
      return
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await shell.requestFullscreen()
  }

  function selectQuality(value: string) {
    const hls = hlsRef.current
    const player = videoRef.current
    const wasPlaying = Boolean(player && !player.paused)
    const currentPlaybackTime = player?.currentTime ?? 0

    setSelectedQuality(value)
    setIsQualityOpen(false)

    if (hls) {
      hls.currentLevel = value === "auto" ? -1 : Number(value)
      return
    }

    if (!player) {
      return
    }

    const rendition = renditions.find((item) => qualityLabel(item) === value)
    const nextSource = value === "auto" ? video.playbackManifestUrl : rendition?.playlistUrl

    if (nextSource) {
      player.src = nextSource
      player.currentTime = currentPlaybackTime
      if (wasPlaying) {
        void player.play()
      }
    }
  }

  const hlsQualityOptions = hlsLevels.map((level) => ({
    label: `${level.height}p`,
    value: String(level.index),
  }))
  const qualityOptions =
    hlsQualityOptions && hlsQualityOptions.length > 0
      ? hlsQualityOptions
      : renditions.map((rendition) => ({
          label: qualityLabel(rendition),
          value: qualityLabel(rendition),
        }))
  const progress = duration ? (currentTime / duration) * 100 : 0
  const selectedQualityLabel =
    selectedQuality === "auto"
      ? "Auto"
      : qualityOptions.find((option) => option.value === selectedQuality)?.label ??
        selectedQuality

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-black text-white shadow-sm"
      ref={shellRef}
    >
      <video
        className="aspect-video w-full bg-black"
        onClick={() => void togglePlayback()}
        onDurationChange={(event) =>
          setDuration(event.currentTarget.duration || video.durationSeconds || 0)
        }
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        poster={video.thumbnailUrl ?? undefined}
        ref={videoRef}
      />

      {!isPlaying && (
        <button
          aria-label={`Play ${video.title}`}
          className="absolute inset-0 grid place-items-center bg-black/10"
          onClick={() => void togglePlayback()}
          type="button"
        >
          <span className="grid size-16 place-items-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-105">
            <Play className="ml-1 size-7 fill-current" />
          </span>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/55 to-transparent p-3 pt-14 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <div className="relative">
          {hoverTime !== null && (
            <div
              className="pointer-events-none absolute bottom-7 z-10 -translate-x-1/2 rounded-md bg-black/90 p-1 shadow-lg"
              style={{ left: `${hoverPercent}%` }}
            >
              {activeCue && video.previewSpriteUrl ? (
                <div
                  className="relative overflow-hidden rounded bg-black"
                  style={{
                    width: activeCue.width,
                    height: activeCue.height,
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="size-full"
                    style={{
                      backgroundImage: `url(${video.previewSpriteUrl})`,
                      backgroundPosition: `-${activeCue.x}px -${activeCue.y}px`,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                </div>
              ) : video.thumbnailUrl ? (
                <div
                  aria-hidden="true"
                  className="aspect-video w-40 rounded bg-cover bg-center"
                  style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
                />
              ) : null}
              <p className="mt-1 text-center font-mono text-xs">
                {formatDuration(Math.round(hoverTime))}
              </p>
            </div>
          )}
          <input
            aria-label="Seek video"
            className="h-4 w-full cursor-pointer accent-primary"
            max={duration || 0}
            min={0}
            onChange={(event) => handleSeek(event.target.value)}
            onPointerLeave={() => setHoverTime(null)}
            onPointerMove={handleTimelinePointerMove}
            step={0.1}
            type="range"
            value={currentTime}
          />
          <div
            className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button
              aria-label={isPlaying ? "Pause" : "Play"}
              className="size-9 text-white hover:bg-white/15"
              disabled={!canPlay}
              onClick={() => void togglePlayback()}
              size="icon"
              type="button"
              variant="ghost"
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>
            <Button
              aria-label="Rewind 10 seconds"
              className="size-9 text-white hover:bg-white/15"
              onClick={() => seekBy(-10)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RotateCcw />
            </Button>
            <Button
              aria-label="Fast-forward 10 seconds"
              className="size-9 text-white hover:bg-white/15"
              onClick={() => seekBy(10)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RotateCw />
            </Button>
            <Button
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="size-9 text-white hover:bg-white/15"
              onClick={() => setIsMuted((current) => !current)}
              size="icon"
              type="button"
              variant="ghost"
            >
              {isMuted ? <VolumeX /> : <Volume2 />}
            </Button>
            <input
              aria-label="Volume"
              className="hidden w-20 accent-primary sm:block"
              max={1}
              min={0}
              onChange={(event) => setVolume(Number(event.target.value))}
              step={0.05}
              type="range"
              value={volume}
            />
            <span className="ml-2 font-mono text-xs text-white/85">
              {formatDuration(Math.round(currentTime))} /{" "}
              {formatDuration(Math.round(duration))}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <Button
                aria-label="Playback quality"
                className="gap-2 text-white hover:bg-white/15"
                onClick={() => setIsQualityOpen((current) => !current)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Settings />
                {selectedQualityLabel}
              </Button>
              {isQualityOpen && (
                <div className="absolute bottom-11 right-0 z-20 min-w-32 rounded-md border border-white/15 bg-black/92 p-1 text-sm shadow-lg">
                  <button
                    className={cn(
                      "block w-full rounded px-3 py-2 text-left hover:bg-white/15",
                      selectedQuality === "auto" && "text-primary"
                    )}
                    onClick={() => selectQuality("auto")}
                    type="button"
                  >
                    Auto
                  </button>
                  {qualityOptions.map((option) => (
                    <button
                      className={cn(
                        "block w-full rounded px-3 py-2 text-left hover:bg-white/15",
                        selectedQuality === option.value && "text-primary"
                      )}
                      key={`${option.value}-${option.label}`}
                      onClick={() => selectQuality(option.value)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              aria-label="Fullscreen"
              className="size-9 text-white hover:bg-white/15"
              onClick={() => void toggleFullscreen()}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Maximize />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
