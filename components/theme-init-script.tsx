const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}})()`

export function ThemeInitScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: A synchronous inline script in <head> is the only thing that can set the theme class before first paint; anything deferred flashes the wrong theme at dark-mode readers.
  return <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
}
