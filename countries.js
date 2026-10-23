(() => {
  const config = window.CORTE_FEEDBACK;
  const list = document.querySelector('#country-list');
  let totals = [];
  let githubTotal = window.CORTE_DOWNLOAD_TOTAL ?? null;
  const en = () => document.documentElement.lang === 'en';
  const names = () => new Intl.DisplayNames([en() ? 'en' : 'pt-PT'], {type:'region'});
  const flag = code => String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397));
  function render() {
    const summary=document.querySelector('#country-summary');
    const tracked=totals.reduce((n,item)=>n+Number(item.clicks),0);
    if(summary) summary.textContent=(githubTotal===null ? (en()?'GitHub total loading…':'A carregar o total do GitHub…') : `${githubTotal.toLocaleString(en()?'en':'pt-PT')} ${en()?'installer downloads on GitHub':'downloads do instalador no GitHub'}`)+` · ${tracked.toLocaleString(en()?'en':'pt-PT')} ${en()?'website clicks recorded below':'cliques no site registados abaixo'}`;
    list.replaceChildren();
    if (!totals.length) {list.textContent = en() ? 'No countries recorded yet. Be the first!' : 'Ainda não há países registados. Sê o primeiro!';return;}
    const display = names();
    totals.forEach(item => {
      const row = document.createElement('div');row.className='country-row';
      const label = document.createElement('span');label.textContent=item.country === 'ZZ' ? (en() ? 'Unknown country' : 'País não identificado') : flag(item.country) + ' ' + display.of(item.country);
      const count = document.createElement('strong');count.textContent=Number(item.clicks).toLocaleString(en() ? 'en' : 'pt-PT');
      row.append(label,count);list.append(row);
    });
  }
  async function load() {
    try {
      const response = await fetch(config.url + '/rest/v1/download_countries?select=country,clicks&order=clicks.desc,country.asc', {headers:{apikey:config.key},signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw Error('Unavailable');
      totals = await response.json();render();
    } catch {list.textContent=en() ? 'Country statistics are temporarily unavailable.' : 'As estatísticas por país estão temporariamente indisponíveis.';}
  }
  async function detectCountry() {
    let country = 'ZZ';
    try {
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(3000)
      });
      if (response.ok) {
        const match = (await response.text()).match(/^loc=([A-Z]{2})\r?$/m);
        if (match && match[1] !== 'XX') country = match[1];
      }
    } catch { /* Unknown country; never infer it from the browser language. */ }
    return country;
  }
  // Resolve before the click so a slow geo request never delays a download.
  const detectedCountry=detectCountry();
  async function recordCountry() {
    const country=await detectedCountry;
    try {
      await fetch(config.url + '/rest/v1/rpc/record_country_download', {
        method:'POST',keepalive:true,headers:{apikey:config.key,'Content-Type':'application/json'},
        body:JSON.stringify({country_code:country}),signal:AbortSignal.timeout(8000)
      });
      load();
    } catch { /* Statistics must never prevent the download. */ }
  }
  document.querySelectorAll('a.dl').forEach(link => {
    link.addEventListener('click', event => {if(event.button===0) void recordCountry();});
    link.addEventListener('auxclick', event => {if(event.button===1) void recordCountry();});
  });
  window.addEventListener('corte-download-total',event=>{githubTotal=event.detail;render();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  load();
})();
