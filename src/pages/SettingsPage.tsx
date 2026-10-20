import { useI18n } from '../i18n/I18nContext'
import { LanguageSelect } from '../i18n/LanguageSelect'
import type { DataSource } from '../data/DataSource'
import { GroupGate } from './GroupGate'

export function SettingsPage({ source, onLeave }: { source: DataSource; onLeave?: () => void }) {
  const { t } = useI18n()
  const leave = (
    <button type="button" className="button" onClick={onLeave}>
      {t('settings.leave')}
    </button>
  )
  return (
    <GroupGate source={source} extra={leave}>
      {(group) => (
        <div className="page">
          <h1>{t('settings.title')}</h1>
          <LanguageSelect />
          <dl className="card facts">
            <dt>{t('settings.timeZone')}</dt>
            <dd>{group.timeZone}</dd>
          </dl>
          <p className="hint">{t('settings.later')}</p>
          {leave}
        </div>
      )}
    </GroupGate>
  )
}
