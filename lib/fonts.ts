import { JetBrains_Mono, Noto_Sans_JP, Orbitron } from "next/font/google"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  weight: ["400"],
})

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron-loaded",
  weight: ["400", "500", "700", "900"],
})

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  weight: ["400"],
})

export const fontVars = `${jetbrainsMono.variable} ${orbitron.variable} ${notoSansJp.variable}`
