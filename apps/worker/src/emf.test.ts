import assert from "node:assert/strict"
import test from "node:test"

import { createWorkerEmfMetric } from "./emf"

test("createWorkerEmfMetric emits CloudWatch EMF shape", () => {
  const metric = createWorkerEmfMetric({
    environment: "dev",
    outcome: "succeeded",
    timestamp: 1786000000000,
    metrics: [
      { name: "ProcessingSucceeded", unit: "Count", value: 1 },
      { name: "ProcessingDurationMs", unit: "Milliseconds", value: 42 },
    ],
    fields: {
      videoId: "video-1",
    },
  })

  assert.deepEqual(metric, {
    _aws: {
      Timestamp: 1786000000000,
      CloudWatchMetrics: [
        {
          Namespace: "StreamOps/Worker",
          Dimensions: [["Environment", "Outcome"]],
          Metrics: [
            { Name: "ProcessingSucceeded", Unit: "Count" },
            { Name: "ProcessingDurationMs", Unit: "Milliseconds" },
          ],
        },
      ],
    },
    Environment: "dev",
    Outcome: "succeeded",
    ProcessingSucceeded: 1,
    ProcessingDurationMs: 42,
    videoId: "video-1",
  })
})

test("createWorkerEmfMetric sanitizes extra fields", () => {
  const metric = createWorkerEmfMetric({
    environment: "dev",
    outcome: "failed",
    metrics: [{ name: "ProcessingFailed", unit: "Count", value: 1 }],
    fields: {
      presignedUrl: "https://example.com/file?X-Amz-Signature=secret",
    },
  })

  assert.equal((metric as Record<string, unknown>).presignedUrl, "[REDACTED]")
})
