const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const report=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'));await page.waitForSelector('#rows tr');
  let combinations=0,checkedCosts=0;
  for(const metric of ['length','travel_time'])for(const direction of ['metro-to-location','location-to-metro']){
   await page.selectOption('#metric',metric);await page.selectOption('#direction',direction);
   if(await page.locator('#rows tr').count()!==5)throw Error('Missing fixed probe');
   const divisor=metric==='length'?1000:60;
   for(const probe of report.probes){
    const row=page.locator(`#rows tr[data-cbsa="${probe.cbsa}"]`),cells=await row.locator('td').allTextContents();
    const chosen=report.cases.filter(c=>c.metric===metric&&c.orientation===direction&&c.probe_cbsa===probe.cbsa);
    const old=chosen.find(c=>c.scenario_id==='preserved-census-denver-road-lead-v1').graph_only_cost;
    const next=chosen.find(c=>c.scenario_id===report.scenario_id).graph_only_cost;
    const expected=[(old/divisor).toFixed(3),(next/divisor).toFixed(3),((next-old)/divisor).toFixed(3)];
    if(cells.slice(1,4).join('|')!==expected.join('|'))throw Error('Wrong scenario/direction/units or delta');
    checkedCosts+=2;
   }
   combinations++;
  }
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  if(process.argv[4])await page.screenshot({path:process.argv[4],fullPage:true});
  console.log(JSON.stringify({combinations,checkedCosts,pageErrors:0,externalRequests:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
