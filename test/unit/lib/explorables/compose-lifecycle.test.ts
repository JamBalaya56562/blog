import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  allowed,
  type ComposeAction,
  type ComposeCommand,
  type ComposeLifecycleContent,
  initialState,
  isInitial,
  networkExists,
  reduce,
} from "@/lib/explorables/compose-lifecycle"

const content: ComposeLifecycleContent = {
  commands: {
    down: "docker compose down",
    downVolumes: "docker compose down -v",
    start: "docker compose start",
    stop: "docker compose stop",
    up: "docker compose up -d",
  },
  containers: { app: "emdash-emdash-1", db: "emdash-db-1" },
  external: "emdash-uploads",
  image: "emdash-emdash",
  labels: {
    absent: "—",
    empty: "empty",
    externalTag: "external",
    image: "image",
    network: "network",
    running: "Up",
    stopped: "Exited",
    volume: "volume",
  },
  network: "emdash_default",
  status: {
    created: "created",
    createdVolume: "created volume",
    down: "down",
    downVolumes: "down -v",
    initial: "initial",
    noop: "noop",
    resumed: "resumed",
    started: "started",
    stopped: "stopped",
    volumeOnly: "volume only",
  },
  volume: { item: "Hello from PostgreSQL", name: "emdash_pgdata" },
}

const COMMANDS: readonly ComposeCommand[] = [
  "up",
  "stop",
  "start",
  "down",
  "downVolumes",
]

const actions = fc.array(
  fc.oneof(
    fc.constantFrom(...COMMANDS).map((type): ComposeAction => ({ type })),
    fc.constant<ComposeAction>({ type: "reset" }),
  ),
  { maxLength: 16 },
)

const play = (list: readonly ComposeAction[]) =>
  list.reduce((s, a) => reduce(s, a, content), initialState(content))

/** The transcripts recorded from the article's stack, one per transition. */
const DOWN = [
  "Container emdash-emdash-1 Stopping",
  "Container emdash-emdash-1 Stopped",
  "Container emdash-emdash-1 Removing",
  "Container emdash-emdash-1 Removed",
  "Container emdash-db-1 Stopping",
  "Container emdash-db-1 Stopped",
  "Container emdash-db-1 Removing",
  "Container emdash-db-1 Removed",
]
const START = [
  "Container emdash-db-1 Starting",
  "Container emdash-db-1 Started",
  "Container emdash-db-1 Waiting",
  "Container emdash-db-1 Healthy",
  "Container emdash-emdash-1 Starting",
  "Container emdash-emdash-1 Started",
]

describe("compose lifecycle", () => {
  /** Compose creates the volume before the first container, every time. */
  test("Property 1: containers never exist without the volume", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const state = play(list)
        if (state.containers !== "none") {
          expect(state.volume.exists).toBe(true)
        }
      }),
      { numRuns: 300 },
    )
  })

  /** The post is only ever lost with its volume. */
  test("Property 2: the post survives everything but down -v", () => {
    fc.assert(
      fc.property(actions, fc.constantFrom(...COMMANDS), (list, type) => {
        const before = play(list)
        const after = reduce(before, { type }, content)
        if (type !== "downVolumes" && before.volume.rows.length > 0) {
          expect(after.volume.rows).toEqual(before.volume.rows)
        }
        if (type === "downVolumes" && allowed(before, type)) {
          expect(after.volume).toEqual({ exists: false, rows: [] })
        }
      }),
      { numRuns: 300 },
    )
  })

  test("Property 3: a command that cannot act changes nothing", () => {
    fc.assert(
      fc.property(actions, fc.constantFrom(...COMMANDS), (list, type) => {
        const before = play(list)
        if (!allowed(before, type)) {
          expect(reduce(before, { type }, content)).toBe(before)
        }
      }),
      { numRuns: 300 },
    )
  })

  test("Property 4: the network lives exactly as long as the containers", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const state = play(list)
        expect(networkExists(state)).toBe(state.containers !== "none")
      }),
      { numRuns: 300 },
    )
  })

  test("Property 5: reset returns to the served picture", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const back = reduce(play(list), { type: "reset" }, content)
        expect(back).toEqual(initialState(content))
        expect(isInitial(back, content)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  test("serves the stack up, with the post in the database's volume", () => {
    const state = initialState(content)
    expect(state.containers).toBe("running")
    expect(state.volume.rows).toEqual(["Hello from PostgreSQL"])
    // The last thing Compose printed: the up after a down, the volume kept.
    expect(state.output).toEqual(
      reduce(reduce(state, { type: "down" }, content), { type: "up" }, content)
        .output,
    )
    expect(state.output[1]).toBe("Network emdash_default Created")
  })

  test("prints what Compose printed for each transition", () => {
    const up = initialState(content)
    const stopped = reduce(up, { type: "stop" }, content)
    expect(stopped.output).toEqual([
      "Container emdash-emdash-1 Stopping",
      "Container emdash-emdash-1 Stopped",
      "Container emdash-db-1 Stopping",
      "Container emdash-db-1 Stopped",
    ])
    expect(reduce(stopped, { type: "start" }, content).output).toEqual(START)
    expect(reduce(stopped, { type: "up" }, content).output).toEqual(START)
    expect(reduce(up, { type: "up" }, content).output).toEqual([
      "Container emdash-db-1 Running",
      "Container emdash-emdash-1 Running",
      "Container emdash-db-1 Waiting",
      "Container emdash-db-1 Healthy",
    ])

    const down = reduce(up, { type: "down" }, content)
    expect(down.output).toEqual([
      ...DOWN,
      "Network emdash_default Removing",
      "Network emdash_default Removed",
    ])
    expect(reduce(stopped, { type: "down" }, content).output).toEqual(
      down.output,
    )

    const downVolumes = reduce(up, { type: "downVolumes" }, content)
    expect(downVolumes.output).toEqual([
      ...DOWN,
      "Volume emdash_pgdata Removing",
      "Network emdash_default Removing",
      "Volume emdash_pgdata Removed",
      "Network emdash_default Removed",
    ])
    expect(reduce(down, { type: "downVolumes" }, content).output).toEqual([
      "Volume emdash_pgdata Removing",
      "Volume emdash_pgdata Removed",
    ])
  })

  test("up after down keeps the volume; up after down -v makes an empty one", () => {
    const down = reduce(initialState(content), { type: "down" }, content)
    const again = reduce(down, { type: "up" }, content)
    expect(again.volume.rows).toEqual(["Hello from PostgreSQL"])
    expect(again.last).toBe("created")
    expect(again.output.slice(0, 2)).toEqual([
      "Network emdash_default Creating",
      "Network emdash_default Created",
    ])

    const wiped = reduce(
      reduce(initialState(content), { type: "downVolumes" }, content),
      { type: "up" },
      content,
    )
    expect(wiped.volume).toEqual({ exists: true, rows: [] })
    expect(wiped.last).toBe("createdVolume")
    expect(wiped.output.slice(0, 4)).toEqual([
      "Network emdash_default Creating",
      "Volume emdash_pgdata Creating",
      "Volume emdash_pgdata Created",
      "Network emdash_default Created",
    ])
  })

  test("down with nothing up cannot be pressed; down -v still can", () => {
    const down = reduce(initialState(content), { type: "down" }, content)
    expect(allowed(down, "down")).toBe(false)
    expect(allowed(down, "downVolumes")).toBe(true)
    const gone = reduce(down, { type: "downVolumes" }, content)
    expect(allowed(gone, "downVolumes")).toBe(false)
  })

  test("rejects content it cannot draw", () => {
    expect(() =>
      initialState({ ...content, containers: { app: "x", db: "x" } }),
    ).toThrow("two distinct container names")
    expect(() =>
      initialState({ ...content, volume: { item: "", name: "v" } }),
    ).toThrow("the volume needs an item")
  })
})
