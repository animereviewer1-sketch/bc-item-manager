// ── BCIM / main.js ────────────────────────────────────────
// Entry point – assumes all other modules are loaded

(function() {
  if (document.getElementById('bcim-root')) { document.getElementById('bcim-root').remove(); return; }
  window.BCIM = window.BCIM || {};

  // ── Build CSS ─────────────────────────────────────────────
  BCIM.buildCSS();

  // ── DOM skeleton ─────────────────────────────────────────
  const el = BCIM.el;
  const root    = el('div',{id:'bcim-root'});
  const bar     = el('div',{id:'bcim-bar'},
    el('span',{id:'bcim-logo'},'⬡ BCIM'),
    el('button',{id:'bcim-mini-btn',title:'Mini Mode'},'_'),
    el('button',{id:'bcim-x'},'✕')
  );
  const pbar    = el('div',{id:'bcim-players'});
  const tabs    = el('div',{id:'bcim-tabs'});
  const content = el('div',{id:'bcim-content'});
  const cfgWrap = el('div',{id:'bcim-cfg-wrap',style:{display:'none'}});
  const act     = el('div',{id:'bcim-act',style:{display:'none'}});
  const stEl    = el('div',{id:'bcim-st'});

  [bar,pbar,tabs,content,cfgWrap,act,stEl].forEach(n=>root.appendChild(n));
  document.body.appendChild(root);

  // ── Tab definitions ───────────────────────────────────────
  const TAB_DEFS = [
    {id:'slots',     icon:'👗', tip:'Slots'},
    {id:'body',      icon:'🧍', tip:'Körper'},
    {id:'search',    icon:'🔍', tip:'Suchen'},
    {id:'outfits',   icon:'🎭', tip:'Outfits'},
    {id:'locks',     icon:'🔒', tip:'Locks'},
    {id:'automation',icon:'⏱', tip:'Automation'},
    {id:'chat',      icon:'💬', tip:'Chat'},
    {id:'games',     icon:'🎲', tip:'Spiele'},
    {id:'karma',     icon:'⭐', tip:'Karma'},
    {id:'colors',    icon:'🎨', tip:'Farben'},
    {id:'monitor',   icon:'👁', tip:'Monitor'},
    {id:'rules',     icon:'⚡', tip:'Regeln'},
    {id:'stats',     icon:'📊', tip:'Statistik'},
    {id:'settings',  icon:'⚙️', tip:'Einstellungen'},
  ];
  TAB_DEFS.forEach(t => {
    const b=el('button',{class:`bt${BCIM.S.tab===t.id?' on':''}`,title:t.tip,'data-t':t.id},t.icon);
    tabs.appendChild(b);
  });

  // ── Drag ──────────────────────────────────────────────────
  bar.addEventListener('mousedown',e=>{
    if(e.target.id==='bcim-x'||e.target.id==='bcim-mini-btn') return;
    const r=root.getBoundingClientRect(),ox=e.clientX-r.left,oy=e.clientY-r.top;
    const mv=e2=>{root.style.left=(e2.clientX-ox)+'px';root.style.top=(e2.clientY-oy)+'px';root.style.right='auto';};
    document.addEventListener('mousemove',mv);
    document.addEventListener('mouseup',()=>document.removeEventListener('mousemove',mv),{once:true});
  });
  document.getElementById('bcim-x').addEventListener('click',()=>{
    root.remove();
    BCIM.AUTO?.stopEscalation(); BCIM.AUTO?.stopAutoEscape();
    BCIM.CHAT?.stop(); BCIM.KARMA?.stop();
    clearInterval(BCIM._monitorInterval);
  });
  document.getElementById('bcim-mini-btn').addEventListener('click',()=>{
    BCIM.CFG.miniMode=!BCIM.CFG.miniMode; BCIM.saveCFG();
    root.classList.toggle('mini',BCIM.CFG.miniMode);
    document.getElementById('bcim-mini-btn').textContent=BCIM.CFG.miniMode?'□':'_';
  });
  if(BCIM.CFG.miniMode){root.classList.add('mini');document.getElementById('bcim-mini-btn').textContent='□';}

  // ── Tab switching ─────────────────────────────────────────
  tabs.addEventListener('click',e=>{
    const b=e.target.closest('.bt'); if(!b) return;
    BCIM.S.tab=b.dataset.t;
    BCIM.$$('.bt',tabs).forEach(t=>t.classList.toggle('on',t.dataset.t===BCIM.S.tab));
    renderTabContent();
  });

  // ── Player bar ────────────────────────────────────────────
  function renderPlayers(){
    pbar.innerHTML='';
    const list=BCIM.BC.players();
    if(!list.length){pbar.appendChild(el('span',{style:{color:'var(--txt3)',fontSize:'11px',padding:'2px'}},'Kein Raum'));return;}
    list.forEach(c=>{
      const name=c.Nickname||c.Name||`#${c.MemberNumber}`;
      const b=el('button',{class:'bp'+(BCIM.S.char?.MemberNumber===c.MemberNumber?' on':'')},c.IsPlayer?.()? `★ ${name}`:name);
      b.addEventListener('click',()=>{
        BCIM.S.char=c; BCIM.S.group=null; BCIM.S.asset=null; BCIM.resetItem();
        BCIM.SYNC.startMonitor(c);
        renderPlayers(); renderTabContent();
      });
      pbar.appendChild(b);
    });
  }

  // ── Tab router ────────────────────────────────────────────
  function renderTabContent(){
    content.innerHTML=''; cfgWrap.innerHTML='';
    act.style.display='none'; stEl.textContent='';
    const showCfg=['slots','search','body'].includes(BCIM.S.tab);
    cfgWrap.style.display=showCfg?'block':'none';

    switch(BCIM.S.tab){
      case 'slots':      BCIM.TAB_SLOTS?.();     renderCfg(); break;
      case 'body':       BCIM.TAB_BODY?.();      renderCfg(); break;
      case 'search':     BCIM.TAB_SEARCH?.();    renderCfg(); break;
      case 'outfits':    content.appendChild(BCIM.TAB_OUTFITS?.()||el('div',{},'Fehler')); break;
      case 'locks':      content.appendChild(BCIM.TAB_LOCKS?.()||el('div',{},'Fehler'));   break;
      case 'monitor':    content.appendChild(BCIM.TAB_MONITOR?.()||el('div',{},'Fehler')); break;
      case 'rules':      content.appendChild(BCIM.TAB_RULES?.()||el('div',{},'Fehler'));   break;
      case 'stats':      content.appendChild(BCIM.TAB_STATS?.()||el('div',{},'Fehler'));   break;
      case 'settings':   content.appendChild(BCIM.TAB_SETTINGS?.()||el('div',{},'Fehler'));break;
      case 'automation': content.appendChild(BCIM.TAB_AUTOMATION?.()||el('div',{},'Fehler')); break;
      case 'chat':       content.appendChild(BCIM.TAB_CHAT?.()||el('div',{},'Fehler'));    break;
      case 'games':      content.appendChild(BCIM.TAB_GAMES?.()||el('div',{},'Fehler'));   break;
      case 'karma':      content.appendChild(BCIM.TAB_KARMA?.()||el('div',{},'Fehler'));   break;
      case 'colors':     content.appendChild(BCIM.TAB_COLORS?.()||el('div',{},'Fehler'));  break;
    }
  }

  // ── Inline slot/body/search/cfg renderers (from core tabs) ─
  BCIM.TAB_SLOTS  = () => { const g=el('div',{id:'bcim-slots'}); buildSlotGrid(g); content.appendChild(g); };
  BCIM.TAB_BODY   = () => { const m=el('div',{id:'bcim-body-map'}); buildBodyMap(m); content.appendChild(m); };
  BCIM.TAB_SEARCH = () => {
    const sq=el('div',{id:'bcim-sq'},el('input',{type:'text',class:'bcim-search-inp',placeholder:'🔍 Item suchen...',value:BCIM.S.searchQ}));
    const al=el('div',{id:'bcim-al'}); content.appendChild(sq); content.appendChild(al);
    refreshAssets(al);
    sq.querySelector('input').addEventListener('input',e=>{BCIM.S.searchQ=e.target.value;refreshAssets(al);});
  };

  function buildSlotGrid(grid){
    if(!BCIM.S.char){grid.appendChild(el('div',{class:'bempty',style:{gridColumn:'1/-1'}},'Spieler wählen'));return;}
    const c=BCIM.S.char,groups=BCIM.BC.getGroups(c.AssetFamily||'Female3DCG');
    const allN=groups.map(g=>g.Name);
    const sorted=[...BCIM.SLOT_ORDER,...allN.filter(n=>!BCIM.SLOT_ORDER.includes(n))];
    sorted.forEach(gName=>{
      const grp=groups.find(g=>g.Name===gName);if(!grp)return;
      const item=BCIM.BC.getItem(c,gName);
      const label=BCIM.SLOT_LABELS[gName]||gName.replace('Item','').replace(/([A-Z])/g,' $1').trim().slice(0,10);
      const isFav=BCIM.CFG.favorites.includes(item?.Asset?.Name);
      const s=el('div',{class:`bs${item?' full':''}${BCIM.S.group===gName?' on':''}`},
        el('div',{class:'bs-n'},label),
        item?el('div',{class:'bs-i'},(item.Asset?.Name||'?').replace(/([A-Z])/g,' $1').trim().slice(0,11)):el('div',{class:'bs-e'},'—'),
      );
      if(isFav)s.appendChild(el('span',{class:'bs-fav'},'★'));
      if(BCIM.BC.isAddonAsset(item?.Asset))s.appendChild(el('span',{class:'addon-dot'}));
      s.addEventListener('click',()=>selectGroup(gName));
      grid.appendChild(s);
    });
  }

  const BODY_ZONES=[
    {label:'👤 Kopf',   slots:['ItemHead','ItemHair','ItemHairFront','HairAccessory1','HairAccessory2','HatAccessory']},
    {label:'👁 Gesicht',slots:['ItemEyes','ItemEyesShadow','ItemEyesLashes','ItemNose','ItemEars']},
    {label:'👄 Mund',   slots:['ItemMouth','ItemMouthAccessories']},
    {label:'📿 Hals',   slots:['ItemNeck','ItemNeckRestraints','ItemNeckAccessories']},
    {label:'💪 Arme',   slots:['ItemArms','ItemHands','Gloves']},
    {label:'✋ Hand',   slots:['ItemHandheld']},
    {label:'👕 Oberteil',slots:['Cloth','ClothAccessory','ItemTorso','ItemTorso2']},
    {label:'🎀 Brust',  slots:['ItemBreast']},
    {label:'👖 Unterteil',slots:['ClothLower','ItemPelvis']},
    {label:'🍑 Hintern',slots:['ItemButt','ItemVulva','ItemVulvaPiercings']},
    {label:'🦵 Beine',  slots:['ItemLegs','Socks','SocksRight']},
    {label:'👟 Füße',   slots:['ItemFeet','Shoes']},
  ];
  function buildBodyMap(map){
    BODY_ZONES.forEach(zone=>{
      const hasItem=BCIM.S.char&&zone.slots.some(sl=>BCIM.BC.getItem(BCIM.S.char,sl));
      const isActive=BCIM.S.group&&zone.slots.includes(BCIM.S.group);
      const z=el('div',{class:`bzone${hasItem?' full':''}${isActive?' on':''}`},zone.label,
        hasItem?el('span',{style:{color:'var(--acc)',fontSize:'9px',marginLeft:'4px'}},
          zone.slots.filter(sl=>BCIM.BC.getItem(BCIM.S.char,sl)).length+'×'):'',
      );
      z.addEventListener('click',()=>{
        const target=zone.slots.find(sl=>BCIM.BC.getItem(BCIM.S.char,sl))||zone.slots[0];
        selectGroup(target);
      });
      map.appendChild(z);
    });
  }

  function refreshAssets(al){
    al.innerHTML='';
    if(!BCIM.S.group){al.appendChild(el('div',{class:'bempty'},'Zuerst Slot wählen'));return;}
    const fam=BCIM.S.char?.AssetFamily||'Female3DCG';
    let assets=BCIM.BC.getAssetsForGroup(fam,BCIM.S.group);
    const q=BCIM.S.searchQ.toLowerCase();
    if(q)assets=assets.filter(a=>a.Name.toLowerCase().includes(q));
    assets=assets.slice(0,120);
    if(!assets.length){al.appendChild(el('div',{class:'bempty'},'Nichts gefunden'));return;}
    assets.forEach(a=>{
      const name=a.Name.replace(/([A-Z])/g,' $1').trim();
      const isFav=BCIM.CFG.favorites.includes(a.Name);
      const arch=BCIM.BC.getArchetype(a);
      const isAddon=BCIM.BC.isAddonAsset(a);
      const row=el('div',{class:'ba'+(BCIM.S.asset?.Name===a.Name?' on':'')},
        isAddon?el('span',{class:'ba-badge'},'Addon'):'',
        el('span',{},name),
        arch!=='basic'&&arch!=='unknown'?el('span',{class:'ba-badge'},arch):'',
        el('span',{class:'ba-fav'+(isFav?' on':'')},isFav?'★':'☆'),
      );
      row.querySelector('.ba-fav').addEventListener('click',e=>{
        e.stopPropagation();
        const idx=BCIM.CFG.favorites.indexOf(a.Name);
        if(idx>=0)BCIM.CFG.favorites.splice(idx,1); else BCIM.CFG.favorites.push(a.Name);
        BCIM.saveCFG(); refreshAssets(al); buildSlotGrid(BCIM.$('#bcim-slots')||el('div'));
      });
      row.addEventListener('click',()=>{BCIM.S.asset=a;BCIM.S.colors=[];BCIM.S.modSelections={};BCIM.S.typedType=null;refreshAssets(al);renderCfg();});
      al.appendChild(row);
    });
  }

  function selectGroup(gName){
    BCIM.S.group=gName; BCIM.S.asset=null; BCIM.resetItem();
    const item=BCIM.BC.getItem(BCIM.S.char,gName);
    if(item){
      BCIM.S.asset=item.Asset;
      BCIM.S.craft={...(item.Craft||{})}; BCIM.S.prop={...(item.Property||{})};
      BCIM.S.colors=Array.isArray(item.Color)?[...item.Color]:[item.Color||'#ffffff'];
      const arch=BCIM.BC.getArchetype(BCIM.S.asset);
      if(arch==='modular')BCIM.S.modSelections=BCIM.BC.decodeModular(BCIM.S.asset,item.Property?.Type||'');
      else BCIM.S.typedType=item.Property?.Type||null;
    }
    renderTabContent();
  }

  function renderCfg(){
    cfgWrap.innerHTML=''; act.style.display='none';
    if(!BCIM.S.char||!BCIM.S.group){cfgWrap.appendChild(BCIM.UI.emptyState('👆','Spieler & Slot wählen'));return;}
    const curItem=BCIM.BC.getItem(BCIM.S.char,BCIM.S.group);
    const asset=BCIM.S.asset||curItem?.Asset;
    if(!asset){
      cfgWrap.appendChild(BCIM.UI.emptyState('🔍','Item über Suchen wählen'));
      if(curItem)showActions(true,false); return;
    }
    // Delegate to configurator
    BCIM.CFG_RENDER?.(cfgWrap,asset,curItem);
    showActions(!!curItem,true);
  }

  function showActions(remove,apply){
    act.innerHTML=''; act.style.display='flex';
    if(apply){const b=el('button',{class:'bbt bbt-p'},'✓ Anlegen');b.addEventListener('click',doApply);act.appendChild(b);}
    if(remove){const b=el('button',{class:'bbt bbt-d'},'✕ Entfernen');b.addEventListener('click',doRemove);act.appendChild(b);}
    const ref=el('button',{class:'bbt bbt-g',title:'Aktualisieren'},'↻');
    ref.addEventListener('click',()=>{renderPlayers();renderTabContent();});
    act.appendChild(ref);
  }

  function doApply(){
    const {char:c,group:g}=BCIM.S;
    const curItem=BCIM.BC.getItem(c,g);
    const asset=BCIM.S.asset||curItem?.Asset;
    if(!c||!g||!asset){BCIM.setStatus('Kein Asset!',true);return;}
    const fp={...BCIM.S.prop};
    const arch=BCIM.BC.getArchetype(asset);
    if(arch==='modular')fp.Type=BCIM.BC.encodeModular(asset,BCIM.S.modSelections);
    else if(arch==='typed')fp.Type=BCIM.S.typedType||undefined;
    if(BCIM.BC.applyItem(c,g,asset,BCIM.S.colors.length?BCIM.S.colors:undefined,Object.keys(BCIM.S.craft).length?BCIM.S.craft:undefined,Object.keys(fp).length?fp:undefined)){
      BCIM.SYNC.saveHistory(c);
      BCIM.SYNC.logAction('apply',g,asset.Name,c.Name);
      BCIM.setStatus('✓ Angelegt!',false);
      setTimeout(()=>renderTabContent(),350);
    } else BCIM.setStatus('❌ Fehler',true);
  }

  function doRemove(){
    if(!BCIM.S.char||!BCIM.S.group)return;
    if(BCIM.BC.removeItem(BCIM.S.char,BCIM.S.group)){
      BCIM.SYNC.saveHistory(BCIM.S.char); BCIM.SYNC.logAction('remove',BCIM.S.group,'',BCIM.S.char.Name);
      BCIM.S.asset=null; BCIM.resetItem();
      BCIM.setStatus('Entfernt',false);
      setTimeout(()=>renderTabContent(),300);
    } else BCIM.setStatus('❌ Fehler',true);
  }

  // ── Monitor polling ───────────────────────────────────────
  BCIM._monitorInterval = setInterval(()=>{
    if(!document.getElementById('bcim-root')){clearInterval(BCIM._monitorInterval);return;}
    if(!BCIM.S.char)return;
    const changes=BCIM.SYNC.checkChanges(BCIM.S.char);
    if(changes.length){
      changes.forEach(c=>{c.time=Date.now();BCIM.S.monitorAlerts.unshift(c);});
      if(BCIM.S.monitorAlerts.length>50)BCIM.S.monitorAlerts.length=50;
      // Owner check
      changes.filter(c=>c.type==='removed'&&BCIM.CFG.ownerSlots?.includes(c.group)).forEach(c=>{
        BCIM.S.ownerAlerts.unshift({group:c.group,time:Date.now()});
      });
      // Update monitor badge
      const monTab=BCIM.$('.bt[data-t="monitor"]',tabs);
      if(monTab&&BCIM.S.tab!=='monitor'){
        let badge=monTab.querySelector('.bt-n');
        if(!badge){badge=el('span',{class:'bt-n'});monTab.appendChild(badge);}
        badge.textContent=BCIM.S.monitorAlerts.length>9?'9+':String(BCIM.S.monitorAlerts.length);
      }
      if(BCIM.S.tab==='monitor')renderTabContent();
    }
  },2500);

  // ── Command Palette (Ctrl+K) ──────────────────────────────
  BCIM.PALETTE_COMMANDS = [
    ...TAB_DEFS.map(t=>({icon:t.icon,label:t.tip,sub:'Tab öffnen',action:()=>{BCIM.S.tab=t.id;BCIM.$$('.bt',tabs).forEach(b=>b.classList.toggle('on',b.dataset.t===t.id));renderTabContent();}})),
    {icon:'🎲',label:'Zufalls-Restraints',  sub:'Automation',action:()=>{BCIM.S.tab='automation';renderTabContent();}},
    {icon:'⭐',label:'Karma starten',        sub:'Karma',     action:()=>{if(BCIM.S.char)BCIM.KARMA.start();}},
    {icon:'💬',label:'Chat-Engine starten',  sub:'Chat',      action:()=>BCIM.CHAT.start()},
    {icon:'🗑',label:'Alle Daten löschen',   sub:'Einstellungen',action:()=>{}},
    {icon:'⏹',label:'Alle Automationen stoppen',sub:'Automation',action:()=>{BCIM.AUTO.stopEscalation();BCIM.AUTO.stopAutoEscape();BCIM.AUTO.stopSequence();}},
  ];

  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='k'&&document.getElementById('bcim-root')){
      e.preventDefault(); openPalette();
    }
    if(e.key==='Escape'&&document.getElementById('bcim-palette-overlay')) {
      document.getElementById('bcim-palette-overlay')?.remove();
    }
  });

  function openPalette(){
    document.getElementById('bcim-palette-overlay')?.remove();
    const ov=el('div',{id:'bcim-palette-overlay'});
    const box=el('div',{id:'bcim-palette'});
    const inp=el('input',{id:'bcim-palette-input',placeholder:'⌘ Befehl suchen...',autocomplete:'off'});
    const list=el('div',{id:'bcim-palette-list'});
    let focusIdx=0;
    const buildList=(q='')=>{
      list.innerHTML=''; focusIdx=0;
      const cmds=BCIM.PALETTE_COMMANDS.filter(c=>!q||c.label.toLowerCase().includes(q.toLowerCase())||c.sub?.toLowerCase().includes(q.toLowerCase()));
      cmds.forEach((cmd,i)=>{
        const item=el('div',{class:'palette-item'+(i===0?' focused':'')},
          el('span',{class:'palette-icon'},cmd.icon),
          el('div',{style:{flex:1}},el('div',{class:'palette-label'},cmd.label),cmd.sub?el('div',{class:'palette-sub'},cmd.sub):''),
        );
        item.addEventListener('click',()=>{cmd.action();ov.remove();});
        item.addEventListener('mouseenter',()=>{list.querySelectorAll('.palette-item').forEach((x,j)=>x.classList.toggle('focused',j===i));focusIdx=i;});
        list.appendChild(item);
      });
    };
    buildList();
    inp.addEventListener('input',e=>buildList(e.target.value));
    inp.addEventListener('keydown',e=>{
      const items=list.querySelectorAll('.palette-item');
      if(e.key==='ArrowDown'){focusIdx=Math.min(focusIdx+1,items.length-1);}
      else if(e.key==='ArrowUp'){focusIdx=Math.max(focusIdx-1,0);}
      else if(e.key==='Enter'){const cmd=BCIM.PALETTE_COMMANDS.filter(c=>!inp.value||c.label.toLowerCase().includes(inp.value.toLowerCase()))[focusIdx];cmd?.action();ov.remove();return;}
      else return;
      items.forEach((x,j)=>x.classList.toggle('focused',j===focusIdx));
      items[focusIdx]?.scrollIntoView({block:'nearest'});
    });
    box.appendChild(inp); box.appendChild(list);
    ov.appendChild(box); ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
    setTimeout(()=>inp.focus(),50);
  }

  // ── ModSDK registration ───────────────────────────────────
  try {
    const sdk=window.bcModSDK||window.ModSDK;
    if(sdk&&!sdk.ModsInfo?.has?.('BCItemManager'))
      sdk.registerMod({name:'BCItemManager',version:'3.0',fullName:'BC Item Manager'});
  } catch {}

  // ── Init ──────────────────────────────────────────────────
  function init(){
    renderPlayers();
    const list=BCIM.BC.players();
    if(list.length){
      BCIM.S.char=list[0];
      renderPlayers();
      BCIM.SYNC.startMonitor(BCIM.S.char);
    }
    renderTabContent();
    // auto-refresh players
    setInterval(()=>{if(document.getElementById('bcim-root'))renderPlayers();},5000);
  }

  typeof Player!=='undefined'?init():(()=>{const w=setInterval(()=>{if(typeof Player!=='undefined'){clearInterval(w);init();}},500);})();
})();
