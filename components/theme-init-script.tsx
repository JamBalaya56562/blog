export function ThemeInitScript() {
  const script = `
(function() {
  try {
    var theme = localStorage.getItem("theme")
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  } catch (e) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }
})()
`

  // biome-ignore lint/security/noDangerouslySetInnerHtml: Inline script required for FOUC prevention before React hydration
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
