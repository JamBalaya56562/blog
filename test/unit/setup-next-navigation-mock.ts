import { mock } from "bun:test"

// The real hooks need a mounted App Router: outside one, usePathname returns
// null and useRouter throws. A file that overrides this mock spreads
// `nextNavigationMock`, since mock.module replaces the whole module and,
// without `--isolate`, a partial override takes the other exports away from
// later files.
export const nextNavigationMock = {
  forbidden: () => {
    throw new Error("NEXT_FORBIDDEN")
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
  permanentRedirect: () => {},
  RedirectType: { push: "push", replace: "replace" },
  redirect: () => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/en",
    })
  },
  unauthorized: () => {
    throw new Error("NEXT_UNAUTHORIZED")
  },
  useParams: () => ({}),
  usePathname: () => "/en",
  useRouter: () => ({
    back: () => {},
    forward: () => {},
    prefetch: () => {},
    push: () => {},
    refresh: () => {},
    replace: () => {},
  }),
  useSearchParams: () => new URLSearchParams(),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
}

mock.module("next/navigation", () => nextNavigationMock)
