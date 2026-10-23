import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
const directory = 'docs/screenshots'
await mkdir(directory, { recursive: true })
const manifest = { version: 1, generatedAt: new Date().toISOString(), states: [] }
try {
  // Capture pinned accordion use cases as dedicated, reviewable visual states.
  const pinCases = [
    { name: 'pins-one-expanded', codes: ['19740'], expanded: null },
    { name: 'pins-two-collapsed', codes: ['19740','35620'], expanded: null },
    { name: 'pins-three-expanded', codes: ['19740','35620','31080'], expanded: 1 },
    { name: 'pins-four-scrolled', codes: ['19740','35620','31080','16980'], scroll: true },
    { name: 'pins-six-scrolled-expanded', codes: ['19740','35620','31080','16980','19100','26420'], scroll: true, expanded: 2 },
  ]
  for (const spec of pinCases) {
    const page = await browser.newPage({ viewport: { width: 820, height: 900 }, deviceScaleFactor: 1 })
    try {
      const link = 'http://127.0.0.1:4173/#/metro-population-voronoi?pins=' + spec.codes.join(',')
      await page.goto(link, { waitUntil: 'domcontentloaded' })
      await page.locator('[data-testid="metro-app"][data-source-kind="census"]').waitFor({ timeout: 30000 })
      await page.waitForFunction(() => document.querySelector('[data-testid="metro-shading-canvas"]')?.dataset.renderReady === 'true')
      await page.getByRole('button', { name: 'Expand controls' }).click()
      const accordion = page.getByTestId('pinned-accordion')
      await page.waitForFunction(expected => document.querySelectorAll('[data-testid="pinned-city-row"]').length === Math.min(expected,3), spec.codes.length)
      if (spec.scroll) await accordion.getByRole('button', { name: 'Show next pinned cities' }).click()
      if (spec.expanded !== undefined && spec.expanded !== null) {
        await accordion.getByTestId('pinned-city-row').nth(spec.expanded).locator('button[aria-expanded]').click()
      }
      const expanded = await accordion.getByTestId('pinned-city-expanded').count()
      if (expanded !== (spec.codes.length===1 || spec.expanded!=null ? 1 : 0)) throw Error('Incorrect accordion expansion for ' + spec.name)
      await page.screenshot({ path: directory + '/' + spec.name + '.png' })
      manifest.states.push({ name: spec.name, pinnedCount: spec.codes.length, expandedCount: expanded, screenshot: spec.name + '.png' })
    } finally { await page.close() }
  }
  for (const spec of [
    { name: 'desktop-home', width: 1440, height: 900, details: false },
    { name: 'desktop-city-details', width: 1440, height: 900, details: true },
    { name: 'tablet-home', width: 820, height: 1180, details: false },
    { name: 'mobile-dark-preference', width: 390, height: 844, details: false, dark: true },
    { name: 'mobile-home', width: 390, height: 844, details: false },
    { name: 'mobile-narrow-320', width: 320, height: 700, details: false },
    { name: 'mobile-city-details', width: 390, height: 844, details: true },
  ]) {
    const page = await browser.newPage({ viewport: { width: spec.width, height: spec.height }, deviceScaleFactor: 1, colorScheme: spec.dark ? 'dark' : 'light' })
    try {
      const startedAt = performance.now()
      let mapReadyMs = null
      await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'domcontentloaded' })
      await page.getByText('Metro Population Regions — Interactive Map').first().click()
      await page.getByTestId('metro-app').waitFor()
      const explainer = page.getByTestId('map-explainer')
      // On narrow viewports the descriptive header may be visually truncated/hidden;
      // validate its accessible DOM content, not visibility, before checking Canvas readiness.
      await explainer.waitFor({ state: 'attached' })
      if (!spec.details && !(await explainer.textContent()).includes('shaded region')) {
        throw new Error('Landing explainer must describe nearest-metro regions')
      }

      // Wait for the official dataset, projected state outlines, and finished Canvas paint.
      await page.locator('[data-testid="metro-app"][data-source-kind="census"]').waitFor({ timeout: 30000 })
      await page.waitForFunction(() => {
        const canvas = document.querySelector('[data-testid="metro-shading-canvas"]')
        const svg = document.querySelector('svg[role="img"]')
        if (!canvas || canvas.dataset.renderReady !== 'true' || !svg?.querySelector('path[d]')) return false
        const ctx = canvas.getContext('2d')
        return ctx && ctx.getImageData(500, 310, 1, 1).data[3] > 0
      }, null, { timeout: 30000 })

      mapReadyMs = Math.round(performance.now() - startedAt)
      if (spec.details) {
        await page.getByRole('button', { name: 'Open metro search' }).click()
        const search = page.getByRole('searchbox')
        await search.fill('Denver')
        await page.getByRole('option', { name: /Denver-Aurora/ }).first().click()
        await page.getByTestId('metro-details').getByText('19740').waitFor()
        if (!(await explainer.textContent()).includes('Denver')) throw new Error('Explainer did not react to city selection')
      }
      if (spec.width <= 390) {
        const header = page.getByTestId('metro-header')
        const geometry = await header.evaluate(el => {
          const bounds = el.getBoundingClientRect()
          const controls = [...el.querySelectorAll('button')]
          return { headerRight: bounds.right, controls: controls.map(button => {
            const rect = button.getBoundingClientRect()
            return { label: button.getAttribute('aria-label'), left: rect.left, right: rect.right, width: rect.width, height: rect.height }
          }) }
        })
        if (geometry.controls.some(button => button.right > geometry.headerRight + 1 || button.width < 44 || button.height < 44)) {
          throw Error('Mobile header control overflow or undersized touch target: ' + JSON.stringify(geometry))
        }
        await page.getByRole('button', { name: 'Expand controls' }).click()
        if (await page.getByRole('button', { name: 'Collapse navigation' }).count()) throw Error('Duplicate drawer collapse action')
        await page.getByRole('button', { name: 'Collapse controls' }).click()
        await page.getByRole('button', { name: 'Open map legend' }).click()
        await page.getByTestId('metro-legend').waitFor()
        await page.getByRole('button', { name: 'Close map legend' }).last().click()
        await page.getByRole('button', { name: 'Open metro search' }).click()
        await page.getByRole('searchbox').waitFor()
        await page.getByTestId('metro-header').getByRole('button', { name: 'Close metro search', exact: true }).click()
      }
      // Verify actual computed colors, including when the OS prefers dark mode.
      const contrast = await page.evaluate(() => {
        const root = document.querySelector('[data-testid="metro-app"]')
        const searchButton = document.querySelector('button[aria-label="Open metro search"], button[aria-label="Close metro search"]')
        const rgb = s => (s.match(/[\\d.]+/g) || []).slice(0, 3).map(Number)
        const lum = color => {
          const values = rgb(color).map(v => {const x=v/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4})
          return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722
        }
        const ratio = (a,b) => {const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
        return {root: ratio(getComputedStyle(root).color,getComputedStyle(root).backgroundColor),
          search: ratio(getComputedStyle(searchButton).color,getComputedStyle(searchButton).backgroundColor)}
      })
      if (contrast.root < 4.5 || contrast.search < 4.5) throw Error(`Contrast below WCAG AA threshold for ${spec.name}: ${JSON.stringify(contrast)}`)
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
      manifest.states.push({ name: spec.name, mapReadyMs, captureMs: Math.round(performance.now() - startedAt), ...dimensions, horizontalFit: dimensions.documentWidth <= spec.width + 1,
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
console.log(JSON.stringify(manifest.states.map(({name,mapReadyMs,captureMs,horizontalFit,verticalFit})=>({name,mapReadyMs,captureMs,horizontalFit,verticalFit}))))
