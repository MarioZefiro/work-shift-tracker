import { useId, useState, type FormEvent } from 'react'
import { useI18n } from '../i18n/I18nContext'

export function NamePrompt({ onSubmit }: { onSubmit: (name: string) => Promise<void> }) {
  const { t } = useI18n()
  const nameId = useId()
  const hintId = useId()
  const [name, setName] = useState('')
  const [failed, setFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    setFailed(false)
    try {
      await onSubmit(trimmed)
    } catch {
      setFailed(true)
      setSaving(false)
    }
  }

  return (
    <main className="landing">
      <h1>{t('auth.name.title')}</h1>
      <form className="form" onSubmit={submit}>
        <label htmlFor={nameId}>{t('auth.name.label')}</label>
        <input id={nameId} required maxLength={60} autoComplete="name" aria-describedby={hintId} value={name} onChange={(e) => setName(e.target.value)} />
        <p id={hintId} className="hint">
          {t('auth.name.hint')}
        </p>
        <button type="submit" className="button" disabled={saving}>
          {t('auth.name.submit')}
        </button>
      </form>
      {failed && <p role="alert">{t('auth.name.error')}</p>}
    </main>
  )
}
