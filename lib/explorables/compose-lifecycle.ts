/**
 * The state behind the Compose lifecycle figure: two containers, the network
 * Compose creates for them, the database's named volume with a post in it, an
 * external volume and the built image — and what each `docker compose`
 * command leaves of them.
 *
 * The lines a command prints are the ones Compose printed when the article's
 * stack was taken through every transition here, in the order it printed
 * them. The database starts first and stops last, because the app depends on
 * it; a network exists exactly while the containers do.
 */

export type ContainerStatus = "running" | "stopped" | "none"

export type ComposeCommand = "up" | "stop" | "start" | "down" | "downVolumes"

export type ComposeStatusKey =
  | "initial"
  | "created"
  | "createdVolume"
  | "resumed"
  | "noop"
  | "stopped"
  | "started"
  | "down"
  | "downVolumes"
  | "volumeOnly"

export type ComposeLifecycleContent = Readonly<{
  containers: Readonly<{ app: string; db: string }>
  network: string
  /** The named volume Compose manages, and the post that lives in it. */
  volume: Readonly<{ name: string; item: string }>
  /** Declared `external: true`: Compose uses it and never removes it. */
  external: string
  image: string
  /** The commands as the reader would type them. */
  commands: Readonly<Record<ComposeCommand, string>>
  labels: Readonly<{
    /** A container that is up, and one that is stopped. */
    running: string
    stopped: string
    /** Any part of the project that does not exist right now. */
    absent: string
    /** What an existing network, volume or image is called on its row. */
    network: string
    volume: string
    image: string
    /** Marks the volume Compose uses but never removes. */
    externalTag: string
    /** Shown inside a volume that has nothing in it. */
    empty: string
  }>
  /** Spoken after each command; may use `{item}`, `{volume}` and `{external}`. */
  status: Readonly<Record<ComposeStatusKey, string>>
}>

export type ComposeState = Readonly<{
  containers: ContainerStatus
  volume: Readonly<{ exists: boolean; rows: readonly string[] }>
  last: ComposeStatusKey
  /** What the last command printed, one line per event. */
  output: readonly string[]
}>

export type ComposeAction = { type: ComposeCommand } | { type: "reset" }

export function initialState(content: ComposeLifecycleContent): ComposeState {
  const { app, db } = content.containers
  if (app === "" || db === "" || app === db) {
    throw new Error("ComposeLifecycle: two distinct container names needed")
  }
  if (content.volume.item === "") {
    throw new Error("ComposeLifecycle: the volume needs an item")
  }
  // The served picture is the stack as the article leaves it: brought down
  // after the post was written and up again, so the post is in the volume
  // and the last thing Compose printed is that `up`.
  return {
    containers: "running",
    last: "initial",
    output: createLines(content, true),
    volume: { exists: true, rows: [content.volume.item] },
  }
}

/** The network lives exactly as long as the containers do. */
export function networkExists(state: ComposeState): boolean {
  return state.containers !== "none"
}

/**
 * Whether a command does anything. `up` always does something, even if only
 * to report that everything is running; `down` with nothing to take down
 * prints nothing at all, so the button is off rather than silent.
 */
export function allowed(state: ComposeState, type: ComposeCommand): boolean {
  switch (type) {
    case "up":
      return true
    case "stop":
      return state.containers === "running"
    case "start":
      return state.containers === "stopped"
    case "down":
      return state.containers !== "none"
    case "downVolumes":
      return state.containers !== "none" || state.volume.exists
  }
}

function line(kind: string, name: string, verb: string): string {
  return `${kind} ${name} ${verb}`
}

function startLines(content: ComposeLifecycleContent): string[] {
  const { app, db } = content.containers
  return [
    line("Container", db, "Starting"),
    line("Container", db, "Started"),
    line("Container", db, "Waiting"),
    line("Container", db, "Healthy"),
    line("Container", app, "Starting"),
    line("Container", app, "Started"),
  ]
}

/**
 * What `up` prints onto nothing: the network, the volume if it has to make
 * one, both containers, then the database started and waited on before the
 * app. Onto a volume that survived a `down`, the volume lines are absent.
 */
function createLines(
  content: ComposeLifecycleContent,
  volumeExists: boolean,
): string[] {
  const { app, db } = content.containers
  const { network } = content
  const volume = content.volume.name
  return [
    line("Network", network, "Creating"),
    ...(volumeExists
      ? [line("Network", network, "Created")]
      : [
          line("Volume", volume, "Creating"),
          line("Volume", volume, "Created"),
          line("Network", network, "Created"),
        ]),
    line("Container", db, "Creating"),
    line("Container", db, "Created"),
    line("Container", app, "Creating"),
    line("Container", app, "Created"),
    ...startLines(content),
  ]
}

function removeContainerLines(content: ComposeLifecycleContent): string[] {
  return [content.containers.app, content.containers.db].flatMap((name) => [
    line("Container", name, "Stopping"),
    line("Container", name, "Stopped"),
    line("Container", name, "Removing"),
    line("Container", name, "Removed"),
  ])
}

export function reduce(
  state: ComposeState,
  action: ComposeAction,
  content: ComposeLifecycleContent,
): ComposeState {
  if (action.type === "reset") {
    return initialState(content)
  }
  if (!allowed(state, action.type)) {
    return state
  }
  const { app, db } = content.containers
  const { network } = content
  const volume = content.volume.name

  switch (action.type) {
    case "up":
      if (state.containers === "running") {
        return {
          ...state,
          last: "noop",
          output: [
            line("Container", db, "Running"),
            line("Container", app, "Running"),
            line("Container", db, "Waiting"),
            line("Container", db, "Healthy"),
          ],
        }
      }
      if (state.containers === "stopped") {
        return {
          ...state,
          containers: "running",
          last: "resumed",
          output: startLines(content),
        }
      }
      return {
        containers: "running",
        last: state.volume.exists ? "created" : "createdVolume",
        output: createLines(content, state.volume.exists),
        // A volume Compose has to create is a new, empty one: what was in
        // the old one went with it.
        volume: state.volume.exists ? state.volume : { exists: true, rows: [] },
      }
    case "stop":
      return {
        ...state,
        containers: "stopped",
        last: "stopped",
        output: [
          line("Container", app, "Stopping"),
          line("Container", app, "Stopped"),
          line("Container", db, "Stopping"),
          line("Container", db, "Stopped"),
        ],
      }
    case "start":
      return {
        ...state,
        containers: "running",
        last: "started",
        output: startLines(content),
      }
    case "down":
      return {
        ...state,
        containers: "none",
        last: "down",
        output: [
          ...removeContainerLines(content),
          line("Network", network, "Removing"),
          line("Network", network, "Removed"),
        ],
      }
    case "downVolumes": {
      if (state.containers === "none") {
        return {
          containers: "none",
          last: "volumeOnly",
          output: [
            line("Volume", volume, "Removing"),
            line("Volume", volume, "Removed"),
          ],
          volume: { exists: false, rows: [] },
        }
      }
      // Containers never exist without the volume: `up` creates it first.
      return {
        containers: "none",
        last: "downVolumes",
        output: [
          ...removeContainerLines(content),
          line("Volume", volume, "Removing"),
          line("Network", network, "Removing"),
          line("Volume", volume, "Removed"),
          line("Network", network, "Removed"),
        ],
        volume: { exists: false, rows: [] },
      }
    }
  }
}

/** The command whose output the figure is showing, if any. */
export function lastCommand(state: ComposeState): ComposeCommand {
  switch (state.last) {
    case "initial":
    case "created":
    case "createdVolume":
    case "resumed":
    case "noop":
      return "up"
    case "stopped":
      return "stop"
    case "started":
      return "start"
    case "down":
      return "down"
    case "downVolumes":
    case "volumeOnly":
      return "downVolumes"
  }
}

export function isInitial(
  state: ComposeState,
  content: ComposeLifecycleContent,
): boolean {
  const initial = initialState(content)
  return (
    state.containers === initial.containers &&
    state.last === initial.last &&
    state.volume.exists === initial.volume.exists &&
    state.volume.rows.join() === initial.volume.rows.join()
  )
}
