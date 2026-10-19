import type { DataSource } from '../data/DataSource'
import type { Role } from '../lib/types'
import { GroupGate } from './GroupGate'

export const ROLE_LABEL: Record<Role, string> = { manager: 'Responsabile', member: 'Membro' }

export function PeoplePage({ source }: { source: DataSource }) {
  return (
    <GroupGate source={source}>
      {(group) => (
        <div className="page">
          <h1>Persone</h1>
          {group.members.length === 0 ? (
            <p>Nessuna persona nel gruppo.</p>
          ) : (
            <ul className="people" aria-label="Persone del gruppo">
              {group.members.map((m) => (
                <li key={m.id}>
                  <span>{m.name}</span>
                  <span className="role">{ROLE_LABEL[m.role]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </GroupGate>
  )
}
