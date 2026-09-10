import rehypeShikiFromHighlighter from "@shikijs/rehype/core"
import { createHighlighterCore, type HighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

const THEMES = { dark: "night-owl", light: "github-light-default" } as const

let highlighter: Promise<HighlighterCore> | undefined

function loadHighlighter(): Promise<HighlighterCore> {
  return createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [
      import("@shikijs/langs/bash"),
      import("@shikijs/langs/css"),
      import("@shikijs/langs/diff"),
      import("@shikijs/langs/html"),
      import("@shikijs/langs/javascript"),
      import("@shikijs/langs/json"),
      import("@shikijs/langs/jsx"),
      import("@shikijs/langs/markdown"),
      import("@shikijs/langs/mdx"),
      // Posts that give a Windows alternative next to a shell command land
      // here; without it the block falls back to `text` and reads as one
      // undifferentiated line while the tab beside it is fully coloured.
      import("@shikijs/langs/powershell"),
      import("@shikijs/langs/toml"),
      import("@shikijs/langs/tsx"),
      import("@shikijs/langs/typescript"),
      import("@shikijs/langs/yaml"),
    ],
    themes: [
      import("@shikijs/themes/github-light-default"),
      import("@shikijs/themes/night-owl"),
    ],
  })
}

export async function rehypeHighlight() {
  highlighter ??= loadHighlighter()

  const transform = rehypeShikiFromHighlighter(await highlighter, {
    addLanguageClass: true,
    defaultColor: false,
    fallbackLanguage: "text",
    themes: THEMES,
  })

  return () => transform
}
