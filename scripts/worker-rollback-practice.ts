import { execFileSync } from "node:child_process"

type StackOutput = {
  OutputKey?: string
  OutputValue?: string
}

type PublishVersionOutput = {
  Version?: string
  FunctionArn?: string
  CodeSha256?: string
}

type AliasOutput = {
  Name?: string
  FunctionVersion?: string
  AliasArn?: string
}

const args = parseArgs(process.argv.slice(2))
const command = args._[0]
const stackName = args["stack-name"] ?? "streamops-dev"
const region = args.region ?? "af-south-1"
const aliasName = args.alias ?? "rollback-practice"
const functionName = args.function ?? getWorkerFunctionName(stackName, region)

if (command === "snapshot") {
  const published = publishVersion(functionName, region)
  const version = requireField(published.Version, "published version")
  upsertAlias(functionName, region, aliasName, version)

  console.log(`Published ${functionName} version ${version}.`)
  console.log(`Alias ${aliasName} now points to version ${version}.`)
  console.log(`CodeSha256=${published.CodeSha256 ?? "<unknown>"}`)
} else if (command === "point-alias") {
  const version = args.version
  if (!version) {
    throw new Error("--version is required for point-alias.")
  }

  const alias = updateAlias(functionName, region, aliasName, version)
  console.log(`Alias ${alias.Name} now points to version ${alias.FunctionVersion}.`)
} else if (command === "show-alias") {
  const alias = getAlias(functionName, region, aliasName)
  console.log(`Alias ${alias.Name} points to version ${alias.FunctionVersion}.`)
  console.log(`AliasArn=${alias.AliasArn ?? "<unknown>"}`)
} else {
  throw new Error("Usage: npm run sam:rollback -- <snapshot|show-alias|point-alias --version N>")
}

function publishVersion(functionName: string, region: string): PublishVersionOutput {
  return JSON.parse(execFileSync("aws", [
    "lambda",
    "publish-version",
    "--region",
    region,
    "--function-name",
    functionName,
    "--description",
    `StreamOps rollback practice snapshot ${new Date().toISOString()}`,
    "--output",
    "json",
  ], { encoding: "utf8" })) as PublishVersionOutput
}

function upsertAlias(functionName: string, region: string, aliasName: string, version: string) {
  try {
    createAlias(functionName, region, aliasName, version)
  } catch (error) {
    if (!isAwsError(error, "ResourceConflictException")) {
      throw error
    }
    updateAlias(functionName, region, aliasName, version)
  }
}

function createAlias(functionName: string, region: string, aliasName: string, version: string): AliasOutput {
  return JSON.parse(execFileSync("aws", [
    "lambda",
    "create-alias",
    "--region",
    region,
    "--function-name",
    functionName,
    "--name",
    aliasName,
    "--function-version",
    version,
    "--description",
    "StreamOps rollback practice alias.",
    "--output",
    "json",
  ], { encoding: "utf8" })) as AliasOutput
}

function updateAlias(functionName: string, region: string, aliasName: string, version: string): AliasOutput {
  return JSON.parse(execFileSync("aws", [
    "lambda",
    "update-alias",
    "--region",
    region,
    "--function-name",
    functionName,
    "--name",
    aliasName,
    "--function-version",
    version,
    "--output",
    "json",
  ], { encoding: "utf8" })) as AliasOutput
}

function getAlias(functionName: string, region: string, aliasName: string): AliasOutput {
  return JSON.parse(execFileSync("aws", [
    "lambda",
    "get-alias",
    "--region",
    region,
    "--function-name",
    functionName,
    "--name",
    aliasName,
    "--output",
    "json",
  ], { encoding: "utf8" })) as AliasOutput
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
  const parsed: Record<string, string | string[]> = { _: [] }

  for (let index = 0; index < values.length; index += 1) {
    const current = values[index]
    if (!current?.startsWith("--")) {
      ;(parsed._ as string[]).push(current)
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

  return parsed as Record<string, string> & { _: string[] }
}

function requireField(value: string | undefined, label: string) {
  if (!value) {
    throw new Error(`Missing ${label}.`)
  }

  return value
}

function isAwsError(error: unknown, code: string) {
  return error instanceof Error && error.message.includes(code)
}
