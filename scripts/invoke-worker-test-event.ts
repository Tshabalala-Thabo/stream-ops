import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

type StackOutput = {
  OutputKey?: string
  OutputValue?: string
}

const args = parseArgs(process.argv.slice(2))
const stackName = args["stack-name"] ?? "streamops-dev"
const region = args.region ?? "af-south-1"
const eventFile = args.event ?? "infra/sam/events/sqs-unsupported-message.json"
const functionName = args.function ?? getWorkerFunctionName(stackName, region)
const qualifier = args.qualifier
const workspace = mkdtempSync(join(tmpdir(), "streamops-lambda-invoke-"))
const responseFile = join(workspace, "response.json")
const invokeArgs = [
  "lambda",
  "invoke",
  "--region",
  region,
  "--function-name",
  functionName,
  "--cli-binary-format",
  "raw-in-base64-out",
  "--payload",
  `file://${eventFile}`,
  responseFile,
]

if (qualifier) {
  invokeArgs.splice(6, 0, "--qualifier", qualifier)
}

try {
  const output = execFileSync("aws", invokeArgs, { encoding: "utf8" })

  console.log(output.trim())
  console.log(readFileSync(responseFile, "utf8"))
} finally {
  rmSync(workspace, { force: true, recursive: true })
}

function getWorkerFunctionName(stackName: string, region: string) {
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
  const value = outputs.get("WorkerFunctionName")

  if (!value) {
    throw new Error("CloudFormation output WorkerFunctionName is missing.")
  }

  return value
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
