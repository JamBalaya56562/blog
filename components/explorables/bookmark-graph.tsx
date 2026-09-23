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
import type { GraphRowView } from "@/lib/explorables/graph"
import { Explorable } from "./explorable"
import { Frame } from "./frame"
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

  /**
   * Every drawing each column can be put into, by any run of the three
   * commands.
   *
   * Committing is not the only thing that changes a column's height: a name
   * sits on the row it points at, so pushing before the last commits leaves
   * origin/main on an old row while main is on a new one, and the column
   * takes a line for each of them instead of one line for both. Which
   * arrangement is tallest is a question about wrapping at a width nobody
   * here knows, so the drawings are not weighed against each other — all of
   * them are laid into the column, and the grid answers it.
   *
   * The columns are walked apart and deduped by what they draw: the states
   * number a couple of dozen, and most of them draw a column that another
   * one already drew.
   */
  const drawings = (() => {
    const git = new Map<string, readonly GraphRowView[]>()
    const jj = new Map<string, readonly GraphRowView[]>()
    const seen = new Set<string>()
    const queue: BookmarkState[] = [initialState(content)]
    while (queue.length > 0) {
      const at = queue.shift() as BookmarkState
      const key = JSON.stringify(at)
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      const here = {
        git: rowsOf(at.git, content, false),
        jj: rowsOf(at.jj, content, true),
      }
      git.set(JSON.stringify(here.git), here.git)
      jj.set(JSON.stringify(here.jj), here.jj)
      for (const type of ACTIONS) {
        if (allowed(at, { type }, content)) {
          queue.push(reduce(at, { type }, content))
        }
      }
    }
    return { git, jj }
  })()

  /** The column as it is now, then every other way it can be drawn. */
  function column(side: "git" | "jj") {
    const live = rowsOf(state[side], content, side === "jj")
    const key = JSON.stringify(live)
    return [
      live,
      ...[...drawings[side]].flatMap(([at, rows]) =>
        at === key ? [] : [rows],
      ),
    ]
  }

  /** Every sentence the figure can say, for each commit it can name. */
  const statuses = Object.values(content.status).flatMap((sentence) =>
    content.descs.map((desc) => fill(sentence, { desc })),
  )

  return (
    <Explorable
      caption={caption}
      hint={hint}
      onReset={() => dispatch({ type: "reset" })}
      pristine={isInitial(state, content)}
      status={fill(content.status[state.last], { desc: lastDesc })}
      statuses={statuses}
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
        {(["git", "jj"] as const).map((side) => (
          <div key={side}>
            <p className="pp-explorable-column-head">{content.labels[side]}</p>
            <Frame
              active={0}
              panes={column(side).map((rows) => (
                <GraphRows
                  key={JSON.stringify(rows)}
                  label={content.labels[side]}
                  rows={rows}
                />
              ))}
            />
          </div>
        ))}
      </div>
    </Explorable>
  )
}
