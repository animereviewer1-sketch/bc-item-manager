// ── BCIM / tabs / tab-rules.js ────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_RULES = () => {
  const {el, UI, S, BC, DB, CFG, saveCFG, setStatus, SLOT_LABELS, SLOT_ORDER} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ── Farb-Sync (Master Color) ──────────────────────────────
  body.appendChild(UI.section('🎨 Master Farb-Sync'));
  const syncCard = el('div',{class:'card'});
  syncCard.appendChild(el('div',{class:'section-note'},'Ein Slot als Farbvorlage — alle anderen Items übernehmen seine Farbe.'));

  const masterSel=el('select',{class:'bsel',style:{marginBottom:'6px'}});
  masterSel.appendChild(el('option',{value:''},'— Kein Master —'));
  SLOT_ORDER.forEach(g=>{
    const o=el('option',{value:g},SLOT_LABELS[g]||g);
    if(CFG.masterColorGroup===g)o.selected=true;
    masterSel.appendChild(o);
  });
  masterSel.addEventListener('change',e=>{CFG.masterColorGroup=e.target.value||null;saveCFG();});

  const applyBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%'}},'🎨 Master-Farbe jetzt auf alle anwenden');
  applyBtn.addEventListener('click',()=>{
    if(!CFG.masterColorGroup||!S.char){setStatus('Master-Slot & Spieler wählen',true);return;}
    const master=BC.getItem(S.char,CFG.masterColorGroup);
    if(!master){setStatus('Master-Slot ist leer',true);return;}
    const masterColor=Array.isArray(master.Color)?master.Color:[master.Color];
    let count=0;
    BC.getGroups(S.char.AssetFamily||'Female3DCG').forEach(g=>{
      if(g.Name===CFG.masterColorGroup)return;
      const item=BC.getItem(S.char,g.Name);
      if(!item)return;
      BC.applyItem(S.char,g.Name,item.Asset,masterColor,undefined,undefined);
      count++;
    });
    setStatus(`✓ Farbe auf ${count} Items angewendet`,false);
  });
  [masterSel,applyBtn].forEach(n=>syncCard.appendChild(n));
  body.appendChild(syncCard);

  // ── Rule engine ───────────────────────────────────────────
  body.appendChild(UI.section('⚡ Regeln (IF → THEN)'));

  const rulesListEl = el('div');
  const renderRules = ()=>{
    rulesListEl.innerHTML='';
    const rules=DB.get('rules',[]);
    if(!rules.length){ rulesListEl.appendChild(el('div',{class:'section-note'},'Keine Regeln definiert.')); }
    rules.forEach((rule,i)=>{
      const card=el('div',{class:'card'});
      card.appendChild(el('div',{class:'card-title'},
        el('span',{style:{color:rule.active?'var(--acc)':'var(--txt3)',marginRight:'4px'}},rule.active?'●':'○'),
        el('span',{},`${rule.triggerLabel} → ${rule.actionLabel}`),
      ));
      const row=el('div',{class:'card-actions'});
      const togBtn=el('button',{class:'sbtn'},rule.active?'Deaktivieren':'Aktivieren');
      const delBtn=el('button',{class:'sbtn sbtn-d'},'✕');
      togBtn.addEventListener('click',()=>{rule.active=!rule.active;DB.set('rules',[...rules]);renderRules();});
      delBtn.addEventListener('click',()=>{rules.splice(i,1);DB.set('rules',rules);renderRules();});
      row.appendChild(togBtn); row.appendChild(delBtn);
      card.appendChild(row);
      rulesListEl.appendChild(card);
    });
  };
  renderRules();
  body.appendChild(rulesListEl);

  // ── Add rule ──────────────────────────────────────────────
  body.appendChild(UI.section('+ Neue Regel'));
  const ruleCard=el('div',{class:'card'});

  const triggerSel=el('select',{class:'bsel',style:{marginBottom:'5px'}});
  [['slot_filled','Wenn Slot belegt wird'],['slot_cleared','Wenn Slot geleert wird'],['any_change','Bei jeder Änderung']].forEach(([v,l])=>triggerSel.appendChild(el('option',{value:v},l)));

  const triggerSlotSel=el('select',{class:'bsel',style:{marginBottom:'5px'}});
  triggerSlotSel.appendChild(el('option',{value:''},'Slot wählen (optional)...'));
  SLOT_ORDER.forEach(g=>triggerSlotSel.appendChild(el('option',{value:g},SLOT_LABELS[g]||g)));

  const actionSel=el('select',{class:'bsel',style:{marginBottom:'5px'}});
  [
    ['set_material_shiny',  '→ Craft: Shiny setzen'],
    ['set_material_leather','→ Craft: Leather setzen'],
    ['color_sync',          '→ Farb-Sync anwenden'],
    ['save_history',        '→ History-Snapshot speichern'],
    ['notify',              '→ Benachrichtigung anzeigen'],
    ['karma_bonus',         '→ 5 Karma-Punkte vergeben'],
  ].forEach(([v,l])=>actionSel.appendChild(el('option',{value:v},l)));

  const addRuleBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%'}},'+ Regel hinzufügen');
  addRuleBtn.addEventListener('click',()=>{
    const rules=DB.get('rules',[]);
    const tSlot=triggerSlotSel.value;
    rules.push({
      id:Date.now(), active:true,
      trigger:triggerSel.value, triggerSlot:tSlot, action:actionSel.value,
      triggerLabel:(triggerSel.options[triggerSel.selectedIndex].text)+(tSlot?` [${SLOT_LABELS[tSlot]||tSlot}]`:''),
      actionLabel: actionSel.options[actionSel.selectedIndex].text,
    });
    DB.set('rules',rules);
    setStatus('✓ Regel hinzugefügt',false);
    renderRules();
  });
  [triggerSel,triggerSlotSel,actionSel,addRuleBtn].forEach(n=>ruleCard.appendChild(n));
  body.appendChild(ruleCard);

  // Rule executor (called from apply/remove hooks)
  BCIM.applyActiveRules = (trigger, group, char) => {
    const rules=DB.get('rules',[]);
    rules.filter(r=>r.active&&(r.trigger===trigger||r.trigger==='any_change')&&(!r.triggerSlot||r.triggerSlot===group)).forEach(r=>{
      switch(r.action){
        case 'set_material_shiny': {
          const item=BC.getItem(char,group);
          if(item){item.Craft={...(item.Craft||{}),Property:'Shiny'};try{CharacterRefresh(char);}catch{}}
          break;
        }
        case 'set_material_leather': {
          const item=BC.getItem(char,group);
          if(item){item.Craft={...(item.Craft||{}),Property:'Leather'};try{CharacterRefresh(char);}catch{}}
          break;
        }
        case 'color_sync': {
          if(CFG.masterColorGroup){
            const master=BC.getItem(char,CFG.masterColorGroup);
            const item=BC.getItem(char,group);
            if(master&&item) BC.applyItem(char,group,item.Asset,Array.isArray(master.Color)?master.Color:[master.Color]);
          }
          break;
        }
        case 'save_history': BCIM.SYNC.saveHistory(char); break;
        case 'notify': setStatus(`⚡ Regel: ${r.triggerLabel}`,false); break;
        case 'karma_bonus': BCIM.KARMA?.addPoints(5,`Regel-Bonus: ${r.triggerLabel}`); break;
      }
    });
  };

  // ── BCX integration (readonly) ────────────────────────────
  const bcxRules=BC.bcxRules();
  if(bcxRules){
    body.appendChild(UI.section('🔗 BCX Regeln (nur lesen)'));
    const bcxCard=el('div',{class:'card'});
    bcxRules.slice(0,12).forEach(r=>{
      bcxCard.appendChild(el('div',{class:'card-row',style:{marginBottom:'3px'}},
        el('span',{style:{color:r.active?'#4ade80':'var(--txt3)',fontSize:'10px'}},r.active?'●':'○'),
        el('span',{style:{fontSize:'11px',flex:1}},r.name),
      ));
    });
    body.appendChild(bcxCard);
  }

  // ── Loaded addons ─────────────────────────────────────────
  const addons=BC.loadedAddons();
  if(addons.length){
    body.appendChild(UI.section('🧩 Geladene Addons'));
    const addonCard=el('div',{class:'card'});
    addons.forEach(a=>{
      addonCard.appendChild(el('div',{class:'card-row',style:{marginBottom:'3px'}},
        el('span',{style:{color:'var(--acc)',fontSize:'11px'}},'⬡'),
        el('span',{style:{fontSize:'11px'}},a),
      ));
    });
    body.appendChild(addonCard);
  }

  return body;
};
