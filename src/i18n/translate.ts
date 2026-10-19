import type { MessageKey, Messages } from './messages/it'

export type Params = Record<string, string | number>
export type Translate = (key: MessageKey, params?: Params) => string

export function createTranslate(locale: string, messages: Messages): Translate {
  const rules = new Intl.PluralRules(locale)
  return (key, params = {}) => {
    const entry = messages[key]
    const raw =
      typeof entry === 'string'
        ? entry
        : ((entry as unknown as Record<string, string | undefined>)[rules.select(Number(params.count))] ?? entry.other)
    return raw.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole))
  }
}
