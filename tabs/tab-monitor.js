// ── BCIM / tabs / tab-monitor.js ─────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_MONITOR = () => {
  const {el, UI, S, BC, DB, SYNC, setStatus, SLOT_LABELS, SLOT_ORDER, CFG, saveCFG} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ── Live alerts ───────────────────────────────────────────
  body.appendChild(UI.section('🔴 Live Änderungen'));
  const alerts = S.monitorAlerts.slice(0,25);

  if(!alerts.length){
    body.appendChild(el('div',{class:'bempty'},el('div',{class:'bempty-i'},'👁'),'Wartet auf Änderungen...'));
  } else {
    const alertWrap = el('div');
    alerts.forEach(a=>{
      const cls  = a.type==='added'?'alert-add':a.type==='removed'?'alert-remove':a.type==='property'?'alert-prop':'alert-change';
      const icon = a.type==='added'?'+ ':a.type==='removed'?'− ':a.type==='property'?'≈ ':'↔ ';
      const label= SLOT_LABELS[a.group]||a.group;
      const txt  = a.type==='changed' ? `${label}: ${a.from} → ${a.to}` : `${label}: ${a.assetName||a.from||''}`;
      const pill = el('div',{class:`alert-pill ${cls}`},
        el('span',{},icon+txt),
        el('span',{style:{marginLeft:'auto',fontSize:'9px',color:'inherit',opacity:'.7'}},new Date(a.time).toLocaleTimeString()),
      );
      alertWrap.appendChild(pill);
    });
    body.appendChild(alertWrap);
    const clrBtn = el('button',{class:'sbtn',style:{width:'100%',marginTop:'4px'}},'🗑 Löschen');
    clrBtn.addEventListener('click',()=>{S.monitorAlerts=[]; /* remove badge */ const b=BCIM.$('.bt[data-t="monitor"] .bt-n'); if(b)b.remove(); BCIM.emit('tabRefresh',{}); });
    body.appendChild(clrBtn);
  }

  // ── Snapshot Diff ─────────────────────────────────────────
  body.appendChild(UI.section('📸 Snapshot Vergleich'));
  const snapCard = el('div',{class:'card'});
  const takeBtn  = el('button',{class:'sbtn sbtn-p'},'📸 Snapshot aufnehmen');
  const diffBtn  = el('button',{class:'sbtn'},'🔍 Vergleichen');
  takeBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    S.monitorSnap = BC.snapshot(S.char);
    setStatus(`✓ Snapshot: ${S.monitorSnap.length} Items`,false);
    snapInfo.textContent=`Snapshot: ${S.monitorSnap.length} Items — ${new Date().toLocaleTimeString()}`;
  });
  diffBtn.addEventListener('click',()=>{
    if(!S.monitorSnap){setStatus('Erst Snapshot aufnehmen!',true);return;}
    if(!S.char)return;
    UI.diffModal('Snapshot vs. Aktuell', SYNC.getOutfitDiff(S.monitorSnap, BC.snapshot(S.char)));
  });
  const snapInfo = el('div',{class:'card-sub',style:{marginTop:'5px'}}, S.monitorSnap?`Snapshot: ${S.monitorSnap.length} Items`:'Kein Snapshot');
  const row=el('div',{style:{display:'flex',gap:'5px'}});
  row.appendChild(takeBtn); row.appendChild(diffBtn);
  snapCard.appendChild(row); snapCard.appendChild(snapInfo);
  body.appendChild(snapCard);

  // ── Owner tracker ─────────────────────────────────────────
  body.appendChild(UI.section('👑 Owner Tracker'));
  const ownerCard = el('div',{class:'card'});
  ownerCard.appendChild(el('div',{class:'section-note'},'Alert wenn überwachte Items entfernt werden.'));

  const ownerListEl = el('div');
  const renderOwner = ()=>{
    ownerListEl.innerHTML='';
    (CFG.ownerSlots||[]).forEach((slot,i)=>{
      const item    = S.char ? BC.getItem(S.char,slot) : null;
      const present = !!item;
      const row = el('div',{class:'card-row',style:{marginTop:'5px'}},
        el('span',{style:{fontSize:'12px'}},present?'✅':'❌'),
        el('span',{style:{flex:1,fontSize:'11px',color:present?'var(--txt)':'#ff6680'}},
          (SLOT_LABELS[slot]||slot)+(item?' — '+(item.Asset?.Name||'?'):'  ← leer!')),
        el('button',{class:'sbtn sbtn-d',style:{padding:'2px 6px'}},'✕'),
      );
      row.querySelector('.sbtn').addEventListener('click',()=>{CFG.ownerSlots.splice(i,1);saveCFG();renderOwner();});
      ownerListEl.appendChild(row);
    });
  };
  renderOwner();

  const ownerAddRow = el('div',{style:{display:'flex',gap:'5px',marginTop:'7px'}});
  const ownerSel = el('select',{class:'bsel',style:{flex:'1'}});
  ownerSel.appendChild(el('option',{value:''},'Slot hinzufügen...'));
  SLOT_ORDER.forEach(g=>ownerSel.appendChild(el('option',{value:g},SLOT_LABELS[g]||g)));
  const addOwnerBtn = el('button',{class:'sbtn sbtn-p'},'+ Überwachen');
  addOwnerBtn.addEventListener('click',()=>{
    if(!ownerSel.value)return;
    if(!(CFG.ownerSlots||[]).includes(ownerSel.value)){
      (CFG.ownerSlots=CFG.ownerSlots||[]).push(ownerSel.value); saveCFG();
    }
    renderOwner();
  });
  ownerAddRow.appendChild(ownerSel); ownerAddRow.appendChild(addOwnerBtn);
  ownerCard.appendChild(ownerListEl); ownerCard.appendChild(ownerAddRow);
  body.appendChild(ownerCard);

  // Owner alerts
  if(S.ownerAlerts?.length){
    body.appendChild(UI.section('⚠ Owner Alerts'));
    S.ownerAlerts.slice(0,5).forEach(a=>{
      body.appendChild(el('div',{class:'alert-pill alert-remove'},
        '👑 '+(SLOT_LABELS[a.group]||a.group)+' wurde entfernt! ('+new Date(a.time).toLocaleTimeString()+')'
      ));
    });
    const clrOwn=el('button',{class:'sbtn',style:{width:'100%',marginTop:'4px'}},'Alerts löschen');
    clrOwn.addEventListener('click',()=>{S.ownerAlerts=[];});
    body.appendChild(clrOwn);
  }

  return body;
};
