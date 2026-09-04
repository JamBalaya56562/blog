import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import { PageTransition } from "@/components/page-transition"

/**
 * `PageTransition` is the one place that decides how a navigation direction
 * maps onto a `view-transition-class`, so the properties asserted here are
 * the ones whose drift would silently stop the directional slide.
 *
 * The component is called directly rather than rendered for these: it is a
 * plain function returning a single element, so its props are readable
 * without standing in for `ViewTransition` — which `setup-react-mock.ts`
 * patches to drop every prop, and which is module-cached by the time this
 * file runs anyway.
 */
function transitionProps() {
  const element = PageTransition({ children: null }) as {
    props: Record<string, unknown>
  }
  return element.props
}

afterEach(cleanup)

describe("PageTransition", () => {
  test("maps both navigation directions onto view-transition classes", () => {
    expect(transitionProps().enter).toEqual({
      default: "none",
      "nav-back": "nav-back",
      "nav-forward": "nav-forward",
    })
  })

  test("enters and exits through the same classes", () => {
    // Asymmetry means one half of a navigation animates and the other does
    // not — a slide that plays on arrival but not on departure, or vice versa.
    const props = transitionProps()
    expect(props.exit).toEqual(props.enter as Record<string, string>)
  })

  test("leaves untyped navigations alone", () => {
    // Browser back/forward, `router.refresh()` and Suspense reveals carry no
    // transition type; without this they would slide in whichever direction
    // happened to be first.
    expect(transitionProps().default).toBe("none")
  })

  test("takes no name, so the two pages stay an exit/enter pair", () => {
    // Naming both sides the same makes React pair them into a `share` morph
    // instead, and the directional slide silently stops.
    expect(transitionProps().name).toBeUndefined()
  })

  test("renders its children", () => {
    const { container } = render(
      <PageTransition>
        <p>page body</p>
      </PageTransition>,
    )
    expect(container.textContent).toContain("page body")
  })
})
