const { mkdirSync, symlinkSync } = require("node:fs")

// Create /tmp/cache and symlink .next/cache to it.
// Lambda containers have a read-only filesystem except for /tmp.
// Next.js image optimization writes to .next/cache/images/, so without
// this symlink, optimized images fail to load on the first request.
try {
  mkdirSync("/tmp/cache", { recursive: true })
  symlinkSync("/tmp/cache", ".next/cache")
} catch {
  // Ignore EEXIST (warm container reuse) and EACCES (read-only .next/)
}
