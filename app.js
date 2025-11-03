(() => {
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const format = v => (Number(v)||0).toLocaleString('ro-RO',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' lei';
  const KEY = 'minirevolut_v4';

  // Pages and nav
  const pages = { total: qs('#page-total'), card: qs('#page-card'), cash: qs('#page-cash') };
  const navButtons = qsa('.nav button');

  // Totals / summaries
  const totalAllEl = qs('#totalAll'); const totalAllBig = qs('#totalAllBig');
  const summaryCard = qs('#summaryCard'); const summaryCash = qs('#summaryCash');
  const cardsSummary = qs('#cardsSummary');

  // Card management
  const cardsList = qs('#cardsList'); const newCardTitle = qs('#newCardTitle'); const addCardBtn = qs('#addCardBtn');
  const activeCardTitle = qs('#activeCardTitle'); const activeCardTotal = qs('#activeCardTotal');
  const cardAmount = qs('#cardAmount'); const cardSource = qs('#cardSource'); const cardNote = qs('#cardNote');
  const cardAdd = qs('#cardAdd'); const cardRemove = qs('#cardRemove'); const cardReset = qs('#cardReset');
  const cardList = qs('#cardList'); const cardExport = qs('#cardExport'); const cardClear = qs('#cardClear');

  // Cash
  const cashTotal = qs('#cashTotal'); const cashAmount = qs('#cashAmount'); const cashSource = qs('#cashSource'); const cashNote = qs('#cashNote');
  const cashAdd = qs('#cashAdd'); const cashRemove = qs('#cashRemove'); const cashReset = qs('#cashReset');
  const cashList = qs('#cashList'); const cashExport = qs('#cashExport'); const cashClear = qs('#cashClear');

  const goCard = qs('#goCard'); const goCash = qs('#goCash');

  let state = { cards: [], cash: {tx:[]}, page: 'total', activeCardId: null };

  // util
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); render(); }
  function load(){ try{ const v = localStorage.getItem(KEY); if(v) state = JSON.parse(v); }catch(e){} render(); }

  function sumTx(list){ return list.reduce((s,t)=>s+Number(t.amount||0),0); }
  function totalCards(){ return state.cards.reduce((s,c)=> s + sumTx(c.tx), 0); }
  function totalAll(){ return totalCards() + sumTx(state.cash.tx); }

  // render
  function render(){
    totalAllEl.textContent = format(totalAll());
    totalAllBig.textContent = format(totalAll());
    summaryCard.textContent = format(totalCards());
    summaryCash.textContent = format(sumTx(state.cash.tx));

    // cards summary on total page
    cardsSummary.innerHTML = '';
    state.cards.forEach(c => {
      const item = document.createElement('div'); item.className='card-item';
      if(state.activeCardId === c.id) item.classList.add('active');
      const preview = document.createElement('div'); preview.className='card-preview'; preview.style.background = 'linear-gradient(135deg, rgba(6,182,212,1), rgba(6,182,212,0.85))';
      const dot = document.createElement('div'); dot.className='card-dot';
      const title = document.createElement('div'); title.className='card-title'; title.textContent = c.title;
      preview.appendChild(dot); preview.appendChild(title);
      item.appendChild(preview);
      const foot = document.createElement('div'); foot.style.padding='8px 0'; foot.innerHTML = '<div style="display:flex;justify-content:space-between"><div style="font-weight:600">'+c.title+'</div><div>'+format(sumTx(c.tx))+'</div></div>';
      item.appendChild(foot);
      item.addEventListener('click', ()=> { state.activeCardId = c.id; state.page='card'; save(); });
      cardsSummary.appendChild(item);
    });

    // cards list on card page
    cardsList.innerHTML = '';
    state.cards.forEach(c => {
      const item = document.createElement('div'); item.className='card-item';
      if(state.activeCardId === c.id) item.classList.add('active');
      const preview = document.createElement('div'); preview.className='card-preview'; preview.style.background = 'linear-gradient(135deg, rgba(6,182,212,1), rgba(6,182,212,0.85))';
      const dot = document.createElement('div'); dot.className='card-dot';
      const title = document.createElement('div'); title.className='card-title'; title.textContent = c.title;
      preview.appendChild(dot); preview.appendChild(title);
      item.appendChild(preview);
      const foot = document.createElement('div'); foot.style.padding='8px 0'; foot.innerHTML = '<div style="display:flex;justify-content:space-between"><div style="font-weight:600">'+c.title+'</div><div>'+format(sumTx(c.tx))+'</div></div>';
      const delBtn = document.createElement('button'); delBtn.className='btn btn-accent'; delBtn.textContent='Șterge'; delBtn.style.marginTop='6px';
      delBtn.addEventListener('click', (e)=>{ e.stopPropagation(); if(confirm('Ștergi acest card și toate tranzacțiile sale?')) { state.cards = state.cards.filter(x=>x.id!==c.id); if(state.activeCardId===c.id) state.activeCardId = state.cards.length ? state.cards[0].id : null; save(); } });
      foot.appendChild(delBtn);
      item.appendChild(foot);
      item.addEventListener('click', ()=> { state.activeCardId = c.id; save(); });
      cardsList.appendChild(item);
    });

    // active card details
    const active = state.cards.find(x=>x.id===state.activeCardId);
    activeCardTitle.textContent = active ? active.title : 'N/A';
    activeCardTotal.textContent = active ? format(sumTx(active.tx)) : format(0);

    // lists
    renderList(cardList, active ? active.tx : [], 'card', state.activeCardId);
    renderList(cashList, state.cash.tx, 'cash', null);
    cardExport.disabled = !active || active.tx.length===0;
    cardClear.disabled = !active || active.tx.length===0;
  }

  function renderList(container, list, type, id){
    container.innerHTML = '';
    if(!list || list.length===0){ container.innerHTML = '<div class="small">Nicio tranzacție.</div>'; return; }
    list.forEach(t=>{
      const div = document.createElement('div'); div.className='tx';
      const left = document.createElement('div'); left.className='left';
      const title = document.createElement('div'); title.className='title'; title.textContent = t.source + (t.note ? ' — ' + t.note : '');
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = t.date;
      left.appendChild(title); left.appendChild(meta);
      const right = document.createElement('div'); right.style.textAlign='right';
      const amt = document.createElement('div'); amt.className='amt ' + (Number(t.amount)>=0 ? 'plus' : 'minus'); amt.textContent = format(t.amount);
      const del = document.createElement('button'); del.className='btn btn-accent'; del.textContent='Șterge'; del.style.marginTop='6px';
      del.addEventListener('click', ()=>{ if(confirm('Ștergi această tranzacție?')) { if(type==='card') deleteTxCard(id, t.id); else deleteTxCash(t.id); } });
      right.appendChild(amt); right.appendChild(del);
      div.appendChild(left); div.appendChild(right); container.appendChild(div);
    });
  }

  function addCard(title){
    const t = title && title.trim() ? title.trim() : 'Card ' + (state.cards.length+1);
    const card = { id: 'c_' + Date.now().toString(36), title: t, tx: [] };
    state.cards.push(card);
    state.activeCardId = card.id;
    save();
  }

  function addTxCard(amount, source, note){
    const active = state.cards.find(x=>x.id===state.activeCardId);
    if(!active){ alert('Alege mai întâi un card sau adaugă unul.'); return; }
    if(!amount || isNaN(amount)){ alert('Sumă invalidă'); return; }
    const tx = { id: Date.now() + Math.random().toString(36).slice(2,6), amount: Number(Number(amount).toFixed(2)), source: source||'(fără sursă)', note: note||'', date: new Date().toLocaleString() };
    active.tx.unshift(tx); save();
  }
  function deleteTxCard(cardId, txId){
    const card = state.cards.find(x=>x.id===cardId);
    if(!card) return;
    card.tx = card.tx.filter(t=>t.id!==txId); save();
  }
  function clearCard(cardId){ if(!confirm('Ștergi toate tranzacțiile acestui card?')) return; const card = state.cards.find(x=>x.id===cardId); if(!card) return; card.tx = []; save(); }

  // cash
  function addTxCash(amount, source, note){
    if(!amount || isNaN(amount)){ alert('Sumă invalidă'); return; }
    const tx = { id: Date.now() + Math.random().toString(36).slice(2,6), amount: Number(Number(amount).toFixed(2)), source: source||'(fără sursă)', note: note||'', date: new Date().toLocaleString() };
    state.cash.tx.unshift(tx); save();
  }
  function deleteTxCash(txId){ state.cash.tx = state.cash.tx.filter(t=>t.id!==txId); save(); }
  function clearCash(){ if(!confirm('Ștergi toate tranzacțiile Cash?')) return; state.cash.tx = []; save(); }

  // export
  function exportCSVList(list, name){
    if(!list || list.length===0){ alert('Nu există tranzacții pentru export.'); return; }
    const rows = [['id','date','amount','source','note'], ...list.map(t=>[t.id,t.date,t.amount,t.source,t.note])];
    const csv = rows.map(r=> r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = name + '-transactions-' + new Date().toISOString().slice(0,19).replace(/[:T]/g,'-') + '.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // events
  navButtons.forEach(b=> b.addEventListener('click', ()=> { state.page = b.dataset.page; save(); }));
  goCard.addEventListener('click', ()=> { state.page='card'; save(); }); goCash.addEventListener('click', ()=> { state.page='cash'; save(); });

  addCardBtn.addEventListener('click', ()=> { addCard(newCardTitle.value); newCardTitle.value=''; });
  cardAdd.addEventListener('click', ()=> addTxCard(Number(cardAmount.value), cardSource.value.trim(), cardNote.value.trim()));
  cardRemove.addEventListener('click', ()=> addTxCard(-Math.abs(Number(cardAmount.value)), cardSource.value.trim(), cardNote.value.trim()));
  cardReset.addEventListener('click', ()=> { cardAmount.value=''; cardSource.value=''; cardNote.value=''; });
  cardClear.addEventListener('click', ()=> { if(state.activeCardId) clearCard(state.activeCardId); });

  cardExport.addEventListener('click', ()=> { const c = state.cards.find(x=>x.id===state.activeCardId); if(c) exportCSVList(c.tx, c.title); });

  cashAdd.addEventListener('click', ()=> addTxCash(Number(cashAmount.value), cashSource.value.trim(), cashNote.value.trim()));
  cashRemove.addEventListener('click', ()=> addTxCash(-Math.abs(Number(cashAmount.value)), cashSource.value.trim(), cashNote.value.trim()));
  cashReset.addEventListener('click', ()=> { cashAmount.value=''; cashSource.value=''; cashNote.value=''; });
  cashClear.addEventListener('click', ()=> clearCash());
  cashExport.addEventListener('click', ()=> exportCSVList(state.cash.tx, 'cash'));

  if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js').catch(()=>{}); }

  // initialize with a default card if none
  function ensureDefault(){ if(state.cards.length===0){ state.cards.push({ id: 'c_default', title: 'Card 1', tx: [] }); state.activeCardId = 'c_default'; save(); } }
  load(); ensureDefault();
})();