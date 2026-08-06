import { sanitizeLogFields } from "@streamops/core"

type MetricUnit = "Count" | "Milliseconds"

type MetricValue = {
  name: string
  unit: MetricUnit
  value: number
}

type WorkerMetricInput = {
  environment?: string
  outcome: "started" | "succeeded" | "failed" | "workflow_error"
  metrics: MetricValue[]
  fields?: Record<string, unknown>
  timestamp?: number
}

const namespace = "StreamOps/Worker"

export function createWorkerEmfMetric(input: WorkerMetricInput) {
  const environment = input.environment ?? getWorkerEnvironment()

  return {
    _aws: {
      Timestamp: input.timestamp ?? Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: namespace,
          Dimensions: [["Environment", "Outcome"]],
          Metrics: input.metrics.map((metric) => ({
            Name: metric.name,
            Unit: metric.unit,
          })),
        },
      ],
    },
    Environment: environment,
    Outcome: input.outcome,
    ...Object.fromEntries(input.metrics.map((metric) => [metric.name, metric.value])),
    ...sanitizeLogFields(input.fields ?? {}),
  }
}

export function logWorkerEmfMetric(input: WorkerMetricInput) {
  console.log(JSON.stringify(createWorkerEmfMetric(input)))
}

export function getWorkerEnvironment() {
  return process.env.STREAMOPS_ENVIRONMENT ?? process.env.ENVIRONMENT_NAME ?? "dev"
}
