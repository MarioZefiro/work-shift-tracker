import { useI18n } from '../i18n/I18nContext'

interface Props {
  failed: boolean
  errorMessage: string
  onRetry: () => void
  tall?: boolean // home has a taller third placeholder for the month grid
}

export function LoadState({ failed, errorMessage, onRetry, tall }: Props) {
  const { t } = useI18n()
  if (failed) {
    return (
      <div role="alert" className="card">
        <p>{errorMessage}</p>
        <button type="button" className="button" onClick={onRetry}>
          {t('state.retry')}
        </button>
      </div>
    )
  }
  return (
    <div role="status" className="skeleton-wrap">
      <span className="visually-hidden">{t('state.loading')}</span>
      <div className="skeleton" aria-hidden="true" />
      <div className="skeleton" aria-hidden="true" />
      {tall && <div className="skeleton tall" aria-hidden="true" />}
    </div>
  )
}
