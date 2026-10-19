import type { Group, Shift } from '../lib/types'

export interface DataSource {
  readonly userId: string
  group(): Promise<Group>
  // from/to are inclusive local ISO dates (YYYY-MM-DD) in the group's time zone.
  shifts(range: { from: string; to: string }): Promise<Shift[]>
}
