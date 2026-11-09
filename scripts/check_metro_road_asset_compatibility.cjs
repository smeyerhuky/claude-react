// Actual Chromium/WebCrypto checks using synthetic bytes; no public map activation.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { chromium } = require('playwright')

async function main() {
  const moduleBytes = fs.readFileSync(path.join(__dirname, '../src/research/metroRoadAssetCompatibility.js'))
  const unexpectedRequests = [], errors = []
  const server = http.createServer((request, response) => {
    if (request.url === '/') {
      response.writeHead(200, { 'Content-Type': 'text/html' })
      response.end('<!doctype html><title>Road asset compatibility test</title>')
    } else if (request.url === '/module.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript' }); response.end(moduleBytes)
    } else if (request.url === '/favicon.ico') {
      response.writeHead(204); response.end()
    } else {
      unexpectedRequests.push(request.url); response.writeHead(404); response.end()
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  let browser
  try {
    browser = await chromium.launch({ headless: true,
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
      args: ['--no-sandbox'] })
    const page = await browser.newPage()
    page.on('pageerror', error => errors.push(String(error)))
    const origin = 'http://127.0.0.1:' + server.address().port
    page.on('request', request => { if (!request.url().startsWith(origin + '/')) unexpectedRequests.push(request.url()) })
    await page.goto(origin)
    const result = await page.evaluate(async () => {
      const { canonicalManifest, inspectRoadResearchAsset, MANIFEST_SCHEMA } = await import('/module.js')
      const bytes = text => new TextEncoder().encode(text)
      const sha = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)),
        b => b.toString(16).padStart(2, '0')).join('')
      const identity = 'a'.repeat(64), other = 'b'.repeat(64)
      let matched = 0, rejected = 0
      const context = { graph_bundle_sha256: identity, anchor_registry_sha256: identity, scenario_sha256: identity,
        metro_dataset_sha256: identity, coverage_mask_sha256: identity, eligible_cbsa_ids: ['12345', '23456'],
        population_threshold: 100000, metric: 'length', units: 'meters', direction: 'metro-to-location', extent_id: 'synthetic-test', layer_kind: 'nearest-metro-regions', cost_limit: null }
      async function fixture(query = context) {
        const payload = bytes('{"type":"FeatureCollection","features":[]}')
        const document = { schema: MANIFEST_SCHEMA, research_only: true, release_eligible: false,
          context: structuredClone(query), payload: { sha256: await sha(payload), size_bytes: payload.length, format: 'geojson' } }
        const manifest = bytes(canonicalManifest(document))
        return { document, manifest, payload, expected: { manifest_sha256: await sha(manifest), context: structuredClone(query) } }
      }
      const inspect = f => inspectRoadResearchAsset(f.manifest, f.payload, f.expected)
      async function reject(f, code) {
        try { await inspect(f) } catch (error) {
          if (error.code !== code) throw new Error('Expected ' + code + ', received ' + error.code)
          rejected++; return
        }
        throw new Error('Mismatched asset was accepted: ' + code)
      }
      for (const [metric, units] of [['length', 'meters'], ['travel_time', 'seconds']]) {
        for (const direction of ['metro-to-location', 'location-to-metro']) {
          const f = await fixture({ ...context, metric, units, direction }), receipt = await inspect(f)
          if (!receipt.compatible || receipt.release_eligible || receipt.access_verified || receipt.geometry_validated
            || receipt.geographic_coverage_certified || !receipt.research_only) throw new Error('Unexpected receipt')
          matched++
        }
      }
      for (const [key, value] of Object.entries({ graph_bundle_sha256: other, anchor_registry_sha256: other,
        scenario_sha256: other, metro_dataset_sha256: other, coverage_mask_sha256: other,
        population_threshold: 250000, eligible_cbsa_ids: ['12345'], direction: 'location-to-metro', extent_id: 'different-extent' })) {
        const f = await fixture(); f.expected.context[key] = value
        await reject(f, 'query-context-mismatch')
      }
      const metric = await fixture(); metric.expected.context.metric = 'travel_time'; metric.expected.context.units = 'seconds'
      await reject(metric, 'query-context-mismatch')
      const isochrone = await fixture({ ...context, layer_kind: 'nearest-metro-isochrone', cost_limit: 600 })
      if (!(await inspect(isochrone)).compatible) throw new Error('Isochrone context rejected')
      isochrone.expected.context.cost_limit = 1200; await reject(isochrone, 'query-context-mismatch')
      isochrone.expected.context.layer_kind = 'nearest-metro-regions'; isochrone.expected.context.cost_limit = null
      await reject(isochrone, 'query-context-mismatch')
      const changed = await fixture(); changed.payload[0] ^= 1; await reject(changed, 'payload-digest-mismatch')
      const changedManifest = await fixture(); changedManifest.manifest[0] ^= 1
      await reject(changedManifest, 'manifest-digest-mismatch')
      const duplicate = await fixture()
      duplicate.manifest = bytes('{"schema":"other",' + new TextDecoder().decode(duplicate.manifest).slice(1))
      duplicate.expected.manifest_sha256 = await sha(duplicate.manifest)
      await reject(duplicate, 'noncanonical-manifest')
      const approval = await fixture(); approval.document.release_eligible = true
      approval.manifest = bytes(canonicalManifest(approval.document)); approval.expected.manifest_sha256 = await sha(approval.manifest)
      await reject(approval, 'research-only-manifest-required')
      const mutable = await fixture(), pending = inspect(mutable)
      mutable.payload.fill(0); mutable.manifest.fill(0); mutable.expected.context.direction = 'location-to-metro'
      const receipt = await pending
      if (!receipt.compatible || receipt.context.direction !== 'metro-to-location') throw new Error('Snapshot changed during hash')
      return { matched, rejected, mutationSnapshotPreserved: true, publicRenderingAuthorized: false }
    })
    assert.equal(result.matched, 4); assert.equal(result.rejected, 16)
    assert.equal(result.mutationSnapshotPreserved, true)
    assert.deepEqual(errors, []); assert.deepEqual(unexpectedRequests, [])
    console.log(JSON.stringify({ ...result, browserErrors: errors.length, unexpectedRequests: unexpectedRequests.length }))
  } finally {
    if (browser) await browser.close()
    await new Promise(resolve => server.close(resolve))
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
