const fs=require('fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:1100},locale:"en-US"}),errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
  await page.setContent(fs.readFileSync(process.argv[2],'utf8'));
  const baseline=JSON.parse(fs.readFileSync('docs/research/census-31-source-checkpoint/baseline.json','utf8'));
  const probes=await page.locator('#probe option').evaluateAll(nodes=>nodes.map(n=>n.value));if(probes.length!==18)throw Error('Wrong inherited probe inventory');
  let combinations=0,cells=0,unreachable=0;
  for(const metric of ['length','travel_time'])for(const direction of ['location-to-metro','metro-to-location'])for(const probe of probes){
   await page.selectOption('#metric',metric);await page.selectOption('#direction',direction);await page.selectOption('#probe',probe);
   const rows=await page.locator('#rows tr').evaluateAll(nodes=>nodes.map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent)));
   if(rows.length!==31)throw Error('Source identity dropped');const costs=baseline.cases[[metric,direction,probe].join('|')],seen=new Set();
   for(const row of rows){const cbsa=row[0].match(/\((\d{5})\)$/)?.[1];if(!costs[cbsa]||seen.has(cbsa))throw Error('Missing/duplicate displayed identity');seen.add(cbsa);
    const value=costs[cbsa].graph_only_cost;
    if(value===null){if(row[2]!=='—'||!row[3].includes('Modeled unreachable'))throw Error('Unsupported model lead misrepresented');unreachable++;}
    else if(row[2]!==value.toLocaleString('en-US',{maximumFractionDigits:3}))throw Error('Displayed cost differs from checkpoint');
    cells++;
   }
   if(!(await page.locator('#inventory').innerText()).includes('336'))throw Error('Unknown-competitor accounting changed');
   if(await page.locator('#plot circle').count()!==18)throw Error('Probe plot changed');combinations++;
  }
  if(unreachable!==144||cells!==2232)throw Error('Cost/no-data inventory changed');
  await page.locator('#plot circle').last().click();if(await page.locator('#probe').inputValue()!==probes.at(-1))throw Error('Point selection failed');
  if(errors.length||requests.length)throw Error(JSON.stringify({errors,requests}));
  if(process.argv[3])await page.screenshot({path:process.argv[3],fullPage:true});
  console.log(JSON.stringify({combinations,costCellsChecked:cells,sourceRows:31,unreachableCells:unreachable,unknownCompetitors:336,pointSelection:true,pageErrors:0,networkRequests:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
