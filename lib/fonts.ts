import {
  JetBrains_Mono,
  M_PLUS_1_Code,
  Noto_Sans_JP,
  Orbitron,
} from "next/font/google"

/**
 * The site's four typefaces, declared once.
 *
 * `app/[locale]/layout.tsx` is not the only document root any more:
 * `app/global-error.tsx` replaces the root layout when it renders, so it has to
 * bring its own fonts rather than inherit the ones the layout puts on `<html>`.
 * Two copies of these loaders would drift, and the symptom — the failure page
 * rendering in a fallback stack — is one nobody would notice.
 *
 * `next/font` reads these arguments at build time, so they have to stay literal
 * module-scope calls.
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  weight: ["300", "400", "500", "700"],
})

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron-loaded",
  weight: ["400", "500", "700", "900"],
})

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  weight: ["300", "400", "500", "700", "900"],
})

const mPlus1Code = M_PLUS_1_Code({
  subsets: ["latin"],
  variable: "--font-jp-mono-loaded",
  weight: ["400", "500", "700"],
})

/**
 * The four generated CSS variables, ready for the `className` of an `<html>`
 * element. `app/globals.css` reads them through its `--blog-font-*` tokens and
 * falls back to system faces when they are absent.
 */
export const fontVars = `${jetbrainsMono.variable} ${orbitron.variable} ${notoSansJp.variable} ${mPlus1Code.variable}`
