import type { DataSource } from '../data/DataSource'
import { GroupGate } from './GroupGate'

export function SettingsPage({ source, onLeave }: { source: DataSource; onLeave?: () => void }) {
  return (
    <GroupGate source={source}>
      {(group) => (
        <div className="page">
          <h1>Impostazioni</h1>
          <dl className="card facts">
            <dt>Fuso orario del gruppo</dt>
            <dd>{group.timeZone}</dd>
          </dl>
          <p className="hint">Le modifiche e le notifiche arriveranno in una versione successiva.</p>
          <button type="button" className="button" onClick={onLeave}>
            Esci dalla demo
          </button>
        </div>
      )}
    </GroupGate>
  )
}
