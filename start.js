const { mkdirSync, symlinkSync } = require("node:fs")

// Create /tmp/cache and symlink .next/cache to it.
// Lambda containers have a read-only filesystem except for /tmp.
// Next.js image optimization writes to .next/cache/images/, so without
// this symlink, optimized images fail to load on the first request.
mkdirSync("/tmp/cache", { recursive: true })
try {
  symlinkSync("/tmp/cache", ".next/cache")
} catch (e) {
  // Symlink may already exist on warm Lambda container reuse
  if (e.code !== "EEXIST") {
    throw e
  }
}

require("./server.js")
