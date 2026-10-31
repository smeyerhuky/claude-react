const fs=require('fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage(),requests=[],errors=[];
  page.on('request',r=>{if(!r.url().startsWith('file:'))requests.push(r.url())});page.on('pageerror',e=>errors.push(String(e)));
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'));
  const report=JSON.parse(fs.readFileSync('docs/research/principal-city-source-work/report.json','utf8'));
  await page.locator('#rows tr').first().waitFor();
  if(await page.locator('#rows tr').count()!==698||await page.locator('#state option').count()!==53)throw Error('Incomplete official inventory');
  for(const state of report.states){await page.locator('#state').selectOption(state.state);if(await page.locator('#rows tr').count()!==state.memberships)throw Error('Wrong city-state group '+state.state)}
  await page.locator('#state').selectOption('all');
  for(const [status,count] of Object.entries(report.counts)){await page.locator('#status').selectOption(status);if(await page.locator('#rows tr').count()!==count)throw Error('Wrong evidence-work count '+status)}
  await page.locator('#status').selectOption('all');await page.locator('#state').selectOption('UT');await page.locator('#search').fill('39340');
  if(await page.locator('#rows tr').count()!==3)throw Error('Lehi/Orem/Provo collapsed into one metro source');
  await page.getByRole('button',{name:'Inspect Orem UT 4957300',exact:true}).focus();await page.keyboard.press('Enter');
  const detail=await page.locator('#detail').innerText();if(!detail.includes('Access review unresolved')||!detail.includes('sidewalk')||!detail.includes('orem.json'))throw Error('Vehicle-entry caveat or provenance missing');
  await page.locator('#state').selectOption('all');await page.locator('#search').fill('0809280');await page.locator('#rows button').click();
  if(!(await page.locator('#detail-title').innerText()).includes('Broomfield'))throw Error('City FIPS search failed');
  await page.locator('#search').fill('no matching principal city');if(await page.locator('#rows tr').count()!==0||!(await page.locator('#empty').isVisible()))throw Error('Empty search misrepresented');
  if(requests.length||errors.length)throw Error(JSON.stringify({requests,errors}));
  console.log(JSON.stringify({memberships:698,jurisdictions:52,statusCounts:report.counts,keyboardSelection:true,externalRequests:0,pageErrors:0}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
