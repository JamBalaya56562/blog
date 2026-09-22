/**
 * The state behind the container figure: an image, a container on top of it,
 * and a volume beside it — and what each command does to the three.
 *
 * The rule the article states is a rule about where a write lands. A write
 * into the container goes to its writable layer and dies with it; a write
 * into a path that has a volume mounted goes to the volume and outlives
 * every container. `stop` keeps both, `rm` takes the layer only, and a
 * volume in use cannot be removed at all.
 */

export type ContainerStatus = "none" | "running" | "stopped"

export type ContainerLifecycleContent = Readonly<{
  image: Readonly<{
    /** Shown on the stack, e.g. `postgres:18-alpine`. */
    name: string
    /** Layer names, bottom first; the read-only part of the picture. */
    layers: readonly string[]
  }>
  volume: Readonly<{ name: string; path: string }>
  /** What one press of the write command puts down. */
  write: Readonly<{ item: string }>
  /** Which picture this instance starts as. */
  initial: "plain" | "volume"
  /** Button labels: the commands as the reader would type them. */
  commands: Readonly<Record<CommandType, string>>
  labels: Readonly<{
    image: string
    writable: string
    container: string
    running: string
    stopped: string
    none: string
    volume: string
  }>
  /** Spoken after each command; may use `{item}` and `{volume}`. */
  status: Readonly<Record<StatusKey, string>>
}>

export type CommandType =
  | "run"
  | "runVolume"
  | "write"
  | "stop"
  | "start"
  | "rm"
  | "volumeRm"

export type ContainerAction = { type: CommandType } | { type: "reset" }

export type StatusKey =
  | "initialPlain"
  | "initialVolume"
  | "ran"
  | "ranVolume"
  | "wrote"
  | "wroteVolume"
  | "stopped"
  | "started"
  | "removed"
  | "removedKept"
  | "volumeRemoved"
  | "volumeInUse"

export type ContainerState = Readonly<{
  container: ContainerStatus
  /** Whether the running container has the volume mounted. */
  withVolume: boolean
  /** What sits in the container's writable layer. */
  written: readonly string[]
  volume: Readonly<{ exists: boolean; rows: readonly string[] }>
  last: StatusKey
}>

export function initialState(
  content: ContainerLifecycleContent,
): ContainerState {
  if (content.image.layers.length === 0) {
    throw new Error("ContainerLifecycle: no image layers")
  }
  if (content.initial !== "plain" && content.initial !== "volume") {
    throw new Error(`ContainerLifecycle: unknown initial ${content.initial}`)
  }

  const withVolume = content.initial === "volume"
  return {
    container: "running",
    last: withVolume ? "initialVolume" : "initialPlain",
    // The served picture is the one the article drew: a container that has
    // already been written to, either into its own layer or into the volume.
    volume: {
      exists: withVolume,
      rows: withVolume ? [content.write.item] : [],
    },
    withVolume,
    written: withVolume ? [] : [content.write.item],
  }
}

/**
 * Whether the command can act. `volumeRm` is the exception: it stays
 * pressable while a container holds the volume, because being refused is
 * what the reader is meant to see.
 */
export function allowed(state: ContainerState, type: CommandType): boolean {
  switch (type) {
    case "run":
    case "runVolume":
      return state.container === "none"
    case "write":
    case "stop":
      return state.container === "running"
    case "start":
      return state.container === "stopped"
    case "rm":
      return state.container !== "none"
    case "volumeRm":
      return state.volume.exists
  }
}

export function reduce(
  state: ContainerState,
  action: ContainerAction,
  content: ContainerLifecycleContent,
): ContainerState {
  if (action.type === "reset") {
    return initialState(content)
  }
  if (!allowed(state, action.type)) {
    return state
  }

  switch (action.type) {
    case "run":
      return { ...state, container: "running", last: "ran", withVolume: false }
    case "runVolume":
      return {
        ...state,
        container: "running",
        last: "ranVolume",
        volume: { ...state.volume, exists: true },
        withVolume: true,
      }
    case "write": {
      const item = content.write.item
      // The mount decides the destination: the same command writes to the
      // volume when one is mounted on that path, and to the container's own
      // layer when there is not.
      if (state.withVolume) {
        return {
          ...state,
          last: "wroteVolume",
          volume: {
            ...state.volume,
            rows: state.volume.rows.includes(item)
              ? state.volume.rows
              : [...state.volume.rows, item],
          },
        }
      }
      return {
        ...state,
        last: "wrote",
        written: state.written.includes(item)
          ? state.written
          : [...state.written, item],
      }
    }
    case "stop":
      return { ...state, container: "stopped", last: "stopped" }
    case "start":
      return { ...state, container: "running", last: "started" }
    case "rm":
      // The writable layer goes with the container. The volume is not part
      // of it and is not touched.
      return {
        ...state,
        container: "none",
        last: state.volume.rows.length > 0 ? "removedKept" : "removed",
        withVolume: false,
        written: [],
      }
    case "volumeRm":
      if (state.container !== "none" && state.withVolume) {
        // Refused, and the refusal is the lesson: nothing changes but what
        // the figure says.
        return { ...state, last: "volumeInUse" }
      }
      return {
        ...state,
        last: "volumeRemoved",
        volume: { exists: false, rows: [] },
      }
  }
}

export function isInitial(
  state: ContainerState,
  content: ContainerLifecycleContent,
): boolean {
  const initial = initialState(content)
  return (
    state.container === initial.container &&
    state.withVolume === initial.withVolume &&
    state.last === initial.last &&
    state.written.join() === initial.written.join() &&
    state.volume.exists === initial.volume.exists &&
    state.volume.rows.join() === initial.volume.rows.join()
  )
}
