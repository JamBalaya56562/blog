"use client"

import { useReducer } from "react"
import {
  allowed,
  type ComposeAction,
  type ComposeCommand,
  type ComposeLifecycleContent,
  type ComposeState,
  initialState,
  isInitial,
  lastCommand,
  networkExists,
  reduce,
} from "@/lib/explorables/compose-lifecycle"
import { fill } from "@/lib/explorables/format"
import { Explorable } from "./explorable"
import { Frame } from "./frame"

type Props = ComposeLifecycleContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
    /** Printed in front of a command in the shell line, e.g. `docker compose`. */
    prefix: string
  }>

const COMMANDS: readonly ComposeCommand[] = [
  "up",
  "stop",
  "start",
  "down",
  "downVolumes",
]

/** What a row is drawn as: there and running, there but stopped, or gone. */
type Presence = "present" | "stopped" | "absent"

/**
 * A Compose project and what each command leaves of it.
 *
 * Every part of the project is a row: the two containers, the network Compose
 * made for them, the database's volume with the post in it, the external
 * volume and the image. A command changes some rows and not others, and the
 * rows that never change are the point as much as the ones that do: `down`
 * takes the containers and the network and leaves the data, `down -v` takes
 * the data too, and neither touches the external volume or the image.
 *
 * Under the rows is what Compose printed for that command when the article's
 * stack went through it, so the picture and the transcript say the same thing.
 */
export function ComposeLifecycle({
  title,
  hint,
  caption,
  prefix,
  ...content
}: Props) {
  const [state, dispatch] = useReducer(
    (current: ComposeState, action: ComposeAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )

  const vars = {
    external: content.external,
    item: content.volume.item,
    volume: content.volume.name,
  }
  const container = (status: ComposeState["containers"]): Presence =>
    status === "running"
      ? "present"
      : status === "stopped"
        ? "stopped"
        : "absent"
  const containerWord =
    state.containers === "running"
      ? content.labels.running
      : state.containers === "stopped"
        ? content.labels.stopped
        : content.labels.absent

  const rows: readonly {
    key: string
    name: string
    presence: Presence
    badge: string
    tag?: string
    items?: readonly string[]
  }[] = [
    {
      badge: containerWord,
      key: "db",
      name: content.containers.db,
      presence: container(state.containers),
    },
    {
      badge: containerWord,
      key: "app",
      name: content.containers.app,
      presence: container(state.containers),
    },
    {
      badge: networkExists(state)
        ? content.labels.network
        : content.labels.absent,
      key: "network",
      name: content.network,
      presence: networkExists(state) ? "present" : "absent",
    },
    {
      badge: state.volume.exists
        ? content.labels.volume
        : content.labels.absent,
      items: state.volume.exists ? state.volume.rows : undefined,
      key: "volume",
      name: content.volume.name,
      presence: state.volume.exists ? "present" : "absent",
    },
    {
      badge: content.labels.volume,
      key: "external",
      name: content.external,
      presence: "present",
      tag: content.labels.externalTag,
    },
    {
      badge: content.labels.image,
      key: "image",
      name: content.image,
      presence: "present",
    },
  ]

  /**
   * The transcript is as long as the longest thing Compose prints here —
   * `up` onto nothing, creating the volume too — from the first render, so
   * pressing a command never moves the article under the figure.
   */
  const longest = reduce(
    reduce(initialState(content), { type: "downVolumes" }, content),
    { type: "up" },
    content,
  ).output
  const pressed = lastCommand(state)

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={fill(content.status[state.last], vars)}
      statuses={Object.values(content.status).map((s) => fill(s, vars))}
      title={title}
    >
      <div className="pp-explorable-controls">
        {COMMANDS.map((type) => (
          <button
            className="pp-explorable-cmd"
            disabled={!allowed(state, type)}
            key={type}
            onClick={() => dispatch({ type })}
            type="button"
          >
            {content.commands[type]}
          </button>
        ))}
      </div>

      <ul className="pp-explorable-lines">
        {rows.map((row) => (
          <li
            className="pp-explorable-row"
            data-resource={row.presence}
            key={row.key}
          >
            <span className="pp-explorable-cmdtext">
              {row.name}
              {row.tag && <span className="pp-explorable-tag">{row.tag}</span>}
            </span>
            <span className="pp-explorable-badge">{row.badge}</span>
            {row.items && (
              <span className="pp-explorable-items">
                {row.items.length === 0 ? (
                  <span className="pp-explorable-item" data-on="false">
                    {content.labels.empty}
                  </span>
                ) : (
                  row.items.map((item) => (
                    <span className="pp-explorable-item" key={item}>
                      {item}
                    </span>
                  ))
                )}
              </span>
            )}
          </li>
        ))}
      </ul>

      <Frame
        active={0}
        panes={[
          { command: pressed, output: state.output },
          { command: "up" as const, output: longest },
        ].map((pane, index) => (
          <div
            className="pp-explorable-term pp-explorable-echo"
            // The live transcript, then the longest one behind it.
            // biome-ignore lint/suspicious/noArrayIndexKey: two fixed panes
            key={index}
          >
            {pane.command && (
              <div className="pp-explorable-line" data-level="echo">
                {`${prefix} ${content.commands[pane.command]}`}
              </div>
            )}
            {pane.output.map((text, at) => (
              <div
                className="pp-explorable-line"
                data-level="output"
                // Compose prints the same line twice only in different
                // commands, never in one, but the position is what orders them.
                // biome-ignore lint/suspicious/noArrayIndexKey: lines in print order
                key={at}
              >
                {text}
              </div>
            ))}
          </div>
        ))}
      />
    </Explorable>
  )
}
