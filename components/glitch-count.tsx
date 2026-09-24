"use client"

import { useEffect, useRef, useState } from "react"

const PLACEHOLDER = "----"
const LOADING_DIGITS = "0000"
const SCRAMBLE_MS = 55
const SETTLE_STEP_MS = 110

function randomDigit(): string {
  return String(Math.floor(Math.random() * 10))
}

function scrambled(template: string, keep: number): string {
  return Array.from(template, (char, i) =>
    i < keep || !/\d/.test(char) ? char : randomDigit(),
  ).join("")
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type State = "loading" | "settling" | "settled"

/**
 * A number that scrambles while it is unknown and locks in digit by digit,
 * left to right, once it arrives.
 *
 * The server renders dashes rather than a figure: the only figure it has is
 * the one frozen into the page's cache entry, which is exactly what this
 * replaces. Random digits cannot be rendered there either, since the client
 * would hydrate with different ones.
 */
export function GlitchCount({ value }: { readonly value: number | null }) {
  const [text, setText] = useState(PLACEHOLDER)
  const [state, setState] = useState<State>("loading")
  const [locked, setLocked] = useState(0)
  const lockedRef = useRef(0)

  const target = value === null ? null : value.toLocaleString()

  useEffect(() => {
    if (prefersReducedMotion()) {
      if (target !== null) {
        setText(target)
        setState("settled")
      }
      return
    }

    if (target === null) {
      const id = setInterval(() => {
        setText(scrambled(LOADING_DIGITS, 0))
      }, SCRAMBLE_MS)
      return () => clearInterval(id)
    }

    lockedRef.current = 0
    setLocked(0)
    setState("settling")
    const scramble = setInterval(() => {
      setText(scrambled(target, lockedRef.current))
    }, SCRAMBLE_MS)
    const settle = setInterval(() => {
      lockedRef.current += 1
      setLocked(lockedRef.current)
      if (lockedRef.current >= target.length) {
        clearInterval(scramble)
        clearInterval(settle)
        setText(target)
        setState("settled")
      }
    }, SETTLE_STEP_MS)
    return () => {
      clearInterval(scramble)
      clearInterval(settle)
    }
  }, [target])

  return (
    <>
      <span
        aria-hidden="true"
        className="pp-num pp-glitch-count text-cyber-cyan"
        data-state={state}
        data-text={text}
      >
        {Array.from(text, (char, i) => (
          <span
            // Positions, not items: the same slot holds a different digit on
            // every tick.
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            key={i}
            data-locked={state === "settled" || i < locked ? "" : undefined}
          >
            {char}
          </span>
        ))}
      </span>
      {state === "settled" && <span className="sr-only">{target}</span>}
    </>
  )
}
