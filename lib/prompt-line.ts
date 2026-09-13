/**
 * The prompt characters the `shellsession` grammar accepts at the start of a
 * command line, in the set it uses, followed by the space after them. Shared
 * by the highlighter, which marks such lines, and the copy button, which
 * strips the prompt off — kept apart from `lib/highlight.ts` so the button
 * does not pull the highlighter into the client bundle.
 */
export const PROMPT_LINE = /^[#$%>❯➜]\s/
