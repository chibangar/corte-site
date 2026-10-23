const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(failGeo=false,failStats=false) {
  let click;const calls=[];const navigations=[];
  const link={href:'https://github.com/chibangar/corte-site/releases/latest/download/Corte-Setup.exe',addEventListener:(type,fn)=>{if(type==='click')click=fn;}};
  const list={replaceChildren(){},append(){}};
  const context={window:{CORTE_FEEDBACK:{url:'https://example.supabase.co',key:'public'},location:{assign:url=>navigations.push(url)}},document:{documentElement:{lang:'pt'},querySelector:()=>list,querySelectorAll:()=>[link],createElement:()=>({append(){}})},Intl,AbortSignal,MutationObserver:class{observe(){}},fetch:async(url,options={})=>{
    calls.push({url,options});
    if(url.includes('cdn-cgi')) {if(failGeo)throw Error('Offline');return {ok:true,text:async()=> 'ip=192.0.2.1\nloc=PT\n'};}
    if(url.includes('/rpc/')) {if(failStats)throw Error('Offline');return {ok:true};}
    return {ok:true,json:async()=>[]};
  }};
  vm.runInNewContext(fs.readFileSync('countries.js','utf8'),context);
  return {calls,navigations,click:()=>click({button:0,preventDefault(){}})};
}
test('detects country only on download and records country without IP',async()=>{const h=setup();assert.equal(h.calls.filter(c=>c.url.includes('cdn-cgi')).length,0);await h.click();const recorded=h.calls.find(c=>c.url.includes('/rpc/'));assert.deepEqual(JSON.parse(recorded.options.body),{country_code:'PT'});assert.equal(h.navigations.length,1);});
test('download continues when geolocation fails',async()=>{const h=setup(true);await h.click();assert.equal(h.navigations.length,1);});
test('download continues when counter fails',async()=>{const h=setup(false,true);await h.click();assert.equal(h.navigations.length,1);});
