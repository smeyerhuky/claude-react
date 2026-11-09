import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { canonicalManifest, inspectRoadResearchAsset, MANIFEST_SCHEMA,
  MAX_MANIFEST_BYTES, MAX_PAYLOAD_BYTES } from '../src/research/metroRoadAssetCompatibility.js'

const bytes = text => new TextEncoder().encode(text)
const sha = value => createHash('sha256').update(value).digest('hex')
const identity = label => sha(label)
function fixture() {
  // Fictional identities, no adopted coordinates, shapes or approved connectors.
  const context = {
    graph_bundle_sha256: identity('synthetic graph'),
    anchor_registry_sha256: identity('synthetic anchor registry'),
    scenario_sha256: identity('synthetic scenario'),
    metro_dataset_sha256: identity('synthetic metro dataset'),
    coverage_mask_sha256: identity('synthetic mask'),
    eligible_cbsa_ids: ['12345', '23456'], population_threshold: 100000,
    metric: 'length', units: 'meters', direction: 'metro-to-location', extent_id: 'synthetic-test-extent', layer_kind: 'nearest-metro-regions', cost_limit: null,
  }
  const payload = bytes('{"type":"FeatureCollection","features":[]}')
  const document = { schema: MANIFEST_SCHEMA, research_only: true, release_eligible: false,
    context: structuredClone(context), payload: { sha256: sha(payload), size_bytes: payload.length, format: 'geojson' } }
  const f = { context, document, payload }
  f.seal = () => {
    f.manifest = bytes(canonicalManifest(f.document))
    f.expected = { manifest_sha256: sha(f.manifest), context: structuredClone(f.context) }
    return f
  }
  return f.seal()
}
const inspect = f => inspectRoadResearchAsset(f.manifest, f.payload, f.expected)
const rejects = (f, code) => assert.rejects(inspect(f), error => error.code === code)

test('valid bytes and query match without adopting or approving anything', async () => {
  const f = fixture(), result = await inspect(f)
  assert.equal(result.compatible, true)
  assert.deepEqual(result.context, f.context)
  for (const key of ['geometry_validated', 'access_verified', 'geographic_coverage_certified', 'release_eligible']) {
    assert.equal(result[key], false)
  }
  assert.equal(result.payload_bytes_verified, true)
})

test('each query identity independently rejects stale or mixed assets', async () => {
  const changes = { graph_bundle_sha256: identity('other graph'), anchor_registry_sha256: identity('other anchors'),
    scenario_sha256: identity('other scenario'), metro_dataset_sha256: identity('uploaded CSV'),
    coverage_mask_sha256: identity('other mask'), eligible_cbsa_ids: ['12345'], population_threshold: 250000,
    direction: 'location-to-metro', extent_id: 'different-extent' }
  for (const [key, value] of Object.entries(changes)) {
    const f = fixture(); f.expected.context[key] = value
    await rejects(f, 'query-context-mismatch')
  }
  const f = fixture(); f.expected.context.metric = 'travel_time'; f.expected.context.units = 'seconds'
  await rejects(f, 'query-context-mismatch')
})

test('all four directed metric contexts work independently', async () => {
  for (const [metric, units] of [['length', 'meters'], ['travel_time', 'seconds']]) {
    for (const direction of ['metro-to-location', 'location-to-metro']) {
      const f = fixture(); Object.assign(f.context, { metric, units, direction })
      f.document.context = structuredClone(f.context); f.seal()
      assert.deepEqual((await inspect(f)).context, f.context)
    }
  }
})

test('modified manifest and same-size modified payload fail hashes', async () => {
  const f = fixture(); f.manifest[2] ^= 1
  await rejects(f, 'manifest-digest-mismatch')
  const g = fixture(); g.payload[g.payload.length - 2] ^= 1
  await rejects(g, 'payload-digest-mismatch')
  const h = fixture(); h.payload = h.payload.slice(0, -1)
  await rejects(h, 'payload-size-mismatch')
})

test('missing, extra, invalid, ambiguous and unbounded contexts fail closed', async () => {
  for (const mutate of [c => { delete c.scenario_sha256 }, c => { c.unknown = true },
    c => { c.eligible_cbsa_ids.reverse() }, c => { c.eligible_cbsa_ids.push('23456') },
    c => { c.eligible_cbsa_ids = [] }, c => { c.eligible_cbsa_ids = ['12345', 23456] },
    c => { c.eligible_cbsa_ids = Array(10001).fill('12345') },
    c => { c.population_threshold = true }, c => { c.population_threshold = 99999 },
    c => { c.population_threshold = 20000001 }, c => { c.population_threshold = 100000.5 },
    c => { c.layer_kind = 'isochrone' }, c => { c.cost_limit = 600 },
    c => { c.layer_kind = 'nearest-metro-isochrone' }, c => { c.units = 'miles' }, c => { c.metric = ['length'] }, c => { c.metric = '__proto__' },
    c => { c.direction = 'from_anchor' }, c => { c.extent_id = '../colorado' },
    c => { c.scenario_sha256 = 'not-a-hash' }]) {
    const f = fixture(); mutate(f.expected.context)
    await assert.rejects(inspect(f))
    const g = fixture(); mutate(g.document.context); g.seal()
    await assert.rejects(inspect(g))
  }
})

test('caller cannot introduce approval flags, paths or alternate schema', async () => {
  for (const mutate of [d => { d.release_eligible = true }, d => { d.research_only = false },
    d => { d.access_verified = true }, d => { d.schema = 'production' },
    d => { d.payload.url = 'https://example.com/asset' }, d => { d.payload.format = 'html' },
    d => { d.payload.size_bytes = true }, d => { d.payload.size_bytes = MAX_PAYLOAD_BYTES + 1 },
    d => { d.payload.sha256 = 'missing' }]) {
    const f = fixture(); mutate(f.document); f.seal()
    await assert.rejects(inspect(f))
  }
})

test('JSON duplicate keys, whitespace and invalid UTF-8 cannot have alternate interpretations', async () => {
  for (const makeBytes of [f => bytes('{"schema":"other",' + new TextDecoder().decode(f.manifest).slice(1)),
    f => bytes(' ' + new TextDecoder().decode(f.manifest)),
    f => bytes('\ufeff' + new TextDecoder().decode(f.manifest)), () => new Uint8Array([255]),
    () => bytes('{"value":NaN}'), () => bytes('null')]) {
    const f = fixture(); f.manifest = makeBytes(f); f.expected.manifest_sha256 = sha(f.manifest)
    await assert.rejects(inspect(f))
  }
})

test('byte budgets and byte input types are enforced before hashing', async () => {
  for (const invalid of [new Uint8Array(), new Uint8Array(MAX_MANIFEST_BYTES + 1), '{}', null]) {
    const f = fixture(); f.manifest = invalid
    await rejects(f, 'manifest-byte-budget')
  }
  for (const invalid of [new Uint8Array(), new Uint8Array(MAX_PAYLOAD_BYTES + 1), '{}', null]) {
    const f = fixture(); f.payload = invalid
    await rejects(f, 'payload-byte-budget')
  }
  for (const invalid of [null, {}, { manifest_sha256: 'wrong', context: fixture().context }]) {
    const f = fixture(); f.expected = invalid
    await assert.rejects(inspect(f))
  }
})

test('verification receipts describe snapshots despite caller mutation across await', async () => {
  const f = fixture(), original = structuredClone(f.context)
  const pending = inspect(f)
  f.manifest.fill(0); f.payload.fill(0); f.expected.context.direction = 'location-to-metro'
  f.expected.manifest_sha256 = identity('changed during hashing')
  const result = await pending
  assert.deepEqual(result.context, original)
  assert.equal(result.compatible, true)
})

// Node Buffer subclasses Uint8Array but Buffer.slice() aliases caller memory.
test('Node Buffer inputs are copied before asynchronous verification', async () => {
  const f = fixture(); f.manifest = Buffer.from(f.manifest); f.payload = Buffer.from(f.payload)
  const pending = inspect(f); f.manifest.fill(0); f.payload.fill(0)
  assert.equal((await pending).compatible, true)
})

test('isochrone cutoff and layer kind are exact query identities in metric units', async () => {
  const f = fixture(); Object.assign(f.context, { layer_kind: 'nearest-metro-isochrone', cost_limit: 600 })
  f.document.context = structuredClone(f.context); f.seal()
  assert.equal((await inspect(f)).context.cost_limit, 600)
  f.expected.context.cost_limit = 1200
  await rejects(f, 'query-context-mismatch')
  f.expected.context.layer_kind = 'nearest-metro-regions'; f.expected.context.cost_limit = null
  await rejects(f, 'query-context-mismatch')
  for (const invalid of [0, -1, true, 0.5, 1000000001]) {
    const g = fixture(); Object.assign(g.expected.context, { layer_kind: 'nearest-metro-isochrone', cost_limit: invalid })
    await rejects(g, 'invalid-layer-cost-limit')
  }
})
