const fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:1100},locale:"en-US"}),errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'));
  const baseline=JSON.parse(fs.readFileSync(process.argv[4]||'docs/research/census-33-source-checkpoint/baseline.json','utf8'));
  if(!(await page.locator('h1').innerText()).includes('Las Vegas eight-state'))throw Error('Wrong scenario title');
  const lead=baseline.sources.find(s=>s.cbsa==='29820');if(!(await page.locator('body').innerText()).includes((lead.diagnostic_gap_m/1000).toFixed(3)+' km'))throw Error('Las Vegas connector gap hidden');
  const probes=await page.locator('#probe option').evaluateAll(nodes=>nodes.map(n=>n.value));if(probes.length!==19)throw Error('Wrong inherited probe inventory');
  let combinations=0,cells=0,unreachable=0;
  for(const metric of ['length','travel_time'])for(const direction of ['location-to-metro','metro-to-location'])for(const probe of probes){
   await page.selectOption('#metric',metric);await page.selectOption('#direction',direction);await page.selectOption('#probe',probe);
   const rows=await page.locator('#rows tr').evaluateAll(nodes=>nodes.map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent)));
   if(rows.length!==33)throw Error('Source identity dropped');const costs=baseline.cases[[metric,direction,probe].join('|')],seen=new Set();
   for(const row of rows){const cbsa=row[0].match(/\((\d{5})\)$/)?.[1];if(!costs[cbsa]||seen.has(cbsa))throw Error('Missing/duplicate displayed identity');seen.add(cbsa);
    const value=costs[cbsa].graph_only_cost;
    if(value===null){if(row[2]!=='—'||!row[3].includes('Modeled NoData'))throw Error('Unsupported model lead misrepresented');unreachable++;}
    else if(row[2]!==value.toLocaleString('en-US',{maximumFractionDigits:3}))throw Error('Displayed cost differs from checkpoint');
    cells++;
   }
   if(!(await page.locator('#inventory').innerText()).includes('334'))throw Error('Unknown-competitor accounting changed');
   if(await page.locator('#plot circle').count()!==19)throw Error('Probe plot changed');combinations++;
  }
  if(unreachable!==baseline.unreachable_queries||cells!==2508)throw Error('Cost/no-data inventory changed');
  await page.selectOption('#probe',String(lead.node));
  for(const metric of ['length','travel_time'])for(const direction of ['location-to-metro','metro-to-location']){
   await page.selectOption('#metric',metric);await page.selectOption('#direction',direction);
   const self=await page.locator('#rows tr').filter({hasText:'(29820)'}).locator('td').allTextContents();
   if(self[2]!=='0'||!self[3].includes('Minimum among modeled sources'))throw Error('Node identity zero changed');
  }
  const body=await page.locator('body').innerText();
  for(const text of ['Zero connectors are approved','No urban access anchors are adopted','#137','2,508','2,356','152 modeled NoData','node identity only'])if(!body.includes(text))throw Error('Missing research scope: '+text);
  await page.locator('#plot circle').last().click();if(await page.locator('#probe').inputValue()!==probes.at(-1))throw Error('Point selection failed');
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  if(process.argv[3])await page.screenshot({path:process.argv[3],fullPage:true});
  console.log(JSON.stringify({combinations,costCellsChecked:cells,sourceRows:33,unreachableCells:unreachable,unknownCompetitors:334,pointSelection:true,pageErrors:0,networkRequests:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
