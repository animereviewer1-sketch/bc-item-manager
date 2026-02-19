// ── BCIM / tabs / tab-karma.js ────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_KARMA = () => {
  const {el,UI,S,BC,KARMA,DB,CFG,setStatus,SLOT_LABELS} = BCIM;
  const body = el('div',{class:'tab-body'});

  const cfg = KARMA.getCfg();
  const pts = KARMA.getPoints();
  const maxPts = Math.max(200, ...cfg.winConditions?.map(w=>w.pts)||[200]);

  // ══ OVERVIEW ═════════════════════════════════════════════
  body.appendChild(UI.section('⭐ Karma Punkte'));
  const ptsEl = el('div',{class:'karma-pts'},String(pts));
  const barEl = UI.progressBar(Math.min(100,pts/maxPts*100));
  const statusEl = el('div',{class:'card-sub',style:{textAlign:'center',marginBottom:'6px'}},
    KARMA.active()?'🟢 Läuft':'⚫ Gestoppt'
  );

  const activeCombos = KARMA._combosActive||[];
  const comboRow = el('div',{style:{textAlign:'center',marginBottom:'5px'}});
  activeCombos.forEach(c=>comboRow.appendChild(el('span',{class:'combo-pill'},'⚡ '+c)));
  if(!activeCombos.length) comboRow.appendChild(el('span',{class:'section-note'},'Keine aktive Kombo'));

  const startStopRow = el('div',{style:{display:'flex',gap:'5px',marginBottom:'8px'}});
  const startBtn=el('button',{class:'sbtn sbtn-p',style:{flex:'1'}},'▶ Karma starten');
  const stopBtn =el('button',{class:'sbtn sbtn-d',style:{flex:'1'}},'⏹ Stoppen');
  const resetBtn=el('button',{class:'sbtn sbtn-w',style:{flex:'1'}},'🗑 Punkte zurücksetzen');
  startBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler gewählt',true);return;}
    KARMA.start();
    statusEl.textContent='🟢 Läuft';
    setStatus('Karma-System gestartet',false);
  });
  stopBtn.addEventListener('click',()=>{KARMA.stop();statusEl.textContent='⚫ Gestoppt';});
  resetBtn.addEventListener('click',()=>{
    UI.confirmOverlay('Alle Karma-Punkte zurücksetzen?',()=>{KARMA.resetPoints();refreshPts();setStatus('Punkte zurückgesetzt',false);});
  });
  [startBtn,stopBtn,resetBtn].forEach(b=>startStopRow.appendChild(b));

  body.appendChild(UI.card(ptsEl,barEl,statusEl,comboRow,startStopRow));

  // ══ WIN CONDITIONS ════════════════════════════════════════
  body.appendChild(UI.section('🎁 Einlösbar'));
  const winListEl = el('div');
  const renderWinConditions = (cur) => {
    winListEl.innerHTML='';
    cfg.winConditions?.forEach(w=>{
      const canAfford = cur>=w.pts;
      const pct = Math.min(100,cur/w.pts*100);
      const card=el('div',{class:'card'});
      card.appendChild(el('div',{class:'card-row'},
        el('span',{class:'win-pts'},w.pts+'⭐'),
        el('span',{class:'win-label'},w.label),
        canAfford?el('button',{class:'sbtn sbtn-p',style:{padding:'3px 8px'},'onclick':()=>{
          const res=KARMA.redeemCondition(w.id);
          if(res.ok){setStatus('✓ Eingelöst: '+w.label,false);refreshPts();}
          else setStatus('❌ '+res.reason,true);
        }},'Einlösen'):el('span',{class:'lock-timer'},Math.round(pct)+'%')
      ));
      if(w.description) card.appendChild(el('div',{class:'card-sub'},w.description));
      card.appendChild(UI.progressBar(pct));
      winListEl.appendChild(card);
    });
  };
  renderWinConditions(pts);
  body.appendChild(winListEl);

  // ══ GAMBLING ═════════════════════════════════════════════
  body.appendChild(UI.section('🎰 Karma Gambling'));
  const gcfg=cfg.gambling||{};
  if(!gcfg.enabled){
    body.appendChild(el('div',{class:'section-note'},'Gambling ist in der Konfiguration deaktiviert.'));
  } else {
    let bet=gcfg.minBet||10;
    const betRow=UI.slider(`Einsatz (${gcfg.minBet||10}–${gcfg.maxBet||500})`,gcfg.minBet||10,gcfg.minBet||10,gcfg.maxBet||500,v=>bet=v);
    body.appendChild(betRow);
    const resultEl=el('div',{class:'roulette-result'},'—');
    body.appendChild(resultEl);
    const gambRow=el('div',{style:{display:'flex',gap:'4px'}});
    [['coinflip','🪙 Münze'],['dice','🎲 Würfel'],['roulette','🎡 Roulette']].forEach(([mode,label])=>{
      const b=el('button',{class:'sbtn',style:{flex:'1'}},label);
      b.addEventListener('click',()=>{
        const res=KARMA.gamble(Math.round(bet),mode);
        if(!res.ok){setStatus('❌ '+res.reason,true);return;}
        resultEl.textContent=res.msgResult;
        refreshPts();
        // Chat announce
        BC.sendChat(`🎰 ${label}: ${res.msgResult}`);
      });
      gambRow.appendChild(b);
    });
    body.appendChild(gambRow);
    // Stats
    const gstats=KARMA.getGamblingStats();
    body.appendChild(el('div',{class:'card-sub',style:{marginTop:'6px'}},
      `Gespielt: ${gstats.games} · Gewonnen: ${gstats.totalWon}⭐ · Verloren: ${gstats.totalBet-gstats.totalWon}⭐`
    ));
  }

  // ══ POINT RULES CONFIG ════════════════════════════════════
  body.appendChild(UI.section('⚙ Punkte-Regeln'));
  body.appendChild(el('div',{class:'section-note'},'Punkte pro X Minuten für bestimmte Items/Slots.'));
  const rulesEl=el('div');
  const renderRules=()=>{
    rulesEl.innerHTML='';
    const c=KARMA.getCfg();
    c.pointRules?.forEach((rule,i)=>{
      const row=el('div',{class:'card'});
      const nInp=el('input',{type:'text',class:'bi',value:rule.label,placeholder:'Label',style:{flex:'1'}});
      nInp.addEventListener('change',e=>{rule.label=e.target.value;KARMA.saveCfg(c);});
      const kInp=el('input',{type:'text',class:'bi',value:rule.key,placeholder:'Item-Name oder Gruppe',style:{flex:'1'}});
      kInp.addEventListener('change',e=>{rule.key=e.target.value;KARMA.saveCfg(c);});
      const pInp=el('input',{type:'number',class:'bi',value:rule.pts,placeholder:'Punkte',style:{flex:'0 0 50px'}});
      pInp.addEventListener('change',e=>{rule.pts=parseInt(e.target.value)||1;KARMA.saveCfg(c);});
      const perInp=el('input',{type:'number',class:'bi',value:rule.per,placeholder:'je X Min',style:{flex:'0 0 50px'}});
      perInp.addEventListener('change',e=>{rule.per=parseInt(e.target.value)||5;KARMA.saveCfg(c);});
      const delBtn=el('button',{class:'sbtn sbtn-d'},'✕');
      delBtn.addEventListener('click',()=>{c.pointRules.splice(i,1);KARMA.saveCfg(c);renderRules();});
      const topRow=el('div',{style:{display:'flex',gap:'4px',marginBottom:'4px'}});
      [nInp,kInp].forEach(n=>topRow.appendChild(n));
      const botRow=el('div',{style:{display:'flex',gap:'4px',alignItems:'center'}});
      botRow.appendChild(el('span',{class:'card-sub'},'Pkt:'));
      botRow.appendChild(pInp);
      botRow.appendChild(el('span',{class:'card-sub'},'/ alle'));
      botRow.appendChild(perInp);
      botRow.appendChild(el('span',{class:'card-sub'},'Min'));
      botRow.appendChild(delBtn);
      row.appendChild(topRow); row.appendChild(botRow);
      rulesEl.appendChild(row);
    });
    const addBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'4px'}},'+ Regel hinzufügen');
    addBtn.addEventListener('click',()=>{
      const c2=KARMA.getCfg();
      c2.pointRules.push({id:'r'+Date.now(),label:'Neues Item',key:'',type:'asset',pts:1,per:5});
      KARMA.saveCfg(c2); renderRules();
    });
    rulesEl.appendChild(addBtn);
  };
  renderRules();
  body.appendChild(rulesEl);

  // ══ COMBOS CONFIG ═════════════════════════════════════════
  body.appendChild(UI.section('⚡ Kombos'));
  body.appendChild(el('div',{class:'section-note'},'Wenn alle gelisteten Slots/Items gleichzeitig getragen werden.'));
  const combosEl=el('div');
  const renderCombos=()=>{
    combosEl.innerHTML='';
    const c=KARMA.getCfg();
    c.combos?.forEach((combo,i)=>{
      const card=el('div',{class:'card'});
      const labelInp=el('input',{type:'text',class:'bi',value:combo.label,placeholder:'Kombo-Name',style:{marginBottom:'4px'}});
      labelInp.addEventListener('change',e=>{combo.label=e.target.value;KARMA.saveCfg(c);});
      const multInp=el('input',{type:'number',class:'bi',value:combo.multiplier,placeholder:'Multiplikator',step:'0.5',style:{flex:'1'}});
      multInp.addEventListener('change',e=>{combo.multiplier=parseFloat(e.target.value)||1;KARMA.saveCfg(c);});
      const bonusInp=el('input',{type:'number',class:'bi',value:combo.bonus||0,placeholder:'Bonus-Pkt',style:{flex:'1'}});
      bonusInp.addEventListener('change',e=>{combo.bonus=parseInt(e.target.value)||0;KARMA.saveCfg(c);});
      const delBtn=el('button',{class:'sbtn sbtn-d'},'✕');
      delBtn.addEventListener('click',()=>{c.combos.splice(i,1);KARMA.saveCfg(c);renderCombos();});
      const row1=el('div',{style:{display:'flex',gap:'4px',marginBottom:'4px'}});
      row1.appendChild(labelInp);
      const row2=el('div',{style:{display:'flex',gap:'4px',alignItems:'center'}});
      [el('span',{class:'card-sub'},'×'),multInp,el('span',{class:'card-sub'},'+'),bonusInp,el('span',{class:'card-sub'},'Bonus'),delBtn]
        .forEach(n=>row2.appendChild(n));
      // Items in combo
      const itemsEl=el('div',{class:'btags',style:{marginTop:'5px'}});
      (combo.items||[]).forEach((item,j)=>{
        const pill=el('button',{class:'btag on'},item,el('span',{style:{marginLeft:'3px',opacity:'.7'},onclick:e=>{e.stopPropagation();combo.items.splice(j,1);KARMA.saveCfg(c);renderCombos();}},'×'));
        itemsEl.appendChild(pill);
      });
      const addItemInp=el('input',{type:'text',class:'bi',placeholder:'Slot/Item hinzufügen...',style:{marginTop:'4px',fontSize:'11px'}});
      addItemInp.addEventListener('keydown',e=>{if(e.key==='Enter'&&addItemInp.value.trim()){
        combo.items.push(addItemInp.value.trim()); addItemInp.value=''; KARMA.saveCfg(c); renderCombos();
      }});
      [row1,row2,itemsEl,addItemInp].forEach(n=>card.appendChild(n));
      combosEl.appendChild(card);
    });
    const addBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'4px'}},'+ Kombo hinzufügen');
    addBtn.addEventListener('click',()=>{
      const c2=KARMA.getCfg();
      c2.combos.push({id:'c'+Date.now(),label:'Neue Kombo',items:[],multiplier:2,bonus:0,description:''});
      KARMA.saveCfg(c2); renderCombos();
    });
    combosEl.appendChild(addBtn);
  };
  renderCombos();
  body.appendChild(combosEl);

  // ══ WIN CONDITIONS CONFIG ══════════════════════════════════
  body.appendChild(UI.section('🎁 Einlöse-Bedingungen konfigurieren'));
  const winCfgEl=el('div');
  const renderWinCfg=()=>{
    winCfgEl.innerHTML='';
    const c=KARMA.getCfg();
    c.winConditions?.forEach((w,i)=>{
      const card=el('div',{class:'card'});
      const ptsInp=el('input',{type:'number',class:'bi',value:w.pts,placeholder:'Punkte',style:{flex:'0 0 60px'}});
      ptsInp.addEventListener('change',e=>{w.pts=parseInt(e.target.value)||10;KARMA.saveCfg(c);});
      const lblInp=el('input',{type:'text',class:'bi',value:w.label,placeholder:'Label',style:{flex:'1'}});
      lblInp.addEventListener('change',e=>{w.label=e.target.value;KARMA.saveCfg(c);});
      const typeSel=el('select',{class:'bsel',style:{marginTop:'4px'}});
      [['unlock','Item entfernen'],['freeAll','Vollständige Freiheit'],['applyTo','Item anlegen bei Spieler'],['gamblingBoost','Gambling Boost']].forEach(([v,l])=>{
        const o=el('option',{value:v},l);if(w.type===v)o.selected=true;typeSel.appendChild(o);
      });
      typeSel.addEventListener('change',e=>{w.type=e.target.value;KARMA.saveCfg(c);});
      const delBtn=el('button',{class:'sbtn sbtn-d'},'✕');
      delBtn.addEventListener('click',()=>{c.winConditions.splice(i,1);KARMA.saveCfg(c);renderWinCfg();});
      const row1=el('div',{style:{display:'flex',gap:'4px'}});
      [el('span',{class:'card-sub',style:{lineHeight:'28px'}},'⭐'),ptsInp,lblInp,delBtn].forEach(n=>row1.appendChild(n));
      card.appendChild(row1); card.appendChild(typeSel);
      winCfgEl.appendChild(card);
    });
    const addBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'4px'}},'+ Bedingung hinzufügen');
    addBtn.addEventListener('click',()=>{
      const c2=KARMA.getCfg();
      c2.winConditions.push({id:'w'+Date.now(),pts:50,label:'Neu',type:'unlock',description:''});
      KARMA.saveCfg(c2); renderWinCfg(); renderWinConditions(KARMA.getPoints());
    });
    winCfgEl.appendChild(addBtn);
  };
  renderWinCfg();
  body.appendChild(winCfgEl);

  // ══ LOG ════════════════════════════════════════════════════
  body.appendChild(UI.section('📋 Karma-Log'));
  const log=DB.get('karmaLog',[]).slice(0,15);
  if(!log.length){body.appendChild(el('div',{class:'section-note'},'Noch keine Einträge.'));}
  log.forEach(e=>{
    const sign=e.pts>0?'+':' ';
    body.appendChild(el('div',{class:'card-row',style:{marginBottom:'4px'}},
      el('span',{style:{color:e.pts>0?'#4ade80':'#ff6680',fontFamily:'var(--mono, monospace)',fontSize:'11px',minWidth:'36px'}},sign+e.pts),
      el('span',{style:{fontSize:'10px',color:'var(--txt2)',flex:'1'}},e.reason||'?'),
      el('span',{style:{fontSize:'9px',color:'var(--txt3)'}},new Date(e.timestamp).toLocaleTimeString()),
    ));
  });

  // Refresh helper
  const refreshPts=()=>{
    const p=KARMA.getPoints();
    ptsEl.textContent=String(p);
    barEl.querySelector('.prog-fill').style.width=Math.min(100,p/maxPts*100)+'%';
    renderWinConditions(p);
  };

  BCIM.on('karmaPointsChanged',()=>{ if(document.getElementById('bcim-root'))refreshPts(); });

  return body;
};
