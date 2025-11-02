
// MiniRevolut PWA - app.js
(() => {
  const el = id => document.getElementById(id);
  const amountIn = el('amount');
  const sourceIn = el('source');
  const noteIn = el('note');
  const addBtn = el('addBtn');
  const removeBtn = el('removeBtn');
  const resetBtn = el('resetBtn');
  const txList = el('txList');
  const totalAll = el('totalAll');
  const txCount = el('txCount');
  const exportBtn = el('exportBtn');
  const clearAllBtn = el('clearAllBtn');
  const filterIn = el('filter');
  const tabs = document.querySelectorAll('[data-tab]');
  const titleEl = el('pageTitle');

  const STORAGE_KEY = 'minirevolut_accounts_v1';
  let state = { card: {tx:[]}, cash: {tx:[]} , active: 'card' };
  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }
  function load(){ try{ const r = localStorage.getItem(STORAGE_KEY); if(r) state = JSON.parse(r); }catch(e){} render(); }

  function formatCurrency(v){
    const n = Number(v) || 0;
    return n.toLocaleString('ro-RO',{minimumFractionDigits:2, maximumFractionDigits:2}) + ' lei';
  }
  function curAccount(){ return state[state.active]; }

  function computeAccountTotal(acc){ return acc.tx.reduce((s,t) => s + Number(t.amount || 0), 0); }
  function computeTotalAll(){ return computeAccountTotal(state.card) + computeAccountTotal(state.cash); }

  function addTransaction(amount, source, note){
    if (!amount || isNaN(amount)) return alert('Introdu o sumă validă.');
    const tx = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      amount: Number(Number(amount).toFixed(2)),
      source: source ? String(source).trim() : '(fără sursă)',
      note: note ? String(note).trim() : '',
      date: new Date().toISOString()
    };
    state[state.active].tx.unshift(tx);
    save();
    clearInputs();
  }
  function deleteTx(id){
    if(!confirm('Ștergi această tranzacție?')) return;
    const acc = state[state.active];
    acc.tx = acc.tx.filter(t => t.id !== id);
    save();
  }
  function clearInputs(){ amountIn.value=''; sourceIn.value=''; noteIn.value=''; }
  function exportCSV(){
    const acc = state[state.active];
    if(acc.tx.length === 0){ alert('Nu există tranzacții pentru export.'); return; }
    const rows = [['id','date','amount','source','note'], ...acc.tx.map(t=>[t.id,t.date,t.amount,t.source,t.note])];
    const csv = rows.map(r => r.map(c => '\"' + String(c).replace(/\"/g,'\"\"') + '\"').join(',')).join('\\n');
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = state.active + '-transactions-' + new Date().toISOString().slice(0,19).replace(/[:T]/g,'-') + '.csv';
    a.click(); URL.revokeObjectURL(url);
  }
  function clearAll(){
    if(!confirm('Ștergi toate tranzacțiile din acest cont?')) return;
    state[state.active].tx = [];
    save();
  }

  function render(){
    // totals
    totalAll.textContent = formatCurrency(computeTotalAll());
    txCount.textContent = curAccount().tx.length;
    titleEl.textContent = state.active === 'card' ? 'Card' : 'Cash';

    // filter
    const q = (filterIn.value||'').toLowerCase().trim();
    const visible = q ? curAccount().tx.filter(t => String(t.amount).toLowerCase().includes(q) || (t.source||'').toLowerCase().includes(q) || (t.note||'').toLowerCase().includes(q)) : curAccount().tx;

    txList.innerHTML = '';
    if(visible.length === 0){ txList.innerHTML = '<div class="muted small">Nicio tranzacție găsită.</div>'; return; }
    visible.forEach(t => {
      const div = document.createElement('div'); div.className = 'tx';
      const left = document.createElement('div'); left.className = 'left';
      const title = document.createElement('div'); title.className = 'title'; title.textContent = t.source + (t.note ? ' — ' + t.note : '');
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = new Date(t.date).toLocaleString();
      left.appendChild(title); left.appendChild(meta);
      const right = document.createElement('div'); right.style.textAlign='right';
      const amt = document.createElement('div'); amt.className = 'amt ' + (Number(t.amount) >= 0 ? 'plus' : 'minus'); amt.textContent = formatCurrency(t.amount);
      const actions = document.createElement('div'); actions.style.marginTop='8px'; actions.style.display='flex'; actions.style.justifyContent='flex-end'; actions.style.gap='6px';
      const del = document.createElement('button'); del.className='small'; del.textContent='Șterge'; del.onclick = ()=> deleteTx(t.id);
      actions.appendChild(del);
      right.appendChild(amt); right.appendChild(actions);
      div.appendChild(left); div.appendChild(right); txList.appendChild(div);
    });
  }

  // events
  addBtn.addEventListener('click', ()=> addTransaction(Number(amountIn.value), sourceIn.value, noteIn.value));
  removeBtn.addEventListener('click', ()=> { const v = Number(amountIn.value); if(!v || isNaN(v)) return alert('Introdu o sumă validă.'); addTransaction(-Math.abs(v), sourceIn.value, noteIn.value); });
  resetBtn.addEventListener('click', clearInputs);
  exportBtn.addEventListener('click', exportCSV);
  clearAllBtn.addEventListener('click', clearAll);
  filterIn.addEventListener('input', render);
  amountIn.addEventListener('keydown', (e)=> { if(e.key==='Enter') addBtn.click(); });

  // tab switch
  tabs.forEach(t => t.addEventListener('click', ()=> {
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    state.active = t.dataset.tab;
    save();
  }));

  // install service worker
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }

  load();
})();
