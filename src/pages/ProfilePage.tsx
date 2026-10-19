import type { DataSource } from '../data/DataSource'
import { GroupGate } from './GroupGate'
import { ROLE_LABEL } from './PeoplePage'

export function ProfilePage({ source }: { source: DataSource }) {
  return (
    <GroupGate source={source}>
      {(group) => {
        const me = group.members.find((m) => m.id === source.userId)
        if (!me) return <p role="alert">Profilo non trovato.</p>
        return (
          <div className="page">
            <h1>{me.name}</h1>
            <dl className="card facts">
              <dt>Ruolo</dt>
              <dd>{ROLE_LABEL[me.role]}</dd>
              <dt>Gruppo</dt>
              <dd>{group.name}</dd>
            </dl>
          </div>
        )
      }}
    </GroupGate>
  )
}
