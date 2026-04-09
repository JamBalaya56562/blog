import { mock } from "bun:test"

// Preload mock for next/navigation to resolve ESM export issues in Bun.
// next/navigation's CJS entry point may not expose all named exports that
// ESM consumers expect, causing "Export named '...' not found" errors.
//
// IMPORTANT: Individual test files that override this mock MUST spread
// `nextNavigationMock` to preserve all exports. Bun's mock.module()
// replaces the entire module, and partial overrides leak across test files
// on Bun canary (Linux CI), causing "Export named '...' not found" errors.
// See: https://github.com/oven-sh/bun/issues/12823
export const nextNavigationMock = {
  redirect: () => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/en",
    })
  },
  permanentRedirect: () => {},
  usePathname: () => "/en",
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
  forbidden: () => {
    throw new Error("NEXT_FORBIDDEN")
  },
  unauthorized: () => {
    throw new Error("NEXT_UNAUTHORIZED")
  },
  RedirectType: { push: "push", replace: "replace" },
}

mock.module("next/navigation", () => nextNavigationMock)
