# 0004. In-house i18n with Italian as the source of truth

## Status
Accepted

## Context
The UI ships in five languages (it, en, fr, es, de). Needs are small: flat strings, placeholders,
plurals, a language picker. An i18n library would be a dependency larger than the feature.

## Decision
- `src/i18n/messages/it.ts` defines the keys; `MessageKey` and `Messages` types derive from it, so each
  other locale file must provide every key (`src/i18n/messages/{en,fr,es,de}.ts`).
- `src/i18n/locales.ts` lists locales; adding one is a new messages file plus one entry.
- `createTranslate` (`src/i18n/translate.ts`) replaces `{name}` placeholders and picks plural forms with
  `Intl.PluralRules`.
- Locale resolution: stored choice, then `navigator.languages` by primary subtag, then `it`. Storage
  errors are tolerated.
- `src/i18n/i18n.test.tsx` checks, per locale, identical keys, no empty strings and identical placeholders
  versus `it`.

## Consequences
- Missing keys fail at type-check and in tests, not in production.
- Only `{name}` substitution and `Intl` plural categories: no gender, no rich-text or nested messages.
- Messages are bundled together; no lazy loading per language. Revisit when strings or locales grow
  enough to hurt bundle size, or if translators need an external workflow.
- Translation quality of non-Italian files is not reviewed by tests.
