import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"
import type { ReactNode } from "react"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { ThemeProvider } from "@/lib/theme/theme-provider"
// Mock next/navigation before importing Header (which imports LocaleSwitchLink)
import { nextNavigationMock } from "../setup-next-navigation-mock"
import { localStorageStub, matchMediaStub, stubGlobals } from "../stub-global"

mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  usePathname: () => "/en",
}))

// Mock next/image to avoid URL resolution errors in Happy DOM. The mock keeps
// `width` and `height` on the element, which is what this file asserts on.
mock.module("next/image", () => ({
  default: ({
    priority: _priority,
    alt = "",
    ...props
  }: Record<string, unknown>) => <img alt={alt as string} {...props} />,
}))

const { Header } = await import("@/components/header")
const { Footer } = await import("@/components/footer")

const logo = await Bun.file("public/logo.svg").text()
const svgSize = logo.match(/<svg[^>]*?width="(\d+)"[^>]*?height="(\d+)"/)
const intrinsicWidth = Number(svgSize?.[1])
const intrinsicHeight = Number(svgSize?.[2])

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <ThemeProvider>{children}</ThemeProvider>
}

let restore = () => {}

afterEach(() => {
  restore()
})

beforeEach(() => {
  restore = stubGlobals({
    localStorage: localStorageStub(() => ({})),
    matchMedia: matchMediaStub(),
  })
})

/**
 * Tailwind's preflight declares `height: auto` on every image, so the `height`
 * prop given to a logo never reaches the layout — the browser derives the
 * height from the rendered width and the file's own aspect ratio. State a pair
 * that the SVG does not have and the two disagree at runtime: next/image
 * compares each attribute against what the element actually measures and warns
 * that "width or height [was] modified, but not the other". The footer shipped
 * 140x18 against a 166x20 file, which renders 17px tall.
 *
 * The assertion derives the expected height from `public/logo.svg` rather than
 * hardcoding it, so redrawing the logo at a new ratio fails here instead of in
 * a browser console.
 */
describe("Logo dimensions", () => {
  const dictionary = getDictionary("en")

  for (const [name, element] of [
    ["Header", <Header dictionary={dictionary} key="header" locale="en" />],
    ["Footer", <Footer dictionary={dictionary} key="footer" locale="en" />],
  ] as const) {
    test(`${name} states the logo at its intrinsic aspect ratio`, () => {
      const { container } = render(element, { wrapper })
      const image = container.querySelector('img[src="/logo.svg"]')

      expect(image).not.toBeNull()
      const width = Number(image?.getAttribute("width"))
      const height = Number(image?.getAttribute("height"))
      expect(width).toBeGreaterThan(0)
      expect(height).toBeGreaterThan(0)
      // What the browser will lay out, given `height: auto`.
      expect(Math.round((width * intrinsicHeight) / intrinsicWidth)).toBe(
        height,
      )
    })
  }
})
