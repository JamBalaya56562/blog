import { mock } from "bun:test"

// Preload mock for lucide-react to resolve CJS/ESM interop issue in Bun.
// lucide-react v1.7.0 has no "exports" field in package.json, so Bun resolves
// the CJS entry point and fails to extract named ESM exports.
// Individual test files can override this mock with their own mock.module() call.
const Stub = () => null
mock.module("lucide-react", () => ({
  ArrowUp: Stub,
  BookOpen: Stub,
  Box: Stub,
  ExternalLink: Stub,
  FolderOpen: Stub,
  Globe: Stub,
  Heart: Stub,
  MapPin: Stub,
  Moon: Stub,
  Paintbrush: Stub,
  Puzzle: Stub,
  Sparkles: Stub,
  Sun: Stub,
  Terminal: Stub,
  User: Stub,
  Wrench: Stub,
}))
