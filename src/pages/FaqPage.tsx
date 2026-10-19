import { useI18n } from '../i18n/I18nContext'

const FAQ = [
  { q: 'faq.q1', a: 'faq.a1' },
  { q: 'faq.q2', a: 'faq.a2' },
  { q: 'faq.q3', a: 'faq.a3' },
  { q: 'faq.q4', a: 'faq.a4' },
] as const

export function FaqPage() {
  const { t } = useI18n()
  return (
    <div className="page">
      <h1>{t('faq.title')}</h1>
      {FAQ.map(({ q, a }) => (
        <details key={q} className="faq">
          <summary>{t(q)}</summary>
          <p>{t(a)}</p>
        </details>
      ))}
    </div>
  )
}
