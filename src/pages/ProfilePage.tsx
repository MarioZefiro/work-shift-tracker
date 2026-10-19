import { useI18n } from '../i18n/I18nContext'
import type { DataSource } from '../data/DataSource'
import { GroupGate } from './GroupGate'
import { ROLE_LABEL } from './PeoplePage'

export function ProfilePage({ source }: { source: DataSource }) {
  const { t } = useI18n()
  return (
    <GroupGate source={source}>
      {(group) => {
        const me = group.members.find((m) => m.id === source.userId)
        if (!me) return <p role="alert">{t('profile.notFound')}</p>
        return (
          <div className="page">
            <h1>{me.name}</h1>
            <dl className="card facts">
              <dt>{t('profile.role')}</dt>
              <dd>{t(ROLE_LABEL[me.role])}</dd>
              <dt>{t('profile.group')}</dt>
              <dd>{group.name}</dd>
            </dl>
          </div>
        )
      }}
    </GroupGate>
  )
}
