// ── BCIM / tabs / tab-outfits.js ─────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_OUTFITS = () => {
  const {el, UI, S, BC, DB, SYNC, setStatus, SLOT_LABELS} = BCIM;
  const body = el('div',{class:'tab-body'});

  const OUTFIT_ICONS = ['🎭','👗','🌙','☀️','🌸','🔥','❄️','⚡','💎','🎀','🖤','🤍','👑','🎪','🌈'];
  let newOutfitName = ''; let newOutfitIcon = '🎭';

  // ── Save current ─────────────────────────────────────────
  body.appendChild(UI.section('💾 Aktuelles Outfit speichern'));
  const saveCard = el('div',{class:'card'});
  const nameInp  = el('input',{type:'text',class:'bi',placeholder:'Outfit-Name...',value:newOutfitName,style:{marginBottom:'6px'}});
  nameInp.addEventListener('input',e=>{newOutfitName=e.target.value;});

  const iconRow = el('div',{class:'icon-grid',style:{marginBottom:'6px'}});
  OUTFIT_ICONS.forEach(ic=>{
    const b=el('button',{class:'icon-btn'+(newOutfitIcon===ic?' on':'')},ic);
    b.addEventListener('click',()=>{newOutfitIcon=ic; iconRow.querySelectorAll('.icon-btn').forEach(x=>x.classList.toggle('on',x.textContent===ic));});
    iconRow.appendChild(b);
  });

  const btnRow = el('div',{style:{display:'flex',gap:'5px'}});
  const diffBtn = el('button',{class:'sbtn'},'🔍 Diff');
  const saveBtn = el('button',{class:'sbtn sbtn-p',style:{flex:'1'}},'💾 Speichern');
  diffBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    UI.diffModal('Aktuell vs. leer', SYNC.getOutfitDiff(BC.snapshot(S.char),[]));
  });
  saveBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    if(!newOutfitName.trim()){setStatus('Name eingeben!',true);return;}
    const snap = BC.snapshot(S.char);
    const outfits = DB.get('outfits',[]);
    outfits.unshift({id:Date.now(),name:newOutfitName.trim(),icon:newOutfitIcon,items:snap,createdAt:Date.now()});
    DB.set('outfits',outfits);
    newOutfitName=''; nameInp.value='';
    setStatus('✓ Outfit gespeichert!',false);
    renderOutfitList();
  });
  btnRow.appendChild(diffBtn); btnRow.appendChild(saveBtn);
  [nameInp,iconRow,btnRow].forEach(n=>saveCard.appendChild(n));
  body.appendChild(saveCard);

  // ── History ──────────────────────────────────────────────
  const history = DB.get('history',[]);
  if(history.length){
    body.appendChild(UI.section('🕐 Verlauf (letzte 10)'));
    history.forEach(h=>{
      const d = new Date(h.timestamp);
      const card = el('div',{class:'card card-row'},
        el('div',{style:{flex:1}},
          el('div',{class:'card-title'},`${d.toLocaleTimeString()} — ${h.items.length} Items`),
          el('div',{class:'card-sub'},d.toLocaleDateString()),
        ),
        el('button',{class:'sbtn'},'↩ Restore'),
      );
      card.querySelector('.sbtn').addEventListener('click',()=>{
        if(!S.char)return;
        UI.confirmOverlay(`Zustand von ${d.toLocaleString()} wiederherstellen?`,()=>{
          BC.applySnapshot(S.char,h.items);
          SYNC.logAction('restore','ALL','History',S.char.Name);
          setStatus('✓ Wiederhergestellt',false);
        });
      });
      body.appendChild(card);
    });
  }

  // ── Saved outfits ─────────────────────────────────────────
  body.appendChild(UI.section('🎭 Gespeicherte Outfits'));
  const outfitListEl = el('div');
  body.appendChild(outfitListEl);

  function renderOutfitList(){
    outfitListEl.innerHTML='';
    const outfits = DB.get('outfits',[]);
    if(!outfits.length){ outfitListEl.appendChild(el('div',{class:'bempty'},'Noch keine Outfits gespeichert')); return; }
    outfits.forEach((outfit,i)=>{
      const card = el('div',{class:'card'});
      card.appendChild(el('div',{class:'card-title'},
        el('span',{style:{fontSize:'16px'}},outfit.icon),
        el('span',{},outfit.name),
        el('span',{class:'card-sub',style:{marginLeft:'auto'}},outfit.items.length+' Items'),
      ));

      // Live diff summary
      if(S.char){
        const cur  = BC.snapshot(S.char);
        const diffs= SYNC.getOutfitDiff(cur,outfit.items);
        if(diffs.length){
          card.appendChild(el('div',{class:'card-sub'},
            `${diffs.filter(d=>d.type==='added').length} neu · `+
            `${diffs.filter(d=>d.type==='removed').length} entfernt · `+
            `${diffs.filter(d=>d.type==='changed').length} geändert`
          ));
        } else {
          card.appendChild(el('div',{class:'card-sub',style:{color:'#4ade80'}},'✓ Identisch mit aktuellem Outfit'));
        }
      }

      const actions = el('div',{class:'card-actions'});
      const applyBtn= el('button',{class:'sbtn sbtn-p'},'▶ Anlegen');
      const diffBtn2= el('button',{class:'sbtn'},'🔍 Diff');
      const randBtn = el('button',{class:'sbtn'},'🎲');
      const delBtn  = el('button',{class:'sbtn sbtn-d'},'✕');

      applyBtn.addEventListener('click',()=>{
        if(!S.char)return;
        BC.applySnapshot(S.char,outfit.items);
        SYNC.saveHistory(S.char);
        SYNC.logAction('outfit-apply',outfit.name,'Outfit',S.char.Name);
        setStatus(`✓ ${outfit.name} angelegt`,false);
      });
      diffBtn2.addEventListener('click',()=>{
        if(!S.char)return;
        UI.diffModal(`Diff: ${outfit.name}`, SYNC.getOutfitDiff(BC.snapshot(S.char),outfit.items));
      });
      randBtn.addEventListener('click',()=>{
        if(!S.char||!outfit.items.length)return;
        const rnd = outfit.items[Math.floor(Math.random()*outfit.items.length)];
        const fam = S.char.AssetFamily||'Female3DCG';
        const assets = BC.getAssetsForGroup(fam,rnd.group);
        const asset  = assets[Math.floor(Math.random()*assets.length)];
        if(asset){ BC.applyItem(S.char,rnd.group,asset,rnd.colors,rnd.craft,rnd.property); setStatus(`🎲 ${SLOT_LABELS[rnd.group]||rnd.group}: ${asset.Name}`,false); }
      });
      delBtn.addEventListener('click',()=>{
        UI.confirmOverlay(`"${outfit.name}" löschen?`,()=>{
          const arr=DB.get('outfits',[]); arr.splice(i,1); DB.set('outfits',arr);
          renderOutfitList(); setStatus('Outfit gelöscht',false);
        });
      });
      [applyBtn,diffBtn2,randBtn,delBtn].forEach(b=>actions.appendChild(b));
      card.appendChild(actions);
      outfitListEl.appendChild(card);
    });
  }
  renderOutfitList();

  return body;
};
