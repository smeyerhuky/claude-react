import { useEffect, useMemo, useRef, useState } from 'react'
import { Delaunay, geoAlbers } from 'd3'

// Illustrative seed data, NOT a complete or validated 2025 Census CBSA inventory.
// Each row: anchor name, longitude, latitude, approximate metro population.
const ANCHORS = [
['New York',-74.006,40.713,20100000],['Los Angeles',-118.244,34.052,12900000],['Chicago',-87.630,41.878,9430000],
['Dallas–Fort Worth',-96.797,32.777,8340000],['Houston',-95.370,29.760,7790000],['Washington, DC',-77.037,38.907,6450000],
['Miami',-80.192,25.762,6400000],['Philadelphia',-75.165,39.953,6330000],['Atlanta',-84.388,33.749,6410000],
['Phoenix',-112.074,33.448,5180000],['Boston',-71.059,42.360,4950000],['San Francisco',-122.419,37.775,4530000],
['Riverside',-117.396,33.953,4700000],['Detroit',-83.046,42.331,4300000],['Seattle',-122.332,47.606,4160000],
['Minneapolis',-93.265,44.978,3760000],['San Diego',-117.161,32.716,3300000],['Tampa',-82.457,27.951,3360000],
['Denver',-104.990,39.739,3050000],['Charlotte',-80.843,35.227,2880000],['Orlando',-81.379,28.538,2940000],
['Baltimore',-76.612,39.290,2860000],['St. Louis',-90.199,38.627,2810000],['San Antonio',-98.494,29.424,2770000],
['Portland',-122.678,45.515,2560000],['Sacramento',-121.494,38.582,2470000],['Pittsburgh',-79.996,40.441,2420000],
['Las Vegas',-115.140,36.170,2360000],['Austin',-97.743,30.267,2470000],['Cincinnati',-84.512,39.103,2290000],
['Kansas City',-94.579,39.100,2240000],['Columbus',-82.999,39.961,2240000],['Indianapolis',-86.158,39.768,2150000],
['Cleveland',-81.694,41.499,2170000],['Nashville',-86.782,36.163,2160000],['San Jose',-121.886,37.338,1980000],
['Virginia Beach',-75.978,36.853,1800000],['Jacksonville',-81.656,30.332,1740000],['Milwaukee',-87.907,43.039,1570000],
['Providence',-71.413,41.824,1690000],['Oklahoma City',-97.516,35.468,1470000],['Raleigh',-78.638,35.780,1540000],
['Louisville',-85.759,38.253,1390000],['Richmond',-77.436,37.541,1350000],['Memphis',-90.049,35.150,1330000],
['New Orleans',-90.072,29.951,1270000],['Salt Lake City',-111.891,40.761,1280000],['Hartford',-72.673,41.766,1210000],
['Buffalo',-78.878,42.887,1150000],['Birmingham',-86.802,33.521,1160000],['Grand Rapids',-85.668,42.963,1180000],
['Rochester',-77.609,43.156,1090000],['Tucson',-110.974,32.223,1080000],['Fresno',-119.788,36.737,1020000],
['Tulsa',-95.992,36.154,1050000],['Honolulu',-157.858,21.307,1010000],['Omaha',-95.998,41.256,1010000],
['Worcester',-71.802,42.263,980000],['Bridgeport',-73.195,41.179,960000],['Albuquerque',-106.650,35.084,925000],
['Greenville',-82.394,34.853,990000],['Bakersfield',-119.019,35.373,930000],['Albany',-73.756,42.653,905000],
['Knoxville',-83.920,35.961,895000],['McAllen',-98.230,26.203,920000],['Baton Rouge',-91.140,30.451,880000],
['El Paso',-106.485,31.762,880000],['Allentown',-75.490,40.608,870000],['New Haven',-72.928,41.308,875000],
['Sarasota',-82.531,27.336,900000],['Charleston, SC',-79.931,32.776,860000],['Columbia, SC',-81.034,34.000,850000],
['Boise',-116.202,43.615,850000],['Dayton',-84.192,39.759,810000],['Colorado Springs',-104.821,38.834,770000],
['Provo',-111.659,40.234,740000],['Lakeland',-81.949,28.040,780000],['Des Moines',-93.625,41.586,740000],
['Madison',-89.401,43.074,700000],['Akron',-81.519,41.082,700000],['North Port',-82.235,27.044,770000],
['Winston-Salem',-80.244,36.099,690000],['Little Rock',-92.290,34.746,760000],['Stockton',-121.290,37.958,830000],
['Ogden',-111.974,41.223,690000],['Augusta',-81.974,33.474,640000],['Spokane',-117.426,47.658,610000],
['Toledo',-83.555,41.663,600000],['Chattanooga',-85.310,35.045,590000],['Syracuse',-76.147,43.048,660000],
['Wichita',-97.337,37.687,660000],['Port St. Lucie',-80.341,27.274,570000],['Cape Coral',-81.950,26.562,860000],
['Durham',-78.899,35.994,670000],['Harrisburg',-76.886,40.273,600000],['Lancaster',-76.305,40.037,570000],
['Jackson, MS',-90.185,32.299,590000],['Palm Bay',-80.588,28.034,620000],['Fayetteville, AR',-94.158,36.062,610000],
['Lexington',-84.503,38.040,530000],['Huntsville',-86.586,34.730,530000],['Pensacola',-87.216,30.421,530000],
['Springfield, MO',-93.292,37.209,490000],['Reno',-119.814,39.529,510000],['Lubbock',-101.845,33.578,330000],
['Mobile',-88.040,30.695,440000],['Tallahassee',-84.280,30.438,400000],['Savannah',-81.099,32.080,420000],
['Asheville',-82.554,35.595,480000],['Gainesville, FL',-82.325,29.652,350000],['Fort Collins',-105.084,40.585,370000],
['Fort Wayne',-85.140,41.080,430000],['Lansing',-84.556,42.733,480000],['Flint',-83.687,43.013,400000],
['Kalamazoo',-85.588,42.292,260000],['Green Bay',-88.019,44.519,330000],['Eugene',-123.087,44.053,380000],
['Salem',-123.035,44.942,440000],['Medford',-122.876,42.326,220000],['Bend',-121.315,44.058,210000],
['Yakima',-120.506,46.602,260000],['Tri-Cities, WA',-119.137,46.239,320000],['Olympia',-122.901,47.037,310000],
['Bellingham',-122.478,48.751,240000],['Billings',-108.501,45.783,190000],['Missoula',-113.994,46.872,120000],
['Bozeman',-111.042,45.677,130000],['Great Falls',-111.300,47.505,85000],['Casper',-106.313,42.850,81000],
['Cheyenne',-104.820,41.140,101000],['Rapid City',-103.231,44.081,150000],['Sioux Falls',-96.731,43.548,290000],
['Fargo',-96.789,46.877,270000],['Bismarck',-100.783,46.808,140000],['Duluth',-92.100,46.786,290000],
['St. Cloud',-94.163,45.557,200000],['Rochester, MN',-92.463,44.012,230000],['Mankato',-93.999,44.164,105000],
['Lincoln',-96.703,40.814,340000],['Grand Island',-98.342,40.925,88000],['Sioux City',-96.405,42.499,150000],
['Cedar Rapids',-91.665,41.978,280000],['Iowa City',-91.531,41.661,180000],['Davenport',-90.578,41.524,380000],
['Waterloo',-92.342,42.493,170000],['Peoria',-89.589,40.693,400000],['Bloomington, IL',-88.994,40.484,170000],
['Champaign',-88.243,40.116,240000],['Springfield, IL',-89.644,39.782,210000],['Rockford',-89.094,42.271,340000],
['South Bend',-86.252,41.676,330000],['Lafayette, IN',-86.875,40.416,230000],['Muncie',-85.386,40.193,110000],
['Terre Haute',-87.414,39.466,180000],['Evansville',-87.555,37.972,310000],['Bloomington, IN',-86.526,39.165,175000],
['Fort Smith',-94.398,35.386,250000],['Jonesboro',-90.704,35.843,140000],['Hot Springs',-93.054,34.503,100000],
['Joplin',-94.513,37.084,190000],['St. Joseph',-94.846,39.768,120000],['Jefferson City',-92.174,38.577,150000],
['Columbia, MO',-92.334,38.952,220000],['Cape Girardeau',-89.518,37.305,100000],['Springfield, OH',-83.808,39.924,135000],
['Canton',-81.379,40.799,400000],['Youngstown',-80.649,41.099,530000],['Mansfield',-82.515,40.758,120000],
['Lima',-84.105,40.742,100000],['Erie',-80.085,42.129,260000],['Scranton',-75.662,41.409,560000],
['Reading',-75.926,40.335,440000],['York',-76.728,39.962,460000],['State College',-77.860,40.794,165000],
['Johnstown',-78.922,40.326,130000],['Williamsport',-77.002,41.241,110000],['Utica',-75.232,43.101,290000],
['Binghamton',-75.918,42.099,240000],['Ithaca',-76.496,42.443,105000],['Elmira',-76.807,42.090,85000],
['Kingston, NY',-73.997,41.927,180000],['Poughkeepsie',-73.931,41.701,690000],
['Springfield, MA',-72.590,42.102,700000],['Pittsfield',-73.245,42.450,125000],['Barnstable',-70.300,41.700,230000],
['Manchester, NH',-71.454,42.995,430000],['Portsmouth, NH',-70.763,43.072,130000],['Dover, NH',-70.875,43.198,100000],
['Burlington, VT',-73.213,44.476,230000],['Lewiston, ME',-70.215,44.100,110000],['Portland, ME',-70.256,43.659,570000],
['Bangor',-68.772,44.801,150000],['Augusta, ME',-69.779,44.310,125000],
['Charlottesville',-78.476,38.029,240000],['Roanoke',-79.941,37.271,320000],['Lynchburg',-79.143,37.414,260000],
['Blacksburg',-80.413,37.230,180000],['Harrisonburg',-78.869,38.450,140000],['Winchester',-78.163,39.185,150000],
['Fredericksburg',-77.460,38.304,360000],['Danville, VA',-79.395,36.586,100000],['New Bern',-77.044,35.108,130000],
['Wilmington, NC',-77.944,34.225,310000],['Fayetteville, NC',-78.878,35.052,540000],['Greensboro',-79.792,36.073,790000],
['Hickory',-81.338,35.734,380000],['Rocky Mount',-77.791,35.939,140000],['Goldsboro',-77.992,35.384,120000],
['Florence, SC',-79.762,34.195,210000],['Myrtle Beach',-78.886,33.689,420000],['Sumter',-80.342,33.920,105000],
['Spartanburg',-81.932,34.949,350000],['Anderson, SC',-82.650,34.503,210000],['Athens, GA',-83.377,33.951,220000],
['Macon',-83.632,32.841,230000],['Warner Robins',-83.600,32.615,200000],['Columbus, GA',-84.988,32.461,330000],
['Albany, GA',-84.156,31.579,145000],['Valdosta',-83.278,30.833,150000],['Gainesville, GA',-83.825,34.297,220000],
['Dalton',-84.970,34.769,145000],['Rome, GA',-85.164,34.257,100000],['Dothan',-85.390,31.223,155000],
['Montgomery',-86.300,32.379,385000],['Tuscaloosa',-87.569,33.210,270000],['Gadsden',-86.006,34.014,100000],
['Decatur, AL',-86.983,34.605,155000],['Florence, AL',-87.678,34.799,150000],['Auburn, AL',-85.480,32.609,180000],
['Anniston',-85.832,33.659,115000],['Hattiesburg',-89.290,31.327,170000],['Gulfport',-89.092,30.368,430000],
['Pascagoula',-88.556,30.365,145000],['Meridian',-88.704,32.364,100000],['Tupelo',-88.703,34.258,145000],
['Oxford, MS',-89.520,34.366,100000],['Monroe, LA',-92.119,32.509,200000],['Shreveport',-93.750,32.525,390000],
['Alexandria, LA',-92.446,31.312,145000],['Lafayette, LA',-92.019,30.224,490000],['Lake Charles',-93.217,30.226,220000],
['Houma',-90.719,29.595,210000],['Hammond, LA',-90.461,30.504,140000],['Beaumont',-94.126,30.080,400000],
['Longview, TX',-94.740,32.500,280000],['Tyler',-95.301,32.351,240000],['Waco',-97.146,31.550,300000],
['Killeen',-97.727,31.117,510000],['College Station',-96.334,30.628,290000],['Bryan',-96.370,30.674,260000],
['Sherman',-96.616,33.636,150000],['Wichita Falls',-98.493,33.914,150000],['Abilene',-99.733,32.449,170000],
['Midland',-102.078,31.997,190000],['Odessa',-102.368,31.845,170000],['San Angelo',-100.437,31.464,120000],
['Amarillo',-101.831,35.222,270000],['Laredo',-99.507,27.503,270000],['Brownsville',-97.498,25.902,440000],
['Corpus Christi',-97.397,27.800,440000],['Victoria',-96.985,28.805,100000],['Texarkana',-94.047,33.426,145000],
['Lawton',-98.395,34.608,125000],['Enid',-97.879,36.396,65000],['Stillwater',-97.058,36.115,85000],
['Norman',-97.440,35.222,130000],['Muskogee',-95.369,35.748,65000],['Bartlesville',-96.000,36.747,55000],
['Pueblo',-104.609,38.254,170000],['Greeley',-104.709,40.423,360000],['Boulder',-105.270,40.015,330000],
['Grand Junction',-108.551,39.063,160000],['Durango',-107.880,37.275,57000],['Flagstaff',-111.651,35.199,145000],
['Prescott',-112.469,34.540,245000],['Yuma',-114.627,32.692,210000],['Lake Havasu City',-114.322,34.484,220000],
['Sierra Vista',-110.303,31.545,125000],['Santa Fe',-105.938,35.687,155000],['Las Cruces',-106.779,32.319,220000],
['Farmington',-108.218,36.729,120000],['Roswell',-104.523,33.394,65000],['Clovis',-103.206,34.404,49000],
['Idaho Falls',-112.034,43.492,160000],['Pocatello',-112.445,42.871,95000],['Coeur d\'Alene',-116.780,47.678,190000],
['Twin Falls',-114.460,42.563,120000],['Lewiston, ID',-117.018,46.417,65000],['Logan',-111.835,41.736,150000],
['St. George',-113.568,37.096,200000],['Cedar City',-113.061,37.677,62000],['Carson City',-119.768,39.164,59000],
['Las Cruces',-106.778,32.319,220000],['Santa Rosa, CA',-122.715,38.441,490000],['Napa',-122.287,38.297,145000],
['Vallejo',-122.257,38.104,450000],['Modesto',-120.997,37.639,550000],['Merced',-120.482,37.302,290000],
['Visalia',-119.292,36.330,470000],['Hanford',-119.645,36.328,155000],['Madera',-120.060,36.962,165000],
['Salinas',-121.655,36.677,440000],['Santa Cruz',-122.030,36.974,260000],['San Luis Obispo',-120.660,35.282,280000],
['Santa Maria',-120.436,34.953,450000],['Santa Barbara',-119.698,34.420,440000],['Oxnard',-119.177,34.198,840000],
['Santa Clarita',-118.542,34.391,230000],['Hemet',-116.972,33.747,180000],['Palm Springs',-116.546,33.830,380000],
['El Centro',-115.563,32.793,180000],['Redding',-122.391,40.587,180000],['Chico',-121.837,39.728,210000],
['Yuba City',-121.617,39.140,180000],['Eureka',-124.163,40.802,135000],['Ukiah',-123.208,39.150,90000]
]

const STATE_SOURCE = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
const EXCLUDED = new Set(['Alaska', 'Hawaii', 'Puerto Rico'])
const MIN = 100000
const MAX = 20000000
const PRESETS = [100000,250000,500000,1000000,1200000,2000000,5000000,10000000,20000000]
const projection = geoAlbers().scale(1260).translate([500,310])
const fmt = n => n >= 1000000 ? `${+(n/1000000).toFixed(2)}M` : `${Math.round(n/1000)}K`
const clamp = n => Math.min(MAX,Math.max(MIN,Number.isFinite(n)?n:MIN))
const toTrack = n => Math.round(1000*Math.log(clamp(n)/MIN)/Math.log(MAX/MIN))
const fromTrack = t => Math.round(MIN*Math.pow(MAX/MIN,Number(t)/1000)/1000)*1000
// CSV import requires explicit geographic anchors because Census population workbooks
// contain CBSA populations but not the longitude/latitude needed for Voronoi sites.
const splitCsv = text => {
  const rows = []
  let field = '', row = [], quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted && ch === '"' && text[i + 1] === '"') { field += '"'; i++; continue }
    if (ch === '"') { quoted = !quoted; continue }
    if (!quoted && (ch === ',' || ch === '\n' || ch === '\r')) {
      row.push(field.trim()); field = ''
      if (ch !== ',') {
        if (row.some(Boolean)) rows.push(row)
        row = []
        if (ch === '\r' && text[i + 1] === '\n') i++
      }
    } else field += ch
  }
  if (quoted) throw Error('Unclosed quoted CSV field')
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}
const parseMetroCsv = csv => {
  const rows = splitCsv(csv.replace(/^\uFEFF/, ''))
  const hdr = rows.shift()?.map(v => v.toLowerCase()) || []
  const index = names => names.map(n => hdr.indexOf(n)).find(i => i >= 0) ?? -1
  const indexes = [
    index(['name','metro','metro_name']),
    index(['longitude','lon']),
    index(['latitude','lat']),
    index(['population','pop','population_2025','pop_2025'])
  ]
  if (indexes.some(i => i < 0)) throw Error('Required CSV columns: name, longitude, latitude, population')
  if (rows.length > 3000) throw Error('Maximum 3,000 metro rows')
  const cbsaIndex = index(['cbsa','cbsa_code','geoid'])
  const found = new Set(), result = []
  rows.forEach((row,i) => {
    const name = row[indexes[0]]?.trim()
    const lon = Number(row[indexes[1]]), lat = Number(row[indexes[2]])
    const pop = Number(row[indexes[3]]?.replace(/,/g,''))
    if (!name || !Number.isFinite(lon) || !Number.isFinite(lat) || !Number.isSafeInteger(pop) || pop <= 0)
      throw Error(`Invalid metro on CSV data row ${i + 2}`)
    if (lon < -125 || lon > -66 || lat < 24 || lat > 50) return
    const key = name.toLowerCase()
    if (found.has(key)) throw Error(`Duplicate metro name: ${name}`)
    found.add(key)
    const p = projection([lon,lat])
    if (p) result.push({id:key,name,lon,lat,pop,p,cbsa:cbsaIndex >= 0 ? (row[cbsaIndex] || '').trim() : ''})
  })
  if (!result.length) throw Error('No qualifying contiguous-U.S. locations in the CSV')
  return result
}
// Keep official CBSA names for identity/details; map labels use principal city shorthand.
// The few hyphenated principal-city names must not be split as metro divisions.
const SHORT_NAME_OVERRIDES = {
  'Winston-Salem': 'Winston-Salem',
  'Wilkes-Barre': 'Wilkes-Barre',
}
const principalCity = name => {
  const first = name.replace(/\s+(?:Metro Area|Metropolitan Statistical Area)$/i, '').split(',')[0].trim()
  for (const city of Object.keys(SHORT_NAME_OVERRIDES)) {
    if (first.startsWith(city)) return city
  }
  return first.split('-')[0].trim()
}
const mapShortNames = metros => {
  const counts = new Map()
  for (const a of metros) {
    const city = principalCity(a.name)
    counts.set(city, (counts.get(city) || 0) + 1)
  }
  return new Map(metros.map(a => {
    const city = principalCity(a.name)
    const state = a.name.match(/,\s*([A-Z]{2})(?:-[A-Z]{2})*(?:\s|$)/)?.[1]
    return [a.id, counts.get(city) > 1 ? `${city}, ${state || a.cbsa || a.id}` : city]
  }))
}
const points = ANCHORS.filter((row, i) => row[3] >= MIN && ANCHORS.findIndex(other => other[0] === row[0]) === i)
  .map(([name,lon,lat,pop],id) => ({id,name,lon,lat,pop,p:projection([lon,lat])})).filter(a=>a.p)

export default function MetroPopulationVoronoi() {
  const canvasRef = useRef(null)
  const [states,setStates] = useState([])
  const [importedPoints,setImportedPoints] = useState(null)
  const [importLabel,setImportLabel] = useState('')
  const [importError,setImportError] = useState('')
  const [sourceKind,setSourceKind] = useState('demo')
  const [officialPoints,setOfficialPoints] = useState(null)
  const cellCache = useRef(new Map())
  useEffect(() => {
    let active = true
    const url = `${import.meta.env.BASE_URL}data/metros-census-2025.csv`
    fetch(url).then(response => { if (!response.ok) throw Error('No generated Census data'); return response.text() })
      .then(csv => { if (active) { const records = parseMetroCsv(csv); setImportedPoints(records); setOfficialPoints(records); setImportLabel(`U.S. Census Vintage 2025 · ${records.length} lower-48 metros`); setSourceKind('census') } })
      .catch(() => { /* Explicit demo fallback is identified in UI. */ })
    return () => { active = false }
  }, [])
  const [loadError,setLoadError] = useState('')
  const [threshold,setThreshold] = useState(1200000)
  const [typed,setTyped] = useState('1200000')
  const [step,setStep] = useState(10000)
  const [showLabels,setShowLabels] = useState(true)
  const [selected,setSelected] = useState(null)
  const [search,setSearch] = useState('')
  const [drawerOpen,setDrawerOpen] = useState(false)
  const [searchOpen,setSearchOpen] = useState(false)
  const [hovered,setHovered] = useState(null)
  const [pinnedIds,setPinnedIds] = useState([])
  const [detailOpen,setDetailOpen] = useState(false)
  useEffect(()=>{
    let alive=true
    fetch(STATE_SOURCE).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json()})
      .then(data=>{if(alive)setStates(data.features.filter(f=>!EXCLUDED.has(f.properties?.name)))})
      .catch(e=>{if(alive)setLoadError(e.message)})
    return ()=>{alive=false}
  },[])
  const choose = value => { const v=clamp(Math.round(value/1000)*1000);setThreshold(v);setTyped(String(v)) }
  const dataset = importedPoints || points
  // Reuse the *same* eligible-array identity between population breakpoints.
  const eligibleSignature = dataset.filter(a=>a.pop>=threshold).map(a=>a.id).join('|')
  const qualifying = useMemo(()=>dataset.filter(a=>a.pop>=threshold),[dataset,eligibleSignature])
  const ranked = useMemo(() => [...dataset].sort((a,b) => b.pop-a.pop || a.name.localeCompare(b.name)), [dataset])
  const searchMatches = useMemo(() => {
    const q=search.trim().toLowerCase()
    return q ? ranked.filter(a=>a.name.toLowerCase().includes(q) || a.cbsa?.includes(q)).slice(0,12) : []
  }, [ranked, search])
  const shortNames = useMemo(() => mapShortNames(dataset), [dataset])
  const selectedRank = selected ? ranked.findIndex(a=>a.id===selected.id)+1 : 0
  const isEligible = selected ? selected.pop >= threshold : false
  const chooseMetro = a => {
    setSelected(a)
    setHovered(null)
    setDetailOpen(true)
  }
  const togglePin = a => setPinnedIds(ids => ids.includes(a.id) ? ids.filter(id=>id!==a.id) : [...ids,a.id])
  const pinned = dataset.filter(a=>pinnedIds.includes(a.id))
  const resetView = () => { setSearchOpen(false);setDrawerOpen(false);setHovered(null);setSelected(null);setDetailOpen(false);setSearch('') }
  // Measure label widths with the browser's actual text metrics, then seek free space.
  // Lower population thresholds naturally show fewer labels when crowded.
  const labelLayout = useMemo(() => {
    if (!showLabels || !qualifying.length) return []
    const fontSize = threshold < 500000 ? 7 : threshold < 1200000 ? 8 : 10
    const ctx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
    if (ctx) ctx.font = `${fontSize}px Arial, sans-serif`
    const sorted = [...qualifying].sort((a,b) => b.pop - a.pop)
    const placed = []
    const dots = qualifying.map(a => a.p)
    for (const a of sorted) {
      const [px,py] = a.p
      const width = Math.ceil((ctx?.measureText(shortNames.get(a.id) || a.name).width ?? (shortNames.get(a.id) || a.name).length*fontSize*.57) + 5)
      const height = fontSize + 5
      const options = []
      // Search clockwise around each anchor, from short offsets to longer leaders.
      for (const distance of [10, 18, 29, 43, 60, 82]) {
        for (let sector=0;sector<16;sector++) {
          const angle = (sector/16)*Math.PI*2
          const vx=Math.cos(angle), vy=Math.sin(angle)
          const x = px + vx*distance - (vx < -.22 ? width : vx > .22 ? 0 : width/2)
          const y = py + vy*distance - height/2
          const rect={x,y,w:width,h:height}
          if (x<3 || y<3 || x+width>997 || y+height>617) continue
          let collisions=0
          for (const b of placed) {
            const dx=Math.min(x+width,b.x+b.w)-Math.max(x,b.x)
            const dy=Math.min(y+height,b.y+b.h)-Math.max(y,b.y)
            if (dx>0 && dy>0) collisions+=dx*dy
          }
          for(const [dx,dy] of dots) {
            if(dx===px && dy===py) continue
            if(dx>x-4 && dx<x+width+4 && dy>y-4 && dy<y+height+4) collisions+=50
          }
          const distanceCost=distance*.12
          options.push({rect,score:collisions*100+distanceCost,distance})
        }
      }
      options.sort((a,b)=>a.score-b.score)
      const best=options[0]
      // At the densest thresholds prefer omitted labels over illegible overlaps.
      if (!best || best.score>14) continue
      const rect=best.rect
      placed.push({...rect,id:a.id})
      const tx=Math.max(rect.x,Math.min(px,rect.x+rect.w))
      const ty=Math.max(rect.y,Math.min(py,rect.y+rect.h))
      const leader=Math.hypot(tx-px,ty-py)>12
      placed[placed.length-1].render={a,x:rect.x+2,y:rect.y+fontSize+1,fontSize,leader,tx,ty}
    }
    return placed.map(p=>p.render)
  }, [qualifying, showLabels, threshold, shortNames])
  const importCsv = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (file.size > 1_000_000) throw Error('CSV must be smaller than 1MB')
      const records = parseMetroCsv(await file.text())
      setImportedPoints(records)
      setImportLabel(file.name)
      setSourceKind('upload')
      setImportError('')
      setSelected(null)
      cellCache.current.clear()
    } catch (error) { setImportError(error.message) }
    event.target.value = ''
  }
  const cells = useMemo(()=>{
    if(!qualifying.length)return []
    const key = eligibleSignature
    if (cellCache.current.has(key)) return cellCache.current.get(key)
    const vor = Delaunay.from(qualifying, a=>a.p[0],a=>a.p[1]).voronoi([0,0,1000,620])
    const result = qualifying.map((a,i)=>({a,polygon:vor.renderCell(i),color:`hsl(${((typeof a.id==='number' ? a.id : [...a.id].reduce((n,ch)=>n*31+ch.charCodeAt(0),0)) *137.508)%360} 65% 73%)`}))
    if (cellCache.current.size > 50) cellCache.current.clear()
    cellCache.current.set(key,result)
    return result
  },[qualifying,eligibleSignature])
  // Build state SVG outlines from the same projected coordinate rings as Canvas;
  // geoPath's spherical winding interpretation previously produced Alaska/Hawaii-like inset boxes.
  const ringToSvg = ring => ring.length < 3 ? '' : `M${ring.map(p=>p.join(',')).join('L')}Z`
  // Use literal GeoJSON rings for Canvas. D3 geoPath treats winding as
  // spherical interior/exterior: some state GeoJSON rings encode the inverse
  // polygon, which rasterized nearly the whole viewport as U.S. land.
  // Project raw vertices instead, so the clip can never contain a world box.
  const landRings = useMemo(() => states.flatMap(feature => {
    const geometry = feature.geometry
    if (!geometry) return []
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon' ? geometry.coordinates : []
    return polygons.map(polygon => polygon.map(ring =>
      ring.map(coordinate => projection(coordinate)).filter(Boolean)
    )).filter(polygon => polygon[0]?.length >= 3)
  }), [states])
  const countryPaths = useMemo(() => landRings.map(polygon => polygon.map(ringToSvg).join('')).filter(Boolean), [landRings])
  // Canvas Path2D clipping is applied by the rasterizer, rather than relying on
  // SVG fragment identifiers (which failed to clip in the deployed application).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !landRings.length) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    canvas.dataset.renderReady = 'false'
    ctx.clearRect(0, 0, 1000, 620)
    const cellPaths = cells.filter(cell => cell.polygon).map(cell => ({
      path: new Path2D(cell.polygon),
      color: cell.color,
    }))
    for (const polygon of landRings) {
      const boundary = new Path2D()
      for (const ring of polygon) {
        if (ring.length < 3) continue
        boundary.moveTo(ring[0][0], ring[0][1])
        for (let i = 1; i < ring.length; i++) boundary.lineTo(ring[i][0], ring[i][1])
        boundary.closePath()
      }
      ctx.save()
      ctx.clip(boundary, 'evenodd')
      for (const cell of cellPaths) {
        ctx.fillStyle = cell.color
        ctx.fill(cell.path)
      }
      ctx.restore()
    }
    canvas.dataset.renderReady = cellPaths.length > 0 ? 'true' : 'false'
  }, [landRings, cells])
  return (
    <div data-testid="metro-app" data-source-kind={sourceKind} className="fixed inset-0 flex overflow-hidden bg-slate-100 text-slate-900" style={{height:'100dvh'}}>
      <aside aria-label="Map navigation" className={`relative z-30 flex shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm transition-[width] duration-200 ${drawerOpen?'w-[min(76vw,288px)]':'w-14'}`}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-2">
          <a href="#/" aria-label="Home" title="Home" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 text-xl">⌂</a>
          {drawerOpen && <button aria-label="Collapse navigation" onClick={()=>setDrawerOpen(false)} className="rounded-lg px-2 py-2 hover:bg-slate-100">‹</button>}
        </div>
        <button aria-label={drawerOpen?'Collapse controls':'Expand controls'} onClick={()=>setDrawerOpen(v=>!v)} className="mx-2 mt-3 rounded-lg p-2 text-center hover:bg-slate-100" title="Map controls">☷</button>
        {drawerOpen && <div className="min-h-0 flex-1 overflow-y-auto p-3 text-sm space-y-5">
          <div><h2 className="font-bold text-lg">Map controls</h2><p className="text-xs text-slate-500">2025 Census metro areas</p></div>
          <section className="space-y-3">
            <label htmlFor="metro-range" className="font-semibold">Minimum metro population</label>
            <div className="flex gap-2 items-center">
              <button aria-label="Decrease population" onClick={()=>choose(threshold-step)} className="border rounded-lg px-3 py-2">−</button>
              <input aria-label="Exact minimum population" type="number" min={MIN} max={MAX} step={1000} value={typed}
                onChange={e=>setTyped(e.target.value)} onBlur={()=>choose(Number(typed))}
                onKeyDown={e=>{if(e.key==='Enter')choose(Number(typed))}} className="w-full min-w-0 border rounded-lg p-2 text-right"/>
              <button aria-label="Increase population" onClick={()=>choose(threshold+step)} className="border rounded-lg px-3 py-2">+</button>
            </div>
            <input id="metro-range" aria-label="Minimum metro population slider" type="range" min={0} max={1000} value={toTrack(threshold)}
              onChange={e=>choose(fromTrack(e.target.value))} className="w-full accent-blue-700"/>
            <div className="flex flex-wrap gap-1">{PRESETS.map(n=><button key={n} onClick={()=>choose(n)}
              className={`rounded-full border px-2 py-1 text-xs ${threshold===n?'bg-blue-700 text-white':'bg-white'}`}>{fmt(n)}</button>)}</div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}/> Show city labels</label>
          </section>
          <section aria-label="Pinned metros" className="space-y-2"><h3 className="font-semibold">Pinned cities ({pinned.length})</h3>
            {pinned.length ? pinned.map(a=><div key={a.id} className="flex items-center justify-between gap-2 rounded bg-orange-50 px-2 py-1">
              <button className="truncate text-left underline" onClick={()=>chooseMetro(a)}>{shortNames.get(a.id)||a.name}</button>
              <button aria-label={`Unpin ${a.name}`} onClick={()=>togglePin(a)}>×</button>
            </div>) : <p className="text-slate-500 text-xs">Search and pin several metros to compare locations.</p>}
          </section>
          <button className="w-full rounded-lg border px-3 py-2" onClick={resetView}>Return to full map</button>
          <p className="text-xs text-slate-500">Census 2025 metro populations · Nearest-metro Voronoi regions (not official CBSA boundaries)</p>
        </div>}
      </aside>
      <main className="relative min-w-0 flex-1 flex flex-col overflow-hidden">
        <div className="z-20 flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-5">
          <div className="min-w-0"><h1 className="truncate text-sm sm:text-lg font-bold">Nearest metro map</h1><p className="text-[10px] sm:text-xs text-slate-500">{fmt(threshold)} minimum · {qualifying.length} metros</p></div>
          <div className="relative flex min-w-0 items-center justify-end">
            <button aria-label={searchOpen?'Close metro search':'Open metro search'} title="Search metros" onClick={()=>setSearchOpen(v=>!v)}
              className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white shadow-sm">⌕</button>
          </div>
        </div>
        {searchOpen && <section aria-label="Metro search" className="absolute z-40 right-2 sm:right-5 top-14 w-[min(420px,calc(100%-16px))] max-w-[calc(100%-16px)] rounded-xl border bg-white shadow-xl p-3">
          <label htmlFor="metro-search" className="block font-semibold text-sm mb-2">Find and pin cities</label>
          <input id="metro-search" type="search" value={search} autoFocus placeholder="City, state, or CBSA code" onChange={e=>setSearch(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&searchMatches.length)chooseMetro(searchMatches[0])}} className="w-full rounded-lg border px-3 py-2"/>
          <div role="listbox" aria-label="Matching metro areas" className="max-h-[min(40dvh,260px)] overflow-y-auto mt-2 divide-y">
            {searchMatches.map(a=><div key={a.id} className="flex items-center gap-2 py-2 text-xs sm:text-sm">
              <button role="option" aria-selected={selected?.id===a.id} onClick={()=>chooseMetro(a)} className="min-w-0 flex-1 truncate text-left">{a.name}</button>
              <button onClick={()=>togglePin(a)} className="shrink-0 rounded border px-2 py-1" aria-label={`${pinnedIds.includes(a.id)?'Unpin':'Pin'} ${a.name}`}>{pinnedIds.includes(a.id)?'Unpin':'Pin'}</button>
            </div>)}
            {search && !searchMatches.length && <p className="p-2 text-sm">No matching metros.</p>}
          </div>
          {pinned.length>0 && <p className="mt-2 text-xs text-slate-600">{pinned.length} cities pinned</p>}
        </section>}
        <div className="relative min-h-0 flex-1 overflow-hidden p-2 sm:p-4">
          <div data-testid="map-shell" className="relative h-full w-full flex items-center justify-center overflow-hidden rounded-2xl border bg-white shadow-sm">
            {loadError ? <p role="alert" className="p-4">Unable to load states: {loadError}</p> : !states.length ? <p>Loading U.S. geography…</p> :
              <div className="relative w-full max-w-full max-h-full" style={{aspectRatio:'1000/620',width:'min(100%, calc((100dvh - 100px) * 1000 / 620))'}}>
                <canvas ref={canvasRef} width={1000} height={620} aria-hidden="true" data-testid="metro-shading-canvas" className="absolute inset-0 w-full h-full"/>
          <svg viewBox="0 0 1000 620" role="img" aria-label={`Map of ${qualifying.length} qualifying metro regions for population threshold ${threshold}`} className="absolute inset-0 w-full h-full">
            <g fill="none" fillRule="evenodd" stroke="#64748b" strokeWidth="1.2" strokeLinejoin="round" pointerEvents="none">
              {countryPaths.map((d,i)=><path key={i} d={d}/>)}
            </g>
            <g pointerEvents="none">{labelLayout.filter(item=>item.leader).map(item=>
              <line key={item.a.id} x1={item.a.p[0]} y1={item.a.p[1]} x2={item.tx} y2={item.ty}
                stroke="#64748b" strokeOpacity="0.52" strokeWidth="0.8" />)}</g>
            <g>{qualifying.map(a=><g key={a.id} onMouseEnter={()=>setHovered(a)} onFocus={()=>setHovered(a)} onClick={()=>{setHovered(null);chooseMetro(a)}} style={{cursor:'pointer'}}>
              <circle cx={a.p[0]} cy={a.p[1]} r={pinnedIds.includes(a.id)?6:selected?.id===a.id?4.8:3.2} fill={pinnedIds.includes(a.id)?"#f97316":"#0f172a"} stroke="white" strokeWidth="1.2"/>
              <title>{a.name}: ~{a.pop.toLocaleString()} ({sourceKind === 'census' ? 'Census 2025 estimate' : importedPoints ? 'uploaded population' : 'illustrative estimate'})</title>
            </g>)}</g>
            <g>{labelLayout.map(item=><text key={item.a.id} x={item.x} y={item.y} fontSize={item.fontSize}
              onClick={()=>chooseMetro(item.a)} style={{cursor:'pointer'}}
              fill="#0f172a" stroke="#fff" strokeWidth="2.5" paintOrder="stroke">{shortNames.get(item.a.id) || item.a.name}</text>)}</g>
          </svg>
              </div>}
            {hovered && !detailOpen && <div role="tooltip" className="absolute z-20 bottom-3 right-3 max-w-[min(280px,85%)] rounded-xl border bg-white p-3 shadow-lg text-sm" onMouseEnter={()=>setHovered(hovered)} onMouseLeave={()=>setHovered(null)}>
              <div className="font-semibold">{hovered.name}</div>
              <p>Population: {hovered.pop.toLocaleString()}</p><p>CBSA: {hovered.cbsa||'N/A'}</p>
              <button onClick={()=>chooseMetro(hovered)} className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-white">Show full stats</button>
            </div>}
            {detailOpen && selected && <section data-testid="metro-details" aria-label="Full metro statistics" className="absolute z-30 bottom-2 right-2 left-2 sm:bottom-4 sm:right-4 sm:left-auto sm:w-[380px] max-h-[60dvh] overflow-y-auto rounded-xl border bg-white p-4 shadow-xl text-sm">
              <div className="flex items-start justify-between gap-3"><h2 className="font-bold text-lg">{selected.name}</h2><button aria-label="Close full stats" onClick={()=>setDetailOpen(false)}>✕</button></div>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                <div><dt className="text-xs text-slate-500">Population (2025)</dt><dd className="font-bold">{selected.pop.toLocaleString()}</dd></div>
                <div><dt className="text-xs text-slate-500">Population rank</dt><dd>#{selectedRank} of {ranked.length}</dd></div>
                <div><dt className="text-xs text-slate-500">CBSA code</dt><dd>{selected.cbsa||'Not provided'}</dd></div>
                <div><dt className="text-xs text-slate-500">Current threshold</dt><dd>{isEligible?'Qualifies':'Below minimum'}</dd></div>
              </dl>
              <div className="mt-3 flex gap-2">
                <button className="rounded border px-3 py-2" onClick={()=>togglePin(selected)}>{pinnedIds.includes(selected.id)?'Unpin city':'Pin city'}</button>
                {!isEligible && <button className="rounded border px-3 py-2" onClick={()=>choose(selected.pop)}>Include this metro in the map</button>}
                <button className="rounded border px-3 py-2" onClick={resetView}>Full map</button>
              </div>
              <p className="mt-2 text-xs text-slate-500">Source: {sourceKind==='census'?'U.S. Census Bureau 2025 population estimates and TIGER/Line CBSA point':sourceKind==='upload'?'Uploaded CSV':'Illustrative demo data'}. Voronoi region is not the official metro boundary.</p>
            </section>}
          </div>
        </div>
      </main>
    </div>
  )
}
