import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { ContainerLifecycle } from "@/components/explorables/container-lifecycle"

afterEach(cleanup)

function renderFigure(initial: "plain" | "volume" = "volume") {
  return render(
    <ContainerLifecycle
      caption="Containers are disposable; data lives in volumes"
      commands={{
        rm: "docker rm -f db",
        run: "docker run -d --name db",
        runVolume: "docker run -d -v pgdata:/var/lib/postgresql",
        start: "docker start db",
        stop: "docker stop db",
        volumeRm: "docker volume rm pgdata",
        write: "docker exec db psql -c INSERT",
      }}
      hint="Press a command"
      image={{
        layers: ["alpine", "postgres", "initdb"],
        name: "postgres:18-alpine",
      }}
      initial={initial}
      labels={{
        container: "container db",
        image: "image (read-only)",
        none: "no container",
        running: "Up",
        stopped: "Exited (0)",
        volume: "volume",
        writable: "writable layer",
      }}
      status={{
        initialPlain: "db is running with nothing mounted",
        initialVolume: "db is running with {volume} mounted",
        ran: "started without a volume",
        ranVolume: "started with {volume}",
        removed: "the writable layer is gone",
        removedKept: "the container is gone; {volume} still holds its rows",
        started: "running again",
        stopped: "stopped, and everything is still here",
        volumeInUse: "{volume} is in use by db",
        volumeRemoved: "{volume} is gone",
        wrote: "wrote {item} into the writable layer",
        wroteVolume: "wrote {item} into {volume}",
      }}
      title="postgres:18-alpine"
      volume={{ name: "pgdata", path: "/var/lib/postgresql" }}
      write={{ item: "notes" }}
    />,
  )
}

const items = (container: HTMLElement, selector: string) =>
  [...container.querySelectorAll(`${selector} .pp-explorable-item`)].map(
    (item) => item.textContent,
  )

const layer = (container: HTMLElement) => items(container, ".pp-explorable-box")
const volume = (container: HTMLElement) =>
  items(container, ".pp-explorable-volume")

const press = (container: HTMLElement, text: string) => {
  const button = [
    ...container.querySelectorAll<HTMLButtonElement>(".pp-explorable-cmd"),
  ].find((b) => b.textContent === text)
  if (!button) {
    throw new Error(`no button for ${text}`)
  }
  fireEvent.click(button)
  return button
}

const button = (container: HTMLElement, text: string) =>
  [...container.querySelectorAll<HTMLButtonElement>(".pp-explorable-cmd")].find(
    (b) => b.textContent === text,
  ) as HTMLButtonElement

describe("ContainerLifecycle", () => {
  /** The served markup is the picture each instance replaces. */
  test("renders the volume instance as served", () => {
    const { container, getByText } = renderFigure("volume")

    expect(volume(container)).toEqual(["notes"])
    expect(layer(container)).toEqual(["—"])
    expect(getByText("db is running with pgdata mounted")).toBeDefined()
    expect(
      container.querySelector(".pp-explorable-link")?.getAttribute("data-on"),
    ).toBe("true")
  })

  test("renders the plain instance as served", () => {
    const { container, getByText } = renderFigure("plain")

    expect(layer(container)).toEqual(["notes"])
    expect(volume(container)).toEqual(["—"])
    expect(getByText("db is running with nothing mounted")).toBeDefined()
  })

  /** "docker stop はプロセスを止めるだけで、書き込み層もボリュームも残り". */
  test("stop keeps everything and start picks it up again", () => {
    const { container, getByText } = renderFigure("plain")

    press(container, "docker stop db")
    expect(layer(container)).toEqual(["notes"])
    expect(getByText("stopped, and everything is still here")).toBeDefined()

    press(container, "docker start db")
    expect(layer(container)).toEqual(["notes"])
    expect(getByText("running again")).toBeDefined()
  })

  /** "コンテナを消すと、書いたものも消える" — and nothing else does. */
  test("rm takes the writable layer and leaves the volume", () => {
    const { container, getByText } = renderFigure("volume")

    press(container, "docker rm -f db")

    expect(layer(container)).toEqual(["—"])
    expect(volume(container)).toEqual(["notes"])
    expect(
      getByText("the container is gone; pgdata still holds its rows"),
    ).toBeDefined()
  })

  /**
   * The same write command, two destinations: the mount is what decides,
   * which is the whole of "コンテナは使い捨て、データはボリューム".
   */
  test("a write without a volume does not survive the container", () => {
    const { container, getByText } = renderFigure("plain")

    press(container, "docker rm -f db")
    press(container, "docker run -d --name db")
    press(container, "docker exec db psql -c INSERT")
    expect(layer(container)).toEqual(["notes"])
    expect(getByText("wrote notes into the writable layer")).toBeDefined()

    press(container, "docker rm -f db")
    press(container, "docker run -d --name db")
    expect(layer(container)).toEqual(["—"])
  })

  test("a write with a volume outlives every container", () => {
    const { container, getByText } = renderFigure("plain")

    press(container, "docker rm -f db")
    press(container, "docker run -d -v pgdata:/var/lib/postgresql")
    press(container, "docker exec db psql -c INSERT")
    expect(getByText("wrote notes into pgdata")).toBeDefined()

    press(container, "docker rm -f db")
    press(container, "docker run -d -v pgdata:/var/lib/postgresql")
    expect(volume(container)).toEqual(["notes"])
    expect(layer(container)).toEqual(["—"])
  })

  /**
   * "使っているものは消せない". The button stays pressable on purpose: the
   * refusal is what the reader came to see.
   */
  test("removing a volume in use is refused, not disabled", () => {
    const { container, getByText } = renderFigure("volume")
    const remove = button(container, "docker volume rm pgdata")
    expect(remove.disabled).toBe(false)

    fireEvent.click(remove)
    expect(volume(container)).toEqual(["notes"])
    expect(getByText("pgdata is in use by db")).toBeDefined()

    press(container, "docker rm -f db")
    fireEvent.click(remove)
    expect(getByText("pgdata is gone")).toBeDefined()
  })

  test("a command that cannot act is disabled", () => {
    const { container } = renderFigure("volume")

    expect(button(container, "docker start db").disabled).toBe(true)
    expect(button(container, "docker run -d --name db").disabled).toBe(true)

    press(container, "docker rm -f db")
    expect(button(container, "docker exec db psql -c INSERT").disabled).toBe(
      true,
    )
    expect(button(container, "docker run -d --name db").disabled).toBe(false)
  })

  test("reset returns to the served state", () => {
    const { container, getByRole } = renderFigure("volume")
    const reset = getByRole("button", { name: "Reset" }) as HTMLButtonElement
    expect(reset.disabled).toBe(true)

    press(container, "docker rm -f db")
    expect(reset.disabled).toBe(false)

    fireEvent.click(reset)
    expect(volume(container)).toEqual(["notes"])
    expect(layer(container)).toEqual(["—"])
    expect(reset.disabled).toBe(true)
  })

  test("throws on an image with no layers", () => {
    expect(() =>
      render(
        <ContainerLifecycle
          commands={{
            rm: "rm",
            run: "run",
            runVolume: "runVolume",
            start: "start",
            stop: "stop",
            volumeRm: "volumeRm",
            write: "write",
          }}
          image={{ layers: [], name: "x" }}
          initial="plain"
          labels={{
            container: "c",
            image: "i",
            none: "n",
            running: "r",
            stopped: "s",
            volume: "v",
            writable: "w",
          }}
          status={{
            initialPlain: "p",
            initialVolume: "v",
            ran: "ran",
            ranVolume: "ranVolume",
            removed: "removed",
            removedKept: "removedKept",
            started: "started",
            stopped: "stopped",
            volumeInUse: "inUse",
            volumeRemoved: "volumeRemoved",
            wrote: "wrote",
            wroteVolume: "wroteVolume",
          }}
          title="t"
          volume={{ name: "v", path: "/p" }}
          write={{ item: "i" }}
        />,
      ),
    ).toThrow("no image layers")
  })
})
