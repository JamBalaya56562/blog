import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, fireEvent, render } from "@testing-library/react"
import { ContainerLifecycle } from "@/components/explorables/container-lifecycle"

afterEach(cleanup)

function renderFigure(initial: "plain" | "volume" = "volume", echo = false) {
  return render(
    <ContainerLifecycle
      caption="Containers are disposable; data lives in volumes"
      echo={
        echo
          ? {
              rm: "docker rm -f db",
              run: "docker run -d --name db postgres:18-alpine",
              runVolume:
                "docker run -d -v pgdata:/var/lib/postgresql postgres:18-alpine",
              start: "docker start db",
              stop: "docker stop db",
              volumeRm: "docker volume rm pgdata",
              write: 'docker exec db psql -c "INSERT INTO notes …"',
            }
          : undefined
      }
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
        groups: {
          create: "start",
          destroy: "remove",
          pause: "pause",
          write: "write",
        },
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
        removedKept: "the container is gone; {volume} is still here",
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

/** The nginx instance: no volume, short buttons, and a line printing them. */
function renderPlain() {
  return render(
    <ContainerLifecycle
      commands={{
        rm: "docker rm -f web",
        run: "docker run -d --name web",
        start: "docker start web",
        stop: "docker stop web",
        write: "docker cp index.html web:/...",
      }}
      echo={{
        rm: "docker rm -f web",
        run: "docker run -d --name web -p 8080:80 nginx:1.29-alpine",
        start: "docker start web",
        stop: "docker stop web",
        write: "docker cp site/index.html web:/usr/share/nginx/html/index.html",
      }}
      image={{ layers: ["alpine", "nginx"], name: "nginx:1.29-alpine" }}
      initial="plain"
      labels={{
        container: "container web",
        groups: {
          create: "start",
          destroy: "remove",
          pause: "pause",
          write: "write",
        },
        image: "image (read-only)",
        none: "removed",
        running: "Up",
        stopped: "Exited (0)",
        writable: "writable layer",
      }}
      short={{
        rm: "rm -f",
        run: "run -d",
        start: "start",
        stop: "stop",
        write: "cp index.html",
      }}
      status={{
        initialPlain: "web is running with {item} in its layer",
        ran: "started again with an empty layer",
        removed: "gone, writable layer and all",
        started: "running again",
        stopped: "only stopped",
        wrote: "wrote {item} into the writable layer",
      }}
      title="nginx:1.29-alpine"
      track
      write={{ item: "index.html" }}
    />,
  )
}

/**
 * The shell line the reader sees. Every command the figure can print is in
 * the markup beside it and hidden, which is what keeps the panel from
 * growing a line when a longer command is pressed.
 */
const shownLine = (container: HTMLElement) =>
  container.querySelector(
    '.pp-explorable-pane[data-active="true"] .pp-explorable-line',
  )

const commands = (container: HTMLElement) =>
  [...container.querySelectorAll(".pp-explorable-cmd")].map(
    (button) => button.textContent,
  )

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

  /** The stack is the image's, so the figure says which image it is. */
  test("names the image above its layers", () => {
    const { getByText } = renderFigure("plain")

    expect(getByText("image (read-only) · postgres:18-alpine")).toBeDefined()
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
      getByText("the container is gone; pgdata is still here"),
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

  /**
   * The instance before the article has introduced volumes: one idea, and
   * no cylinder to tell the reader to ignore.
   */
  test("a figure without a volume has neither the column nor its commands", () => {
    const { container, getByText } = renderPlain()

    expect(container.querySelector(".pp-explorable-volume")).toBeNull()
    expect(container.querySelector(".pp-explorable-link")).toBeNull()
    expect(
      container
        .querySelector(".pp-explorable-stack")
        ?.getAttribute("data-volume"),
    ).toBe("false")
    expect(commands(container)).toEqual([
      "run -d",
      "cp index.html",
      "stop",
      "start",
      "rm -f",
    ])
    expect(
      getByText("web is running with index.html in its layer"),
    ).toBeDefined()
  })

  /** The rows are what makes seven commands readable, so they are labelled. */
  test("the commands are in labelled rows", () => {
    const { container } = renderFigure("volume")

    expect(
      [...container.querySelectorAll(".pp-explorable-group-head")].map(
        (head) => head.textContent,
      ),
    ).toEqual(["start", "write", "pause", "remove"])
    // The two that touch the volume take its colour, the rest the container's.
    expect(button(container, "docker volume rm pgdata").dataset.target).toBe(
      "volume",
    )
    expect(
      button(container, "docker run -d -v pgdata:/var/lib/postgresql").dataset
        .target,
    ).toBe("mount")
    expect(button(container, "docker stop db").dataset.target).toBe("container")
  })

  /** A short button is only readable next to the whole command. */
  test("the shell line prints what was pressed", () => {
    const { container } = renderPlain()
    const line = () => shownLine(container)

    expect(line()?.textContent).toBe(
      "docker cp site/index.html web:/usr/share/nginx/html/index.html",
    )

    press(container, "rm -f")
    expect(line()?.textContent).toBe("docker rm -f web")
    expect(line()?.getAttribute("data-level")).toBe("echo")
  })

  /** The refusal is printed as one, not as a command that ran. */
  test("a refused command is marked in the shell line", () => {
    const { container } = renderFigure("volume", true)

    fireEvent.click(button(container, "docker volume rm pgdata"))
    const line = shownLine(container)
    expect(line?.getAttribute("data-level")).toBe("error")
    expect(line?.textContent).toBe("docker volume rm pgdata")
  })

  /** A figure given no commands to print prints no line at all. */
  test("without the commands spelled out there is no shell line", () => {
    const { container } = renderFigure("volume")

    expect(container.querySelector(".pp-explorable-line")).toBeNull()
  })

  /** Every command it can print is held in the layout from the first render. */
  test("the shell panel reserves every command it can print", () => {
    const { container } = renderPlain()

    expect([...container.querySelectorAll(".pp-explorable-echo")].length).toBe(
      5,
    )
  })

  test("the state track marks where the container is", () => {
    const { container } = renderPlain()
    const at = () =>
      [...container.querySelectorAll(".pp-explorable-track li")].findIndex(
        (item) => item.getAttribute("data-at") === "true",
      )

    expect(at()).toBe(0)
    press(container, "stop")
    expect(at()).toBe(1)
    press(container, "rm -f")
    expect(at()).toBe(2)
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
            groups: { create: "c", destroy: "d", pause: "p", write: "w" },
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
