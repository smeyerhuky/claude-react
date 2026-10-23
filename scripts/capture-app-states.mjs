import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
const directory = 'docs/screenshots'
await mkdir(directory, { recursive: true })
const manifest = { version: 1, generatedAt: new Date().toISOString(), states: [] }
try {
  for (const spec of [
    { name: 'desktop-home', width: 1440, height: 900, details: false },
    { name: 'desktop-city-details', width: 1440, height: 900, details: true },
    { name: 'mobile-home', width: 390, height: 844, details: false },
    { name: 'mobile-city-details', width: 390, height: 844, details: true },
  ]) {
    const page = await browser.newPage({ viewport: { width: spec.width, height: spec.height }, deviceScaleFactor: 1 })
    try {
      await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'domcontentloaded' })
      await page.getByText('Metro Population Regions — Interactive Map').first().click()
      await page.getByTestId('metro-app').waitFor()
      if (spec.details) {
        await page.getByRole('button', { name: 'Open metro search' }).click()
        const search = page.getByRole('searchbox')
        await search.fill('Denver')
        await page.getByRole('option', { name: /Denver-Aurora/ }).first().click()
        await page.getByTestId('metro-details').getByText('19740').waitFor()
      }
      await page.evaluate(() => document.fonts.ready)
      const dimensions = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }))
      // New full-viewport interface: neither document axis may overflow.
      const path = `${directory}/${spec.name}.png`
      await page.screenshot({ path, fullPage: false, animations: 'disabled' })
      const sha256 = createHash('sha256').update(await readFile(path)).digest('hex')
      manifest.states.push({ name: spec.name, ...dimensions, horizontalFit: dimensions.documentWidth <= spec.width + 1,
        verticalFit: dimensions.documentHeight <= spec.height + 1, sha256, path })
      if (dimensions.documentHeight > spec.height + 1) throw Error(`Vertical page overflow in ${spec.name}: ${dimensions.documentHeight} > ${spec.height}`)
      if (dimensions.documentWidth > spec.width + 1) {
        throw Error(`Horizontal page overflow in ${spec.name}: ${dimensions.documentWidth} > ${spec.width}`)
      }
    } finally {
      await page.close()
    }
  }
} finally {
  await writeFile(`${directory}/visual-manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
  await browser.close()
}
console.log(JSON.stringify(manifest.states.map(({name,horizontalFit,verticalFit})=>({name,horizontalFit,verticalFit}))))
