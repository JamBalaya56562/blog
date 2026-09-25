/**
 * The prompt characters the posts use at the start of a command line,
 * followed by the space after them — a subset of what the `shellsession`
 * grammar accepts, which also takes Greek letters and a `user@host:path` or
 * `(venv)` style prefix. Shared by the highlighter, which marks such lines,
 * and the copy button, which strips the prompt off — kept apart from
 * `lib/highlight.ts` so the button does not pull the highlighter into the
 * client bundle.
 */
export const PROMPT_LINE = /^[#$%>❯➜]\s/
