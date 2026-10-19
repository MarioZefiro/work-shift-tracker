import type { DataSource } from '../data/DataSource'
import { useI18n } from '../i18n/I18nContext'
import type { MessageKey } from '../i18n/messages/it'
import type { Role } from '../lib/types'
import { GroupGate } from './GroupGate'

export const ROLE_LABEL: Record<Role, MessageKey> = { manager: 'role.manager', member: 'role.member' }

export function PeoplePage({ source }: { source: DataSource }) {
  const { t } = useI18n()
  return (
    <GroupGate source={source}>
      {(group) => (
        <div className="page">
          <h1>{t('people.title')}</h1>
          {group.members.length === 0 ? (
            <p>{t('people.empty')}</p>
          ) : (
            <ul className="people" aria-label={t('people.list')}>
              {group.members.map((m) => (
                <li key={m.id}>
                  <span>{m.name}</span>
                  <span className="role">{t(ROLE_LABEL[m.role])}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </GroupGate>
  )
}
