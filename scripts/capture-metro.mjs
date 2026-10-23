import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'domcontentloaded' })
  await page.getByText('Metro Population Regions — Interactive Map').first().click()
  // This PR includes a verified official dataset; a silent demo fallback is a regression.
  await page.getByText('U.S. Census Vintage 2025 · 359 lower-48 metros').first().waitFor({ state: 'visible' })
  await page.getByText('Data: U.S. Census Bureau Vintage 2025').first().waitFor({ state: 'visible' })
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
