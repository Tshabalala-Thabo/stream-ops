export type StreamOpsAwsConfig = {
  region: string
  tableName: string
  sourceBucket: string
}

function requireEnv(name: string, value: string | undefined) {
  if (!value?.trim()) {
    throw new Error(`${name} is required for AWS workflow mode.`)
  }

  return value
}

export function getStreamOpsAwsConfig(env = process.env): StreamOpsAwsConfig {
  return {
    region: requireEnv("AWS_REGION", env.AWS_REGION),
    tableName: requireEnv("STREAMOPS_TABLE_NAME", env.STREAMOPS_TABLE_NAME),
    sourceBucket: requireEnv("STREAMOPS_SOURCE_BUCKET", env.STREAMOPS_SOURCE_BUCKET),
  }
}
