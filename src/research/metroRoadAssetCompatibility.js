// Research byte/context verification only. This module cannot authorize rendering.
export const MANIFEST_SCHEMA = 'metro-road-asset-research-v1'
export const MAX_MANIFEST_BYTES = 256 * 1024
export const MAX_PAYLOAD_BYTES = 16 * 1024 * 1024
const HASH_FIELDS = ['graph_bundle_sha256', 'anchor_registry_sha256', 'scenario_sha256',
  'metro_dataset_sha256', 'coverage_mask_sha256']
const CONTEXT_FIELDS = [...HASH_FIELDS, 'eligible_cbsa_ids', 'population_threshold',
  'metric', 'direction', 'units', 'extent_id', 'layer_kind', 'cost_limit']
const METRICS = { length: 'meters', travel_time: 'seconds' }
const digestPattern = /^[a-f0-9]{64}$/

export class RoadAssetCompatibilityError extends Error {
  constructor(code) {
    super(code)
    this.name = 'RoadAssetCompatibilityError'
    this.code = code
  }
}

function demand(condition, code) {
  if (!condition) throw new RoadAssetCompatibilityError(code)
}

function fields(value, keys, code) {
  demand(value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key)), code)
}

// Canonical UTF-8 bytes are required on disk: no whitespace, duplicate keys,
// alternative number encodings, or ambiguous spelling of a manifest identity.
export function canonicalManifest(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalManifest).join(',') + ']'
  if (value !== null && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalManifest(value[key])).join(',') + '}'
  }
  return JSON.stringify(value)
}

function validateContext(context) {
  fields(context, CONTEXT_FIELDS, 'invalid-context-fields')
  demand(HASH_FIELDS.every(key => typeof context[key] === 'string' && digestPattern.test(context[key])), 'invalid-context-digest')
  const ids = context.eligible_cbsa_ids
  demand(Array.isArray(ids) && ids.length > 0 && ids.length <= 10000
    && ids.every(id => typeof id === 'string' && /^[0-9]{5}$/.test(id))
    && ids.every((id, index) => index === 0 || ids[index - 1] < id), 'invalid-eligible-metro-set')
  demand(Number.isSafeInteger(context.population_threshold)
    && context.population_threshold >= 100000 && context.population_threshold <= 20000000, 'invalid-population-threshold')
  demand(typeof context.metric === 'string' && Object.hasOwn(METRICS, context.metric) && context.units === METRICS[context.metric], 'invalid-metric-units')
  demand(['metro-to-location', 'location-to-metro'].includes(context.direction), 'invalid-direction')
  demand((context.layer_kind === 'nearest-metro-regions' && context.cost_limit === null)
    || (context.layer_kind === 'nearest-metro-isochrone' && Number.isSafeInteger(context.cost_limit)
      && context.cost_limit > 0 && context.cost_limit <= 1000000000), 'invalid-layer-cost-limit')
  demand(typeof context.extent_id === 'string' && /^[a-z0-9][a-z0-9-]{0,127}$/.test(context.extent_id), 'invalid-extent')
}

function snapshot(bytes, maximum, code) {
  demand(bytes instanceof Uint8Array && bytes.byteLength > 0 && bytes.byteLength <= maximum, code)
  return new Uint8Array(bytes)
}

async function sha256(bytes) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('')
}

// expected must come from a separately selected trusted catalog and live query,
// never from the incoming manifest. An exact match is NOT release approval.
export async function inspectRoadResearchAsset(manifestBytes, payloadBytes, expected) {
  fields(expected, ['manifest_sha256', 'context'], 'invalid-expectation')
  demand(typeof expected.manifest_sha256 === 'string' && digestPattern.test(expected.manifest_sha256), 'invalid-expected-manifest-digest')
  validateContext(expected.context)
  const selectedDigest = expected.manifest_sha256
  const selectedContext = canonicalManifest(expected.context)
  // Capture caller-owned inputs before any await; later mutation cannot change
  // which bytes or query this receipt describes.
  const manifest = snapshot(manifestBytes, MAX_MANIFEST_BYTES, 'manifest-byte-budget')
  const payload = snapshot(payloadBytes, MAX_PAYLOAD_BYTES, 'payload-byte-budget')
  demand(await sha256(manifest) === selectedDigest, 'manifest-digest-mismatch')
  let text, document
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(manifest)
    document = JSON.parse(text)
  } catch {
    throw new RoadAssetCompatibilityError('invalid-manifest-json')
  }
  demand(text === canonicalManifest(document)
    && new TextEncoder().encode(text).byteLength === manifest.byteLength, 'noncanonical-manifest')
  fields(document, ['schema', 'research_only', 'release_eligible', 'context', 'payload'], 'invalid-manifest-fields')
  demand(document.schema === MANIFEST_SCHEMA && document.research_only === true
    && document.release_eligible === false, 'research-only-manifest-required')
  validateContext(document.context)
  demand(canonicalManifest(document.context) === selectedContext, 'query-context-mismatch')
  fields(document.payload, ['sha256', 'size_bytes', 'format'], 'invalid-payload-fields')
  demand(typeof document.payload.sha256 === 'string' && digestPattern.test(document.payload.sha256)
    && Number.isSafeInteger(document.payload.size_bytes) && document.payload.size_bytes > 0
    && document.payload.size_bytes <= MAX_PAYLOAD_BYTES
    && document.payload.format === 'geojson', 'invalid-payload-metadata')
  demand(payload.byteLength === document.payload.size_bytes, 'payload-size-mismatch')
  demand(await sha256(payload) === document.payload.sha256, 'payload-digest-mismatch')
  return {
    compatible: true,
    research_only: true,
    manifest_sha256: selectedDigest,
    context: JSON.parse(selectedContext),
    payload_sha256: document.payload.sha256,
    payload_bytes_verified: true,
    geometry_validated: false,
    access_verified: false,
    geographic_coverage_certified: false,
    release_eligible: false,
  }
}
