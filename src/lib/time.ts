export class NonexistentLocalTimeError extends Error {}
export class AmbiguousLocalTimeError extends Error {}

const DAY_MS = 24 * 60 * 60 * 1000

function formatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function wallClock(instant: Date, timeZone: string): Record<string, string> {
  const parts: Record<string, string> = {}
  for (const p of formatter(timeZone).formatToParts(instant)) parts[p.type] = p.value
  return parts
}

// Wall-clock fields of an instant, read as if they were UTC.
function wallAsUtcMs(instant: Date, timeZone: string): number {
  const p = wallClock(instant, timeZone)
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
}

export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const wall = Date.UTC(y, mo - 1, d, h, mi)

  // Offsets a day either side bracket any single DST transition near `wall`.
  const candidates = new Set<number>()
  for (const probe of [wall - DAY_MS, wall + DAY_MS]) {
    const offset = wallAsUtcMs(new Date(probe), timeZone) - probe
    const guess = wall - offset
    if (wallAsUtcMs(new Date(guess), timeZone) === wall) candidates.add(guess)
  }

  if (candidates.size === 0) throw new NonexistentLocalTimeError(`${date} ${time} does not exist in ${timeZone}`)
  if (candidates.size > 1) throw new AmbiguousLocalTimeError(`${date} ${time} is ambiguous in ${timeZone}`)
  return new Date([...candidates][0])
}

export function localDateIn(instant: Date, timeZone: string): string {
  const p = wallClock(instant, timeZone)
  return `${p.year}-${p.month}-${p.day}`
}
