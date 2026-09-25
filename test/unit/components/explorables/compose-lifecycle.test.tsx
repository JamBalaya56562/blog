import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { ComposeLifecycle } from "@/components/explorables/compose-lifecycle"

afterEach(cleanup)

function renderFigure() {
  return render(
    <ComposeLifecycle
      caption="down keeps the data; down -v does not"
      commands={{
        down: "down",
        downVolumes: "down -v",
        start: "start",
        stop: "stop",
        up: "up -d",
      }}
      containers={{ app: "emdash-emdash-1", db: "emdash-db-1" }}
      external="emdash-uploads"
      hint="Press a command"
      image="emdash-emdash"
      labels={{
        absent: "gone",
        empty: "empty",
        externalTag: "external",
        image: "image",
        network: "network",
        running: "Up",
        stopped: "Exited",
        volume: "volume",
      }}
      network="emdash_default"
      prefix="docker compose"
      status={{
        created: "created, {volume} ready",
        createdVolume: "created a new, empty {volume}",
        down: "down: {item} is still in {volume}",
        downVolumes: "down -v: {volume} is gone",
        initial: "up, with {item} in {volume}",
        noop: "already up",
        resumed: "resumed",
        started: "started",
        stopped: "stopped",
        volumeOnly: "only {volume} removed",
      }}
      title="compose.yaml"
      volume={{ item: "Hello from PostgreSQL", name: "emdash_pgdata" }}
    />,
  )
}

/** The row whose name is exactly this; `emdash-emdash` is also a prefix. */
const row = (container: HTMLElement, name: string) =>
  [...container.querySelectorAll<HTMLElement>(".pp-explorable-row")].find(
    (li) =>
      li.querySelector(".pp-explorable-cmdtext")?.firstChild?.textContent ===
      name,
  ) as HTMLElement

const button = (container: HTMLElement, label: string) =>
  [...container.querySelectorAll<HTMLButtonElement>(".pp-explorable-cmd")].find(
    (b) => b.textContent === label,
  ) as HTMLButtonElement

/** The live transcript is the first pane; the second only holds the room. */
const transcript = (container: HTMLElement) =>
  [
    ...container.querySelectorAll(
      '.pp-explorable-pane[data-active="true"] .pp-explorable-line',
    ),
  ].map((line) => line.textContent)

describe("ComposeLifecycle", () => {
  test("serves the stack up, with the post in the volume", () => {
    const { container } = renderFigure()
    expect(row(container, "emdash-db-1").dataset.resource).toBe("present")
    expect(row(container, "emdash_pgdata").textContent).toContain(
      "Hello from PostgreSQL",
    )
    expect(row(container, "emdash-uploads").textContent).toContain("external")
    expect(button(container, "start").disabled).toBe(true)
    expect(transcript(container)[0]).toBe("docker compose up -d")
    expect(transcript(container)).not.toContain("Volume emdash_pgdata Created")
    expect(container.querySelector(".pp-explorable-reset")).toHaveProperty(
      "disabled",
      true,
    )
  })

  test("down takes the containers and the network, not the data", () => {
    const { container } = renderFigure()
    fireEvent.click(button(container, "down"))
    expect(row(container, "emdash-emdash-1").dataset.resource).toBe("absent")
    expect(row(container, "emdash_default").dataset.resource).toBe("absent")
    expect(row(container, "emdash_pgdata").textContent).toContain(
      "Hello from PostgreSQL",
    )
    expect(transcript(container)[0]).toBe("docker compose down")
    expect(transcript(container).at(-1)).toBe("Network emdash_default Removed")
    expect(button(container, "down").disabled).toBe(true)
  })

  test("down -v takes the data too, and up brings back an empty volume", () => {
    const { container, getByText } = renderFigure()
    fireEvent.click(button(container, "down -v"))
    expect(row(container, "emdash_pgdata").dataset.resource).toBe("absent")
    expect(row(container, "emdash-uploads").dataset.resource).toBe("present")
    expect(row(container, "emdash-emdash").dataset.resource).toBe("present")
    getByText("down -v: emdash_pgdata is gone", {
      selector: ".pp-explorable-status",
    })

    fireEvent.click(button(container, "up -d"))
    expect(row(container, "emdash_pgdata").textContent).toContain("empty")
    expect(transcript(container)).toContain("Volume emdash_pgdata Created")
  })

  test("stop leaves everything but pauses the containers", () => {
    const { container } = renderFigure()
    fireEvent.click(button(container, "stop"))
    expect(row(container, "emdash-db-1").dataset.resource).toBe("stopped")
    expect(row(container, "emdash_default").dataset.resource).toBe("present")
    expect(button(container, "start").disabled).toBe(false)
    expect(button(container, "stop").disabled).toBe(true)
  })

  test("reset returns to the served picture", () => {
    const { container } = renderFigure()
    fireEvent.click(button(container, "down -v"))
    const reset = container.querySelector(
      ".pp-explorable-reset",
    ) as HTMLButtonElement
    fireEvent.click(reset)
    expect(row(container, "emdash_pgdata").textContent).toContain(
      "Hello from PostgreSQL",
    )
    expect(reset.disabled).toBe(true)
  })
})
