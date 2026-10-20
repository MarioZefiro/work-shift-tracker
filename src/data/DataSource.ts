import type { Group, Shift } from '../lib/types'

// A source is bound to one group. Read-only because Piano 1 screens never write.
export interface DataSource {
  readonly userId: string
  group(): Promise<Group>
  // from/to are inclusive local ISO dates (YYYY-MM-DD) in the group's time zone.
  shifts(range: { from: string; to: string }): Promise<Shift[]>
}
