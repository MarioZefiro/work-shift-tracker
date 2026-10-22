import axe from 'axe-core'
import { expect } from 'vitest'

// color-contrast is off: jsdom has no layout or computed colors, so it is covered by the Playwright axe run.
export async function expectNoA11yViolations(container: HTMLElement) {
  const { violations } = await axe.run(container, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    rules: { 'color-contrast': { enabled: false } },
  })
  const report = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
  expect(report).toEqual([])
}
