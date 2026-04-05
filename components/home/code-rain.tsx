"use client"

import { useEffect, useState } from "react"

const CODE_SNIPPETS = [
  "const app = next()",
  "export default function",
  "import { useState }",
  "async function fetch()",
  "<Component />",
  "npm install",
  "git commit -m",
  "return <div>",
  "interface Props {}",
  "type Result = string",
  "await db.query()",
  "console.log(data)",
  "useEffect(() => {})",
  "export const api =",
  "docker build -t",
  "bun run dev",
  "fn main() {}",
  "pub struct App",
  "impl Iterator",
  "match result {}",
]

interface FloatingCode {
  id: number
  text: string
  x: number
  duration: number
  delay: number
  size: number
}

function generateItems(count: number): FloatingCode[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    text: CODE_SNIPPETS[i % CODE_SNIPPETS.length],
    x: Math.random() * 100,
    duration: 18 + Math.random() * 24,
    delay: -(Math.random() * 30),
    size: 10 + Math.random() * 4,
  }))
}

export function CodeRain() {
  const [items, setItems] = useState<FloatingCode[]>([])

  useEffect(() => {
    setItems(generateItems(14))
  }, [])

  if (items.length === 0) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {items.map((item) => (
        <span
          key={item.id}
          className="absolute whitespace-nowrap font-mono text-primary/[0.08] dark:text-white/[0.08]"
          style={{
            left: `${item.x}%`,
            fontSize: `${item.size}px`,
            animation: `codeFloat ${item.duration}s linear ${item.delay}s infinite`,
          }}
        >
          {item.text}
        </span>
      ))}
    </div>
  )
}
