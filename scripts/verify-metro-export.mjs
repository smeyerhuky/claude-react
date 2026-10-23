import { chromium } from 'playwright'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

// Validate downloaded *pixels*, not only the PNG header. Samples intentionally
// tolerate font anti-aliasing while detecting missing map, SVG or footer layers.
const outputDir = 'docs/screenshots'
const cases = [
  { name: 'metro-export-default', hash: '#/metro-population-voronoi', pins: 0 },
  { name: 'metro-export-denver-selected', hash: '#/metro-population-voronoi?city=19740', pins: 0, selected: true },
  { name: 'metro-export-six-pins', hash: '#/metro-population-voronoi?city=19740&pins=19740,35620,31080,16980,19100,26420&compare=1', pins: 6, selected: true },
]
const browser = await chromium.launch({ headless: true })
const report = []
await mkdir(outputDir, { recursive: true })
try {
  for (const spec of cases) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true })
    try {
      await page.goto('http://127.0.0.1:4173/' + spec.hash, { waitUntil: 'domcontentloaded' })
      await page.locator('[data-testid="metro-app"][data-source-kind="census"]').waitFor({ timeout: 30000 })
      await page.waitForFunction(() => {
        const canvas = document.querySelector('[data-testid="metro-shading-canvas"]')
        return canvas?.dataset.renderReady === 'true' && !!document.querySelector('[data-testid="map-shell"] svg[role="img"] path[d]')
      }, null, { timeout: 30000 })
      if (spec.selected) await page.locator('[data-metro-marker="19740"][data-selected="true"]').waitFor()
      if (spec.pins) {
        await page.locator('[data-metro-marker="19740"][data-pinned="true"]').waitFor()
        await page.getByRole('button', { name: 'Compare pinned cities' }).waitFor({ state: 'attached' })
      }
      const before = await page.evaluate(() => ({ hash: location.hash, pinned: document.querySelectorAll('[data-metro-marker][data-pinned="true"]').length }))
      const downloadEvent = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Download map PNG' }).click()
      const download = await downloadEvent
      if (download.suggestedFilename() !== 'metro-population-map.png') throw Error('Unexpected export filename')
      const bytes = await readFile(await download.path())
      if (bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw Error('Invalid PNG signature')
      const file = outputDir + '/' + spec.name + '.png'
      await writeFile(file, bytes)
      const inspected = await page.evaluate(async ({ base64, pinCount, selected }) => {
        const source = 'data:image/png;base64,' + base64
        const image = new Image()
        image.src = source
        await image.decode()
        const c = document.createElement('canvas')
        c.width = image.naturalWidth
        c.height = image.naturalHeight
        const ctx = c.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(image, 0, 0)
        const pixel = (x, y) => [...ctx.getImageData(x, y, 1, 1).data]
        const grid = (x0, y0, x1, y1, stride) => {
          const unique = new Set(), count = { nonwhite: 0, dark: 0, orange: 0 }
          for (let y = y0; y < y1; y += stride) for (let x = x0; x < x1; x += stride) {
            const [r,g,b,a] = pixel(x,y)
            if (a !== 255) throw Error('Unexpected transparent export pixel at ' + x + ',' + y)
            unique.add([r>>4,g>>4,b>>4].join(','))
            if (Math.min(r,g,b) < 235) count.nonwhite++
            if (Math.max(r,g,b) < 155) count.dark++
            if (r > 130 && r > g * 1.3 && g > b * 1.15) count.orange++
          }
          return { ...count, colors: unique.size }
        }
        const map = grid(60, 70, 1940, 1170, 18)
        const header = grid(30, 1250, 1950, 1370, 4)
        const footer = grid(25, 1390, 1850, 1390 + pinCount*56, 4)
        // Detect overlay contributions by comparing exported pixels with the
        // original shading canvas. Differences imply SVG rasterization occurred.
        const mapCanvas = document.querySelector('[data-testid="metro-shading-canvas"]')
        const original = mapCanvas.getContext('2d', { willReadFrequently: true })
        let overlayDifferences = 0
        for (let y = 80; y < 1160; y += 8) for (let x = 80; x < 1920; x += 8) {
          const exported = pixel(x,y)
          const beneath = original.getImageData(Math.floor(x/2),Math.floor(y/2),1,1).data
          // Skip unpainted source pixels; only compare opaque map interior.
          if (beneath[3] < 250) continue
          if (Math.max(...[0,1,2].map(i=>Math.abs(exported[i]-beneath[i]))) > 65) overlayDifferences++
        }
        if (image.naturalWidth !== 2000 || image.naturalHeight !== 2*(620+76+pinCount*28)) throw Error('Export dimensions wrong')
        if (map.colors < 12 || map.nonwhite < 500 || map.dark < 20) throw Error('Map shading appears blank: ' + JSON.stringify(map))
        if (overlayDifferences < 15) throw Error('SVG outlines/labels absent from export: differences=' + overlayDifferences)
        if (header.dark < 50) throw Error('Footer heading/metadata missing: ' + JSON.stringify(header))
        if (pinCount && (footer.orange < pinCount*5 || footer.dark < pinCount*20)) throw Error('Pinned-city dots or text missing: ' + JSON.stringify(footer))
        return { width:image.naturalWidth, height:image.naturalHeight, map, header, footer, overlayDifferences, selected }
      }, { base64: bytes.toString('base64'), pinCount: spec.pins, selected: !!spec.selected })
      const after = await page.evaluate(() => ({ hash: location.hash, pinned: document.querySelectorAll('[data-metro-marker][data-pinned="true"]').length }))
      if (JSON.stringify(before) !== JSON.stringify(after)) throw Error('PNG export mutated map state')
      report.push({ name:spec.name, ...inspected, path:file })
      console.log('PNG visual PASS', spec.name, JSON.stringify(inspected))
    } finally { await page.close() }
  }
} finally {
  await writeFile(outputDir + '/export-visual-manifest.json', JSON.stringify({ states:report }, null, 2) + '\n')
  await browser.close()
}
