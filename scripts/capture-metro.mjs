import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:4173/#/', { waitUntil: 'domcontentloaded' })
  await page.getByText('Metro Population Regions — Interactive Map').first().click()
  // This PR includes a verified official dataset; a silent demo fallback is a regression.
  await page.getByTestId('metro-app').waitFor()
  // The map key must explain the geography and remain keyboard-accessible.
  await page.getByRole('button', { name: 'Open map legend' }).click()
  const legend = page.getByTestId('metro-legend')
  await legend.getByText('not official Census CBSA boundaries', { exact: false }).waitFor()
  await legend.getByText('Blue ring', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Close map legend' }).last().click()
  if (await legend.count()) throw Error('Map legend did not close')

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
    const listboxBackground = getComputedStyle(row.closest('[role="listbox"]')).backgroundColor
    const optionBackground = getComputedStyle(el).backgroundColor
    const pin = getComputedStyle(row.querySelector('button[aria-label^="Pin"]'))
    return { text, background, listboxBackground, optionBackground, pinText: pin.color, pinBackground: pin.backgroundColor }
  })
  if (colors.text !== 'rgb(15, 23, 42)' || colors.background !== 'rgb(255, 255, 255)' || colors.listboxBackground !== 'rgb(255, 255, 255)' || colors.pinText !== 'rgb(15, 23, 42)') {
    throw Error('Search contrast regression: ' + JSON.stringify(colors))
  }
  await searchPanel.getByRole('button', { name: 'Clear metro search' }).click()
  if (await search.inputValue() !== '') throw Error('Search clear button failed')
  await search.fill('Denver')
  await page.getByRole('button', { name: /Pin Denver-Aurora/ }).click()
  await search.fill('New York')
  await page.getByRole('button', { name: /Pin New York-Newark/ }).first().click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download map PNG' }).click()
  const download = await downloadPromise
  if (download.suggestedFilename() !== 'metro-population-map.png') throw Error('Wrong exported PNG filename')
  const pngPath = await download.path()
  const pngBuffer = await import('node:fs/promises').then(fs => fs.readFile(pngPath))
  if (pngBuffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw Error('Export is not a PNG')
  if (pngBuffer.readUInt32BE(16) !== 2000 || pngBuffer.readUInt32BE(20) < 1400) throw Error('Export dimensions are incorrect')
  await page.getByTestId('png-export-status').getByText('Map PNG downloaded').waitFor()
  await page.evaluate(() => {
    const original = HTMLCanvasElement.prototype.toBlob
    window.__restoreExportBlob = () => { HTMLCanvasElement.prototype.toBlob = original }
    HTMLCanvasElement.prototype.toBlob = function (callback) { callback(null) }
  })
  await page.getByRole('button', { name: 'Download map PNG' }).click()
  await page.getByTestId('png-export-error').getByText(/could not encode the PNG/i).waitFor()
  await page.evaluate(() => window.__restoreExportBlob())
  await page.getByRole('button', { name: 'Download map PNG' }).click()
  await page.getByTestId('png-export-error').waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: 'Expand controls' }).click()
  const accordion = page.getByTestId('pinned-accordion')
  if (await accordion.getByTestId('pinned-city-row').count() !== 2) throw Error('Expected two compact pinned rows')
  if (await accordion.getByTestId('pinned-city-expanded').count() !== 0) throw Error('Multiple pins should start collapsed')
  const denverToggle = accordion.getByRole('button', { name: /Expand Denver-Aurora.*statistics/i })
   await denverToggle.focus()
   await page.keyboard.press('Enter')
   await accordion.getByRole('button', { name: /Collapse Denver-Aurora.*statistics/i }).waitFor()
   const denverControl = await accordion.getByRole('button', { name: /Collapse Denver-Aurora.*statistics/i }).getAttribute('aria-controls')
   if (!denverControl || !await accordion.locator(`[id="${denverControl}"]`).count()) throw Error('Expanded pinned panel is not linked by aria-controls')
  await accordion.getByTestId('pinned-city-expanded').waitFor({ state: 'visible' })
  const nyToggle = accordion.getByRole('button', { name: /Expand New York-Newark.*statistics/i })
   await nyToggle.focus()
   await page.keyboard.press('Space')
   await accordion.getByRole('button', { name: /Collapse New York-Newark.*statistics/i }).waitFor()
  if (await accordion.getByTestId('pinned-city-expanded').count() !== 1) throw Error('Accordion should keep only one row expanded')

  await page.getByRole('button', { name: 'Compare pinned cities' }).click()
  const comparison = page.getByTestId('metro-comparison')
  await comparison.waitFor()
  if (await comparison.getByTestId('comparison-row').count() !== 2) throw Error('Comparison should show both pinned metros')
  const populations = await comparison.getByTestId('comparison-row').locator('span.tabular-nums').allTextContents()
  if (populations.length !== 2 || Number(populations[0].replaceAll(',','')) < Number(populations[1].replaceAll(',',''))) {
    throw Error('Comparison is not sorted by population')
  }
  if (!Number((await comparison.getByTestId('comparison-gap').textContent()).replaceAll(',',''))) throw Error('Missing comparison population gap')
  await comparison.getByRole('button', { name: 'Close city comparison' }).click()
  await search.fill('Denver')
  await page.locator('[data-metro-marker="19740"][data-pinned="true"]').waitFor()
  await page.getByRole('option', { name: /Denver-Aurora/ }).first().click()
  await page.locator('[data-metro-marker="19740"][data-selected="true"]').waitFor()
  const details = page.getByTestId('metro-details')
  await details.getByText('19740').waitFor()
  await details.getByRole('heading', { name: 'Denver-Aurora-Centennial, CO Metro Area' }).waitFor()
  await mkdir('docs/screenshots', { recursive: true })
  await page.screenshot({ path: 'docs/screenshots/metro-search-details.png' })
  const sharedHash = await page.evaluate(() => window.location.hash)
  if (!sharedHash.includes('city=19740') || !sharedHash.includes('pins=')) throw Error('Shared URL missing city or pinned metros: ' + sharedHash)
  const sharedPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await sharedPage.goto('http://127.0.0.1:4173/' + sharedHash, { waitUntil: 'domcontentloaded' })
    await sharedPage.locator('[data-testid="metro-app"][data-source-kind="census"]').waitFor({ timeout: 30000 })
    await sharedPage.locator('[data-metro-marker="19740"][data-pinned="true"][data-selected="true"]').waitFor({ timeout: 15000 })
    await sharedPage.getByTestId('metro-details').getByText('19740').waitFor()
    await sharedPage.getByRole('button', { name: 'Expand controls' }).click()
    await sharedPage.getByRole('button', { name: 'Compare pinned cities' }).waitFor()
    // Shareable-view changes must produce real browser history entries.
    // Back and forward must restore settings without losing the pinned cities.
    const labels = sharedPage.getByRole('checkbox', { name: 'Show city labels' })
    await labels.uncheck()
    await sharedPage.waitForFunction(() => location.hash.includes('labels=0'))
    await sharedPage.goBack({ waitUntil: 'domcontentloaded' })
    await sharedPage.waitForFunction(() => !location.hash.includes('labels=0'))
    await labels.waitFor()
    if (!await labels.isChecked()) throw Error('Browser Back did not restore enabled map labels')
    await sharedPage.goForward({ waitUntil: 'domcontentloaded' })
    await sharedPage.waitForFunction(() => location.hash.includes('labels=0'))
    if (await labels.isChecked()) throw Error('Browser Forward did not restore disabled map labels')
    await sharedPage.locator('[data-metro-marker="19740"][data-pinned="true"]').waitFor()

  } finally { await sharedPage.close() }
  // Four or more pins should expose three visible rows plus up/down navigation.
  const fourPage = await browser.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await fourPage.goto('http://127.0.0.1:4173/#/metro-population-voronoi?pins=19740,35620,31080,16980', { waitUntil: 'domcontentloaded' })
    await fourPage.locator('[data-testid="metro-app"][data-source-kind="census"]').waitFor({ timeout: 30000 })
    await fourPage.getByRole('button', { name: 'Expand controls' }).click()
    const fourAccordion = fourPage.getByTestId('pinned-accordion')
    await fourAccordion.getByTestId('pinned-city-row').first().waitFor()
    if (await fourAccordion.getByTestId('pinned-city-row').count() !== 3) throw Error('Four pins should display three accordion rows')
    await fourAccordion.getByRole('button', { name: 'Show next pinned cities' }).click()
    if (await fourAccordion.getByTestId('pinned-city-row').count() !== 3) throw Error('Scrolling pins changed the visible row count')
    await fourAccordion.getByRole('button', { name: 'Show previous pinned cities' }).click()
    await fourPage.screenshot({ path: 'docs/screenshots/metro-four-pin-accordion.png' })
  } finally { await fourPage.close() }
  await page.getByRole('button', { name: 'Open metro search' }).count() && await page.getByRole('button', { name: 'Close metro search' }).click()
  await page.getByTestId('full-map-reset').click()
  if (await page.locator('[data-metro-marker="19740"][data-pinned="true"]').count()) throw Error('Full-map reset failed to clear pinned cities')
  if (await page.getByTestId('metro-comparison').count()) throw Error('Full-map reset failed to dismiss comparison')
  if (await page.getByTestId('metro-details').count()) throw Error('Full-map reset failed to close details')
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
