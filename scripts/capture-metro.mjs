import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'domcontentloaded' })
  await page.getByText('Metro Population Regions — Interactive Map').first().click()
  // This PR includes a verified official dataset; a silent demo fallback is a regression.
  await page.getByTestId('metro-app').waitFor()
  // Wait for the official dataset, projected state outlines, and finished Canvas paint.
  await page.locator('[data-testid="metro-app"][data-source-kind="census"]').waitFor({ timeout: 30000 })
  await page.waitForFunction(() => {
    const canvas = document.querySelector('[data-testid="metro-shading-canvas"]')
    const svg = document.querySelector('svg[role="img"]')
    if (!canvas || canvas.dataset.renderReady !== 'true' || !svg?.querySelector('path[d]')) return false
    const ctx = canvas.getContext('2d')
    return ctx && ctx.getImageData(500, 310, 1, 1).data[3] > 0
  }, null, { timeout: 30000 })

  await page.getByRole('button', { name: 'Open metro search' }).click()
  const search = page.getByRole('searchbox')
  await search.fill('Denver')
  const searchPanel = page.getByRole('region', { name: 'Metro search' })
  const result = page.getByRole('option', { name: /Denver-Aurora/ }).first()
  await result.waitFor()
  const colors = await result.evaluate(el => {
    const row = el.closest('div')
    const text = getComputedStyle(el.querySelector('span') || el).color
    const background = getComputedStyle(row).backgroundColor
    const pin = getComputedStyle(row.querySelector('button[aria-label^="Pin"]'))
    return { text, background, pinText: pin.color, pinBackground: pin.backgroundColor }
  })
  if (colors.text !== 'rgb(15, 23, 42)' || colors.background !== 'rgb(255, 255, 255)' || colors.pinText !== 'rgb(15, 23, 42)') {
    throw Error('Search contrast regression: ' + JSON.stringify(colors))
  }
  await searchPanel.getByRole('button', { name: 'Clear metro search' }).click()
  if (await search.inputValue() !== '') throw Error('Search clear button failed')
  await search.fill('Denver')
  await page.getByRole('option', { name: /Denver-Aurora/ }).first().click()
  const details = page.getByTestId('metro-details')
  await details.getByText('19740').waitFor()
  await details.getByRole('heading', { name: 'Denver-Aurora-Centennial, CO Metro Area' }).waitFor()
  await mkdir('docs/screenshots', { recursive: true })
  await page.screenshot({ path: 'docs/screenshots/metro-search-details.png' })
  await page.getByRole('button', { name: 'Open metro search' }).count() && await page.getByRole('button', { name: 'Close metro search' }).click()
  await page.getByRole('button', { name: 'Full map' }).click()
  const canvas = page.locator('[data-testid="metro-shading-canvas"]')
  await canvas.waitFor({ state: 'visible' })
  await page.waitForFunction(() => {
    const canvas = document.querySelector('[data-testid="metro-shading-canvas"]')
    return canvas && canvas.getContext('2d').getImageData(500,310,1,1).data[3] > 0
  }, null, { timeout: 20000 })
  // The map's canvas must be fully transparent at locations outside the US.
  const test = await canvas.evaluate(el => {
    const ctx=el.getContext('2d')
    const probes=[[10,10],[990,10],[10,600],[990,600],[500,20],[500,600],[25,310]]
    return probes.map(([x,y])=>({x,y,alpha:ctx.getImageData(x,y,1,1).data[3]}))
  })
  await mkdir('docs/screenshots', { recursive: true })
  await canvas.locator('xpath=..').screenshot({ path: 'docs/screenshots/metro-default.png' })
  if (test.some(p => p.alpha !== 0)) throw new Error('Canvas boundary spillover: '+JSON.stringify(test))
  const geometryCheck = await canvas.evaluate(el => {
    const ctx = el.getContext('2d')
    const grid = { interior: 0, exterior: 0 }
    // A completely transparent canvas is not a valid clipping fix.
    for (let y = 50; y < 550; y += 10) for (let x = 50; x < 950; x += 10) {
      const alpha = ctx.getImageData(x,y,1,1).data[3]
      if (alpha > 0) grid.interior++
      else grid.exterior++
    }
    return grid
  })
  if (geometryCheck.interior < 300 || geometryCheck.exterior < 200) throw new Error('Suspicious geographic mask: '+JSON.stringify(geometryCheck))
  console.log('Captured docs/screenshots/metro-default.png; verified transparent external probes', test)
} finally {
  await browser.close()
}
