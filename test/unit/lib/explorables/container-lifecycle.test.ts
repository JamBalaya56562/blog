import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  allowed,
  type CommandType,
  type ContainerAction,
  type ContainerLifecycleContent,
  type ContainerState,
  initialState,
  isInitial,
  lastCommand,
  reduce,
} from "@/lib/explorables/container-lifecycle"

const base: ContainerLifecycleContent = {
  commands: {
    rm: "docker rm -f db",
    run: "docker run -d --name db",
    runVolume: "docker run -d -v pgdata:/var/lib/postgresql",
    start: "docker start db",
    stop: "docker stop db",
    volumeRm: "docker volume rm pgdata",
    write: "docker exec db psql -c INSERT",
  },
  image: {
    layers: ["alpine", "postgres", "initdb"],
    name: "postgres:18-alpine",
  },
  initial: "volume",
  labels: {
    container: "container db",
    groups: {
      create: "start",
      destroy: "remove",
      pause: "pause",
      write: "write",
    },
    image: "image",
    none: "no container",
    running: "Up",
    stopped: "Exited (0)",
    volume: "volume",
    writable: "writable layer",
  },
  status: {
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
  },
  volume: { name: "pgdata", path: "/var/lib/postgresql" },
  write: { item: "notes" },
}
const plain: ContainerLifecycleContent = { ...base, initial: "plain" }
/** The nginx instance: a writable layer, and no volume anywhere. */
const noVolume: ContainerLifecycleContent = {
  ...plain,
  commands: {
    rm: base.commands.rm,
    run: base.commands.run,
    start: base.commands.start,
    stop: base.commands.stop,
    write: base.commands.write,
  },
  volume: undefined,
}

const COMMANDS: readonly CommandType[] = [
  "run",
  "runVolume",
  "write",
  "stop",
  "start",
  "rm",
  "volumeRm",
]
const action = fc.constantFrom<ContainerAction>(
  ...COMMANDS.map((type) => ({ type }) as ContainerAction),
  { type: "reset" },
)
const actions = fc.array(action, { maxLength: 16 })

function run(list: readonly ContainerAction[], content = base): ContainerState {
  return list.reduce((s, a) => reduce(s, a, content), initialState(content))
}

describe("container lifecycle", () => {
  /** "docker stop はプロセスを止めるだけで、書き込み層もボリュームも残り". */
  test("Property 1: stop then start changes nothing but the status", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const before = run(list)
        if (before.container !== "running") {
          return
        }
        const after = reduce(
          reduce(before, { type: "stop" }, base),
          { type: "start" },
          base,
        )
        expect({ ...after, last: before.last }).toEqual(before)
      }),
      { numRuns: 300 },
    )
  })

  /** "消えるのは docker rm したときだけです" — and only the layer, never the volume. */
  test("Property 2: rm empties the writable layer and leaves the volume", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const before = run(list)
        if (before.container === "none") {
          return
        }
        const after = reduce(before, { type: "rm" }, base)
        expect(after.written).toEqual([])
        expect(after.volume).toEqual(before.volume)
      }),
      { numRuns: 300 },
    )
  })

  /**
   * The article's rule, both ways round: what goes to a volume outlives the
   * container, what goes to the writable layer does not.
   */
  test("Property 3: a write survives rm exactly when a volume held it", () => {
    fc.assert(
      fc.property(fc.boolean(), (useVolume) => {
        const start = initialState(plain)
        const ran = reduce(
          reduce(start, { type: "rm" }, plain),
          { type: useVolume ? "runVolume" : "run" },
          plain,
        )
        const written = reduce(ran, { type: "write" }, plain)
        const removed = reduce(written, { type: "rm" }, plain)
        const again = reduce(
          removed,
          { type: useVolume ? "runVolume" : "run" },
          plain,
        )

        expect(again.written).toEqual([])
        expect(again.volume.rows).toEqual(useVolume ? ["notes"] : [])
      }),
      { numRuns: 50 },
    )
  })

  /**
   * One write, one destination. The item can end up in both places over a
   * history — a volume keeps the row an earlier container put there while a
   * later container, started without the mount, writes its own copy inside
   * itself — but no single press ever puts it in two.
   */
  test("Property 4: each write lands in exactly one of the two places", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const before = run(list)
        if (!allowed(before, "write")) {
          return
        }
        const after = reduce(before, { type: "write" }, base)
        const layerGrew = after.written.length > before.written.length
        const volumeGrew = after.volume.rows.length > before.volume.rows.length
        expect(layerGrew && volumeGrew).toBe(false)
        // Whichever side it went to, the other is untouched.
        expect(volumeGrew ? after.written : after.volume.rows).toEqual(
          volumeGrew ? before.written : before.volume.rows,
        )
      }),
      { numRuns: 300 },
    )
  })

  test("Property 5: nothing is ever written to a container that is not there", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const state = run(list)
        if (state.container === "none") {
          expect(state.written).toEqual([])
        }
        expect(state.withVolume ? state.volume.exists : true).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  test("Property 6: a disallowed command changes nothing", () => {
    fc.assert(
      fc.property(actions, fc.constantFrom(...COMMANDS), (list, type) => {
        const state = run(list)
        if (allowed(state, type)) {
          return
        }
        expect(reduce(state, { type }, base)).toBe(state)
      }),
      { numRuns: 300 },
    )
  })

  test("Property 7: reset returns to the served state", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const back = reduce(run(list), { type: "reset" }, base)
        expect(back).toEqual(initialState(base))
        expect(isInitial(back, base)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })

  /** "使っているものは消せない". */
  test("a volume a container holds cannot be removed", () => {
    const state = initialState(base)
    const refused = reduce(state, { type: "volumeRm" }, base)

    expect(refused.last).toBe("volumeInUse")
    expect(refused.volume).toEqual(state.volume)

    const removed = reduce(
      reduce(state, { type: "rm" }, base),
      { type: "volumeRm" },
      base,
    )
    expect(removed.volume).toEqual({ exists: false, rows: [] })
    expect(removed.last).toBe("volumeRemoved")
  })

  test("the served state is the picture each instance replaces", () => {
    expect(initialState(plain)).toEqual({
      container: "running",
      last: "initialPlain",
      volume: { exists: false, rows: [] },
      withVolume: false,
      written: ["notes"],
    })
    expect(initialState(base)).toEqual({
      container: "running",
      last: "initialVolume",
      volume: { exists: true, rows: ["notes"] },
      withVolume: true,
      written: [],
    })
  })

  /**
   * What the figure says after `rm` turns on whether a volume is there at
   * all. An empty volume is still a volume that outlived the container, and
   * the chips beside the sentence are what show its contents.
   */
  test("removing a container says whether a volume was left behind", () => {
    expect(reduce(initialState(base), { type: "rm" }, base).last).toBe(
      "removedKept",
    )
    expect(reduce(initialState(plain), { type: "rm" }, plain).last).toBe(
      "removed",
    )

    // A volume created empty and never written to still survives the rm.
    const emptyVolume = ["rm", "runVolume", "rm"].reduce(
      (state, type) => reduce(state, { type } as ContainerAction, plain),
      initialState(plain),
    )
    expect(emptyVolume.volume).toEqual({ exists: true, rows: [] })
    expect(emptyVolume.last).toBe("removedKept")
  })

  test("rejects content it cannot draw", () => {
    expect(() =>
      initialState({ ...base, image: { ...base.image, layers: [] } }),
    ).toThrow("no image layers")
    expect(() =>
      initialState({
        ...base,
        initial: "sideways" as ContainerLifecycleContent["initial"],
      }),
    ).toThrow("unknown initial sideways")
    // A figure with no volume cannot be served with one mounted.
    expect(() => initialState({ ...noVolume, initial: "volume" })).toThrow(
      "initial volume without a volume",
    )
  })

  /**
   * The first of the two instances is about the writable layer alone. Its
   * two volume commands are not there to press, and nothing it can do
   * brings a volume into being.
   */
  test("a figure without a volume never grows one", () => {
    fc.assert(
      fc.property(actions, (list) => {
        const state = run(list, noVolume)
        expect(state.volume).toEqual({ exists: false, rows: [] })
        expect(state.withVolume).toBe(false)
      }),
      { numRuns: 300 },
    )
  })

  /** The shell line under the figure prints what the reader just pressed. */
  test("every state names the command that reached it", () => {
    expect(lastCommand(initialState(plain))).toBe("write")
    expect(lastCommand(initialState(base))).toBe("write")

    const cases: readonly [ContainerAction["type"], CommandType][] = [
      ["rm", "rm"],
      ["run", "run"],
      ["stop", "stop"],
      ["start", "start"],
      ["write", "write"],
      ["runVolume", "runVolume"],
      ["volumeRm", "volumeRm"],
    ]
    for (const [pressed, printed] of cases) {
      // Reach a state where the command can act, press it, and read it back.
      const reachable = [
        { type: "rm" },
        { type: "run" },
        { type: "stop" },
        { type: "start" },
        { type: pressed },
      ] as readonly ContainerAction[]
      const state = run(reachable, base)
      if (allowed(run(reachable.slice(0, -1), base), pressed as CommandType)) {
        expect(lastCommand(state)).toBe(printed)
      }
    }
  })
})
