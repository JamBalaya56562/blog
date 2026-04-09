import { mock } from "bun:test"

// Preload mock for react to add ViewTransition which is not yet exported
// from the CJS entry point that Bun resolves in test environment.
// Instead of replacing the entire module (which breaks react-dom internals),
// we patch the ViewTransition export onto the existing react module.
const React = require("react")
if (!React.ViewTransition) {
  React.ViewTransition = ({
    children,
  }: {
    name?: string
    share?: string
    children: unknown
  }) => children
}

mock.module("react", () => React)
