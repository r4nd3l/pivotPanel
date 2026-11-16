import { test, expect } from '@playwright/test'

/** Idle gap on 2026-07-20 — no auto-resume slot */
const TEST_DATE = new Date('2026-07-20T12:00:00+02:00')

async function waitForHome(page) {
  await page.goto('./')
  await expect(page.getByText('Adatok betöltése…')).toBeHidden({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: /Love Nature/i })).toBeVisible({ timeout: 10_000 })
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
  const hasYt = await page.locator('#yt-player, .fixed.inset-0 iframe').count()
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
    await expect(page.getByRole('button', { name: /^7.TV Békéscsaba$/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^7.TV Békéscsaba - Este$/i })).toBeVisible()
  })

  test('schedule has no YouTube links left', async ({ page }) => {
    await expect(page.locator('#yt-player')).toHaveCount(0)
    const titles = await page.locator('button').allInnerTexts()
    for (const t of ['Love Nature - Természetfilm', 'Alföld TV', 'Oxygen Music - Zene']) {
      expect(titles.map((x) => x.trim())).toContain(t)
    }
  })

  // Every IPTV slot must actually reach playback (video fades in only on 'playing')
  for (const title of [
    '7.TV Békéscsaba',
    'Love Nature - Természetfilm',
    'Alföld TV',
    'Oxygen Music - Zene',
    '7.TV Békéscsaba - Este',
  ]) {
    test(`IPTV slot plays: ${title}`, async ({ page }) => {
      await page.getByRole('button', { name: title, exact: true }).first().click()
      await expect(modal(page)).toBeVisible({ timeout: 15_000 })
      await assertCloseButtonOnTop(page)
      await expect(modal(page).locator('video.opacity-100')).toBeVisible({ timeout: 30_000 })
      await closeButton(page).click()
      await expect(modal(page)).toBeHidden()
    })
  }

  test('auto-resumes current slot when page loads mid-program', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-07-20T10:15:00+02:00') })
    await page.goto('./')
    await expect(modal(page)).toBeVisible({ timeout: 20_000 })
    await assertCloseButtonOnTop(page)
    await expect(modal(page).locator('video')).toBeAttached()
  })
})

test.describe('2027 plan', () => {
  for (const [date, holiday] of [
    ['2027-01-01T12:00:00+01:00', 'Újév'],
    ['2027-12-24T12:00:00+01:00', 'Karácsony előestéje'],
  ]) {
    test(`loads plan_2027.json on ${date.slice(0, 10)} (${holiday})`, async ({ page }) => {
      await installClock(page, new Date(date))
      await waitForHome(page)
      await expect(page.getByText(holiday)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Alföld TV', exact: true })).toBeVisible()
    })
  }
})
