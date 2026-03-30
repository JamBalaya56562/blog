import type { Locale } from "./config"

import en from "./dictionaries/en.json"
import ja from "./dictionaries/ja.json"

export type Dictionary = typeof en

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ja,
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
