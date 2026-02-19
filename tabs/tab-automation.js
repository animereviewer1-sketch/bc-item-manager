// ── BCIM / tabs / tab-automation.js ──────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_AUTOMATION = () => {
  const {el,UI,S,BC,AUTO,DB,CFG,saveCFG,SLOT_LABELS,SLOT_ORDER,setStatus} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ══ SEQUENCES ══════════════════════════════════════════
  body.appendChild(UI.section('⏱ Sequenz-Editor'));

  const sequences = DB.get('sequences',[]);
  let editSeq = null;  // currently editing
  const seqListEl = el('div',{id:'bcim-seq-list'});

  const renderSeqList = () => {
    seqListEl.innerHTML = '';
    const seqs = DB.get('sequences',[]);
    if (!seqs.length) { seqListEl.appendChild(el('div',{class:'section-note'},'Keine Sequenzen gespeichert.')); return; }
    seqs.forEach((seq,i) => {
      const card = UI.card(
        el('div',{class:'card-title'},el('span',{},seq.name),
          el('span',{class:'card-sub',style:{marginLeft:'auto'}},seq.steps.length+' Schritte')),
        el('div',{class:'card-actions'},
          el('button',{class:'sbtn sbtn-p',onclick:()=>playSequence(seq)},'▶ Abspielen'),
          el('button',{class:'sbtn',onclick:()=>editSequence(seq,i)},'✏ Bearbeiten'),
          el('button',{class:'sbtn sbtn-d',onclick:()=>{ const a=DB.get('sequences',[]); a.splice(i,1); DB.set('sequences',a); renderSeqList(); }},'✕'),
        )
      );
      seqListEl.appendChild(card);
    });
  };
  renderSeqList();
  body.appendChild(seqListEl);

  // Add sequence button
  const addSeqBtn = el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'5px'}},'+ Neue Sequenz erstellen');
  addSeqBtn.addEventListener('click',()=>openSequenceEditor(null,null));
  body.appendChild(addSeqBtn);

  // Running indicator
  const runIndicator = el('div',{id:'bcim-seq-run',style:{display:'none',padding:'8px',background:'color-mix(in srgb,var(--acc) 10%,transparent)',
    border:'1px solid var(--acc)',borderRadius:'8px',margin:'6px 0',fontSize:'11px',color:'var(--acc)'}});
  body.appendChild(runIndicator);

  const stopSeqBtn = el('button',{class:'sbtn sbtn-d',style:{width:'100%',display:'none'}},'⏹ Sequenz stoppen');
  stopSeqBtn.addEventListener('click',()=>{ AUTO.stopSequence(); stopSeqBtn.style.display='none'; runIndicator.style.display='none'; });
  body.appendChild(stopSeqBtn);

  function playSequence(seq) {
    if (!S.char) { setStatus('Kein Spieler gewählt',true); return; }
    runIndicator.style.display='block'; stopSeqBtn.style.display='block';
    runIndicator.textContent='▶ Läuft: '+seq.name+'...';
    AUTO.runSequence(S.char, seq.steps,
      (i,step)=>{ runIndicator.textContent=`▶ Schritt ${i+1}/${seq.steps.length}: ${SLOT_LABELS[step.group]||step.group}`; },
      ()=>{ runIndicator.textContent='✓ Fertig!'; stopSeqBtn.style.display='none'; setTimeout(()=>{runIndicator.style.display='none';},2000); }
    );
  }

  function openSequenceEditor(seq, idx) {
    // Overlay editor
    const ov = el('div',{style:{position:'fixed',inset:'0',background:'rgba(0,0,0,.75)',zIndex:'199999',
      display:'flex',alignItems:'center',justifyContent:'center'}});
    const box = el('div',{style:{background:'var(--bg)',border:'1px solid var(--brd)',borderRadius:'14px',
      padding:'14px',width:'360px',maxHeight:'80vh',overflowY:'auto',color:'var(--txt)'}});

    let steps = seq ? [...seq.steps] : [];
    let seqName = seq?.name||'';

    const nameInp = el('input',{type:'text',class:'bi',placeholder:'Sequenz-Name...',value:seqName,style:{marginBottom:'8px'}});
    nameInp.addEventListener('input',e=>seqName=e.target.value);

    const stepListEl = el('div',{id:'seq-step-list'});
    const renderSteps = () => {
      stepListEl.innerHTML='';
      steps.forEach((step,i)=>{
        const row = el('div',{class:'seq-step'},
          el('span',{class:'seq-step-num'},(i+1)+'.'),
          el('span',{class:'seq-step-label'},
            step.action==='remove'?'✕ ':'+',
            (SLOT_LABELS[step.group]||step.group)+': '+(step.assetName||'—')
          ),
          el('span',{class:'seq-step-delay'},step.delay?Math.round(step.delay/1000)+'s':'—'),
          el('button',{class:'sbtn sbtn-d',style:{padding:'2px 5px',fontSize:'10px'},
            onclick:()=>{steps.splice(i,1);renderSteps();}},'✕')
        );
        stepListEl.appendChild(row);
      });
    };
    renderSteps();

    // Add step controls
    const groupSel = el('select',{class:'bsel',style:{marginBottom:'5px'}});
    groupSel.appendChild(el('option',{value:''},'Slot wählen...'));
    SLOT_ORDER.forEach(g=>groupSel.appendChild(el('option',{value:g},SLOT_LABELS[g]||g)));

    const assetInp = el('input',{type:'text',class:'bi',placeholder:'Item-Name (leer = entfernen)',style:{marginBottom:'5px'}});
    const delayInp = el('input',{type:'number',class:'bi',placeholder:'Delay ms (z.B. 3000)',value:'1000',style:{marginBottom:'5px'}});
    const chatInp  = el('input',{type:'text',class:'bi',placeholder:'Chat-Nachricht (optional)',style:{marginBottom:'5px'}});

    const addStepBtn = el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'8px'}},'+ Schritt hinzufügen');
    addStepBtn.addEventListener('click',()=>{
      if(!groupSel.value) return;
      const assetName = assetInp.value.trim();
      steps.push({
        group:groupSel.value, assetName:assetName||undefined,
        action: assetName?'apply':'remove',
        delay: parseInt(delayInp.value)||1000,
        chatMsg: chatInp.value.trim()||undefined,
      });
      assetInp.value=''; chatInp.value='';
      renderSteps();
    });

    const saveBtn = el('button',{class:'sbtn sbtn-p',style:{flex:'1'}},'💾 Speichern');
    saveBtn.addEventListener('click',()=>{
      if(!seqName.trim()){return;}
      const seqs=DB.get('sequences',[]);
      if(idx!=null) seqs[idx]={...seqs[idx],name:seqName,steps};
      else seqs.unshift({id:Date.now(),name:seqName,steps});
      DB.set('sequences',seqs);
      ov.remove(); renderSeqList();
    });
    const cancelBtn=el('button',{class:'sbtn',style:{flex:'1'}},'Abbrechen');
    cancelBtn.addEventListener('click',()=>ov.remove());
    const btnRow=el('div',{style:{display:'flex',gap:'5px',marginTop:'5px'}});
    btnRow.appendChild(cancelBtn); btnRow.appendChild(saveBtn);

    [el('div',{style:{fontWeight:'600',color:'var(--acc)',marginBottom:'8px'}},seq?'Sequenz bearbeiten':'Neue Sequenz'),
     nameInp,stepListEl,el('hr',{style:{border:'none',borderTop:'1px solid var(--brd)',margin:'8px 0'}}),
     el('div',{class:'card-sub',style:{marginBottom:'5px'}},'Schritt hinzufügen:'),
     groupSel,assetInp,delayInp,chatInp,addStepBtn,btnRow
    ].forEach(n=>box.appendChild(n));
    ov.appendChild(box); ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
  }

  function editSequence(seq, idx) { openSequenceEditor(seq, idx); }

  // ══ ZUFALLS-RESTRAINTS ═══════════════════════════════════
  body.appendChild(UI.section('🎲 Zufalls-Restraints'));
  const randCfg = { slots:[], difficulty:5, craftProperty:'', chatAnnounce:true };

  const slotCheckWrap = el('div',{class:'btags',style:{marginBottom:'7px'}});
  ['ItemMouth','ItemArms','ItemHands','ItemLegs','ItemFeet','ItemEyes','ItemHead'].forEach(g=>{
    const btn=el('button',{class:'btag',onclick:()=>{
      const idx=randCfg.slots.indexOf(g);
      if(idx>=0)randCfg.slots.splice(idx,1); else randCfg.slots.push(g);
      btn.classList.toggle('on',randCfg.slots.includes(g));
    }},SLOT_LABELS[g]||g);
    slotCheckWrap.appendChild(btn);
  });
  body.appendChild(slotCheckWrap);

  const randDiffRow = UI.slider('Schwierigkeit',5,0,20,v=>randCfg.difficulty=v);
  body.appendChild(randDiffRow);

  const matSel=el('select',{class:'bsel',style:{marginBottom:'6px'}});
  matSel.appendChild(el('option',{value:''},'— Kein Craft-Material —'));
  BC.craftMaterials.forEach(m=>{matSel.appendChild(el('option',{value:m},m));});
  matSel.addEventListener('change',e=>randCfg.craftProperty=e.target.value);
  body.appendChild(matSel);

  body.appendChild(BCIM.UI.toggle('Im Chat ankündigen',true,v=>randCfg.chatAnnounce=v));

  const applyRandBtn = el('button',{class:'sbtn sbtn-p',style:{width:'100%'}},'🎲 Zufalls-Restraints anlegen');
  applyRandBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    if(!randCfg.slots.length){setStatus('Mindestens einen Slot wählen',true);return;}
    const applied = AUTO.randomRestraints(S.char, randCfg);
    setStatus(`✓ ${applied.length} Items angelegt`,false);
  });
  body.appendChild(applyRandBtn);

  // ══ ESKALATION ═══════════════════════════════════════════
  body.appendChild(UI.section('📈 Eskalations-Modus'));
  const escState = el('div',{class:'section-note',id:'bcim-esc-state'},'Inaktiv');
  body.appendChild(escState);

  const escCfg = {items:[], intervalMinutes:5, chatAnnounce:true, loop:false};
  const savedSequences = DB.get('sequences',[]);

  const escSeqSel = el('select',{class:'bsel',style:{marginBottom:'5px'}});
  escSeqSel.appendChild(el('option',{value:''},'Sequenz wählen...'));
  savedSequences.forEach(s=>escSeqSel.appendChild(el('option',{value:s.id},s.name)));
  escSeqSel.addEventListener('change',e=>{
    const s=DB.get('sequences',[]).find(x=>x.id==e.target.value);
    if(s) escCfg.items=s.steps;
  });
  body.appendChild(escSeqSel);

  const escIntervalRow = UI.slider('Interval (Minuten)',5,1,60,v=>{escCfg.intervalMinutes=v;});
  body.appendChild(escIntervalRow);
  body.appendChild(BCIM.UI.toggle('Im Chat ankündigen',true,v=>escCfg.chatAnnounce=v));
  body.appendChild(BCIM.UI.toggle('Endlos-Loop',false,v=>escCfg.loop=v));

  const escBtnRow = el('div',{style:{display:'flex',gap:'5px'}});
  const startEscBtn = el('button',{class:'sbtn sbtn-p',style:{flex:'1'}},'▶ Starten');
  const stopEscBtn  = el('button',{class:'sbtn sbtn-d',style:{flex:'1'}},'⏹ Stoppen');
  startEscBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    AUTO.startEscalation(S.char,escCfg,
      (entry,idx)=>{escState.textContent=`Aktiv — ${idx}. Item angelegt: ${SLOT_LABELS[entry.group]||entry.group}`;}
    );
    escState.textContent='Aktiv ✓';
    setStatus('Eskalation gestartet',false);
  });
  stopEscBtn.addEventListener('click',()=>{AUTO.stopEscalation();escState.textContent='Gestoppt.';});
  escBtnRow.appendChild(startEscBtn); escBtnRow.appendChild(stopEscBtn);
  body.appendChild(escBtnRow);

  // ══ AUTO-ESCAPE ══════════════════════════════════════════
  body.appendChild(UI.section('🔓 Auto-Escape'));
  const aeCfg = {...(CFG.escapeConfig||{enabled:false,condition:'always',timerMinutes:10,allowedItems:[]})};
  const aeState = el('div',{class:'section-note',id:'bcim-ae-state'},AUTO.autoEscapeActive()?'Aktiv':'Inaktiv');
  body.appendChild(aeState);

  const condSel = el('select',{class:'bsel',style:{marginBottom:'5px'}});
  [['always','Immer versuchen'],['alone','Nur wenn alleine'],['timer','Nach X Minuten'],['items','Außer erlaubte Items']].forEach(([v,l])=>{
    const o=el('option',{value:v},l); if(aeCfg.condition===v)o.selected=true; condSel.appendChild(o);
  });
  condSel.addEventListener('change',e=>aeCfg.condition=e.target.value);
  body.appendChild(condSel);

  const timerRow = UI.slider('Mindest-Tragedauer (Min)',10,1,120,v=>aeCfg.timerMinutes=v);
  body.appendChild(timerRow);

  const aeBtnRow = el('div',{style:{display:'flex',gap:'5px'}});
  const startAeBtn=el('button',{class:'sbtn sbtn-p',style:{flex:'1'}},'▶ Aktivieren');
  const stopAeBtn =el('button',{class:'sbtn sbtn-d',style:{flex:'1'}},'⏹ Deaktivieren');
  startAeBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    CFG.escapeConfig=aeCfg; saveCFG();
    AUTO.startAutoEscape(S.char,aeCfg,
      (group,name)=>{ setStatus(`🔓 Entkommen aus: ${SLOT_LABELS[group]||group}`,false); }
    );
    aeState.textContent='Aktiv ✓';
  });
  stopAeBtn.addEventListener('click',()=>{AUTO.stopAutoEscape();aeState.textContent='Inaktiv';});
  aeBtnRow.appendChild(startAeBtn); aeBtnRow.appendChild(stopAeBtn);
  body.appendChild(aeBtnRow);

  // ══ MAKRO-REKORDER ════════════════════════════════════════
  body.appendChild(UI.section('⏺ Makro-Rekorder'));
  const recState = el('div',{class:'section-note'},'Inaktiv');
  body.appendChild(recState);
  const macroNameInp = el('input',{type:'text',class:'bi',placeholder:'Makro-Name...',style:{marginBottom:'6px'}});
  body.appendChild(macroNameInp);

  const macros = DB.get('macros',[]);
  const recBtnRow = el('div',{style:{display:'flex',gap:'5px',marginBottom:'8px'}});
  const startRecBtn=el('button',{class:'sbtn sbtn-p',style:{flex:'1'}},'⏺ Aufnehmen');
  const stopRecBtn =el('button',{class:'sbtn sbtn-d',style:{flex:'1'}},'⏹ Stoppen & Speichern');
  startRecBtn.addEventListener('click',()=>{
    AUTO.startRecording();
    recState.textContent='⏺ Aufnahme läuft...';
    setStatus('Aufnahme gestartet — lege Items an!',false);
  });
  stopRecBtn.addEventListener('click',()=>{
    const steps=AUTO.stopRecording(macroNameInp.value.trim()||'Makro '+Date.now());
    recState.textContent=`Gespeichert: ${steps.length} Schritte`;
    macroNameInp.value='';
    renderMacros();
  });
  recBtnRow.appendChild(startRecBtn); recBtnRow.appendChild(stopRecBtn);
  body.appendChild(recBtnRow);

  const macroListEl = el('div');
  const renderMacros = () => {
    macroListEl.innerHTML='';
    const ms=DB.get('macros',[]);
    ms.forEach((m,i)=>{
      const c=UI.card(
        el('div',{class:'card-title'},m.name,el('span',{class:'card-sub',style:{marginLeft:'auto'}},m.steps.length+'×')),
        el('div',{class:'card-actions'},
          el('button',{class:'sbtn sbtn-p',onclick:()=>{
            if(!S.char)return;
            AUTO.playMacro(S.char,m,
              (i,s)=>setStatus(`▶ ${i+1}/${m.steps.length}: ${SLOT_LABELS[s.group]||s.group}`,false),
              ()=>setStatus('✓ Makro fertig',false)
            );
          }},'▶ Abspielen'),
          el('button',{class:'sbtn sbtn-d',onclick:()=>{const a=DB.get('macros',[]);a.splice(i,1);DB.set('macros',a);renderMacros();}},'✕'),
        )
      );
      macroListEl.appendChild(c);
    });
  };
  renderMacros();
  body.appendChild(macroListEl);

  return body;
};
