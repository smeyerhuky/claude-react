const fs=require('fs'),crypto=require('crypto'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'));
  const expected=JSON.parse(fs.readFileSync('docs/research/utah-parent-reference/domains.json','utf8'));
  const queue=JSON.parse(fs.readFileSync('docs/research/remaining-competitor-queue/queue.json','utf8'));
  const actual=await page.evaluate(()=>data);
  if(actual.rows.length!==367||new Set(actual.rows.map(r=>r.cbsa)).size!==367)throw Error('Incomplete unique source inventory');
  for(const row of actual.rows){const domain=expected.domains.find(d=>d.cbsa===row.cbsa);if(!domain||JSON.stringify(row.point)!==JSON.stringify(domain.native_representative_lonlat)||row.name!==domain.name||row.population!==domain.source_population)throw Error('Source identity or native point changed');}
  const queueSha=crypto.createHash('sha256').update(fs.readFileSync('docs/research/remaining-competitor-queue/queue.json')).digest('hex');if(actual.queue_sha256!==queueSha)throw Error('Wrong frozen queue');
  const states=JSON.parse(fs.readFileSync('docs/research/native-state-inventory/report.json','utf8'));
  for(const row of actual.rows)require('assert').deepStrictEqual(row.point_states,states.rows.find(s=>s.cbsa===row.cbsa).point_states);
  await page.locator('#pointstate').selectOption('TN');const tnIds=await page.locator('#rows tr').evaluateAll(rows=>rows.map(r=>r.dataset.cbsa));if(!tnIds.includes('32820')||tnIds.length!==8)throw Error('Native-state filtering changed membership or omitted Memphis');
  await page.locator('#pointstate').selectOption('PR');if(await page.locator('#rows tr').count()!==5)throw Error('Puerto Rico native points missing');
  await page.locator('#pointstate').selectOption('TX');const txPositions=await page.locator('#plot circle').evaluateAll(dots=>dots.map(d=>Number(d.getAttribute('cx'))));if(txPositions.length!==24||Math.max(...txPositions)-Math.min(...txPositions)<700)throw Error('Filtered native points did not fit the research view');
  await page.locator('#pointstate').selectOption('NV');if(await page.locator('#rows tr').count()!==2)throw Error('Nevada native inventory changed');
  await page.locator('#pointstate').selectOption('all');
  await page.locator('#status').selectOption('unknown');
  const ids=await page.locator('#rows tr').evaluateAll(rows=>rows.map(r=>r.dataset.cbsa));if(JSON.stringify(ids)!==JSON.stringify(queue.queue.map(r=>r.cbsa)))throw Error('Unknown identities/order changed');
  if(actual.rows.filter(r=>r.scans.length).length!==55||actual.rows.some(r=>r.modeled&&r.scans.length))throw Error('Lead investigations confused with route coverage');
  const manifest=JSON.parse(fs.readFileSync('docs/research/missouri-arkansas-origin-evidence/manifest.json','utf8'));
  const sourceReports=[{state:'kansas',report_path:'docs/research/kansas-texas-source-preflight/kansas-origins.json'},{state:'texas',report_path:'docs/research/kansas-texas-source-preflight/texas-origins.json'},...manifest.records,...JSON.parse(fs.readFileSync('docs/research/competitor-frontier-expansion/manifest.json','utf8')).records,...JSON.parse(fs.readFileSync('docs/research/retained-extract-frontier/manifest.json','utf8')).records,...JSON.parse(fs.readFileSync('docs/research/nevada-competitor-frontier/manifest.json','utf8')).records];
  for(const row of actual.rows)for(const scan of row.scans){
   const report=sourceReports.filter(r=>r.state===scan.extract).map(r=>JSON.parse(fs.readFileSync(r.report_path,'utf8'))).find(r=>r.metros.some(m=>m.cbsa===row.cbsa));
   const record=report.metros.find(m=>m.cbsa===row.cbsa);require('assert').deepStrictEqual(scan.supported,record.nearest_model_drivable_highway);require('assert').deepStrictEqual(scan.mapped,record.nearest_mapped_highway);if(scan.osm_sha256!==report.osm_sha256)throw Error('Wrong source extract identity');
  }
  const triage=JSON.parse(fs.readFileSync('docs/research/competitor-frontier-expansion/review.json','utf8'));
  for(const note of [...triage.records,...JSON.parse(fs.readFileSync('docs/research/retained-extract-frontier/review.json','utf8')).records,...JSON.parse(fs.readFileSync('docs/research/nevada-competitor-frontier/review.json','utf8')).records])require('assert').deepStrictEqual(actual.rows.find(r=>r.cbsa===note.cbsa).triage,note);
  await page.locator('#status').selectOption('all');await page.locator('#search').fill('32820');await page.locator('#plot circle').click();if(!(await page.locator('#observations').innerText()).includes('appropriate neighboring-state extract'))throw Error('Memphis absence confused with inaccessibility');await page.locator('#search').fill('');
  for(const row of queue.queue.slice(0,10))if(!actual.rows.find(r=>r.cbsa===row.cbsa).scans.length)throw Error('First ten investigation accounting changed');
  await page.locator('#status').selectOption('investigated');if(await page.locator('#rows tr').count()!==55)throw Error('Investigation filter wrong');
  await page.locator('#status').selectOption('unscanned');if(await page.locator('#rows tr').count()!==286)throw Error('Unscanned filter wrong');
  await page.locator('#status').selectOption('all');await page.locator('#search').fill('27900');await page.locator('#plot circle').focus();await page.locator('#plot circle').press('Enter');
  const observations=await page.locator('#observations').innerText();if(!observations.includes('897906982')||!observations.includes('6115.452')||!observations.includes('needs evidence'))throw Error('Joplin cross-border observations/review missing');
  await page.locator('#search').fill('');
  await page.locator('#status').selectOption('all');await page.locator('#csv').selectOption('absent');if(await page.locator('#rows tr').count()!==8)throw Error('Missing CSV qualifiers');
  await page.locator('#csv').selectOption('all');await page.locator('#search').fill('Wichita');if(await page.locator('#rows tr').count()!==2)throw Error('Name search failed');
  await page.locator('#search').fill('48660');const dot=page.locator('#plot circle');await dot.focus();await dot.press('Enter');if(!(await page.locator('#selected').innerText()).includes('48660'))throw Error('Keyboard point selection failed');
  await page.locator('#search').fill('<script>');if(await page.locator('#rows tr').count()!==0)throw Error('Unsafe or incorrect search');
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  console.log(JSON.stringify({identities:367,unknownOrderChecked:341,absentCsvQualifiers:8,nativeCoordinatesChecked:367,retainedLeadIdentities:55,crossBorderDetails:true,keyboardSelection:true,pageErrors:0,networkRequests:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
