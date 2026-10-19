export type ShiftCode = 'M' | 'P' | 'N' | 'R'
export type Role = 'manager' | 'member'

export interface ShiftType {
  code: ShiftCode
  label: string
  startTime: string
  durationMinutes: number
}

export interface Shift {
  id: string
  userId: string
  code: ShiftCode
  startsAt: string
  endsAt: string
}

export interface Member {
  id: string
  name: string
  role: Role
}

export interface Group {
  id: string
  name: string
  timeZone: string
  members: Member[]
  shiftTypes: ShiftType[]
}
