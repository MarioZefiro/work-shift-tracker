import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const PAGES = ['Home', 'Persone', 'Profilo', 'Impostazioni', 'FAQ']

async function expectNoViolations(page: import('@playwright/test').Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(violations).toEqual([])
}

test('landing has no accessibility violations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Prova la demo' })).toBeVisible()
  await expectNoViolations(page)
})

for (const name of PAGES) {
  test(`${name} has no accessibility violations`, async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Prova la demo' }).click()
    await page.getByRole('navigation', { name: 'Principale' }).getByRole('link', { name }).click()
    await expect(page.getByRole('link', { name, includeHidden: false })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('status')).toHaveCount(0)
    await expectNoViolations(page)
  })
}

test('Home with a month day selected has no accessibility violations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Prova la demo' }).click()
  const day = page.locator('button.day').first()
  await day.click()
  await expect(day).toHaveAttribute('aria-pressed', 'true')
  await expectNoViolations(page)
})
