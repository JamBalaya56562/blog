import rehypeShikiFromHighlighter from "@shikijs/rehype/core"
import type { ShikiTransformer } from "shiki"
import { createHighlighterCore, type HighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import { PROMPT_LINE } from "@/lib/prompt-line"

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
      // A terminal transcript: prompt lines are commands, the rest is what
      // they printed. `console` is the alias posts use on the fence.
      import("@shikijs/langs/shellsession"),
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

/**
 * Marks the command lines of a `console` fence with `data-cmd`, so the
 * terminal frame can tell them from the output around them and the copy
 * button can pick out just the commands. The grammar already colours the
 * prompt and the command, but leaves nothing on the line itself to say which
 * kind it is; the raw source is checked here because the tokens are already
 * split by then.
 */
const markCommandLines: ShikiTransformer = {
  line(node, line) {
    const lang = this.options.lang
    if (lang !== "console" && lang !== "shellsession") {
      return
    }
    const source = this.source.split("\n")[line - 1] ?? ""
    if (PROMPT_LINE.test(source)) {
      node.properties.dataCmd = ""
    }
  },
  name: "mark-command-lines",
}

export async function rehypeHighlight() {
  highlighter ??= loadHighlighter()

  const transform = rehypeShikiFromHighlighter(await highlighter, {
    addLanguageClass: true,
    defaultColor: false,
    fallbackLanguage: "text",
    /**
     * `title="mise.toml"` after the language on a fence, the way Docusaurus and
     * VitePress spell it. What is returned here is merged into the meta Shiki
     * puts on the `<pre>` it builds, so the title arrives as an attribute;
     * `mdx-components.tsx` takes it off there and draws the filename strip,
     * which also stops it from becoming a browser tooltip.
     */
    parseMetaString: (meta) => {
      const title = meta.match(/(?:^|\s)title="([^"]*)"/)?.[1]
      return title ? { title } : null
    },
    themes: THEMES,
    transformers: [markCommandLines],
  })

  return () => transform
}
