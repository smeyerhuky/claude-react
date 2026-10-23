import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'domcontentloaded' })
  await page.getByText('Metro Population Regions — Interactive Map').first().click()
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
  // Compare shaded pixels against the actual rendered SVG state geometry over a
  // dense lattice. This catches off-land spillover missed by corner probes.
  const leakage = await page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="metro-shading-canvas"]')
    const svg = canvas.parentElement.querySelector('svg')
    const context = canvas.getContext('2d')
    const paths = [...svg.querySelectorAll('g[fill="none"] path')]
    let outside = 0, filled = 0
    const pt = svg.createSVGPoint()
    for (let y=4; y<620; y+=8) for (let x=4; x<1000; x+=8) {
      pt.x=x; pt.y=y
      const onLand = paths.some(path => path.isPointInFill(pt))
      const alpha = context.getImageData(x,y,1,1).data[3]
      if (alpha>0) filled++
      if (alpha>0 && !onLand) outside++
    }
    return {outside, filled, statePaths:paths.length}
  })
  if (leakage.outside > 1 || leakage.filled < 300) throw new Error('Geographic fill outside state outline: '+JSON.stringify(leakage))
  console.log('Captured docs/screenshots/metro-default.png; verified transparent external probes', test)
} finally {
  await browser.close()
}
