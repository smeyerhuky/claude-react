const fs=require('fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',route=>{requests.push(route.request().url());route.abort();});
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'),{waitUntil:'load'});
  const data=await page.locator('#kernel-data').evaluate(el=>JSON.parse(el.textContent));
  let cases=0;
  for(const scenario of ['adopted_reference','active_window_regression'])for(const metric of ['length','travel_time'])for(const direction of ['forward','reverse']){
   await page.locator('#scenario').selectOption(scenario);await page.locator('#metric').selectOption(metric);await page.locator('#direction').selectOption(direction);
   const entry=data.report.query_replays[[scenario,metric,direction].join(':')],result=entry.result;
   const expected=result.cost===null?'No path in supplied network':result.cost.toFixed(3)+(metric==='length'?' m':' s');
   if(await page.locator('#cost').innerText()!==expected)throw Error('Wrong displayed cost');
   if(await page.locator('#rows tr').count()!==result.arc_path.length||await page.locator('#plot .path').count()!==result.arc_path.length)throw Error('Wrong exact path length');
   if(JSON.stringify(await page.locator('#rows tr').evaluateAll(rows=>rows.map(row=>row.dataset.arcId)))!==JSON.stringify(result.arc_path))throw Error('Wrong arc identities');
   if(!(await page.locator('#nodes').innerText()).includes(String(result.source))||!(await page.locator('#nodes').innerText()).includes(String(result.target)))throw Error('Wrong query orientation');
   if(!(await page.locator('#identity').textContent()).includes(entry.scenario_sha256)||!(await page.locator('#identity').textContent()).includes(entry.graph_sha256))throw Error('Stale scenario or graph binding');
   for(const aid of result.arc_path){const arc=Object.values(data.weights.selected_raw_way_results).flatMap(r=>r.arcs||[]).find(a=>a.id===aid),text=await page.locator(`tr[data-arc-id="${aid}"]`).innerText();if(!text.includes(arc.length.toFixed(3))||!text.includes(arc.travel_time.toFixed(3)))throw Error('Wrong segment weight');}
   cases++;
  }
  await page.locator('details summary').focus();await page.keyboard.press('Enter');
  const body=await page.locator('body').innerText();
  for(const marker of ['Zero connectors approved','No adopted anchors','not metro distances','Conditions may change before arrival.','regression test','not silently removed','does not establish permission','Raw source context'])if(!body.includes(marker))throw Error('Missing scope: '+marker);
  if(!(await page.locator('#bollard').textContent()).includes('815164359'))throw Error('Unresolved source control hidden');
  await page.setViewportSize({width:390,height:844});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile page overflows');
  await page.locator('#scenario').selectOption('adopted_reference');await page.locator('#metric').selectOption('length');await page.locator('#direction').selectOption('forward');
  await page.locator('#scenario').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  if(await page.locator('#scenario').inputValue()!=='active_window_regression')throw Error('Keyboard clock selection failed');
  await page.locator('#scenario').selectOption('adopted_reference');
  if(process.argv[3])await page.screenshot({path:process.argv[3],fullPage:true});
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  console.log(JSON.stringify({cases,exactPathAndWeights:true,scopePreserved:true,keyboard:true,mobile:true,externalRequests:0,pageErrors:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
