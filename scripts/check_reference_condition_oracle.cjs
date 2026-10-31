const fs=require('fs');
const OpeningHours=require('opening_hours');
if(require('opening_hours/package.json').version!=='3.15.0')throw Error('Exact independent schedule parser required');
if(process.env.TZ!=='UTC')throw Error('Oracle must treat supplied synthetic wall clocks as UTC clock components');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
if(data.schema!=='weekly-clock-oracle-fixture-v1'||data.access_verified!==false||data.release_eligible!==false)throw Error('Explicit synthetic scheduler fixture required');
if(data.minute_count!==10080||data.cases.length!==3)throw Error('Complete declared weekly comparison required');
const start=Date.parse(data.local_wall_clock_start);let checked=0;
for(const row of data.cases){
 if(row.expected_bits.length!==data.minute_count)throw Error('Do not truncate clock comparisons');
 const independent=new OpeningHours(row.condition);
 for(let i=0;i<data.minute_count;i++){
  const actual=independent.getState(new Date(start+i*60000))?'1':'0';
  if(actual!==row.expected_bits[i])throw Error('Independent scheduler mismatch: '+row.condition+' at '+new Date(start+i*60000).toISOString());
  checked++;
 }
}
console.log(JSON.stringify({independentParser:'opening_hours@3.15.0',conditions:3,weeklyMinuteComparisons:checked,accessCertified:false}));
