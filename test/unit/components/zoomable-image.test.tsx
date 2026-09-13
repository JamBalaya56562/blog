import { afterEach, describe, expect, mock, test } from "bun:test"
import { act, cleanup, fireEvent, render } from "@testing-library/react"
import { nextNavigationMock } from "../setup-next-navigation-mock"

const pathnameMock = { value: "/en/blog/post" }
mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  usePathname: () => pathnameMock.value,
}))

const { ZoomableImage } = await import("@/components/zoomable-image")

afterEach(() => {
  cleanup()
  pathnameMock.value = "/en/blog/post"
})

function renderImage() {
  return render(
    <ZoomableImage
      src="/api/images/figure.svg"
      alt="A figure"
      className="max-w-full"
    />,
  )
}

// The dialog is rendered into `body` through a portal, and only while open.
const dialog = () => document.body.querySelector("dialog.pp-lightbox")
const open = (container: HTMLElement) =>
  act(() => {
    fireEvent.click(container.querySelector("button.pp-zoom") as HTMLElement)
  })

describe("ZoomableImage", () => {
  test("shows the picture in a button and nothing else until clicked", () => {
    const { container } = renderImage()
    const button = container.querySelector("button.pp-zoom")
    expect(button?.querySelector("img")?.getAttribute("alt")).toBe("A figure")
    expect(button?.getAttribute("title")).toBe("Open at full size")
    expect(dialog()).toBeNull()
  })

  test("opens on click and closes from the close button", () => {
    const { container } = renderImage()
    open(container)
    const d = dialog() as HTMLDialogElement
    expect(d).not.toBeNull()
    expect(d.open).toBe(true)
    expect(d.querySelector("img")?.getAttribute("src")).toBe(
      "/api/images/figure.svg",
    )
    act(() => {
      fireEvent.click(d.querySelector(".pp-lightbox-close") as HTMLElement)
    })
    // `close()` fires the close event, which unmounts the dialog.
    expect(dialog()).toBeNull()
  })

  // The backdrop is the dialog element itself, sized to the viewport; a click
  // on the picture must not close it, so a reader can pinch-zoom on a phone.
  test("a click on the backdrop closes it, a click on the picture does not", () => {
    const { container } = renderImage()
    open(container)
    const d = dialog() as HTMLDialogElement
    act(() => {
      fireEvent.click(d.querySelector(".pp-lightbox-img") as HTMLElement)
    })
    expect(d.open).toBe(true)
    act(() => {
      fireEvent.click(d)
    })
    expect(dialog()).toBeNull()
  })

  // Escape is handled by the element itself: it fires `close`, and the
  // component listens for that to unmount.
  test("the dialog's close event, which Escape raises, unmounts it", () => {
    const { container } = renderImage()
    open(container)
    const d = dialog() as HTMLDialogElement
    act(() => {
      fireEvent(d, new Event("close"))
    })
    expect(dialog()).toBeNull()
  })

  test("the labels follow the locale in the pathname", () => {
    pathnameMock.value = "/ja/blog/post"
    const { container } = renderImage()
    expect(
      container.querySelector("button.pp-zoom")?.getAttribute("title"),
    ).toBe("拡大して表示")
    open(container)
    expect(
      dialog()?.querySelector(".pp-lightbox-close")?.getAttribute("aria-label"),
    ).toBe("閉じる")
  })
})
