// ── BCIM / tabs / tab-locks.js ────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_LOCKS = () => {
  const {el, UI, S, BC, DB, setStatus, SLOT_LABELS, SLOT_ORDER} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ── Locked items overview ─────────────────────────────────
  body.appendChild(UI.section('🔒 Gesperrte Items'));
  const locked = BC.getLockedItems(S.char);

  if(!locked.length){
    body.appendChild(el('div',{class:'bempty'},el('div',{class:'bempty-i'},'🔓'),'Keine gesperrten Items'));
  } else {
    locked.forEach(l=>{
      const card = el('div',{class:'card'});
      const name = (SLOT_LABELS[l.group]||l.group)+': '+(l.assetName||'?').replace(/([A-Z])/g,' $1').trim();
      const timerEl = el('span',{class:'lock-timer'},'—');

      if(l.timer && l.setAt){
        const tick=()=>{
          const end=l.setAt+l.timer*1000, rem=Math.max(0,end-Date.now());
          const h=Math.floor(rem/3600000),m=Math.floor((rem%3600000)/60000),s=Math.floor((rem%60000)/1000);
          timerEl.textContent = rem>0
            ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
            : '⏰ Abgelaufen';
        };
        tick();
        const iv=setInterval(()=>{ if(!document.getElementById('bcim-root')||BCIM.S.tab!=='locks'){clearInterval(iv);return;} tick(); },1000);
      } else {
        timerEl.textContent='Kein Timer'; timerEl.style.color='var(--txt3)';
      }

      card.appendChild(el('div',{class:'card-title'},name));
      card.appendChild(el('div',{class:'card-row'},
        el('span',{class:'card-sub',style:{flex:1}},'🔑 '+l.lock),
        timerEl,
      ));
      body.appendChild(card);
    });
  }

  // ── Timer calculator ──────────────────────────────────────
  body.appendChild(UI.section('⏱ Timer-Kalkulator'));
  const calcCard = el('div',{class:'card'});
  let cH=0,cM=0,cS=0;
  const calcResult = el('div',{class:'encoded-type',style:{marginTop:'6px'}},'BC Timer-Wert: —');
  const updateCalc = ()=>{
    const total=cH*3600+cM*60+cS;
    calcResult.textContent=`BC Timer-Wert: ${total} Sek  =  ${Math.floor(total/3600)}h ${Math.floor((total%3600)/60)}m ${total%60}s`;
  };
  const mkNum=(label,max,cb)=>{
    const inp=el('input',{type:'number',class:'bi',min:'0',max:String(max),value:'0',placeholder:label,style:{flex:'1'}});
    inp.addEventListener('input',e=>{cb(parseInt(e.target.value)||0);updateCalc();});
    return inp;
  };
  const row=el('div',{style:{display:'flex',gap:'4px',alignItems:'center'}});
  [el('span',{class:'card-sub'},'H:'),mkNum('Std',999,v=>cH=v),
   el('span',{class:'card-sub'},'M:'),mkNum('Min',59, v=>cM=v),
   el('span',{class:'card-sub'},'S:'),mkNum('Sek',59, v=>cS=v),
  ].forEach(n=>row.appendChild(n));
  calcCard.appendChild(row); calcCard.appendChild(calcResult);
  body.appendChild(calcCard);

  // ── Lock hierarchy ────────────────────────────────────────
  body.appendChild(UI.section('🔗 Entsperr-Reihenfolge'));
  const hier = DB.get('lockHierarchy',[]);
  const hierCard = el('div',{class:'card'});

  const hierListEl = el('div');
  const renderHier=()=>{
    hierListEl.innerHTML='';
    const h=DB.get('lockHierarchy',[]);
    if(!h.length){ hierListEl.appendChild(el('div',{class:'section-note'},'Keine Reihenfolge definiert')); return; }
    h.forEach((slot,i)=>{
      const row=el('div',{class:'card-row',style:{marginBottom:'4px'}},
        el('span',{style:{fontFamily:'monospace',fontSize:'11px',color:'var(--acc)',minWidth:'20px'}},(i+1)+'.'),
        el('span',{style:{flex:1,fontSize:'11px'}},SLOT_LABELS[slot]||slot),
        el('button',{class:'sbtn sbtn-d',style:{padding:'2px 6px'}},'✕'),
      );
      row.querySelector('.sbtn').addEventListener('click',()=>{h.splice(i,1);DB.set('lockHierarchy',h);renderHier();});
      hierListEl.appendChild(row);
    });
  };
  renderHier();

  const addRow=el('div',{style:{display:'flex',gap:'5px',marginTop:'6px'}});
  const hierSel=el('select',{class:'bsel',style:{flex:'1'}});
  hierSel.appendChild(el('option',{value:''},'Slot wählen...'));
  SLOT_ORDER.forEach(g=>hierSel.appendChild(el('option',{value:g},SLOT_LABELS[g]||g)));
  const addHierBtn=el('button',{class:'sbtn sbtn-p'},'+ Hinzufügen');
  addHierBtn.addEventListener('click',()=>{
    if(!hierSel.value)return;
    const h=DB.get('lockHierarchy',[]);
    if(!h.includes(hierSel.value)){h.push(hierSel.value);DB.set('lockHierarchy',h);}
    renderHier();
  });
  addRow.appendChild(hierSel); addRow.appendChild(addHierBtn);
  hierCard.appendChild(hierListEl); hierCard.appendChild(addRow);
  body.appendChild(hierCard);

  // ── Lock log ──────────────────────────────────────────────
  body.appendChild(UI.section('📋 Lock-Protokoll'));
  const log = DB.get('lockLog',[]);
  if(!log.length){
    body.appendChild(el('div',{class:'bempty'},'Keine Einträge'));
  } else {
    log.slice(0,20).forEach(entry=>{
      const d=new Date(entry.timestamp);
      body.appendChild(el('div',{class:'card'},
        el('div',{class:'card-title',style:{fontSize:'11px'}},
          (entry.action==='add'?'🔒':'🔓')+' '+(SLOT_LABELS[entry.group]||entry.group)),
        el('div',{class:'card-sub'},`${entry.charName||'?'} · ${entry.lock||'?'} · ${d.toLocaleTimeString()}`),
      ));
    });
    const clrBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%',marginTop:'4px'}},'🗑 Protokoll leeren');
    clrBtn.addEventListener('click',()=>{DB.del('lockLog');setStatus('Protokoll gelöscht',false);});
    body.appendChild(clrBtn);
  }

  return body;
};
