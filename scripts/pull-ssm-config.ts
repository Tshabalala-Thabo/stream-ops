import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

type SsmParameter = {
  Name?: string
  Value?: string
}

const args = parseArgs(process.argv.slice(2))
const region = args.region ?? "af-south-1"
const path = args.path ?? "/streamops/dev"
const envFile = args["env-file"] ?? "apps/web/.env.local"

const parametersJson = execFileSync("aws", [
  "ssm",
  "get-parameters-by-path",
  "--region",
  region,
  "--path",
  path,
  "--with-decryption",
  "--query",
  "Parameters",
  "--output",
  "json",
], { encoding: "utf8" })

const parameters = JSON.parse(parametersJson) as SsmParameter[]
const values = mapParametersToEnv(path, parameters)
const existing = existsSync(envFile) ? readFileSync(envFile, "utf8") : ""
const next = upsertEnv(existing, values)

writeFileSync(envFile, next)

console.log(`Updated ${envFile} from SSM ${path}.`)
for (const key of Object.keys(values)) {
  console.log(`${key}=<set>`)
}

function mapParametersToEnv(path: string, parameters: SsmParameter[]) {
  const values: Record<string, string> = {
    AWS_REGION: region,
  }
  const normalizedPath = path.endsWith("/") ? path.slice(0, -1) : path
  const names: Record<string, string> = {
    "aws-region": "AWS_REGION",
    "workflow-store": "WORKFLOW_STORE",
    "table-name": "STREAMOPS_TABLE_NAME",
    "source-bucket": "STREAMOPS_SOURCE_BUCKET",
    "processing-queue-url": "STREAMOPS_PROCESSING_QUEUE_URL",
    "processing-dlq-url": "STREAMOPS_PROCESSING_DLQ_URL",
    "cognito-user-pool-id": "COGNITO_USER_POOL_ID",
    "cognito-client-id": "COGNITO_CLIENT_ID",
    "cognito-issuer": "COGNITO_ISSUER",
    "cognito-domain": "COGNITO_DOMAIN",
  }

  for (const parameter of parameters) {
    if (!parameter.Name || parameter.Value === undefined) {
      continue
    }

    const localName = parameter.Name.replace(`${normalizedPath}/`, "")
    const envName = names[localName]
    if (envName) {
      values[envName] = parameter.Value
    }
  }

  const missing = Object.values(names).filter((name) => !values[name])
  if (missing.length > 0) {
    throw new Error(`SSM config is missing required env values: ${missing.join(", ")}`)
  }

  return values
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
