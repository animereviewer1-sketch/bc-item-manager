// ── BCIM / tabs / tab-games.js ────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_GAMES = () => {
  const {el,UI,S,BC,DB,setStatus,SLOT_LABELS,SLOT_ORDER,AUTO} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ══ WÜRFEL-SYSTEM ═════════════════════════════════════════
  body.appendChild(UI.section('🎲 Würfel-System'));
  body.appendChild(el('div',{class:'section-note'},'Würfelergebnis bestimmt welches Item angelegt wird. Konfiguriere welche Items pro Augenzahl gelten.'));

  const diceConfig = DB.get('diceConfig', {
    faces: [
      {face:1,group:'ItemArms',  assetName:'', label:'Arme'},
      {face:2,group:'ItemMouth', assetName:'', label:'Mund'},
      {face:3,group:'ItemLegs',  assetName:'', label:'Beine'},
      {face:4,group:'ItemHead',  assetName:'', label:'Kopf'},
      {face:5,group:'ItemEyes',  assetName:'', label:'Augen'},
      {face:6,group:'',          assetName:'', label:'Frei! (nichts)'},
    ],
    chatAnnounce: true,
    targetSelf: true,
  });

  const diceResultEl = el('div',{class:'roulette-result',style:{fontSize:'32px'}},'—');
  body.appendChild(diceResultEl);

  const rollBtn = el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'8px'}},'🎲 Würfeln!');
  rollBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    const face = Math.floor(Math.random()*6)+1;
    const cfg = diceConfig.faces.find(f=>f.face===face)||{label:'?',group:'',assetName:''};
    // Animate
    let animCount=0;
    const anim=setInterval(()=>{
      diceResultEl.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][Math.floor(Math.random()*6)];
      if(++animCount>8){clearInterval(anim);
        diceResultEl.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][face-1]+' '+face;
        if(cfg.group){
          const fam=S.char.AssetFamily||'Female3DCG';
          const asset=cfg.assetName
            ? BCIM.BC.getAssetsForGroup(fam,cfg.group).find(a=>a.Name===cfg.assetName)
            : BCIM.BC.getAssetsForGroup(fam,cfg.group)[Math.floor(Math.random()*BCIM.BC.getAssetsForGroup(fam,cfg.group).length)];
          if(asset){BCIM.BC.applyItem(S.char,cfg.group,asset,undefined,undefined,undefined);}
        }
        if(diceConfig.chatAnnounce){BC.sendChat(`🎲 ${face} gewürfelt → ${cfg.label}`);}
        setStatus(`Würfel: ${face} → ${cfg.label}`,false);
      }
    },80);
  });
  body.appendChild(rollBtn);

  // Würfel-Config
  const diceConfigEl=el('div');
  diceConfig.faces.forEach((face,i)=>{
    const row=el('div',{style:{display:'flex',gap:'4px',marginBottom:'4px',alignItems:'center'}});
    const numEl=el('span',{style:{fontSize:'16px',minWidth:'22px'}},['⚀','⚁','⚂','⚃','⚄','⚅'][i]);
    const grpSel=el('select',{class:'bsel',style:{flex:'1'}});
    grpSel.appendChild(el('option',{value:''},'Nichts'));
    SLOT_ORDER.forEach(g=>{const o=el('option',{value:g},SLOT_LABELS[g]||g);if(g===face.group)o.selected=true;grpSel.appendChild(o);});
    grpSel.addEventListener('change',e=>{face.group=e.target.value;DB.set('diceConfig',diceConfig);});
    const lblInp=el('input',{type:'text',class:'bi',placeholder:'Label',value:face.label,style:{flex:'1'}});
    lblInp.addEventListener('input',e=>{face.label=e.target.value;DB.set('diceConfig',diceConfig);});
    [numEl,grpSel,lblInp].forEach(n=>row.appendChild(n));
    diceConfigEl.appendChild(row);
  });
  body.appendChild(diceConfigEl);
  body.appendChild(UI.toggle('Chat-Ansage',diceConfig.chatAnnounce,v=>{diceConfig.chatAnnounce=v;DB.set('diceConfig',diceConfig);}));

  // ══ ROULETTE-RAD ══════════════════════════════════════════
  body.appendChild(UI.section('🎡 Roulette-Rad'));
  body.appendChild(el('div',{class:'section-note'},'Definiere Items/Aktionen für das Roulette. Beim Drehen wird zufällig eine gewählt.'));

  let rouletteItems = DB.get('rouletteItems',[
    {id:'r1',label:'Handschellen',group:'ItemArms',assetName:'',weight:3},
    {id:'r2',label:'Knebel',group:'ItemMouth',assetName:'',weight:3},
    {id:'r3',label:'Augenbinde',group:'ItemHead',assetName:'',weight:3},
    {id:'r4',label:'Fußfesseln',group:'ItemLegs',assetName:'',weight:2},
    {id:'r5',label:'Nichts',group:'',assetName:'',weight:2},
    {id:'r6',label:'Alles frei!',group:'ALL',assetName:'',weight:1},
  ]);

  const rouletteResultEl=el('div',{class:'roulette-result'},'—');
  body.appendChild(rouletteResultEl);

  const spinBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'8px'}},'🎡 Drehen!');
  spinBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    const items=DB.get('rouletteItems',rouletteItems);
    if(!items.length){setStatus('Keine Roulette-Items',true);return;}
    // Weighted random
    const totalWeight=items.reduce((s,i)=>s+i.weight,0);
    let rand=Math.random()*totalWeight;
    let chosen=items[items.length-1];
    for(const item of items){rand-=item.weight;if(rand<=0){chosen=item;break;}}
    // Animate
    let count=0;
    const anim=setInterval(()=>{
      const ri=items[Math.floor(Math.random()*items.length)];
      rouletteResultEl.textContent='⟳ '+ri.label;
      if(++count>12){clearInterval(anim);
        rouletteResultEl.textContent='→ '+chosen.label;
        if(chosen.group==='ALL'){
          const groups=BCIM.BC.getGroups(S.char.AssetFamily||'Female3DCG');
          groups.forEach(g=>BCIM.BC.removeItem(S.char,g.Name));
          setStatus('Alles frei!',false);
        } else if(chosen.group){
          const fam=S.char.AssetFamily||'Female3DCG';
          const assets=BCIM.BC.getAssetsForGroup(fam,chosen.group);
          const asset=chosen.assetName?assets.find(a=>a.Name===chosen.assetName):assets[Math.floor(Math.random()*assets.length)];
          if(asset)BCIM.BC.applyItem(S.char,chosen.group,asset,undefined,undefined,undefined);
        }
        BC.sendChat(`🎡 Roulette: → ${chosen.label}`);
        setStatus('Roulette: '+chosen.label,false);
      }
    },100);
  });
  body.appendChild(spinBtn);

  // Roulette item list
  const rouletteListEl=el('div');
  const renderRouletteItems=()=>{
    rouletteListEl.innerHTML='';
    const items=DB.get('rouletteItems',rouletteItems);
    items.forEach((item,i)=>{
      const row=el('div',{style:{display:'flex',gap:'4px',marginBottom:'4px'}});
      const lblInp=el('input',{type:'text',class:'bi',value:item.label,placeholder:'Label',style:{flex:'2'}});
      lblInp.addEventListener('input',e=>{item.label=e.target.value;DB.set('rouletteItems',items);});
      const wInp=el('input',{type:'number',class:'bi',value:item.weight,placeholder:'Gewicht',style:{flex:'0 0 50px'}});
      wInp.addEventListener('input',e=>{item.weight=parseFloat(e.target.value)||1;DB.set('rouletteItems',items);});
      const delBtn=el('button',{class:'sbtn sbtn-d'},'✕');
      delBtn.addEventListener('click',()=>{items.splice(i,1);DB.set('rouletteItems',items);renderRouletteItems();});
      [lblInp,el('span',{class:'card-sub',style:{lineHeight:'28px'}},'W:'),wInp,delBtn].forEach(n=>row.appendChild(n));
      rouletteListEl.appendChild(row);
    });
    const addBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'3px'}},'+ Item hinzufügen');
    addBtn.addEventListener('click',()=>{
      const items2=DB.get('rouletteItems',rouletteItems);
      items2.push({id:'r'+Date.now(),label:'Neu',group:'',assetName:'',weight:1});
      DB.set('rouletteItems',items2); renderRouletteItems();
    });
    rouletteListEl.appendChild(addBtn);
  };
  renderRouletteItems();
  body.appendChild(rouletteListEl);

  // ══ STRAFEN-SYSTEM ════════════════════════════════════════
  body.appendChild(UI.section('⚡ Strafensystem'));
  body.appendChild(el('div',{class:'section-note'},'Definiere Strafe-Kombinationen. Per Knopfdruck oder Chat-Trigger wird zufällig eine gezogen.'));

  let penalties=DB.get('penalties',[
    {id:'p1',name:'Leichte Strafe',slots:['ItemMouth'],chatMsg:'😬 bekommt eine leichte Strafe!'},
    {id:'p2',name:'Mittlere Strafe',slots:['ItemMouth','ItemArms'],chatMsg:'😳 bekommt eine mittlere Strafe!'},
    {id:'p3',name:'Schwere Strafe',slots:['ItemMouth','ItemArms','ItemLegs','ItemEyes'],chatMsg:'😱 bekommt eine schwere Strafe!'},
  ]);

  const penResultEl=el('div',{class:'card-sub',style:{margin:'5px 0'}});
  body.appendChild(penResultEl);

  const penBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%',marginBottom:'8px'}},'⚡ Zufällige Strafe!');
  penBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    const pens=DB.get('penalties',penalties);
    if(!pens.length){setStatus('Keine Strafen definiert',true);return;}
    const chosen=pens[Math.floor(Math.random()*pens.length)];
    penResultEl.textContent='Strafe: '+chosen.name;
    AUTO.randomRestraints(S.char,{slots:chosen.slots,chatAnnounce:false});
    if(chosen.chatMsg)BC.sendChat(chosen.chatMsg);
    setStatus('Strafe: '+chosen.name,false);
  });
  body.appendChild(penBtn);

  const penListEl=el('div');
  const renderPenalties=()=>{
    penListEl.innerHTML='';
    const pens=DB.get('penalties',penalties);
    pens.forEach((pen,i)=>{
      const card=el('div',{class:'card'});
      const nameInp=el('input',{type:'text',class:'bi',value:pen.name,placeholder:'Strafe-Name',style:{marginBottom:'4px'}});
      nameInp.addEventListener('input',e=>{pen.name=e.target.value;DB.set('penalties',pens);});
      const chatInp=el('input',{type:'text',class:'bi',value:pen.chatMsg||'',placeholder:'Chat-Nachricht...',style:{marginBottom:'4px'}});
      chatInp.addEventListener('input',e=>{pen.chatMsg=e.target.value;DB.set('penalties',pens);});
      const slotTags=el('div',{class:'btags'});
      SLOT_ORDER.slice(0,10).forEach(g=>{
        const active=pen.slots.includes(g);
        const btn=el('button',{class:'btag'+(active?' on':'')},SLOT_LABELS[g]||g);
        btn.addEventListener('click',()=>{
          const idx=pen.slots.indexOf(g);
          if(idx>=0)pen.slots.splice(idx,1);else pen.slots.push(g);
          btn.classList.toggle('on',pen.slots.includes(g));
          DB.set('penalties',pens);
        });
        slotTags.appendChild(btn);
      });
      const delBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%',marginTop:'5px'}},'Strafe löschen');
      delBtn.addEventListener('click',()=>{pens.splice(i,1);DB.set('penalties',pens);renderPenalties();});
      [nameInp,chatInp,slotTags,delBtn].forEach(n=>card.appendChild(n));
      penListEl.appendChild(card);
    });
    const addBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'3px'}},'+ Strafe hinzufügen');
    addBtn.addEventListener('click',()=>{
      const pens2=DB.get('penalties',penalties);
      pens2.push({id:'p'+Date.now(),name:'Neue Strafe',slots:[],chatMsg:'bekommt eine Strafe!'});
      DB.set('penalties',pens2); renderPenalties();
    });
    penListEl.appendChild(addBtn);
  };
  renderPenalties();
  body.appendChild(penListEl);

  // ══ LOOT-BOX ══════════════════════════════════════════════
  body.appendChild(UI.section('📦 Loot-Box'));
  body.appendChild(el('div',{class:'section-note'},'Öffne eine Box und erhalte ein zufälliges Item nach Seltenheitsstufe.'));

  const rarities=[
    {key:'common',  label:'Common',   color:'#888',   pct:60},
    {key:'rare',    label:'Rare',     color:'#60a5fa',pct:30},
    {key:'epic',    label:'Epic',     color:'#c084fc',pct:8},
    {key:'legendary',label:'Legendary',color:'#fbbf24',pct:2},
  ];

  let lootCfg=DB.get('lootCfg',{
    common:    {groups:['ItemArms','ItemMouth','ItemLegs']},
    rare:      {groups:['ItemArms','ItemMouth','ItemLegs','ItemEyes','ItemHead']},
    epic:      {groups:['ItemArms','ItemMouth','ItemLegs','ItemEyes','ItemHead','ItemTorso']},
    legendary: {groups:['ItemArms','ItemMouth','ItemLegs','ItemEyes','ItemHead','ItemTorso','ItemFeet','ItemHands']},
  });

  const lootResultEl=el('div',{class:'roulette-result'},'—');
  body.appendChild(lootResultEl);

  const openBoxBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'8px'}},'📦 Loot-Box öffnen!');
  openBoxBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    // Roll rarity
    const roll=Math.random()*100;
    let cumulative=0, rarity=rarities[0];
    for(const r of rarities){cumulative+=r.pct;if(roll<cumulative){rarity=r;break;}}
    // Pick random slot and item from rarity tier
    const tier=lootCfg[rarity.key];
    const validGroups=tier.groups.filter(g=>BCIM.BC.getAssetsForGroup(S.char.AssetFamily||'Female3DCG',g).length>0);
    if(!validGroups.length){setStatus('Keine Items verfügbar',true);return;}
    const group=validGroups[Math.floor(Math.random()*validGroups.length)];
    const assets=BCIM.BC.getAssetsForGroup(S.char.AssetFamily||'Female3DCG',group);
    const asset=assets[Math.floor(Math.random()*assets.length)];
    // Animate
    let count=0;
    const anim=setInterval(()=>{
      lootResultEl.innerHTML='';
      lootResultEl.appendChild(el('span',{style:{color:'var(--txt3)',fontSize:'13px'}},['📦','💫','✨','❓'][count%4]));
      if(++count>10){clearInterval(anim);
        const assetName=(asset.Name||'?').replace(/([A-Z])/g,' $1').trim();
        lootResultEl.innerHTML='';
        lootResultEl.appendChild(el('div',{style:{color:rarity.color}},`★ ${rarity.label}!`));
        lootResultEl.appendChild(el('div',{style:{fontSize:'13px',color:'var(--txt)',marginTop:'3px'}},
          `${SLOT_LABELS[group]||group}: ${assetName}`));
        BCIM.BC.applyItem(S.char,group,asset,undefined,undefined,undefined);
        BC.sendChat(`📦 Loot-Box: [${rarity.label}] ${assetName}!`);
        setStatus(`[${rarity.label}] ${assetName}`,false);
      }
    },120);
  });
  body.appendChild(openBoxBtn);

  // Rarity distribution display
  rarities.forEach(r=>{
    body.appendChild(el('div',{class:'hbar'},
      el('div',{class:'hbar-label',style:{color:r.color}},r.label),
      el('div',{class:'hbar-track'},el('div',{class:'hbar-fill',style:{width:r.pct+'%',background:r.color}})),
      el('div',{class:'hbar-val'},r.pct+'%'),
    ));
  });

  return body;
};
