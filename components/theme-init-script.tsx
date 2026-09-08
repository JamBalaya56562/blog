/**
 * Runs in <head>, before <body> parses, so the `dark` class is on <html> by the
 * time anything paints. Nothing else in the pipeline is early enough: a class
 * applied after hydration means dark-mode readers see a white flash first.
 *
 * The claim that used to sit here — that `next/script` with `beforeInteractive`
 * cannot guarantee this — no longer holds. Tried against Next 16, it emits the
 * script inline in <head> ahead of <body> and the theme applies correctly. It
 * is not worth switching to: it renders the same `<script>` through React, so
 * it changes nothing that matters and adds an import.
 *
 * React logs "Encountered a script tag while rendering React component" in dev
 * when a 404 re-renders this subtree on the client. That warning is accurate
 * and harmless — the script ran from the initial HTML long before — and it does
 * not appear in a production build. Avoiding it would mean reading the theme
 * from a cookie on the server, which makes every route dynamic and gives up the
 * static prerendering the whole site is built on.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}})()`

export function ThemeInitScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: A synchronous inline script in <head> is the only thing that can set the theme class before first paint; anything deferred flashes the wrong theme at dark-mode readers.
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
}
