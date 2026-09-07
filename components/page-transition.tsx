import type React from "react"
import { ViewTransition } from "react"

export function PageTransition({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ViewTransition
      default="none"
      enter={{
        default: "none",
        "nav-back": "nav-back",
        "nav-forward": "nav-forward",
      }}
      exit={{
        default: "none",
        "nav-back": "nav-back",
        "nav-forward": "nav-forward",
      }}
    >
      {children}
    </ViewTransition>
  )
}
