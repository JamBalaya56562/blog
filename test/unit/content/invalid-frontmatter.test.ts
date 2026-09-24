import { afterAll, afterEach, describe, expect, mock, test } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { GitHubContentLoader } from "@/lib/content/github-loader"
import { LocalContentLoader } from "@/lib/content/local-loader"

/**
 * A post whose frontmatter did not validate was caught as if it were missing:
 * `getPost` returned null, `getAllPosts` dropped it, and the build passed with
 * the post gone from every list and its page never generated. A missing file
 * is still a null; a file that is there and wrong now throws, naming itself.
 */

const VALID = `---
title: Fine
date: "2026-01-01"
description: A post that parses.
tags: [ok]
---

Body.
`

// `tags` is a string, not a list: the kind of slip that used to vanish.
const INVALID = `---
title: Broken
date: "2026-01-02"
description: A post that does not.
tags: oops
---

Body.
`

const root = mkdtempSync(join(tmpdir(), "blog-frontmatter-"))
mkdirSync(join(root, "en"))
writeFileSync(join(root, "en", "fine.mdx"), VALID)
writeFileSync(join(root, "en", "broken.mdx"), INVALID)
// The loader resolves its base path against the working directory.
const loader = new LocalContentLoader(relative(process.cwd(), root))

afterAll(() => {
  rmSync(root, { force: true, recursive: true })
})

describe("LocalContentLoader with a post that does not validate", () => {
  test("getPost throws, naming the file and the field", async () => {
    const error = await loader.getPost("en", "broken").catch((e) => e)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain("broken.mdx")
    expect(error.message).toContain("tags must be an array of strings")
  })

  test("getAllPosts fails rather than listing the rest", async () => {
    await expect(loader.getAllPosts("en")).rejects.toThrow("broken.mdx")
  })

  test("a file that is not there is still a null", async () => {
    expect(await loader.getPost("en", "no-such-post")).toBeNull()
  })

  test("a valid post still loads", async () => {
    const post = await loader.getPost("en", "fine")
    expect(post?.frontmatter.title).toBe("Fine")
  })
})

describe("GitHubContentLoader with a post that does not validate", () => {
  const realFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = realFetch
  })

  function serve(status: number, body: string) {
    globalThis.fetch = mock(
      async () => new Response(body, { status }),
    ) as unknown as typeof fetch
  }

  test("getPost throws, naming the URL", async () => {
    serve(200, INVALID)
    const error = await new GitHubContentLoader()
      .getPost("en", "broken")
      .catch((e) => e)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain("/posts/en/broken.mdx")
  })

  test("a post GitHub does not have is still a null", async () => {
    serve(404, "404: Not Found")
    const spy = mock(() => {})
    const original = console.error
    console.error = spy
    try {
      expect(await new GitHubContentLoader().getPost("en", "gone")).toBeNull()
    } finally {
      console.error = original
    }
  })
})
