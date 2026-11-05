const fs=require('fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:1000}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));await page.route('**/*',route=>{requests.push(route.request().url());route.abort();});
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'),{waitUntil:'load'});
  const data=await page.locator('#mixed-data').evaluate(el=>JSON.parse(el.textContent));
  if(data.cases.length!==10||await page.locator('#case option').count()!==10)throw Error('Missing frozen history cases');
  let checked=0;
  for(const item of data.cases)for(const metric of ['length','travel_time']){
   await page.locator('#case').selectOption(item.id);await page.locator('#metric').selectOption(metric);
   const entry=item.queries[metric],answer=entry.result;
   const expected=answer.cost===null?'No path in supplied network':answer.cost.toFixed(3)+(metric==='length'?' m':' s');
   if(await page.locator('#cost').innerText()!==expected)throw Error('Wrong displayed cost');
   const selected=await page.locator('#rows tr').evaluateAll(rows=>rows.map(r=>r.dataset.arcId));
   if(JSON.stringify(selected)!==JSON.stringify(answer.arc_path))throw Error('Wrong exact path');
   if(await page.locator('#plot .path').count()!==answer.arc_path.length||await page.locator('#plot .declaration').count()!==data.declarations[String(item.relation_id)].length)throw Error('Wrong diagram history/path');
   if(await page.locator('#plot .road').count()!==(item.family==='node'?2:5))throw Error('Wrong supplied component diagram');
   if(await page.locator('#clock').textContent()!==item.clock||await page.locator('#rule-status').textContent()!==item.rule_status)throw Error('Wrong clock/applicability disclosure');
   const ids=await page.locator('#nodes').textContent();if(!ids.includes(String(answer.source))||!ids.includes(String(answer.target)))throw Error('Wrong raw query endpoints');
   const identity=await page.locator('#identity').textContent();if(!identity.includes(entry.scenario_sha256)||!identity.includes(entry.graph_sha256))throw Error('Stale scenario/graph identity');
   for(const aid of answer.arc_path){const arc=data.arcs.find(a=>a.id===aid),row=await page.locator(`tr[data-arc-id="${aid}"]`).innerText();if(!row.includes(arc.length.toFixed(3))||!row.includes(arc.travel_time.toFixed(3)))throw Error('Wrong segment weights');}
   checked++;
  }
  await page.locator('summary').focus();await page.keyboard.press('Enter');
  const body=await page.locator('body').innerText();
  for(const marker of ['Zero connectors approved','No adopted anchors','not metro costs','Conditions may change before arrival.','regression only','does not establish legal turn','2,508 old Census costs','every older inspector view','bollard is never assumed open'])if(!body.includes(marker))throw Error('Missing scope: '+marker);
  await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile page overflow');
  await page.locator('#case').selectOption('way:9680890:full_approach');await page.locator('#metric').selectOption('length');
  await page.locator('#case').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  if(await page.locator('#case').inputValue()!=='way:9680890:start_inside'||await page.locator('#rows tr').count()!==2)throw Error('Keyboard history selection failed');
  if(process.argv[3])await page.screenshot({path:process.argv[3],fullPage:true});
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  console.log(JSON.stringify({cases:checked,exactPathsAndWeights:true,clockAndScopePreserved:true,keyboard:true,mobile:true,externalRequests:0,pageErrors:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
