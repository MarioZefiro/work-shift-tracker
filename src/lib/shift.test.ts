import { expect, test } from 'vitest'
import { isRest, parseShiftCode } from './shift'

test('isRest is true only for R', () => {
  expect(isRest('R')).toBe(true)
  expect(['M', 'P', 'N'].map((c) => isRest(parseShiftCode(c)))).toEqual([false, false, false])
})

test('parseShiftCode accepts known codes and throws on unknown ones', () => {
  expect(parseShiftCode('N')).toBe('N')
  expect(() => parseShiftCode('X')).toThrow(RangeError)
  expect(() => parseShiftCode('m')).toThrow(/unknown shift code "m"/)
})
