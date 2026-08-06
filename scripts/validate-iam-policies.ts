import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

type PolicyDocument = {
  Version: string
  Statement: PolicyStatement[]
}

type PolicyStatement = {
  Sid?: string
  Effect: "Allow" | "Deny"
  Action: string | string[]
  Resource: string | string[]
}

const policyDir = "infra/iam"
const allowedWildcardResourceSids = new Set([
  "CloudFormationReadAndTransform",
  "ManageStreamOpsCognito",
  "CloudWatchLogsRead",
])

const files = readdirSync(policyDir).filter((file) => file.endsWith(".json")).sort()

if (files.length === 0) {
  throw new Error(`No IAM policy JSON files found in ${policyDir}.`)
}

for (const file of files) {
  const path = join(policyDir, file)
  const policy = JSON.parse(readFileSync(path, "utf8")) as PolicyDocument

  assert(policy.Version === "2012-10-17", `${path}: Version must be 2012-10-17.`)
  assert(Array.isArray(policy.Statement), `${path}: Statement must be an array.`)

  for (const statement of policy.Statement) {
    const sid = statement.Sid ?? "<missing Sid>"
    const actions = toArray(statement.Action)
    const resources = toArray(statement.Resource)

    assert(statement.Effect === "Allow", `${path} ${sid}: only Allow statements are expected here.`)
    assert(actions.length > 0, `${path} ${sid}: Action must not be empty.`)
    assert(resources.length > 0, `${path} ${sid}: Resource must not be empty.`)
    assert(
      actions.every((action) => !action.endsWith(":*") && action !== "*"),
      `${path} ${sid}: wildcard actions are not allowed.`
    )

    if (resources.includes("*")) {
      assert(
        statement.Sid !== undefined && allowedWildcardResourceSids.has(statement.Sid),
        `${path} ${sid}: wildcard Resource must be explicitly allow-listed by Sid.`
      )
    }
  }

  console.log(`${path} OK`)
}

function toArray(value: string | string[]) {
  return Array.isArray(value) ? value : [value]
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
