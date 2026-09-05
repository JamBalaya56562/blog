import { existsSync } from "node:fs"
import { join } from "node:path"

const projectRoot = join(import.meta.dirname, "..")
const envPath = join(projectRoot, ".env")

const defaultEnv: Record<string, string> = {
  AWS_REGION: "ap-northeast-1",
  DYNAMODB_ENDPOINT: "http://localhost:8000",
  DYNAMODB_TABLE_NAME: "blog-page-views",
}

/**
 * Variables from an earlier setup that no longer mean anything. They are
 * dropped rather than left behind, because a stale `DATABASE_URL` reads like
 * live configuration, and `AWS_ACCESS_KEY_ID` in `.env` would shadow a real SSO
 * session for every AWS tool run from this directory.
 */
const obsoleteKeys = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_SESSION_TOKEN",
  "DATABASE_URL",
]

const keyOf = (line: string) => line.split("=")[0].trim()
const isAssignment = (line: string) =>
  line.includes("=") && !line.trimStart().startsWith("#")

if (existsSync(envPath)) {
  const existing = await Bun.file(envPath).text()
  const lines = existing.split("\n")

  const kept = lines.filter(
    (line) => !(isAssignment(line) && obsoleteKeys.includes(keyOf(line))),
  )
  const removed = lines.length - kept.length

  const existingKeys = new Set(kept.filter(isAssignment).map(keyOf))
  const missing = Object.entries(defaultEnv).filter(
    ([key]) => !existingKeys.has(key),
  )

  if (missing.length === 0 && removed === 0) {
    console.log(".env already exists with all required variables — skipping.")
    process.exit(0)
  }

  const body = kept.join("\n").trimEnd()
  const append = missing.map(([key, value]) => `${key}=${value}`).join("\n")
  const content = [body, append].filter(Boolean).join("\n")
  await Bun.write(envPath, `${content}\n`)

  const changes = [
    missing.length > 0 && `added: ${missing.map(([k]) => k).join(", ")}`,
    removed > 0 && `removed ${removed} obsolete line(s)`,
  ].filter(Boolean)
  console.log(`.env updated — ${changes.join("; ")}`)
} else {
  const content = Object.entries(defaultEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
  await Bun.write(envPath, `${content}\n`)
  console.log(".env created with default development values.")
}
