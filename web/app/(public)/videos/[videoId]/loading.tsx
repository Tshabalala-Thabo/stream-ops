import { LoadingState } from "@/components/streamops/state-panels"

export default function VideoDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <LoadingState
        title="Loading video detail"
        description="Preparing playback readiness and pipeline metadata."
      />
    </div>
  )
}
