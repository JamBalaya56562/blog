import { afterEach, describe, expect, mock, test } from "bun:test"
import { act, cleanup, fireEvent, render } from "@testing-library/react"
import { nextNavigationMock } from "../setup-next-navigation-mock"

const pathnameMock = { value: "/en/blog/post" }
mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  usePathname: () => pathnameMock.value,
}))

const { CopyButton } = await import("@/components/copy-button")

const written: string[] = []

function withClipboard(present: boolean) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: present
      ? {
          writeText: async (text: string) => {
            written.push(text)
          },
        }
      : undefined,
  })
}

function renderBlock() {
  return render(
    <div className="pp-copy-wrap">
      <CopyButton />
      <pre>
        <code>mise run dev</code>
      </pre>
    </div>,
  )
}

afterEach(() => {
  cleanup()
  written.length = 0
  pathnameMock.value = "/en/blog/post"
})

describe("CopyButton", () => {
  test("renders nothing where the Clipboard API is missing", () => {
    withClipboard(false)
    const { container } = renderBlock()
    expect(container.querySelector("button")).toBeNull()
  })

  test("copies the text of the pre beside it and reports it briefly", async () => {
    withClipboard(true)
    const { container } = renderBlock()
    const button = container.querySelector("button")
    if (!button) {
      throw new Error("no button rendered")
    }
    expect(button.getAttribute("aria-label")).toBe("Copy code")

    await act(async () => {
      fireEvent.click(button)
      await Promise.resolve()
    })
    expect(written).toEqual(["mise run dev"])
    expect(button.dataset.copied).toBe("true")
    expect(button.getAttribute("aria-label")).toBe("Copied")

    await act(() => new Promise((resolve) => setTimeout(resolve, 1700)))
    expect(button.dataset.copied).toBeUndefined()
  })

  // The MDX component map has no locale to hand down, so the label follows
  // the locale in the URL.
  test("the label follows the locale in the pathname", () => {
    withClipboard(true)
    pathnameMock.value = "/ja/blog/post"
    const { container } = renderBlock()
    expect(container.querySelector("button")?.getAttribute("aria-label")).toBe(
      "コードをコピー",
    )
  })
})
