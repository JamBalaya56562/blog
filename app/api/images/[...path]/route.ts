import { readFile } from "node:fs/promises"
import { join } from "node:path"

const MIME_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
}

const CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=604800"

/**
 * One path segment as content images are named: letters, digits, dots,
 * hyphens and underscores, not starting with a dot.
 *
 * Next decodes the URL once before the segments get here, so a request for
 * `%252e%252e` arrives as the text `%2e%2e`. That is not `..` and passed the
 * old `includes("..")` check, but a URL parser reads it as `..` when the
 * GitHub source puts it into a fetch URL, and reads a backslash as `/`. An
 * allowlist has no second reading.
 */
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

/** The image type of a path, or null for anything that is not an image. */
function getMimeType(path: string): string | null {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase()
  return MIME_TYPES[ext] ?? null
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
  const contentType = getMimeType(imagePath)

  if (!path.every((segment) => SEGMENT.test(segment)) || !contentType) {
    return new Response("Bad Request", { status: 400 })
  }
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
        headers: {
          "Cache-Control": CACHE_CONTROL,
          "Content-Type": contentType,
        },
      })
    } catch (e) {
      console.error("Image proxy fetch failed:", e)
      return new Response("Bad Gateway", { status: 502 })
    }
  }

  try {
    const filePath = join(process.cwd(), "content", "images", imagePath)
    const data = await readFile(filePath)
    return new Response(data, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "Content-Type": contentType,
      },
    })
  } catch {
    return new Response("Not Found", { status: 404 })
  }
}
