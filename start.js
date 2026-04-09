const { mkdirSync, symlinkSync } = require("node:fs")

// Create /tmp/cache and symlink .next/cache to it.
// Lambda containers have a read-only filesystem except for /tmp.
// Next.js image optimization writes to .next/cache/images/, so without
// this symlink, optimized images fail to load on the first request.
mkdirSync("/tmp/cache", { recursive: true })
try {
  symlinkSync("/tmp/cache", ".next/cache")
} catch (e) {
  if (e.code === "EEXIST" || e.code === "EACCES") {
    // EEXIST: warm Lambda container reuse (symlink already exists)
    // EACCES: .next/ directory is read-only
  } else {
    throw e
  }
}
