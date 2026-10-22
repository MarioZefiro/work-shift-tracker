import { useId, useState, type FormEvent } from 'react'
import { usePending } from '../app/usePending'
import type { MyGroup } from '../data/supabase/groups'
import { useI18n } from '../i18n/I18nContext'
import { LanguageSelect } from '../i18n/LanguageSelect'
import { ROLE_LABEL } from './roles'

export function GroupsPage({
  groups,
  onOpen,
  onCreate,
  onInvite,
  onSignOut,
}: {
  groups: MyGroup[]
  onOpen: (groupId: string) => void
  onCreate: (name: string) => Promise<void>
  onInvite: (groupId: string) => Promise<string>
  onSignOut: () => void
}) {
  const { t } = useI18n()
  const nameId = useId()
  const [name, setName] = useState('')
  const [createFailed, setCreateFailed] = useState(false)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [inviteFailed, setInviteFailed] = useState(false)
  const [creating, runCreate] = usePending()
  const [inviting, runInvite] = usePending()

  async function create(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setCreateFailed(false)
    await runCreate(async () => {
      try {
        await onCreate(trimmed)
      } catch {
        setCreateFailed(true)
      }
    })
  }

  async function invite(groupId: string) {
    setInviteFailed(false)
    await runInvite(async () => {
      try {
        const link = await onInvite(groupId)
        setLinks((current) => ({ ...current, [groupId]: link }))
      } catch {
        setInviteFailed(true)
      }
    })
  }

  return (
    <main className="page">
      <h1>{t('groups.title')}</h1>
      {groups.length === 0 && <p>{t('groups.empty')}</p>}
      <ul className="group-list">
        {groups.map((g) => (
          <li key={g.id} className="card">
            <button type="button" className="button" onClick={() => onOpen(g.id)}>
              {g.name}
            </button>
            <span>{t(ROLE_LABEL[g.role])}</span>
            {g.role === 'manager' && (
              <button type="button" className="button button-secondary" disabled={inviting} onClick={() => invite(g.id)}>
                {t('groups.invite.create')}
                <span className="visually-hidden"> — {g.name}</span>
              </button>
            )}
            {links[g.id] && (
              <label>
                {t('groups.invite.created')}
                <input readOnly value={links[g.id]} onFocus={(e) => e.currentTarget.select()} />
              </label>
            )}
          </li>
        ))}
      </ul>
      {inviteFailed && <p role="alert">{t('groups.invite.error')}</p>}
      <form className="form" onSubmit={create}>
        <label htmlFor={nameId}>{t('groups.create.label')}</label>
        <input id={nameId} required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="button" disabled={creating}>
          {t('groups.create.submit')}
        </button>
      </form>
      {createFailed && <p role="alert">{t('groups.create.error')}</p>}
      <LanguageSelect />
      <button type="button" className="button button-secondary" onClick={onSignOut}>
        {t('auth.signOut')}
      </button>
    </main>
  )
}
