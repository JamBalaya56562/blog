import { afterEach, describe, expect, mock, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { nextNavigationMock } from "../../setup-next-navigation-mock"

const pathnameMock = { value: "/en/blog/post" }
mock.module("next/navigation", () => ({
  ...nextNavigationMock,
  usePathname: () => pathnameMock.value,
}))

const { Explorable } = await import("@/components/explorables/explorable")

afterEach(() => {
  cleanup()
  pathnameMock.value = "/en/blog/post"
})

function renderFrame(props: { pristine?: boolean; onReset?: () => void } = {}) {
  return render(
    <Explorable
      caption="The takeaway"
      hint="Click something"
      onReset={props.onReset ?? (() => {})}
      pristine={props.pristine ?? true}
      status="Nothing changed yet"
      title="Dockerfile"
    >
      <button type="button">a step</button>
    </Explorable>,
  )
}

describe("Explorable", () => {
  /**
   * The figure is one landmark for assistive tech, named after its subject, so
   * a reader tabbing through the article hears what the buttons inside belong
   * to before reaching them.
   */
  test("is a figure named by its title, with the hint and caption in place", () => {
    const { getByRole, getByText } = renderFrame()

    const figure = getByRole("figure", { name: "Dockerfile" })
    expect(figure.className).toBe("pp-explorable")
    expect(getByText("Click something").className).toBe("pp-explorable-hint")
    expect(getByText("The takeaway").tagName).toBe("FIGCAPTION")
  })

  /**
   * The status line is what a screen reader hears when a press changes the
   * model: polite, so it waits for the reader to finish, and atomic, so the
   * whole sentence is read rather than the word that changed.
   */
  test("announces the status through a polite live region", () => {
    const { getByText } = renderFrame()

    const status = getByText("Nothing changed yet")
    expect(status.getAttribute("aria-live")).toBe("polite")
    expect(status.getAttribute("aria-atomic")).toBe("true")
  })

  test("disables reset while the figure is in its served state", () => {
    const { getByRole } = renderFrame({ pristine: true })

    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(true)
  })

  /**
   * Resetting disables the button under the pointer, which would drop focus
   * to the document; the figure takes it instead so a keyboard user stays in
   * the article where they were.
   */
  test("calls onReset and moves focus to the figure", () => {
    let calls = 0
    const { getByRole } = renderFrame({
      onReset: () => {
        calls++
      },
      pristine: false,
    })

    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(false)
    fireEvent.click(reset)

    expect(calls).toBe(1)
    expect(document.activeElement).toBe(getByRole("figure"))
  })

  /**
   * The strip's kind word and the reset label are the frame's own text, so
   * they are the only words not written in the post itself; both follow the
   * locale in the URL.
   */
  test("labels the strip and the reset button in the locale of the URL", () => {
    pathnameMock.value = "/ja/blog/post"
    const { container, getByRole } = renderFrame()

    expect(getByRole("button", { name: "最初に戻す" })).toBeDefined()
    expect(container.querySelector(".pp-explorable-kind")?.textContent).toBe(
      "動かしてみよう",
    )
  })
})
