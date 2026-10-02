import * as React from "react"
import { z } from "zod"

// The lab's first (and reusable) i18n primitive (phase 33 t1). Every marketing-tier text prop is
// a { it, en } pair, never a hardcoded literal (CONTEXT.md rule 3). A component reads the active
// language from LangProvider via useLang() and resolves a LangText with pick(). The default is
// "it" so a component rendered with NO provider (e.g. the renderToStaticMarkup contract probe)
// still resolves one language's copy instead of throwing.

export const langTextSchema = z.object({
  it: z.string(),
  en: z.string(),
})

export type LangText = z.infer<typeof langTextSchema>

export type Lang = "it" | "en"

// The sensible default: Italian, so a provider-less render still has a language.
export const DEFAULT_LANG: Lang = "it"

// Resolve a { it, en } pair to the string for the active language.
export function pick(text: LangText, lang: Lang): string {
  return text[lang]
}

const LangContext = React.createContext<Lang>(DEFAULT_LANG)

export { LangContext }

export function LangProvider({ value, children }: { value: Lang; children: React.ReactNode }) {
  return React.createElement(LangContext.Provider, { value }, children)
}

export function useLang(): Lang {
  return React.useContext(LangContext)
}
