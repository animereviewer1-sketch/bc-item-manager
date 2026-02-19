// ── BCIM / tab-games.js (v3.1) ────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_GAMES = () => {
  const {el, UI, S, BC, DB, setStatus, SLOT_LABELS, SLOT_ORDER, AUTO} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ══ WÜRFEL ═══════════════════════════════════════════════
  body.appendChild(UI.section('🎲 Würfel-System'));
  let diceConfig = DB.get('diceConfig', {
    faces: [
      {face:1, label:'Arme',   group:'ItemArms',  assetPool:[], usePool:false},
      {face:2, label:'Mund',   group:'ItemMouth', assetPool:[], usePool:false},
      {face:3, label:'Beine',  group:'ItemLegs',  assetPool:[], usePool:false},
      {face:4, label:'Kopf',   group:'ItemHead',  assetPool:[], usePool:false},
      {face:5, label:'Augen',  group:'ItemEyes',  assetPool:[], usePool:false},
      {face:6, label:'Frei!',  group:'',          assetPool:[], usePool:false},
    ],
    chatAnnounce: true,
  });

  const diceResultEl = el('div',{class:'roulette-result',style:{fontSize:'28px'}},'—');
  body.appendChild(diceResultEl);
  const rollBtn = el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'6px'}},'🎲 Würfeln!');
  rollBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    const face = Math.floor(Math.random()*6)+1;
    const cfg  = diceConfig.faces.find(f=>f.face===face)||{label:'?',group:''};
    const icons = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    let c=0; const anim=setInterval(()=>{
      diceResultEl.textContent=icons[Math.floor(Math.random()*6)];
      if(++c>10){clearInterval(anim);
        diceResultEl.textContent=icons[face-1]+' '+face;
        if(cfg.group){
          const fam=S.char.AssetFamily||'Female3DCG';
          const pool=cfg.usePool&&cfg.assetPool?.length?cfg.assetPool:null;
          const allAssets=BC.getAssetsForGroup(fam,cfg.group);
          let asset=null;
          if(pool?.length){
            const name=pool[Math.floor(Math.random()*pool.length)];
            asset=allAssets.find(a=>a.Name===name)||allAssets[Math.floor(Math.random()*allAssets.length)];
          } else { asset=allAssets[Math.floor(Math.random()*allAssets.length)]; }
          if(asset) BC.applyItem(S.char,cfg.group,asset,undefined,undefined,undefined);
        }
        if(diceConfig.chatAnnounce) BC.sendChat('🎲 '+face+' gewürfelt → '+cfg.label);
        setStatus('Würfel: '+face+' → '+cfg.label,false);
      }
    },80);
  });
  body.appendChild(rollBtn);

  // Config for each face
  const diceConfigEl=el('div');
  const renderDiceFaces=()=>{
    diceConfigEl.innerHTML='';
    diceConfig.faces.forEach((face,i)=>{
      const card=el('div',{class:'card',style:{marginBottom:'5px'}});
      const head=el('div',{style:{display:'flex',gap:'6px',alignItems:'center',marginBottom:'5px'}});
      head.appendChild(el('span',{style:{fontSize:'16px'}},['⚀','⚁','⚂','⚃','⚄','⚅'][i]));
      const lblInp=el('input',{type:'text',class:'bi',value:face.label,placeholder:'Label',style:{flex:'1'}});
      lblInp.addEventListener('input',e=>{face.label=e.target.value;DB.set('diceConfig',diceConfig);});
      const grpSel=el('select',{class:'bsel',style:{flex:'1'}});
      grpSel.appendChild(el('option',{value:''},'Nichts'));
      SLOT_ORDER.forEach(g=>{const o=el('option',{value:g},SLOT_LABELS[g]||g);if(g===face.group)o.selected=true;grpSel.appendChild(o);});
      grpSel.addEventListener('change',e=>{face.group=e.target.value;DB.set('diceConfig',diceConfig);renderDiceFaces();});
      head.appendChild(lblInp); head.appendChild(grpSel);
      card.appendChild(head);

      // Pool config
      if(face.group){
        const poolToggle=UI.toggle('Item-Pool verwenden (spezifische Items)',face.usePool,v=>{face.usePool=v;DB.set('diceConfig',diceConfig);renderDiceFaces();});
        card.appendChild(poolToggle);
        if(face.usePool){
          card.appendChild(el('div',{class:'section-note',style:{marginBottom:'4px'}},'Items in Pool (leer = alle Items des Slots):'));
          // Show existing pool items
          const poolWrap=el('div',{class:'btags',style:{marginBottom:'4px'}});
          (face.assetPool||[]).forEach((name,j)=>{
            const pill=el('button',{class:'btag on'},name.replace(/([A-Z])/g,' $1').trim());
            pill.addEventListener('click',()=>{face.assetPool.splice(j,1);DB.set('diceConfig',diceConfig);renderDiceFaces();});
            poolWrap.appendChild(pill);
          });
          card.appendChild(poolWrap);
          // Add item to pool
          const addRow=el('div',{style:{display:'flex',gap:'4px'}});
          const fam=S.char?.AssetFamily||'Female3DCG';
          const assets=BC.getAssetsForGroup(fam,face.group);
          const addSel=el('select',{class:'bsel',style:{flex:'1'}});
          addSel.appendChild(el('option',{value:''},'Item hinzufügen...'));
          assets.forEach(a=>addSel.appendChild(el('option',{value:a.Name},a.Name.replace(/([A-Z])/g,' $1').trim())));
          const addBtn=el('button',{class:'sbtn sbtn-p'},'+ Add');
          addBtn.addEventListener('click',()=>{
            if(!addSel.value)return;
            if(!(face.assetPool||[]).includes(addSel.value)){(face.assetPool=face.assetPool||[]).push(addSel.value);}
            DB.set('diceConfig',diceConfig);renderDiceFaces();
          });
          addRow.appendChild(addSel); addRow.appendChild(addBtn);
          card.appendChild(addRow);
        }
      }
      diceConfigEl.appendChild(card);
    });
  };
  renderDiceFaces();
  body.appendChild(diceConfigEl);
  body.appendChild(UI.toggle('Chat-Ansage',diceConfig.chatAnnounce,v=>{diceConfig.chatAnnounce=v;DB.set('diceConfig',diceConfig);}));

  // ══ ROULETTE ══════════════════════════════════════════════
  body.appendChild(UI.section('🎡 Roulette-Rad'));

  const getRouletteItems=()=>DB.get('rouletteItems',[
    {id:'r1',label:'Handschellen',     group:'ItemArms',  assetPool:[],usePool:false,weight:3},
    {id:'r2',label:'Knebel',           group:'ItemMouth', assetPool:[],usePool:false,weight:3},
    {id:'r3',label:'Augenbinde',       group:'ItemHead',  assetPool:[],usePool:false,weight:2},
    {id:'r4',label:'Fußfesseln',       group:'ItemLegs',  assetPool:[],usePool:false,weight:2},
    {id:'r5',label:'Nichts ✓',         group:'',          assetPool:[],usePool:false,weight:2},
    {id:'r6',label:'ALLES FREI! 🔓',   group:'ALL',       assetPool:[],usePool:false,weight:1},
  ]);

  const rouletteResultEl=el('div',{class:'roulette-result'},'—');
  body.appendChild(rouletteResultEl);
  const spinBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'6px'}},'🎡 Drehen!');
  spinBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    const items=getRouletteItems(); if(!items.length) return;
    const total=items.reduce((s,i)=>s+i.weight,0);
    let rand=Math.random()*total, chosen=items[items.length-1];
    for(const item of items){rand-=item.weight;if(rand<=0){chosen=item;break;}}
    let c=0; const anim=setInterval(()=>{
      const ri=items[Math.floor(Math.random()*items.length)];
      rouletteResultEl.textContent='⟳ '+ri.label;
      if(++c>12){clearInterval(anim);
        rouletteResultEl.textContent='→ '+chosen.label;
        if(chosen.group==='ALL'){
          BC.getGroups(S.char.AssetFamily||'Female3DCG').forEach(g=>BC.removeItem(S.char,g.Name));
        } else if(chosen.group){
          const fam=S.char.AssetFamily||'Female3DCG';
          const allAssets=BC.getAssetsForGroup(fam,chosen.group);
          let asset=null;
          if(chosen.usePool&&chosen.assetPool?.length){
            const name=chosen.assetPool[Math.floor(Math.random()*chosen.assetPool.length)];
            asset=allAssets.find(a=>a.Name===name)||allAssets[Math.floor(Math.random()*allAssets.length)];
          } else { asset=allAssets[Math.floor(Math.random()*allAssets.length)]; }
          if(asset) BC.applyItem(S.char,chosen.group,asset,undefined,undefined,undefined);
        }
        BC.sendChat('🎡 Roulette: → '+chosen.label);
        setStatus('Roulette: '+chosen.label,false);
      }
    },100);
  });
  body.appendChild(spinBtn);

  // Roulette items list
  const rouletteListEl=el('div');
  const renderRouletteList=()=>{
    rouletteListEl.innerHTML='';
    const items=getRouletteItems();
    items.forEach((item,i)=>{
      const card=el('div',{class:'card',style:{marginBottom:'5px'}});
      const row1=el('div',{style:{display:'flex',gap:'4px',marginBottom:'4px'}});
      const lblInp=el('input',{type:'text',class:'bi',value:item.label,placeholder:'Label',style:{flex:'2'}});
      lblInp.addEventListener('input',e=>{item.label=e.target.value;DB.set('rouletteItems',items);});
      const grpSel=el('select',{class:'bsel',style:{flex:'1'}});
      [['','Nichts'],['ALL','Alle frei'],...SLOT_ORDER.map(g=>[g,SLOT_LABELS[g]||g])].forEach(([v,l])=>{
        const o=el('option',{value:v},l);if(v===item.group)o.selected=true;grpSel.appendChild(o);
      });
      grpSel.addEventListener('change',e=>{item.group=e.target.value;DB.set('rouletteItems',items);renderRouletteList();});
      const wInp=el('input',{type:'number',class:'bi',value:item.weight,placeholder:'W',style:{flex:'0 0 46px'},min:'1'});
      wInp.addEventListener('input',e=>{item.weight=parseFloat(e.target.value)||1;DB.set('rouletteItems',items);});
      const delBtn=el('button',{class:'sbtn sbtn-d'},'✕');
      delBtn.addEventListener('click',()=>{items.splice(i,1);DB.set('rouletteItems',items);renderRouletteList();});
      [lblInp,grpSel,el('span',{class:'card-sub',style:{lineHeight:'28px'}},'W:'),wInp,delBtn].forEach(n=>row1.appendChild(n));
      card.appendChild(row1);

      // Pool per item
      if(item.group&&item.group!=='ALL'){
        const poolToggle=UI.toggle('Item-Pool',item.usePool||false,v=>{item.usePool=v;DB.set('rouletteItems',items);renderRouletteList();});
        card.appendChild(poolToggle);
        if(item.usePool){
          const pw=el('div',{class:'btags',style:{marginBottom:'4px'}});
          (item.assetPool||[]).forEach((name,j)=>{
            const pill=el('button',{class:'btag on'},name.replace(/([A-Z])/g,' $1').trim());
            pill.addEventListener('click',()=>{item.assetPool.splice(j,1);DB.set('rouletteItems',items);renderRouletteList();});
            pw.appendChild(pill);
          });
          card.appendChild(pw);
          const fam=S.char?.AssetFamily||'Female3DCG';
          const addSel=el('select',{class:'bsel',style:{marginBottom:'4px'}});
          addSel.appendChild(el('option',{value:''},'Item hinzufügen...'));
          BC.getAssetsForGroup(fam,item.group).forEach(a=>addSel.appendChild(el('option',{value:a.Name},a.Name.replace(/([A-Z])/g,' $1').trim())));
          const addBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%'}},'+ Hinzufügen');
          addBtn.addEventListener('click',()=>{
            if(!addSel.value)return;
            (item.assetPool=item.assetPool||[]).push(addSel.value);
            DB.set('rouletteItems',items);renderRouletteList();
          });
          const addRow2=el('div',{style:{display:'flex',gap:'4px'}});
          addRow2.appendChild(addSel); addRow2.appendChild(addBtn);
          card.appendChild(addRow2);
        }
      }
      rouletteListEl.appendChild(card);
    });
    const addBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'3px'}},'+ Eintrag hinzufügen');
    addBtn.addEventListener('click',()=>{
      items.push({id:'r'+Date.now(),label:'Neu',group:'ItemArms',assetPool:[],usePool:false,weight:1});
      DB.set('rouletteItems',items);renderRouletteList();
    });
    rouletteListEl.appendChild(addBtn);
  };
  renderRouletteList();
  body.appendChild(rouletteListEl);

  // ══ STRAFEN ═══════════════════════════════════════════════
  body.appendChild(UI.section('⚡ Strafensystem'));
  const getPenalties=()=>DB.get('penalties',[
    {id:'p1',name:'Leicht',  items:[{group:'ItemMouth',assetPool:[],usePool:false}], chatMsg:'😬 bekommt eine leichte Strafe!'},
    {id:'p2',name:'Mittel',  items:[{group:'ItemMouth',assetPool:[],usePool:false},{group:'ItemArms',assetPool:[],usePool:false}], chatMsg:'😳 Mittlere Strafe!'},
    {id:'p3',name:'Schwer',  items:[{group:'ItemMouth',assetPool:[],usePool:false},{group:'ItemArms',assetPool:[],usePool:false},{group:'ItemLegs',assetPool:[],usePool:false}], chatMsg:'😱 Schwere Strafe!'},
  ]);

  const penResultEl=el('div',{class:'card-sub',style:{margin:'5px 0',textAlign:'center'}});
  body.appendChild(penResultEl);
  const penBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%',marginBottom:'6px'}},'⚡ Zufällige Strafe!');
  penBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    const pens=getPenalties(); if(!pens.length){setStatus('Keine Strafen',true);return;}
    const chosen=pens[Math.floor(Math.random()*pens.length)];
    penResultEl.textContent='Strafe: '+chosen.name;
    const fam=S.char.AssetFamily||'Female3DCG';
    chosen.items.forEach(slot=>{
      const allAssets=BC.getAssetsForGroup(fam,slot.group);
      let asset=null;
      if(slot.usePool&&slot.assetPool?.length){
        const name=slot.assetPool[Math.floor(Math.random()*slot.assetPool.length)];
        asset=allAssets.find(a=>a.Name===name)||allAssets[Math.floor(Math.random()*allAssets.length)];
      } else { asset=allAssets[Math.floor(Math.random()*allAssets.length)]; }
      if(asset) BC.applyItem(S.char,slot.group,asset);
    });
    if(chosen.chatMsg) BC.sendChat(chosen.chatMsg);
    setStatus('Strafe: '+chosen.name,false);
  });
  body.appendChild(penBtn);

  const penListEl=el('div');
  const renderPenalties=()=>{
    penListEl.innerHTML='';
    const pens=getPenalties();
    pens.forEach((pen,pi)=>{
      const card=el('div',{class:'card',style:{marginBottom:'6px'}});
      const nameInp=el('input',{type:'text',class:'bi',value:pen.name,placeholder:'Strafe-Name',style:{marginBottom:'4px'}});
      nameInp.addEventListener('input',e=>{pen.name=e.target.value;DB.set('penalties',pens);});
      const chatInp=el('input',{type:'text',class:'bi',value:pen.chatMsg||'',placeholder:'Chat-Nachricht...',style:{marginBottom:'6px'}});
      chatInp.addEventListener('input',e=>{pen.chatMsg=e.target.value;DB.set('penalties',pens);});
      card.appendChild(nameInp); card.appendChild(chatInp);

      // Slots / items
      card.appendChild(el('div',{class:'card-sub',style:{marginBottom:'4px'}},'Slots & Items:'));
      (pen.items||[]).forEach((slot,si)=>{
        const slotCard=el('div',{style:{background:'var(--bg3)',borderRadius:'7px',padding:'6px',marginBottom:'4px',border:'1px solid var(--brd)'}});
        const slotRow=el('div',{style:{display:'flex',gap:'4px',marginBottom:'4px'}});
        const slotSel=el('select',{class:'bsel',style:{flex:'1'}});
        SLOT_ORDER.forEach(g=>{const o=el('option',{value:g},SLOT_LABELS[g]||g);if(g===slot.group)o.selected=true;slotSel.appendChild(o);});
        slotSel.addEventListener('change',e=>{slot.group=e.target.value;DB.set('penalties',pens);renderPenalties();});
        const rmBtn=el('button',{class:'sbtn sbtn-d'},'✕');
        rmBtn.addEventListener('click',()=>{pen.items.splice(si,1);DB.set('penalties',pens);renderPenalties();});
        slotRow.appendChild(slotSel); slotRow.appendChild(rmBtn);
        slotCard.appendChild(slotRow);
        // Pool
        const poolTog=UI.toggle('Item-Pool',slot.usePool||false,v=>{slot.usePool=v;DB.set('penalties',pens);renderPenalties();});
        slotCard.appendChild(poolTog);
        if(slot.usePool){
          const pw2=el('div',{class:'btags',style:{marginBottom:'4px'}});
          (slot.assetPool||[]).forEach((name,j)=>{
            const pill=el('button',{class:'btag on'},name.replace(/([A-Z])/g,' $1').trim());
            pill.addEventListener('click',()=>{slot.assetPool.splice(j,1);DB.set('penalties',pens);renderPenalties();});
            pw2.appendChild(pill);
          });
          slotCard.appendChild(pw2);
          const fam=S.char?.AssetFamily||'Female3DCG';
          const addSel2=el('select',{class:'bsel',style:{flex:'1'}});
          addSel2.appendChild(el('option',{value:''},'Item...'));
          BC.getAssetsForGroup(fam,slot.group).forEach(a=>addSel2.appendChild(el('option',{value:a.Name},a.Name.replace(/([A-Z])/g,' $1').trim())));
          const addB2=el('button',{class:'sbtn sbtn-p'},'+ Add');
          addB2.addEventListener('click',()=>{if(!addSel2.value)return;(slot.assetPool=slot.assetPool||[]).push(addSel2.value);DB.set('penalties',pens);renderPenalties();});
          const aRow2=el('div',{style:{display:'flex',gap:'4px'}});
          aRow2.appendChild(addSel2); aRow2.appendChild(addB2);
          slotCard.appendChild(aRow2);
        }
        card.appendChild(slotCard);
      });

      const addSlotBtn=el('button',{class:'sbtn',style:{width:'100%',marginBottom:'5px'}},'+ Slot hinzufügen');
      addSlotBtn.addEventListener('click',()=>{
        (pen.items=pen.items||[]).push({group:'ItemArms',assetPool:[],usePool:false});
        DB.set('penalties',pens);renderPenalties();
      });
      const delPenBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%'}},'Strafe löschen');
      delPenBtn.addEventListener('click',()=>{pens.splice(pi,1);DB.set('penalties',pens);renderPenalties();});
      card.appendChild(addSlotBtn); card.appendChild(delPenBtn);
      penListEl.appendChild(card);
    });
    const addPenBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'4px'}},'+ Neue Strafe');
    addPenBtn.addEventListener('click',()=>{
      pens.push({id:'p'+Date.now(),name:'Neue Strafe',items:[],chatMsg:'bekommt eine Strafe!'});
      DB.set('penalties',pens);renderPenalties();
    });
    penListEl.appendChild(addPenBtn);
  };
  renderPenalties();
  body.appendChild(penListEl);

  // ══ LOOT-BOX ══════════════════════════════════════════════
  body.appendChild(UI.section('📦 Loot-Box'));
  const rarities=[
    {key:'common',   label:'Common',    color:'#888',    pct:60},
    {key:'rare',     label:'Rare',      color:'#60a5fa', pct:25},
    {key:'epic',     label:'Epic',      color:'#c084fc', pct:12},
    {key:'legendary',label:'Legendary', color:'#fbbf24', pct:3},
  ];
  const getLootCfg=()=>DB.get('lootCfg',{
    common:    {slots:[{group:'ItemArms',assetPool:[],usePool:false},{group:'ItemMouth',assetPool:[],usePool:false}]},
    rare:      {slots:[{group:'ItemArms',assetPool:[],usePool:false},{group:'ItemLegs', assetPool:[],usePool:false}]},
    epic:      {slots:[{group:'ItemArms',assetPool:[],usePool:false},{group:'ItemEyes', assetPool:[],usePool:false}]},
    legendary: {slots:[{group:'ItemMouth',assetPool:[],usePool:false},{group:'ItemLegs',assetPool:[],usePool:false},{group:'ItemArms',assetPool:[],usePool:false}]},
  });

  const lootResultEl=el('div',{class:'roulette-result'},'—');
  body.appendChild(lootResultEl);
  const openBoxBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginBottom:'6px'}},'📦 Loot-Box öffnen!');
  openBoxBtn.addEventListener('click',()=>{
    if(!S.char){setStatus('Kein Spieler',true);return;}
    const lootCfg=getLootCfg();
    const roll=Math.random()*100; let cum=0, rarity=rarities[0];
    for(const r of rarities){cum+=r.pct;if(roll<cum){rarity=r;break;}}
    const tier=lootCfg[rarity.key]||{slots:[]};
    const fam=S.char.AssetFamily||'Female3DCG';
    const validSlots=tier.slots.filter(s=>s.group&&BC.getAssetsForGroup(fam,s.group).length>0);
    if(!validSlots.length){setStatus('Keine Items konfiguriert für '+rarity.label,true);return;}
    const slot=validSlots[Math.floor(Math.random()*validSlots.length)];
    const allAssets=BC.getAssetsForGroup(fam,slot.group);
    let asset=null;
    if(slot.usePool&&slot.assetPool?.length){
      const name=slot.assetPool[Math.floor(Math.random()*slot.assetPool.length)];
      asset=allAssets.find(a=>a.Name===name)||allAssets[Math.floor(Math.random()*allAssets.length)];
    } else { asset=allAssets[Math.floor(Math.random()*allAssets.length)]; }
    let c=0; const anim=setInterval(()=>{
      lootResultEl.textContent=['📦','💫','✨','❓'][c%4];
      if(++c>10){clearInterval(anim);
        const assetName=(asset?.Name||'?').replace(/([A-Z])/g,' $1').trim();
        lootResultEl.innerHTML='';
        lootResultEl.appendChild(el('div',{style:{color:rarity.color,fontWeight:'700'}},'★ '+rarity.label+'!'));
        lootResultEl.appendChild(el('div',{style:{fontSize:'12px',color:'var(--txt)',marginTop:'3px'}},
          (SLOT_LABELS[slot.group]||slot.group)+': '+assetName));
        if(asset) BC.applyItem(S.char,slot.group,asset);
        BC.sendChat('📦 Loot-Box ['+rarity.label+']: '+assetName+'!');
        setStatus('['+rarity.label+'] '+assetName,false);
      }
    },120);
  });
  body.appendChild(openBoxBtn);

  // Rarity distribution
  rarities.forEach(r=>{
    body.appendChild(el('div',{class:'hbar'},
      el('div',{class:'hbar-label',style:{color:r.color}},r.label),
      el('div',{class:'hbar-track'},el('div',{class:'hbar-fill',style:{width:r.pct+'%',background:r.color}})),
      el('div',{class:'hbar-val'},r.pct+'%'),
    ));
  });

  // Loot pool configuration per rarity
  body.appendChild(UI.section('🔧 Loot-Pool konfigurieren'));
  const lootCfgEl=el('div');
  const renderLootCfg=()=>{
    lootCfgEl.innerHTML='';
    const lootCfg=getLootCfg();
    rarities.forEach(rar=>{
      const tier=lootCfg[rar.key]||(lootCfg[rar.key]={slots:[]});
      const card=el('div',{class:'card',style:{marginBottom:'6px',borderColor:rar.color+'44'}});
      card.appendChild(el('div',{class:'card-title',style:{color:rar.color}},'★ '+rar.label+' ('+rar.pct+'%)'));
      (tier.slots||[]).forEach((slot,si)=>{
        const sRow=el('div',{style:{display:'flex',gap:'4px',marginBottom:'4px',alignItems:'center'}});
        const slotSel=el('select',{class:'bsel',style:{flex:'1'}});
        SLOT_ORDER.forEach(g=>{const o=el('option',{value:g},SLOT_LABELS[g]||g);if(g===slot.group)o.selected=true;slotSel.appendChild(o);});
        slotSel.addEventListener('change',e=>{slot.group=e.target.value;DB.set('lootCfg',lootCfg);renderLootCfg();});
        const rBtn=el('button',{class:'sbtn sbtn-d'},'✕');
        rBtn.addEventListener('click',()=>{tier.slots.splice(si,1);DB.set('lootCfg',lootCfg);renderLootCfg();});
        sRow.appendChild(slotSel); sRow.appendChild(rBtn);
        card.appendChild(sRow);
        // Pool
        const poolTog2=UI.toggle('Item-Pool',slot.usePool||false,v=>{slot.usePool=v;DB.set('lootCfg',lootCfg);renderLootCfg();});
        card.appendChild(poolTog2);
        if(slot.usePool){
          const pw=el('div',{class:'btags',style:{marginBottom:'4px'}});
          (slot.assetPool||[]).forEach((name,j)=>{
            const pill=el('button',{class:'btag on'},name.replace(/([A-Z])/g,' $1').trim());
            pill.addEventListener('click',()=>{slot.assetPool.splice(j,1);DB.set('lootCfg',lootCfg);renderLootCfg();});
            pw.appendChild(pill);
          });
          card.appendChild(pw);
          const fam=S.char?.AssetFamily||'Female3DCG';
          const aSel=el('select',{class:'bsel',style:{flex:'1'}});
          aSel.appendChild(el('option',{value:''},'Item...'));
          BC.getAssetsForGroup(fam,slot.group).forEach(a=>aSel.appendChild(el('option',{value:a.Name},a.Name.replace(/([A-Z])/g,' $1').trim())));
          const aB=el('button',{class:'sbtn sbtn-p'},'+ Add');
          aB.addEventListener('click',()=>{if(!aSel.value)return;(slot.assetPool=slot.assetPool||[]).push(aSel.value);DB.set('lootCfg',lootCfg);renderLootCfg();});
          const ar=el('div',{style:{display:'flex',gap:'4px'}});
          ar.appendChild(aSel); ar.appendChild(aB); card.appendChild(ar);
        }
      });
      const addSlot=el('button',{class:'sbtn',style:{width:'100%',marginTop:'3px'}},'+ Slot hinzufügen');
      addSlot.addEventListener('click',()=>{(tier.slots=tier.slots||[]).push({group:'ItemArms',assetPool:[],usePool:false});DB.set('lootCfg',lootCfg);renderLootCfg();});
      card.appendChild(addSlot);
      lootCfgEl.appendChild(card);
    });
  };
  renderLootCfg();
  body.appendChild(lootCfgEl);

  return body;
};
