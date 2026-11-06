const fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:950}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));await page.route('**/*',r=>{requests.push(r.request().url());return r.abort();});
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'),{waitUntil:'load'});
  const data=JSON.parse(await page.locator('#native-bounds-data').textContent());
  await page.getByText('First-exit lower bounds',{exact:true}).click();
  await page.getByText('Exact costs and source fingerprints',{exact:true}).click();
  if(await page.locator('#plot .core-node').count()!==294||await page.locator('#plot .unknown').count()!==2||await page.locator('#plot .gate').count()!==1)throw Error('Core or unknown controls lost');
  if(await page.locator('#comparison-rows tr').count()!==2)throw Error('Directional matrix missing');
  for(const direction of ['forward','reverse'])for(const metric of ['length','travel_time']){
   await page.locator('#direction').selectOption(direction);await page.locator('#metric').selectOption(metric);const q=data.queries[direction+':'+metric],unit=metric==='length'?'m':'s';
   if(await page.locator('#cost').innerText()!==q.cost.toFixed(6)+' '+unit)throw Error('Wrong directional cost');
   if(await page.locator('#margin').innerText()!==q.first_exit_gap.toFixed(6)+' '+unit)throw Error('Wrong exit margin');
   if(await page.locator('#rows tr').count()!==q.path.length||await page.locator('#plot .witness').count()!==q.path.length)throw Error('Path/table geometry missing');
   if(await page.locator('#exits tr').count()!==47||!(await page.locator('#exits').innerText()).includes('Unreachable in prefix relaxation'))throw Error('Exit accounting changed');
   const ids=await page.locator('#rows tr td:first-child').allTextContents();if(JSON.stringify(ids)!==JSON.stringify(q.path))throw Error('Directed arcs transposed');
   const identity=JSON.parse(await page.locator('#identity').innerText());if(JSON.stringify(identity.cost_exact)!==JSON.stringify(q.cost_exact)||identity.access_verified||identity.release_eligible||identity.approved_connectors||identity.adopted_anchors)throw Error('Evidence or approval flags changed');
  }
  await page.locator('#show-exits').check();if(await page.locator('#plot .exit').count()!==47)throw Error('Exit overlay missing');
  await page.locator('#show-exits').uncheck();if(await page.locator('#plot .exit').count())throw Error('Exit overlay stuck');
  await page.locator('#focus-path').check();if(!(await page.locator('#viewport-note').innerText()).includes('Focused witness'))throw Error('Witness focus missing');
  await page.locator('#direction').selectOption('forward');await page.locator('#metric').selectOption('travel_time');
  if(!(await page.locator('#margin').innerText()).includes('0.046296 s'))throw Error('Narrow exact time margin hidden');
  if(!(await page.locator('body').innerText()).includes('Zero connectors approved'))throw Error('Access gate hidden');
  await page.getByText('First-exit lower bounds',{exact:true}).click();
  await page.getByText('Exact costs and source fingerprints',{exact:true}).click();
  if(process.argv[3])await page.screenshot({path:process.argv[3],fullPage:true});
  await page.setViewportSize({width:390,height:900});
  const width=await page.evaluate(()=>({body:document.documentElement.scrollWidth,viewport:innerWidth}));if(width.body>width.viewport+1)throw Error('Mobile page overflows');
  if(process.argv[3])await page.screenshot({path:process.argv[3].replace(/\.png$/,'-mobile.png'),fullPage:true});
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  console.log(JSON.stringify({queries:4,coreNodes:294,unknownWays:2,firstExits:47,networkRequests:0,pageErrors:0,mobileOverflow:false}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
