import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

type StackOutput = {
  OutputKey?: string
  OutputValue?: string
}

const args = parseArgs(process.argv.slice(2))
const stackName = args["stack-name"] ?? "streamops-dev"
const region = args.region ?? "af-south-1"
const envFile = args["env-file"] ?? "apps/web/.env.local"

const outputJson = execFileSync("aws", [
  "cloudformation",
  "describe-stacks",
  "--region",
  region,
  "--stack-name",
  stackName,
  "--query",
  "Stacks[0].Outputs",
  "--output",
  "json",
], { encoding: "utf8" })

const outputs = new Map(
  (JSON.parse(outputJson) as StackOutput[])
    .filter((output) => output.OutputKey && output.OutputValue)
    .map((output) => [output.OutputKey as string, output.OutputValue as string])
)

const nextValues = {
  AWS_REGION: region,
  WORKFLOW_STORE: "aws",
  STREAMOPS_TABLE_NAME: requireOutput(outputs, "WorkflowTableName"),
  STREAMOPS_SOURCE_BUCKET: requireOutput(outputs, "SourceBucketName"),
  STREAMOPS_PROCESSING_QUEUE_URL: requireOutput(outputs, "ProcessingQueueUrl"),
  STREAMOPS_PROCESSING_DLQ_URL: requireOutput(outputs, "ProcessingDeadLetterQueueUrl"),
}

const existing = existsSync(envFile) ? readFileSync(envFile, "utf8") : ""
const next = upsertEnv(existing, nextValues)
writeFileSync(envFile, next)

console.log(`Updated ${envFile} from CloudFormation stack ${stackName}.`)
for (const key of Object.keys(nextValues)) {
  console.log(`${key}=<set>`)
}

function parseArgs(values: string[]) {
  const parsed: Record<string, string> = {}

  for (let index = 0; index < values.length; index += 1) {
    const current = values[index]
    if (!current?.startsWith("--")) {
      continue
    }

    const key = current.slice(2)
    const next = values[index + 1]
    if (!next || next.startsWith("--")) {
      parsed[key] = "true"
      continue
    }

    parsed[key] = next
    index += 1
  }

  return parsed
}

function requireOutput(outputs: Map<string, string>, key: string) {
  const value = outputs.get(key)
  if (!value) {
    throw new Error(`CloudFormation output ${key} is missing.`)
  }

  return value
}

function upsertEnv(contents: string, values: Record<string, string>) {
  const remaining = new Map(Object.entries(values))
  const lines = contents.split(/\r?\n/)
  const nextLines = lines.flatMap((line) => {
    const separatorIndex = line.indexOf("=")
    if (separatorIndex === -1) {
      return line
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = remaining.get(key)
    if (value === undefined) {
      return line
    }

    remaining.delete(key)
    return `${key}=${value}`
  })

  if (nextLines.length > 0 && nextLines.at(-1) === "") {
    nextLines.pop()
  }

  for (const [key, value] of remaining) {
    nextLines.push(`${key}=${value}`)
  }

  return `${nextLines.join("\n")}\n`
}
