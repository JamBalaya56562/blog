import { afterEach, describe, expect, test } from "bun:test"
import { GitHubContentLoader } from "@/lib/content/github-loader"
import { createContentLoader } from "@/lib/content/loader"
import { LocalContentLoader } from "@/lib/content/local-loader"

type EnvKey = "CONTENT_SOURCE" | "NEXT_PHASE"

const saved: Record<EnvKey, string | undefined> = {
  CONTENT_SOURCE: process.env.CONTENT_SOURCE,
  NEXT_PHASE: process.env.NEXT_PHASE,
}

function setEnv(key: EnvKey, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
    return
  }
  process.env[key] = value
}

afterEach(() => {
  setEnv("CONTENT_SOURCE", saved.CONTENT_SOURCE)
  setEnv("NEXT_PHASE", saved.NEXT_PHASE)
})

describe("createContentLoader", () => {
  test("defaults to the local filesystem", () => {
    setEnv("CONTENT_SOURCE", undefined)
    setEnv("NEXT_PHASE", undefined)
    expect(createContentLoader()).toBeInstanceOf(LocalContentLoader)
  })

  test("an explicit local source picks the local loader", () => {
    setEnv("CONTENT_SOURCE", "local")
    setEnv("NEXT_PHASE", undefined)
    expect(createContentLoader()).toBeInstanceOf(LocalContentLoader)
  })

  test("a github source picks the GitHub loader at runtime", () => {
    setEnv("CONTENT_SOURCE", "github")
    setEnv("NEXT_PHASE", undefined)
    expect(createContentLoader()).toBeInstanceOf(GitHubContentLoader)
  })

  // The Docker/Lambda image builds with CONTENT_SOURCE=github, and reading the
  // post list over the unauthenticated GitHub API from a shared CI address hits
  // the 60 req/h limit. A 403 there returns an empty list, which fails the build
  // under Cache Components rather than degrading. The posts are in the image, so
  // the build phase reads them from disk instead.
  test("the build phase reads from disk even when the source is github", () => {
    setEnv("CONTENT_SOURCE", "github")
    setEnv("NEXT_PHASE", "phase-production-build")
    expect(createContentLoader()).toBeInstanceOf(LocalContentLoader)
  })

  test("only the production build phase overrides the source", () => {
    setEnv("CONTENT_SOURCE", "github")
    setEnv("NEXT_PHASE", "phase-development-server")
    expect(createContentLoader()).toBeInstanceOf(GitHubContentLoader)
  })

  test("an unrecognised source falls back to local rather than throwing", () => {
    setEnv("CONTENT_SOURCE", "s3")
    setEnv("NEXT_PHASE", undefined)
    expect(createContentLoader()).toBeInstanceOf(LocalContentLoader)
  })

  test("every loader it returns satisfies the ContentLoader contract", () => {
    for (const source of ["local", "github"]) {
      setEnv("CONTENT_SOURCE", source)
      setEnv("NEXT_PHASE", undefined)
      const loader = createContentLoader()
      expect(typeof loader.getPostSlugs).toBe("function")
      expect(typeof loader.getPost).toBe("function")
      expect(typeof loader.getAllPosts).toBe("function")
    }
  })
})
