import type { MessageKey, Messages } from './messages/it'

export type Params = Record<string, string | number>
export type Translate = (key: MessageKey, params?: Params) => string

export function createTranslate(locale: string, messages: Messages): Translate {
  const rules = new Intl.PluralRules(locale)
  return (key, params = {}) => {
    const entry = messages[key]
    let raw = typeof entry === 'string' ? entry : entry.other
    if (typeof entry !== 'string') {
      // Plural has no zero/two forms: those categories fall back to `other`.
      const category = rules.select(Number(params.count))
      if (category === 'one' || category === 'few' || category === 'many') raw = entry[category] ?? entry.other
    }
    return raw.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole))
  }
}
