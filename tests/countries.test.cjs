const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../countries.js'),'utf8');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function page(geoFails=false){
  const element=()=>({children:[],textContent:'',replaceChildren(){this.children=[];},append(...items){this.children.push(...items);}});
  const list=element(),summary=element(),events={},windowEvents={},posts=[];
  const context={Intl,AbortSignal,MutationObserver:class{observe(){}},window:{CORTE_FEEDBACK:{url:'https://test.invalid',key:'public'},CORTE_DOWNLOAD_TOTAL:17,addEventListener(name,fn){windowEvents[name]=fn;}},document:{documentElement:{lang:'pt'},querySelector(s){return s==='#country-list'?list:summary;},querySelectorAll(){return [{addEventListener(name,fn){events[name]=fn;}}];},createElement:element,addEventListener(){}},fetch:async(url,options)=>{
    if(url.includes('cloudflare')){if(geoFails)throw Error('blocked');return {ok:true,text:async()=> 'loc=BR\n'};}
    if(url.includes('/rpc/')){posts.push(JSON.parse(options.body));assert.equal(options.keepalive,true);return {ok:true};}
    return {ok:true,json:async()=>[{country:'PT',clicks:4}]};
  }};
  vm.runInNewContext(source,context);await settle();
  return {events,windowEvents,posts,summary,list};
}
test('distinguishes GitHub downloads from country clicks, without inventing countries',async()=>{
  const p=await page();assert.match(p.summary.textContent,/17 downloads.*4 cliques/);assert.equal(p.list.children.length,1);assert.match(p.list.children[0].children[0].textContent,/Portugal/);
  p.windowEvents['corte-download-total']({detail:21});assert.match(p.summary.textContent,/21 downloads/);
});
test('records normal, Ctrl and middle clicks without blocking navigation',async()=>{
  const p=await page();let blocked=false;
  p.events.click({button:0,preventDefault(){blocked=true;}});await settle();
  p.events.click({button:0,ctrlKey:true});await settle();
  p.events.auxclick({button:1});await settle();
  p.events.auxclick({button:2});await settle();
  assert.equal(blocked,false);assert.equal(p.posts.length,3);assert.ok(p.posts.every(body=>body.country_code==='BR'));
});
test('geo failure records unknown country rather than assuming Portugal',async()=>{
  const p=await page(true);p.events.click({button:0});await settle();assert.equal(p.posts[0].country_code,'ZZ');
});
