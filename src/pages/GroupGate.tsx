import type { ReactNode } from 'react'
import { useAsync } from '../app/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { LanguageSelect } from '../i18n/LanguageSelect'
import type { DataSource } from '../data/DataSource'
import type { Group } from '../lib/types'
import { LoadState } from './LoadState'

// Shared loading / error / ready handling for the read-only group pages.
// `extra` stays visible while loading or after an error, so a failed load never traps the user
// (language and demo exit remain reachable).
export function GroupGate({
  source,
  extra,
  children,
}: {
  source: DataSource
  extra?: ReactNode
  children: (group: Group) => ReactNode
}) {
  const { t } = useI18n()
  const { status, data: group, reload } = useAsync(() => source.group(), [source])

  if (!group) {
    return (
      <>
        <LoadState failed={status === 'error'} errorMessage={t('error.group')} onRetry={reload} />
        <LanguageSelect />
        {extra}
      </>
    )
  }
  return <>{children(group)}</>
}
