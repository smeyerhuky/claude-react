const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.argv[2]+'#/',{waitUntil:'domcontentloaded'});
  await page.getByText('Metro Population Regions — Interactive Map',{exact:true}).first().click();
  await page.locator('[data-testid="metro-app"][data-source-kind="census"]').waitFor({timeout:30000});
  await page.waitForFunction(()=>document.querySelector('[data-testid="metro-shading-canvas"]')?.dataset.renderReady==='true',null,{timeout:30000});
  const snapshot=()=>page.evaluate(()=>({hash:location.hash,canvas:document.querySelector('[data-testid="metro-shading-canvas"]').toDataURL(),markers:[...document.querySelectorAll('[data-metro-marker]')].map(n=>[n.dataset.metroMarker,n.dataset.pinned,n.dataset.selected]),mapLabel:document.querySelector('svg[role="img"]').getAttribute('aria-label')}));
  if(process.argv[3]==='disabled'){
   if(await page.getByRole('button',{name:'Inspect road research (dev)'}).count())throw Error('Inspector available without opt-in');
   if(await page.locator('iframe').count())throw Error('Research frame loaded without opt-in');
   if(errors.length)throw Error(errors.join('\n'));
   console.log(JSON.stringify({devPanel:false,pageErrors:0}));return;
  }
  const before=await snapshot();
  await page.getByRole('button',{name:'Inspect road research (dev)'}).click();
  const dialog=page.getByRole('dialog',{name:'Metro road research inspector'});await dialog.waitFor();
  let frame=page.frameLocator('iframe[title="Census road-node research experiment"]');await frame.locator('#rows tr').first().waitFor();if(await frame.locator('#rows tr').count()!==26)throw Error('Probe experiment missing sources');
  const sandbox=await page.locator('iframe').getAttribute('sandbox');if(sandbox!=='allow-scripts')throw Error('Wrong sandbox');
  await dialog.getByLabel('Research experiment').selectOption('denver');
  frame=page.frameLocator('iframe[title="Denver road-start sensitivity experiment"]');await frame.locator('#rows tr').first().waitFor();if(await frame.locator('#rows tr').count()!==5)throw Error('Comparison missing probes');
  await frame.locator('#metric').selectOption('travel_time');await frame.locator('#direction').selectOption('location-to-metro');
  if(process.argv[4])await page.screenshot({path:process.argv[4],fullPage:true});
  await dialog.getByRole('button',{name:'Close research inspector'}).click();await dialog.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Inspect road research (dev)'}).click();await dialog.waitFor();
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  const after=await snapshot();if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Inspector changed map rendering/state');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({devPanel:true,probeRows:26,comparisonRows:5,sandbox,mapStateAndCanvasPreserved:true,pageErrors:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
