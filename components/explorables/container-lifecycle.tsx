"use client"

import { Fragment, useReducer } from "react"
import {
  allowed,
  type CommandGroup,
  type CommandType,
  type ContainerAction,
  type ContainerLifecycleContent,
  type ContainerState,
  initialState,
  isInitial,
  lastCommand,
  reduce,
} from "@/lib/explorables/container-lifecycle"
import { fill } from "@/lib/explorables/format"
import { Explorable } from "./explorable"

type Props = ContainerLifecycleContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
    /** Draw the three states the container moves between above the commands. */
    track?: boolean
  }>

/**
 * The commands in the order the article uses them, in rows by what they do:
 * one row starts a container, one writes into it, one pauses it, one removes
 * things. A reader looking for "how do I get rid of this" reads one row
 * rather than seven buttons.
 */
const GROUPS: readonly (readonly [CommandGroup, readonly CommandType[]])[] = [
  ["create", ["run", "runVolume"]],
  ["write", ["write"]],
  ["pause", ["stop", "start"]],
  ["destroy", ["rm", "volumeRm"]],
]

/**
 * Which part of the picture a command lands on, so the button can take that
 * part's colour: the container is the cyan box, the volume the magenta
 * cylinder, and a mount is the one command that is both.
 */
const TARGETS: Partial<Record<CommandType, string>> = {
  runVolume: "mount",
  volumeRm: "volume",
}

/** The three the container moves between, in the order it moves through them. */
const TRACK = ["running", "stopped", "none"] as const

/**
 * A container over its image, with a volume beside it when the figure has
 * one, and the commands that decide what survives.
 *
 * The three parts of the picture are the three the article names: the image,
 * read-only and untouched by everything here; the writable layer, which is
 * the container; and the volume, which is not part of the container at all.
 * Writing goes to whichever of the last two the path belongs to, and that is
 * the whole of "コンテナは使い捨て、データはボリューム".
 *
 * Leaving `volume` out drops the cylinder, the two commands that touch it and
 * the dashed mount between them, which is what the instance before the
 * article has introduced volumes wants: one idea, not one idea and a picture
 * to ignore.
 *
 * A command that cannot act is disabled — except removing a volume that a
 * container still holds, which stays pressable so the refusal can be shown.
 * Nothing moves as the state changes: the rows are where they were, so a
 * reader who has just pressed `rm` finds `run` where they last saw it.
 *
 * Authored in MDX, one instance per picture it replaces:
 *
 *     <ContainerLifecycle
 *       title="nginx:1.29-alpine"
 *       hint="Press a command and watch what survives"
 *       image={{ name: "nginx:1.29-alpine", layers: ["alpine", "nginx", "conf"] }}
 *       write={{ item: "index.html" }}
 *       initial="plain"
 *       commands={{ run: "docker run -d", … }}
 *       labels={{ image: "Image (read-only)", groups: { create: "Start", … }, … }}
 *       status={{ initialPlain: "…", removed: "…", … }}
 *     />
 */
export function ContainerLifecycle({
  title,
  hint,
  caption,
  track,
  ...content
}: Props) {
  const [state, dispatch] = useReducer(
    (current: ContainerState, action: ContainerAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )

  const statusText = fill(content.status[state.last] ?? "", {
    item: content.write.item,
    volume: content.volume?.name ?? "",
  })
  const containerLabel =
    state.container === "none"
      ? content.labels.none
      : state.container === "running"
        ? content.labels.running
        : content.labels.stopped
  const echoed = content.echo?.[lastCommand(state)]

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={statusText}
      title={title}
    >
      {/* The rule behind the disabled buttons, drawn rather than explained:
          the container is at one of three states and each command belongs to
          one of the arrows between them. Said again for a screen reader by
          the status line, which is where the state already is. */}
      {track && (
        <ol aria-hidden="true" className="pp-explorable-track">
          {TRACK.map((position) => (
            <li data-at={state.container === position} key={position}>
              <span className="pp-explorable-track-state">
                {position === "running"
                  ? content.labels.running
                  : position === "stopped"
                    ? content.labels.stopped
                    : content.labels.none}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="pp-explorable-groups">
        {GROUPS.map(([group, types]) => {
          const shown = types.flatMap((type) => {
            const full = content.commands[type]
            if (full === undefined) {
              return []
            }
            // The short label is only readable next to the whole command,
            // so it waits for the line that prints one.
            const label =
              (content.echo ? content.short?.[type] : undefined) ?? full
            return [{ label, type }]
          })
          if (shown.length === 0) {
            return null
          }
          return (
            <Fragment key={group}>
              <p className="pp-explorable-group-head">
                {content.labels.groups[group]}
              </p>
              <div className="pp-explorable-controls">
                {shown.map(({ label, type }) => (
                  <button
                    className="pp-explorable-cmd"
                    data-target={TARGETS[type] ?? "container"}
                    disabled={!allowed(state, type)}
                    key={type}
                    onClick={() => dispatch({ type })}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Fragment>
          )
        })}
      </div>

      <div
        className="pp-explorable-stack"
        data-volume={content.volume !== undefined}
      >
        <div>
          <p className="pp-explorable-column-head">
            {content.labels.container}
            {" · "}
            {containerLabel}
          </p>
          <div
            className="pp-explorable-box"
            data-on={state.container !== "none"}
          >
            <p className="pp-explorable-note">{content.labels.writable}</p>
            <div className="pp-explorable-items">
              {state.written.length === 0 ? (
                <span className="pp-explorable-item" data-on="false">
                  —
                </span>
              ) : (
                state.written.map((item) => (
                  <span className="pp-explorable-item" key={item}>
                    {item}
                  </span>
                ))
              )}
            </div>
          </div>
          {/* The layers never change here — the build article is where they
              do — so they are one line under the box rather than a stack
              taller than the container sitting on it. */}
          <div className="pp-explorable-base">
            <p className="pp-explorable-note">
              {content.labels.image}
              {" · "}
              {content.image.name}
            </p>
            <div className="pp-explorable-layers">
              {content.image.layers.map((layer) => (
                <span className="pp-explorable-layer" key={layer}>
                  {layer}
                </span>
              ))}
            </div>
          </div>
        </div>

        {content.volume && (
          <span
            aria-hidden="true"
            className="pp-explorable-link"
            data-on={state.container !== "none" && state.withVolume}
          />
        )}

        {content.volume && (
          <div>
            <p className="pp-explorable-column-head">{content.labels.volume}</p>
            <div className="pp-explorable-volume" data-on={state.volume.exists}>
              <p className="pp-explorable-volume-name">{content.volume.name}</p>
              <p className="pp-explorable-note">{content.volume.path}</p>
              <div className="pp-explorable-items">
                {state.volume.rows.length === 0 ? (
                  <span className="pp-explorable-item" data-on="false">
                    —
                  </span>
                ) : (
                  state.volume.rows.map((row) => (
                    <span className="pp-explorable-item" key={row}>
                      {row}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What was pressed, spelled out the way the article's transcripts
          spell it — the buttons above can stay short because this is here.
          A refused command is marked as one rather than printed as if it
          had run. */}
      {echoed && (
        <div className="pp-explorable-term pp-explorable-echo">
          <div
            className="pp-explorable-line"
            data-level={state.last === "volumeInUse" ? "error" : "echo"}
          >
            {echoed}
          </div>
        </div>
      )}
    </Explorable>
  )
}
