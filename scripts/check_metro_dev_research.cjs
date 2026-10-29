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
  await dialog.getByLabel('Research experiment').selectOption('sixState');
  frame=page.frameLocator('iframe[title="Six-state Census road-node experiment"]');await frame.locator('#rows tr').first().waitFor();
  if(await frame.locator('#rows tr').count()!==31)throw Error('Six-state snapshot missing sources');
  if(!(await frame.locator('#inventory').innerText()).includes('336'))throw Error('Six-state missing-competitor scope changed');
  if(!(await frame.locator('#rows tr').filter({hasText:'(48620)'}).innerText()).includes('Modeled unreachable'))throw Error('Wichita unsupported lead hidden');
  await dialog.getByLabel('Research experiment').selectOption('denver');
  frame=page.frameLocator('iframe[title="Denver road-start sensitivity experiment"]');await frame.locator('#rows tr').first().waitFor();if(await frame.locator('#rows tr').count()!==5)throw Error('Comparison missing probes');
  await frame.locator('#metric').selectOption('travel_time');await frame.locator('#direction').selectOption('location-to-metro');
  await dialog.getByLabel('Research experiment').selectOption('inventory');
  frame=page.frameLocator('iframe[title="Metro competitor investigation inventory"]');
  await frame.locator('#rows tr').first().waitFor();
  if(await frame.locator('#rows tr').count()!==367||await frame.locator('#plot circle').count()!==367)throw Error('Incomplete competitor inventory');
  await frame.locator('#status').selectOption('unknown');if(await frame.locator('#rows tr').count()!==341)throw Error('Missing unknown competitors');
  if(await frame.locator('#rows tr').first().getAttribute('data-cbsa')!=='48660')throw Error('Investigation queue order changed');
  await frame.locator('#status').selectOption('modeled');if(await frame.locator('#rows tr').count()!==26)throw Error('Modeled count changed');
  await frame.locator('#status').selectOption('investigated');if(await frame.locator('#rows tr').count()!==53)throw Error('Lead investigation count changed');
  await frame.locator('#status').selectOption('unscanned');if(await frame.locator('#rows tr').count()!==288)throw Error('Unscanned count changed');
  await frame.locator('#status').selectOption('all');await frame.locator('#csv').selectOption('absent');if(await frame.locator('#rows tr').count()!==8)throw Error('Absent CSV qualifiers dropped');
  await frame.locator('#csv').selectOption('all');await frame.locator('#search').fill('48660');if(await frame.locator('#rows tr').count()!==1)throw Error('CBSA search failed');
  await frame.locator('#rows button').click();if(!(await frame.locator('#selected').innerText()).includes('Access unapproved'))throw Error('Selection lost access warning');
  await frame.locator('#search').fill('no matching metro');if(await frame.locator('#rows tr').count()!==0||await frame.locator('#plot circle').count()!==0)throw Error('Empty search misrepresented');
  await frame.locator('#search').fill('');
  await frame.locator('body').evaluate(()=>window.scrollTo(0,0));
  if(process.argv[4])await page.screenshot({path:process.argv[4],fullPage:true});
  await dialog.getByRole('button',{name:'Close research inspector'}).click();await dialog.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Inspect road research (dev)'}).click();await dialog.waitFor();
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  const after=await snapshot();if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Inspector changed map rendering/state');
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({devPanel:true,probeRows:26,sixStateRows:31,comparisonRows:5,inventoryRows:367,unknownRows:341,absentCsvRows:8,leadInvestigations:53,sandbox,mapStateAndCanvasPreserved:true,pageErrors:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
