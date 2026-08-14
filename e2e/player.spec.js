import { test, expect } from '@playwright/test'

/** Idle gap on 2026-07-20 — no auto-resume slot */
const TEST_DATE = new Date('2026-07-20T12:00:00+02:00')

async function waitForHome(page) {
  await page.goto('./')
  await expect(page.getByText('Adatok betöltése…')).toBeHidden({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: /Poirot/i })).toBeVisible({ timeout: 10_000 })
}

async function installClock(page, date = TEST_DATE) {
  await page.clock.install({ time: date })
}

function modal(page) {
  return page.locator('.fixed.inset-0.z-50.bg-black')
}

function closeButton(page) {
  return page.getByRole('button', { name: 'Close', exact: true })
}

async function assertCloseButtonOnTop(page) {
  const btn = closeButton(page)
  await expect(btn).toBeVisible()
  const box = await btn.boundingBox()
  expect(box).toBeTruthy()
  const centerX = box.x + box.width / 2
  const centerY = box.y + box.height / 2
  const topEl = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y)
    return el?.closest('button')?.getAttribute('aria-label') ?? el?.tagName ?? null
  }, { x: centerX, y: centerY })
  expect(topEl).toBe('Close')
}

async function assertNotStuckBlack(page) {
  const modalEl = modal(page)
  await expect(modalEl).toBeVisible()

  const hasSpinner = await modalEl.locator('.animate-spin').isVisible()
  const hasIframe = await modalEl.locator('iframe').count()
  const hasVideo = await modalEl.locator('video').count()
  const hasYt = await page.locator('#yt-player iframe').count()
  const hasError = await modalEl.getByText(/nem elérhető|Unavailable/i).isVisible().catch(() => false)

  expect(hasSpinner || hasIframe > 0 || hasVideo > 0 || hasYt > 0 || hasError).toBeTruthy()
}

test.describe('PivotPanel player', () => {
  test.beforeEach(async ({ page }) => {
    await installClock(page)
    await waitForHome(page)
  })

  test('loads embedded schedule without ?schedule= param', async ({ page }) => {
    await expect(page).toHaveURL(/\/pivotPanel\/?$/)
    await expect(page.getByRole('button', { name: /^HírTV$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Poirot/i })).toBeVisible()
  })

  test('Videa film: close button visible and on top', async ({ page }) => {
    await page.getByRole('button', { name: /Hogyan tegyünk boldoggá/i }).click()
    await expect(modal(page)).toBeVisible()
    await assertCloseButtonOnTop(page)
    await assertNotStuckBlack(page)
    await closeButton(page).click()
    await expect(modal(page)).toBeHidden()
  })

  test('Poirot YouTube: modal opens with close button', async ({ page }) => {
    await page.getByRole('button', { name: /Poirot/i }).click()
    await expect(modal(page)).toBeVisible()
    await assertCloseButtonOnTop(page)
    await expect(modal(page).getByText(/Csatorna betöltése|Betöltés|Loading/i)).toBeVisible()
    await closeButton(page).click()
    await expect(modal(page)).toBeHidden()
  })

  test('HLS news: close button works even if stream fails', async ({ page }) => {
    await page.getByRole('button', { name: /^HírTV$/i }).click()
    await expect(modal(page)).toBeVisible()
    await assertCloseButtonOnTop(page)
    await assertNotStuckBlack(page)
    await closeButton(page).click()
    await expect(modal(page)).toBeHidden()
  })

  test('Videa transitions from loading to ready within 10s', async ({ page }) => {
    await page.getByRole('button', { name: /Sötét Lovak/i }).click()
    await expect(modal(page)).toBeVisible()
    await assertCloseButtonOnTop(page)

    await expect(modal(page).locator('iframe')).toBeAttached({ timeout: 10_000 })

    await page.clock.runFor(2_000)

    await expect(modal(page).getByText('Csatorna betöltése...')).toBeHidden({ timeout: 5_000 })

    await page.screenshot({ path: 'e2e/screenshots/videa-playing.png', fullPage: true })
  })

  test('auto-resumes current slot when page loads mid-program', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-07-20T10:15:00+02:00') })
    await page.goto('./')
    await expect(modal(page)).toBeVisible({ timeout: 15_000 })
    await assertCloseButtonOnTop(page)
    await expect(page.getByText(/Hogyan tegyünk boldoggá/i)).toBeVisible()
  })
})
