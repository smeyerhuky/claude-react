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
  await page.locator('#status').selectOption('unknown');
  const ids=await page.locator('#rows tr').evaluateAll(rows=>rows.map(r=>r.dataset.cbsa));if(JSON.stringify(ids)!==JSON.stringify(queue.queue.map(r=>r.cbsa)))throw Error('Unknown identities/order changed');
  await page.locator('#status').selectOption('all');await page.locator('#csv').selectOption('absent');if(await page.locator('#rows tr').count()!==8)throw Error('Missing CSV qualifiers');
  await page.locator('#csv').selectOption('all');await page.locator('#search').fill('Wichita');if(await page.locator('#rows tr').count()!==2)throw Error('Name search failed');
  await page.locator('#search').fill('48660');const dot=page.locator('#plot circle');await dot.focus();await dot.press('Enter');if(!(await page.locator('#selected').innerText()).includes('48660'))throw Error('Keyboard point selection failed');
  await page.locator('#search').fill('<script>');if(await page.locator('#rows tr').count()!==0)throw Error('Unsafe or incorrect search');
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  console.log(JSON.stringify({identities:367,unknownOrderChecked:341,absentCsvQualifiers:8,nativeCoordinatesChecked:367,keyboardSelection:true,pageErrors:0,networkRequests:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
