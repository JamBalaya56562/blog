import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import { useMDXComponents } from "@/mdx-components"

afterEach(cleanup)

type Heading = React.ComponentType<{ children?: React.ReactNode }>

/**
 * The server renders more than one post at a time: a reader's page and the
 * prefetches for the links on it, or two readers at once. Each render calls
 * `useMDXComponents()` for its own component map, and the heading ids of
 * one render must not depend on what another render is doing. When the
 * duplicate counter was a module variable, the second render's "Installing"
 * came out as `installing-1` and the table of contents, which numbers its
 * own ids, pointed at an anchor that was not there.
 *
 * Two maps are taken and their headings rendered interleaved, the way two
 * concurrent renders interleave on the server.
 */
describe("heading ids across concurrent renders", () => {
  test("each component map numbers its own duplicates only", () => {
    const first = useMDXComponents()
    const second = useMDXComponents()
    const A = first.h2 as Heading
    const B = second.h2 as Heading

    const { container } = render(
      <>
        <A>Installing</A>
        <B>Installing</B>
        <A>Installing</A>
        <B>Trying it out</B>
      </>,
    )
    const ids = Array.from(container.querySelectorAll("h2")).map((h) => h.id)
    expect(ids).toEqual([
      "installing",
      "installing",
      "installing-1",
      "trying-it-out",
    ])
  })

  test("h2 and h3 in one render share one counter", () => {
    const map = useMDXComponents()
    const H2 = map.h2 as Heading
    const H3 = map.h3 as Heading
    const { container } = render(
      <>
        <H2>Setup</H2>
        <H3>Setup</H3>
      </>,
    )
    const ids = Array.from(container.querySelectorAll("h2, h3")).map(
      (h) => h.id,
    )
    expect(ids).toEqual(["setup", "setup-1"])
  })
})
