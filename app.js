
(() => {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const format = v => (Number(v)||0).toLocaleString('ro-RO',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' lei';
  const KEY = 'minirevolut_v3';

  // Pages
  const pages = { total: qs('#page-total'), card: qs('#page-card'), cash: qs('#page-cash') };
  const navButtons = qsa('.nav button');

  // Totals / summaries
  const totalAllEl = qs('#totalAll'); const totalAllBig = qs('#totalAllBig');
  const summaryCard = qs('#summaryCard'); const summaryCash = qs('#summaryCash');
  const cardTotal = qs('#cardTotal'); const cashTotal = qs('#cashTotal');

  // Card inputs/list
  const cardAmount = qs('#cardAmount'); const cardSource = qs('#cardSource'); const cardNote = qs('#cardNote');
  const cardAdd = qs('#cardAdd'); const cardRemove = qs('#cardRemove'); const cardReset = qs('#cardReset');
  const cardList = qs('#cardList'); const cardExport = qs('#cardExport'); const cardClear = qs('#cardClear');

  // Cash inputs/list
  const cashAmount = qs('#cashAmount'); const cashSource = qs('#cashSource'); const cashNote = qs('#cashNote');
  const cashAdd = qs('#cashAdd'); const cashRemove = qs('#cashRemove'); const cashReset = qs('#cashReset');
  const cashList = qs('#cashList'); const cashExport = qs('#cashExport'); const cashClear = qs('#cashClear');

  // quick nav actions
  const goCard = qs('#goCard'); const goCash = qs('#goCash');

  let state = { card: {tx:[]}, cash: {tx:[]}, page: 'total' };

  // Load / Save
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); render(); }
  function load(){ try{ const v = localStorage.getItem(KEY); if(v) state = JSON.parse(v); }catch(e){} render(); }

  function sumTx(acc){ return acc.tx.reduce((s,t)=>s+Number(t.amount||0),0); }
  function totalAll(){ return sumTx(state.card) + sumTx(state.cash); }

  // Rendering
  function render() {
    // totals
    totalAllEl.textContent = format(totalAll());
    totalAllBig.textContent = format(totalAll());
    summaryCard.textContent = format(sumTx(state.card));
    summaryCash.textContent = format(sumTx(state.cash));
    cardTotal.textContent = format(sumTx(state.card));
    cashTotal.textContent = format(sumTx(state.cash));

    // active page display
    Object.keys(pages).forEach(p => { pages[p].style.display = (state.page === p) ? '' : 'none'; });
    navButtons.forEach(b => b.classList.toggle('active', b.dataset.page === state.page));

    // lists
    renderList(cardList, state.card.tx, 'card');
    renderList(cashList, state.cash.tx, 'cash');
  }

  function renderList(container, list, type){
    container.innerHTML = '';
    if(!list || list.length===0){ container.innerHTML = '<div class="small">Nicio tranzacție.</div>'; return; }
    list.forEach(t => {
      const div = document.createElement('div'); div.className = 'tx';
      const left = document.createElement('div'); left.className = 'left';
      const title = document.createElement('div'); title.className = 'title'; title.textContent = t.source + (t.note? ' — ' + t.note : '');
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = t.date;
      left.appendChild(title); left.appendChild(meta);
      const right = document.createElement('div'); right.style.textAlign='right';
      const amt = document.createElement('div'); amt.className = 'amt ' + (Number(t.amount) >= 0 ? 'plus' : 'minus'); amt.textContent = format(t.amount);
      const del = document.createElement('button'); del.className = 'btn btn-accent'; del.textContent = 'Șterge';
      del.addEventListener('click', ()=> { if(confirm('Ștergi această tranzacție?')) { deleteTx(type, t.id); } });
      right.appendChild(amt); right.appendChild(del);
      div.appendChild(left); div.appendChild(right);
      container.appendChild(div);
    });
  }

  function addTx(type, amount, source, note){
    if(!amount || isNaN(amount)) { alert('Introdu o sumă validă.'); return; }
    const tx = { id: Date.now() + Math.random().toString(36).slice(2,6), amount: Number(Number(amount).toFixed(2)), source: source||'(fără sursă)', note: note||'', date: new Date().toLocaleString() };
    state[type].tx.unshift(tx);
    save();
  }
  function deleteTx(type, id){
    state[type].tx = state[type].tx.filter(t=>t.id!==id);
    save();
  }
  function clearAll(type){
    if(!confirm('Ștergi toate tranzacțiile din acest cont?')) return;
    state[type].tx = []; save();
  }
  function exportCSV(type){
    const list = state[type].tx;
    if(!list || list.length===0){ alert('Nu există tranzacții pentru export.'); return; }
    const rows = [['id','date','amount','source','note'], ...list.map(t=>[t.id,t.date,t.amount,t.source,t.note])];
    const csv = rows.map(r=> r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = type + '-transactions-' + new Date().toISOString().slice(0,19).replace(/[:T]/g,'-') + '.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // Event bindings
  qsa('.nav button').forEach(b => b.addEventListener('click', ()=> { state.page = b.dataset.page; save(); }));
  qs('#goCard').addEventListener('click', ()=> { state.page='card'; save(); });
  qs('#goCash').addEventListener('click', ()=> { state.page='cash'; save(); });

  // Card buttons
  qs('#cardAdd').addEventListener('click', ()=> addTx('card', Number(qs('#cardAmount').value), qs('#cardSource').value.trim(), qs('#cardNote').value.trim()));
  qs('#cardRemove').addEventListener('click', ()=> addTx('card', -Math.abs(Number(qs('#cardAmount').value)), qs('#cardSource').value.trim(), qs('#cardNote').value.trim()));
  qs('#cardReset').addEventListener('click', ()=> { qs('#cardAmount').value=''; qs('#cardSource').value=''; qs('#cardNote').value=''; });
  qs('#cardClear').addEventListener('click', ()=> clearAll('card'));
  qs('#cardExport').addEventListener('click', ()=> exportCSV('card'));

  // Cash buttons
  qs('#cashAdd').addEventListener('click', ()=> addTx('cash', Number(qs('#cashAmount').value), qs('#cashSource').value.trim(), qs('#cashNote').value.trim()));
  qs('#cashRemove').addEventListener('click', ()=> addTx('cash', -Math.abs(Number(qs('#cashAmount').value)), qs('#cashSource').value.trim(), qs('#cashNote').value.trim()));
  qs('#cashReset').addEventListener('click', ()=> { qs('#cashAmount').value=''; qs('#cashSource').value=''; qs('#cashNote').value=''; });
  qs('#cashClear').addEventListener('click', ()=> clearAll('cash'));
  qs('#cashExport').addEventListener('click', ()=> exportCSV('cash'));

  // service worker registration (best effort)
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }

  load();
})();
