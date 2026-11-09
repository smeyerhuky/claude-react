const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),frozen=JSON.parse(fs.readFileSync(path.join(root,'docs/research/northern-local-detours/report.json'))),geometry=JSON.parse(fs.readFileSync(path.join(root,'docs/research/northern-detour-explorer/geometry.json')));
const format=(q)=>q.metric==='length'?`${(q.result.cost/1000).toFixed(2)} km`:`${(q.result.cost/60).toFixed(1)} min`;
function checkGeometry(actual,q){
 const expected=[geometry.nodes[geometry.arcs[q.result.arc_path[0]].from],...q.result.arc_path.map(a=>geometry.nodes[geometry.arcs[a].to])];
 if(actual.length!==expected.length)throw Error('Native vertices were omitted or invented');
 const far=axis=>expected.reduce((best,p,i)=>Math.abs(p[axis]-expected[0][axis])>Math.abs(expected[best][axis]-expected[0][axis])?i:best,0),ix=far(0),iy=far(1);
 if(ix===0||iy===0)throw Error('Test requires nondegenerate native geometry');
 const kx=(actual[ix][0]-actual[0][0])/(expected[ix][0]-expected[0][0]),ky=(actual[iy][1]-actual[0][1])/(expected[iy][1]-expected[0][1]);
 if(!(kx>0&&ky<0))throw Error('Directed native geometry orientation changed');
 for(let i=0;i<expected.length;i++)for(let axis=0;axis<2;axis++){
  const predicted=actual[0][axis]+(axis?ky:kx)*(expected[i][axis]-expected[0][axis]);
  if(Math.abs(predicted-actual[i][axis])>0.002)throw Error('Rendered geometry differs from original native path');
 }
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:1050}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));await page.route('**/*',r=>{requests.push(r.request().url());return r.abort();});
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'),{waitUntil:'load'});
  if(await page.locator('#matrix tr').count()!==20||await page.locator('#source option').count()!==5||await page.locator('#target option').count()!==5)throw Error('Directed pair/endpoints missing');
  await page.getByText('Selected road segments',{exact:true}).click();
  await page.getByText('Exact costs and source evidence',{exact:true}).click();
  let vertexChecks=0;
  for(const q of frozen.queries){
   await page.locator('#source').selectOption(q.source);await page.locator('#target').selectOption(q.target);await page.locator('#metric').selectOption(q.metric);
   if(await page.locator('#raw-cost').innerText()!==q.result.cost.toFixed(6)+(q.metric==='length'?' m':' s'))throw Error('Wrong independent checkpoint cost');
   if(await page.locator('#cost').innerText()!==format(q))throw Error('Wrong rounded display');
   const reverse=frozen.queries.find(r=>r.source===q.target&&r.target===q.source&&r.metric===q.metric);
   if(await page.locator('#return-cost').innerText()!==format(reverse))throw Error('Return cost was transposed');
   const actual=await page.locator('#plot .selected').evaluate(n=>[...n.points].map(p=>[p.x,p.y]));
   checkGeometry(actual,q);vertexChecks+=actual.length;
   checkGeometry(await page.locator('#plot .return').evaluate(n=>[...n.points].map(p=>[p.x,p.y])),reverse);
   const evidence=JSON.parse(await page.locator('#evidence').innerText());
   if(JSON.stringify(evidence.cost_exact)!==JSON.stringify(q.result.exact_stored_path_cost)||evidence.source!==q.source||evidence.target!==q.target||evidence.access_verified||evidence.geographic_coverage_certified||evidence.anchors_adopted||evidence.connectors_approved||evidence.release_eligible)throw Error('Exact evidence or research scope differs');
   const ids=await page.locator('#segments tr').evaluateAll(rows=>rows.map(n=>n.dataset.arc));
   if(JSON.stringify(ids)!==JSON.stringify(q.result.arc_path.slice(0,25)))throw Error('First page arc order differs');
   if(q.result.arc_path.length>25){await page.locator('#next').click();
   if(JSON.stringify(await page.locator('#segments tr').evaluateAll(rows=>rows.map(n=>n.dataset.arc)))!==JSON.stringify(q.result.arc_path.slice(25,50)))throw Error('Next page arc order differs');
   await page.locator('#previous').click();}else if(!(await page.locator('#next').isDisabled()))throw Error('Short path pagination is not bounded');
  }
  const before=JSON.parse(await page.locator('#evidence').innerText());await page.locator('#swap').click();const after=JSON.parse(await page.locator('#evidence').innerText());
  if(after.source!==before.target||after.target!==before.source||after.metric!==before.metric)throw Error('Swap changed query semantics');
  await page.locator('#show-return').uncheck();if(await page.locator('#plot .return').count())throw Error('Return overlay remained');await page.locator('#show-return').check();
  await page.locator('#show-context').uncheck();if(await page.locator('#plot .context').count())throw Error('Context overlay remained');await page.locator('#show-context').check();
  for(const extent of ['greeley','all','route'])await page.locator('#extent').selectOption(extent);
  await page.getByRole('button',{name:'Inspect fort-college to greeley-tenth',exact:true}).click();
  if(JSON.parse(await page.locator('#evidence').innerText()).target!=='greeley-tenth')throw Error('Matrix selection failed');
  await page.locator('#source').selectOption('greeley-tenth');
  if(await page.locator('#source').inputValue()===await page.locator('#target').inputValue())throw Error('Self query was selected');
  if(!(await page.locator('#target option[value="greeley-tenth"]').evaluate(n=>n.disabled)))throw Error('Self target was not disabled');
  await page.locator('#source').selectOption('fort-college');await page.locator('#target').selectOption('greeley-tenth');await page.locator('#metric').selectOption('length');
  await page.getByText('Selected road segments',{exact:true}).click();await page.getByText('Exact costs and source evidence',{exact:true}).click();
  if(!(await page.locator('body').innerText()).includes('Zero connectors approved')||!(await page.locator('body').innerText()).includes('28 newly finite'))throw Error('Model scope is hidden');
  if(process.argv[3])await page.screenshot({path:process.argv[3],fullPage:true});
  await page.setViewportSize({width:390,height:900});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Mobile page overflows');
  await page.locator('#extent').selectOption('greeley');
  if(process.argv[3])await page.screenshot({path:process.argv[3].replace(/\.png$/,'-mobile.png'),fullPage:true});
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  console.log(JSON.stringify({queries:40,directedPairs:20,endpoints:5,nativeVertexChecks:vertexChecks,networkRequests:0,pageErrors:0,mobileOverflow:false}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
