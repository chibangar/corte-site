(() => {
  const config = window.CORTE_FEEDBACK;
  const list = document.querySelector('#country-list');
  let totals = [];
  const en = () => document.documentElement.lang === 'en';
  const names = () => new Intl.DisplayNames([en() ? 'en' : 'pt-PT'], {type:'region'});
  const flag = code => String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397));
  function render() {
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
  async function recordCountry() {
    let country = 'ZZ';
    try {
      const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(1500)
      });
      if (response.ok) {
        const match = (await response.text()).match(/^loc=([A-Z]{2})\r?$/m);
        if (match && match[1] !== 'XX') country = match[1];
      }
    } catch { /* Unknown country; never infer it from the browser language. */ }
    try {
      await fetch(config.url + '/rest/v1/rpc/record_country_download', {
        method:'POST',keepalive:true,headers:{apikey:config.key,'Content-Type':'application/json'},
        body:JSON.stringify({country_code:country}),signal:AbortSignal.timeout(1000)
      });
    } catch { /* Statistics must never prevent the download. */ }
  }
  document.querySelectorAll('a.dl').forEach(link => link.addEventListener('click', async event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const destination = link.href;
    try { await recordCountry(); }
    finally { window.location.assign(destination);load(); }
  }));
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  load();
})();
