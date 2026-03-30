import { readFile } from "node:fs/promises"
import { join } from "node:path"

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
}

function getMimeType(path: string): string {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase()
  return MIME_TYPES[ext] ?? "application/octet-stream"
}

export function resolveImagePath(path: string): string {
  return `/api/images/${path.replace(/^\//, "")}`
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params
  const imagePath = path.join("/")

  if (imagePath.includes("..")) {
    return new Response("Bad Request", { status: 400 })
  }

  const contentType = getMimeType(imagePath)
  const source = process.env.CONTENT_SOURCE ?? "local"

  if (source === "github") {
    const owner = process.env.GITHUB_OWNER ?? ""
    const repo = process.env.GITHUB_REPO ?? ""
    const branch = process.env.GITHUB_BRANCH ?? "main"
    const contentPath = process.env.GITHUB_CONTENT_PATH ?? "content"
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${contentPath}/images/${imagePath}`
    try {
      const res = await fetch(url)
      if (!res.ok) {
        return new Response("Not Found", { status: 404 })
      }
      return new Response(res.body, {
        headers: { "Content-Type": contentType },
      })
    } catch (e) {
      console.error("Image proxy fetch failed:", e)
      return new Response("Bad Gateway", { status: 502 })
    }
  }

  try {
    const filePath = join(process.cwd(), "content", "images", imagePath)
    const data = await readFile(filePath)
    return new Response(data, { headers: { "Content-Type": contentType } })
  } catch {
    return new Response("Not Found", { status: 404 })
  }
}
