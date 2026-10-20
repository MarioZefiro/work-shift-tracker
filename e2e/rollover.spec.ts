import { expect, test } from '@playwright/test'

test('home date follows the midnight rollover', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T21:59:00Z') }) // 23:59 Rome
  await page.goto('/')
  await page.getByRole('button', { name: 'Prova la demo' }).click()
  const h1 = page.getByRole('heading', { level: 1 })
  await expect(h1).toContainText('20 ottobre')
  await page.clock.fastForward('02:00')
  await expect(h1).toContainText('21 ottobre')
})
