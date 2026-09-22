"use client"

import { useReducer } from "react"
import {
  allowed,
  type CommandType,
  type ContainerAction,
  type ContainerLifecycleContent,
  type ContainerState,
  initialState,
  isInitial,
  reduce,
} from "@/lib/explorables/container-lifecycle"
import { fill } from "@/lib/explorables/format"
import { Explorable } from "./explorable"

type Props = ContainerLifecycleContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

const COMMANDS: readonly CommandType[] = [
  "run",
  "runVolume",
  "write",
  "stop",
  "start",
  "rm",
  "volumeRm",
]

/**
 * A container over its image, with a volume beside it, and the commands that
 * decide what survives.
 *
 * The three parts of the picture are the three the article names: the image,
 * read-only and untouched by everything here; the writable layer, which is
 * the container; and the volume, which is not part of the container at all.
 * Writing goes to whichever of the last two the path belongs to, and that is
 * the whole of "コンテナは使い捨て、データはボリューム".
 *
 * A command that cannot act is disabled — except removing a volume that a
 * container still holds, which stays pressable so the refusal can be shown.
 *
 * Authored in MDX, one instance per picture it replaces:
 *
 *     <ContainerLifecycle
 *       title="nginx:1.29-alpine"
 *       hint="Press a command and watch what survives"
 *       image={{ name: "nginx:1.29-alpine", layers: ["alpine", "nginx", "conf"] }}
 *       volume={{ name: "site", path: "/usr/share/nginx/html" }}
 *       write={{ item: "index.html" }}
 *       initial="plain"
 *       commands={{ run: "docker run -d", … }}
 *       labels={{ image: "Image (read-only)", … }}
 *       status={{ initialPlain: "…", removed: "…", … }}
 *     />
 */
export function ContainerLifecycle({
  title,
  hint,
  caption,
  ...content
}: Props) {
  const [state, dispatch] = useReducer(
    (current: ContainerState, action: ContainerAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )

  const statusText = fill(content.status[state.last], {
    item: content.write.item,
    volume: content.volume.name,
  })
  const containerLabel =
    state.container === "none"
      ? content.labels.none
      : state.container === "running"
        ? content.labels.running
        : content.labels.stopped

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={statusText}
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

      <div className="pp-explorable-stack">
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

        <span
          aria-hidden="true"
          className="pp-explorable-link"
          data-on={state.container !== "none" && state.withVolume}
        />

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
      </div>
    </Explorable>
  )
}
