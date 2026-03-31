const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}})()`

export function ThemeInitScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: Synchronous inline script in <head> is required for FOUC prevention before React hydration. next/script with beforeInteractive does not guarantee execution before first paint.
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
}
