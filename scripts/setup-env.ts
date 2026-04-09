import { existsSync } from "node:fs"
import { join } from "node:path"

const projectRoot = join(import.meta.dirname, "..")
const envPath = join(projectRoot, ".env")

const defaultEnv: Record<string, string> = {
  DATABASE_URL: "postgresql://blog:blog_dev_password@localhost:5433/blog",
}

if (existsSync(envPath)) {
  const existing = await Bun.file(envPath).text()
  const existingKeys = new Set(
    existing
      .split("\n")
      .filter((line) => line.includes("=") && !line.startsWith("#"))
      .map((line) => line.split("=")[0].trim()),
  )

  const missing = Object.entries(defaultEnv).filter(
    ([key]) => !existingKeys.has(key),
  )

  if (missing.length === 0) {
    console.log(".env already exists with all required variables — skipping.")
    process.exit(0)
  }

  const append = missing.map(([key, value]) => `${key}=${value}`).join("\n")
  await Bun.write(envPath, `${existing.trimEnd()}\n${append}\n`)
  console.log(`.env updated — added: ${missing.map(([k]) => k).join(", ")}`)
} else {
  const content = Object.entries(defaultEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
  await Bun.write(envPath, `${content}\n`)
  console.log(".env created with default development values.")
}
