(() => {
  const config = window.CORTE_FEEDBACK || {};
  const form = document.querySelector('#feedback-form');
  const list = document.querySelector('#feedback-list');
  const status = document.querySelector('#feedback-status');
  const filter = document.querySelector('#feedback-filter');
  const submit = form.querySelector('button[type=submit]');
  const refresh = document.querySelector('#feedback-refresh');
  const labels = {bug:'Bug', feature:'Funcionalidade', idea:'Ideia'};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url) && !!config.key;
  let rows = [];
  let loading = false;
  function render() {
    list.replaceChildren();
    const visible = rows.filter(row => !filter.value || row.kind === filter.value);
    if (!visible.length) {list.textContent = 'Ainda não há feedback nesta categoria. Partilha o primeiro!';return;}
    visible.forEach(row => {
      const article = document.createElement('article'); article.className = 'feedback-entry';
      const badge = document.createElement('span');badge.className='feedback-kind';badge.textContent=labels[row.kind] || row.kind;
      const title = document.createElement('h3');title.textContent = row.title;
      const body = document.createElement('p');body.textContent = row.description;
      const meta = document.createElement('small');meta.textContent = (row.author || 'Anónimo') + ' · ' + new Date(row.created_at).toLocaleDateString(document.documentElement.lang);
      article.append(badge,title,body,meta);list.append(article);
    });
  }
  async function request(path, options = {}) {
    const response = await fetch(config.url + '/rest/v1/' + path, {...options, headers: {apikey:config.key,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw new Error('Feedback request failed');
    return response.status === 204 ? null : response.json();
  }
  async function load() {
    if (loading) return;
    loading = true; refresh.disabled = true;
    try {rows = await request('feedback?select=kind,title,description,author,created_at&order=created_at.desc&limit=100');render();}
    catch {list.textContent='Não foi possível carregar o feedback. Tenta atualizar a lista.';}
    finally {loading = false;refresh.disabled=false;}
  }
  filter.addEventListener('change',render);refresh.addEventListener('click',load);
  form.addEventListener('submit',async event => {
    event.preventDefault();if (!configured || submit.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {kind:data.get('kind'),title:data.get('title').trim(),description:data.get('description').trim(),author:data.get('author').trim() || 'Anónimo'};
    if (payload.title.length < 4 || payload.description.length < 10) {status.textContent='Escreve um título com pelo menos 4 caracteres e uma descrição com pelo menos 10.';return;}
    submit.disabled=true;status.textContent='A publicar…';
    try {
      await request('feedback',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload)});
      form.reset();filter.value='';status.textContent='Feedback publicado. Obrigado por ajudares a melhorar o Corte!';await load();
    } catch {status.textContent='Não foi possível publicar. O teu texto foi mantido; tenta novamente.';}
    finally {submit.disabled=false;}
  });
  if (configured) load();
  else {submit.disabled=true;refresh.disabled=true;list.textContent='O feedback público estará disponível quando a ligação à base de dados estiver configurada.';}
})();
