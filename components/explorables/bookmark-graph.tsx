"use client"

import { useReducer } from "react"
import {
  allowed,
  type BookmarkAction,
  type BookmarkContent,
  type BookmarkState,
  initialState,
  isInitial,
  reduce,
  rowsOf,
} from "@/lib/explorables/bookmark-graph"
import { fill } from "@/lib/explorables/format"
import { Explorable } from "./explorable"
import { GraphRows } from "./graph-rows"

type Props = BookmarkContent &
  Readonly<{
    title: string
    hint?: string
    caption?: string
  }>

const ACTIONS = ["commit", "bookmark", "push"] as const

/**
 * The same three commands run against Git and against jj, side by side.
 *
 * Press the first button and both graphs gain a commit — and Git's `main`
 * comes along with it while jj's stays where it was put. That is the whole
 * of the difference the section describes, and the reason the second button
 * exists at all: in jj, moving the name is a step you take.
 *
 * Authored in MDX, with the commands shown as the reader would type them:
 *
 *     <BookmarkGraph
 *       title="git / jj"
 *       hint="Press a command and watch which pointer moves"
 *       descs={["Add README", "Greet the world", "Add a licence note"]}
 *       empty="(empty) (no description set)"
 *       commands={{
 *         commit: { git: "git commit", jj: "jj describe + jj new" },
 *         bookmark: { git: "—", jj: "jj bookmark set main -r @-" },
 *         push: { git: "git push", jj: "jj git push --bookmark main" },
 *       }}
 *       labels={{ git: "Git", jj: "jj", head: "HEAD", at: "@", main: "main", remote: "origin/main" }}
 *       status={{ initial: "…", commit: "…{desc}…", bookmark: "…", push: "…" }}
 *     />
 *
 * Keep the descriptions short: the two columns sit side by side even on a
 * phone, so a long message wraps to several lines.
 */
export function BookmarkGraph({ title, hint, caption, ...content }: Props) {
  const [state, dispatch] = useReducer(
    (current: BookmarkState, action: BookmarkAction) =>
      reduce(current, action, content),
    content,
    initialState,
  )
  const lastDesc = content.descs[Math.max(0, state.next - 1)]

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={fill(content.status[state.last], { desc: lastDesc })}
      title={title}
    >
      <div className="pp-explorable-controls">
        {ACTIONS.map((type) => (
          <button
            className="pp-explorable-cmd pp-explorable-cmd-pair"
            disabled={!allowed(state, { type }, content)}
            key={type}
            onClick={() => dispatch({ type })}
            type="button"
          >
            <span>{content.commands[type].git}</span>
            <span>{content.commands[type].jj}</span>
          </button>
        ))}
      </div>
      <div className="pp-explorable-columns">
        <div>
          <p className="pp-explorable-column-head">{content.labels.git}</p>
          <GraphRows
            label={content.labels.git}
            rows={rowsOf(state.git, content, false)}
          />
        </div>
        <div>
          <p className="pp-explorable-column-head">{content.labels.jj}</p>
          <GraphRows
            label={content.labels.jj}
            rows={rowsOf(state.jj, content, true)}
          />
        </div>
      </div>
    </Explorable>
  )
}
