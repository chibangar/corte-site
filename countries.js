(() => {
  const config = window.CORTE_FEEDBACK;
  const dialog = document.querySelector('#country-dialog');
  const form = document.querySelector('#country-form');
  const select = document.querySelector('#download-country');
  const list = document.querySelector('#country-list');
  const skip = document.querySelector('#country-skip');
  const codes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
  let destination = '';
  let totals = [];
  const en = () => document.documentElement.lang === 'en';
  const names = () => new Intl.DisplayNames([en() ? 'en' : 'pt-PT'], {type:'region'});
  const flag = code => String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397));
  function populate() {
    const current = select.value;
    const display = names();
    select.replaceChildren(new Option(en() ? 'Choose your country' : 'Escolhe o teu país', ''));
    codes.map(code => ({code, name:display.of(code)})).sort((a,b)=>a.name.localeCompare(b.name)).forEach(item => select.add(new Option(flag(item.code) + ' ' + item.name, item.code)));
    select.value = current;
  }
  function render() {
    list.replaceChildren();
    if (!totals.length) {list.textContent = en() ? 'No countries recorded yet. Be the first!' : 'Ainda não há países registados. Sê o primeiro!';return;}
    const display = names();
    totals.forEach(item => {
      const row = document.createElement('div');row.className='country-row';
      const label = document.createElement('span');label.textContent=flag(item.country) + ' ' + display.of(item.country);
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
  document.querySelectorAll('a.dl').forEach(link => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
    event.preventDefault();destination=link.href;skip.href=destination;populate();dialog.showModal();
  }));
  skip.addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async event => {
    event.preventDefault();if (!form.reportValidity()) return;
    const country = select.value;
    const button=form.querySelector('button');button.disabled=true;
    try {
      await fetch(config.url + '/rest/v1/rpc/record_country_download',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({country_code:country}),signal:AbortSignal.timeout(1500)});
    } catch { /* Download must continue even if statistics fail. */ }
    finally {button.disabled=false;dialog.close();window.location.assign(destination);load();}
  });
  new MutationObserver(() => {populate();render();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  populate();load();
})();
