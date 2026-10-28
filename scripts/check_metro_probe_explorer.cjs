// Optional browser integration check; Playwright is installed only in the CI temp folder.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
    headless: true,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => requests.push(request.url()));
    await page.setContent(fs.readFileSync(process.argv[2], 'utf8'));
    await page.waitForSelector('#rows tr');
    const probes = await page.locator('#probe option').evaluateAll(xs => xs.map(x => x.value));
    if (probes.length !== 18) throw Error('Expected 18 probes');
    let selections = 0;
    for (const metric of ['length', 'travel_time']) {
      for (const direction of ['location-to-metro', 'metro-to-location']) {
        for (const probe of probes) {
          await page.selectOption('#metric', metric);
          await page.selectOption('#direction', direction);
          await page.selectOption('#probe', probe);
          if (await page.locator('#rows tr').count() !== 26) throw Error('Dropped source row');
          const tucson = page.locator('#rows tr').filter({ has: page.locator('td:first-child', { hasText: '(46060)' }) });
          if (!(await tucson.innerText()).includes('Modeled unreachable')) throw Error('Tucson lost unreachable status');
          if (!(await page.locator('#cost-heading').innerText()).includes(metric === 'length' ? 'meters' : 'seconds')) throw Error('Wrong metric units');
          if (await page.locator('#plot circle').count() !== 18) throw Error('Probe count changed');
          if (probe === '12985655919') {
            const pueblo = page.locator('#rows tr').first();
            if (!(await pueblo.innerText()).includes('(39380)') || await pueblo.locator('td').nth(2).innerText() !== '0') throw Error('Known zero-cost road-node case changed');
          }
          selections++;
        }
      }
    }
    await page.selectOption('#metric', 'length');
    await page.selectOption('#direction', 'location-to-metro');
    await page.locator('#plot circle').last().click();
    if (await page.locator('#probe').inputValue() !== probes.at(-1)) throw Error('Point click failed');
    if (process.argv[3]) await page.screenshot({ path: process.argv[3], fullPage: true });
    if (errors.length) throw Error(errors.join('\n'));
    if (requests.length) throw Error('Standalone explorer made a network request');
    console.log(JSON.stringify({ selections, rows: 26, probes: 18, pageErrors: 0, externalRequests: 0, pointClickPassed: true }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
