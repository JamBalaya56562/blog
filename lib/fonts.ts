import {
  JetBrains_Mono,
  M_PLUS_1_Code,
  Noto_Sans_JP,
  Orbitron,
} from "next/font/google"

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

export const fontVars = `${jetbrainsMono.variable} ${orbitron.variable} ${notoSansJp.variable} ${mPlus1Code.variable}`
