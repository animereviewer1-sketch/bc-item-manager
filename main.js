// ── BCIM / main.js (v3.2) ─────────────────────────────────
(function() {
  if (document.getElementById('bcim-root')) { document.getElementById('bcim-root').remove(); return; }
  window.BCIM = window.BCIM || {};

  BCIM.buildCSS();

  const el = BCIM.el;

  // ── DOM ───────────────────────────────────────────────────
  const root    = el('div',{id:'bcim-root'});
  const bar     = el('div',{id:'bcim-bar'},
    el('span',{id:'bcim-logo'},'⬡ BCIM v3'),
    el('span',{id:'bcim-scan-badge',title:'Assets gescannt — klicken zum Neu-Scannen'},'⟳ Scannen...'),
    el('button',{id:'bcim-size-btn', title:'Größe'},'⤡'),
    el('button',{id:'bcim-mini-btn', title:'Mini'},'_'),
    el('button',{id:'bcim-x'},'✕'),
  );
  const pbar    = el('div',{id:'bcim-players'});
  const tabs    = el('div',{id:'bcim-tabs'});
  const content = el('div',{id:'bcim-content'});
  const cfgWrap = el('div',{id:'bcim-cfg-wrap',style:{display:'none'}});
  const act     = el('div',{id:'bcim-act',style:{display:'none'}});
  const stEl    = el('div',{id:'bcim-st'});
  const resizer = el('div',{id:'bcim-resizer'});

  [bar,pbar,tabs,content,cfgWrap,act,stEl,resizer].forEach(n=>root.appendChild(n));
  document.body.appendChild(root);

  // Restore saved size
  const sw = BCIM.CFG.panelWidth  || 480;
  const sh = BCIM.CFG.panelHeight || 680;
  root.style.width  = sw + 'px';
  root.style.height = sh + 'px';

  // ── Tabs ──────────────────────────────────────────────────
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
    const b = el('button',{class:`bt${BCIM.S.tab===t.id?' on':''}`,title:t.tip,'data-t':t.id},t.icon);
    tabs.appendChild(b);
  });

  // ── Scan badge ────────────────────────────────────────────
  document.getElementById('bcim-scan-badge').addEventListener('click', () => {
    const badge = document.getElementById('bcim-scan-badge');
    badge.textContent = '⟳ Scanning...';
    setTimeout(() => {
      const assets = BCIM.scanAssets(true);
      badge.textContent = '⟳ ' + assets.length + ' items';
      BCIM.setStatus('✓ Scan: ' + assets.length + ' Assets gefunden', false);
    }, 50);
  });

  // ── Drag ──────────────────────────────────────────────────
  bar.addEventListener('mousedown', e => {
    const id = e.target.id;
    if (['bcim-x','bcim-mini-btn','bcim-size-btn','bcim-scan-badge'].includes(id)) return;
    const r  = root.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    const mv = e2 => { root.style.left=(e2.clientX-ox)+'px'; root.style.top=(e2.clientY-oy)+'px'; root.style.right='auto'; };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', mv), {once:true});
  });

  // ── Resize handle (corner drag) ───────────────────────────
  resizer.addEventListener('mousedown', e => {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    const sw = root.offsetWidth, sh = root.offsetHeight;
    const mv = e2 => {
      root.style.width  = Math.max(300, sw + e2.clientX - sx) + 'px';
      root.style.height = Math.max(400, sh + e2.clientY - sy) + 'px';
    };
    const up = () => {
      document.removeEventListener('mousemove', mv);
      document.removeEventListener('mouseup', up);
      BCIM.CFG.panelWidth  = root.offsetWidth;
      BCIM.CFG.panelHeight = root.offsetHeight;
      BCIM.saveCFG();
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', up);
  });

  // ── Size presets ──────────────────────────────────────────
  document.getElementById('bcim-size-btn').addEventListener('click', () => {
    const existing = document.getElementById('bcim-size-popup');
    if (existing) { existing.remove(); return; }
    const popup = el('div',{id:'bcim-size-popup'});
    const presets = [
      {label:'Kompakt',  w:340, h:500},
      {label:'Normal',   w:480, h:680},
      {label:'Breit',    w:580, h:720},
      {label:'Groß',     w:680, h:820},
      {label:'Maximiert',w:820, h:920},
    ];
    presets.forEach(p => {
      const b = el('button',{class:'sbtn',style:{display:'block',width:'100%',marginBottom:'5px',textAlign:'left'}},
        p.label + '  ' + p.w + '×' + p.h);
      b.addEventListener('click', () => {
        root.style.width = p.w+'px'; root.style.height = p.h+'px';
        BCIM.CFG.panelWidth=p.w; BCIM.CFG.panelHeight=p.h;
        BCIM.saveCFG(); popup.remove();
      });
      popup.appendChild(b);
    });
    // Width slider
    popup.appendChild(el('div',{class:'bl',style:{marginTop:'8px'}},'Breite'));
    const wLbl = el('span',{class:'bslr-v'},root.offsetWidth+'px');
    const wSlr = el('input',{type:'range',class:'bslr',min:'280',max:'900',value:String(root.offsetWidth)});
    wSlr.addEventListener('input', e => { root.style.width=e.target.value+'px'; wLbl.textContent=e.target.value+'px'; });
    popup.appendChild(el('div',{class:'bslr-r'},wSlr,wLbl));
    // Height slider
    popup.appendChild(el('div',{class:'bl',style:{marginTop:'6px'}},'Höhe'));
    const hLbl = el('span',{class:'bslr-v'},root.offsetHeight+'px');
    const hSlr = el('input',{type:'range',class:'bslr',min:'360',max:'980',value:String(root.offsetHeight)});
    hSlr.addEventListener('input', e => { root.style.height=e.target.value+'px'; hLbl.textContent=e.target.value+'px'; });
    popup.appendChild(el('div',{class:'bslr-r'},hSlr,hLbl));
    const saveBtn = el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'8px'}},'💾 Speichern');
    saveBtn.addEventListener('click', () => {
      BCIM.CFG.panelWidth=root.offsetWidth; BCIM.CFG.panelHeight=root.offsetHeight;
      BCIM.saveCFG(); popup.remove();
    });
    popup.appendChild(saveBtn);
    root.appendChild(popup);
    // close on outside click
    setTimeout(() => {
      document.addEventListener('mousedown', e => {
        if (!popup.contains(e.target) && e.target.id!=='bcim-size-btn') popup.remove();
      }, {once:true, capture:true});
    }, 100);
  });

  // ── Close ─────────────────────────────────────────────────
  document.getElementById('bcim-x').addEventListener('click', () => {
    root.remove();
    BCIM.AUTO?.stopEscalation?.(); BCIM.AUTO?.stopAutoEscape?.();
    BCIM.CHAT?.stop?.(); BCIM.KARMA?.stop?.();
    clearInterval(BCIM._monitorInterval);
  });

  // ── Mini mode ─────────────────────────────────────────────
  document.getElementById('bcim-mini-btn').addEventListener('click', () => {
    BCIM.CFG.miniMode = !BCIM.CFG.miniMode; BCIM.saveCFG();
    root.classList.toggle('mini', BCIM.CFG.miniMode);
    document.getElementById('bcim-mini-btn').textContent = BCIM.CFG.miniMode ? '□' : '_';
  });
  if (BCIM.CFG.miniMode) { root.classList.add('mini'); document.getElementById('bcim-mini-btn').textContent='□'; }

  // ── Tab switching ─────────────────────────────────────────
  tabs.addEventListener('click', e => {
    const b = e.target.closest('.bt'); if (!b) return;
    BCIM.S.tab = b.dataset.t;
    BCIM.$$('.bt',tabs).forEach(t=>t.classList.toggle('on', t.dataset.t===BCIM.S.tab));
    renderTabContent();
  });

  // ── Players ───────────────────────────────────────────────
  function renderPlayers() {
    pbar.innerHTML='';
    const list = BCIM.BC.players();
    if (!list.length) {
      pbar.appendChild(el('span',{style:{color:'var(--txt3)',fontSize:'12px',padding:'3px'}},'Kein Raum'));
      return;
    }
    list.forEach(c => {
      const name = c.Nickname||c.Name||'#'+c.MemberNumber;
      const b = el('button',{class:'bp'+(BCIM.S.char?.MemberNumber===c.MemberNumber?' on':'')},
        c.IsPlayer?.() ? '★ '+name : name);
      b.addEventListener('click', () => {
        BCIM.S.char=c; BCIM.S.group=null; BCIM.S.asset=null; BCIM.resetItem?.();
        BCIM.SYNC?.startMonitor?.(c);
        renderPlayers(); renderTabContent();
      });
      pbar.appendChild(b);
    });
  }

  // ── Tab router ────────────────────────────────────────────
  function renderTabContent() {
    content.innerHTML=''; cfgWrap.innerHTML='';
    act.style.display='none'; stEl.textContent='';
    const showCfg = ['slots','search','body'].includes(BCIM.S.tab);
    cfgWrap.style.display = showCfg ? 'block' : 'none';

    switch (BCIM.S.tab) {
      case 'slots':      BCIM.TAB_SLOTS?.();     renderCfg(); break;
      case 'body':       BCIM.TAB_BODY?.();       renderCfg(); break;
      case 'search':     BCIM.TAB_SEARCH?.();     renderCfg(); break;
      case 'outfits':    content.appendChild(BCIM.TAB_OUTFITS?.()||err()); break;
      case 'locks':      content.appendChild(BCIM.TAB_LOCKS?.()||err());   break;
      case 'monitor':    content.appendChild(BCIM.TAB_MONITOR?.()||err()); break;
      case 'rules':      content.appendChild(BCIM.TAB_RULES?.()||err());   break;
      case 'stats':      content.appendChild(BCIM.TAB_STATS?.()||err());   break;
      case 'settings':   content.appendChild(BCIM.TAB_SETTINGS?.()||err());break;
      case 'automation': content.appendChild(BCIM.TAB_AUTOMATION?.()||err()); break;
      case 'chat':       content.appendChild(BCIM.TAB_CHAT?.()||err());    break;
      case 'games':      content.appendChild(BCIM.TAB_GAMES?.()||err());   break;
      case 'karma':      content.appendChild(BCIM.TAB_KARMA?.()||err());   break;
      case 'colors':     content.appendChild(BCIM.TAB_COLORS?.()||err());  break;
    }
  }
  const err = () => el('div',{class:'bempty'},'Modul nicht geladen');

  // ── Slots tab ─────────────────────────────────────────────
  BCIM.TAB_SLOTS = () => {
    const g = el('div',{id:'bcim-slots'});
    buildSlotGrid(g); content.appendChild(g);
  };

  function buildSlotGrid(grid) {
    if (!BCIM.S.char) {
      grid.appendChild(el('div',{class:'bempty',style:{gridColumn:'1/-1'}},'Spieler wählen'));
      return;
    }
    const c   = BCIM.S.char;
    const fam = c.AssetFamily||'Female3DCG';
    const groups = BCIM.BC.getGroups(fam);
    const nameSet = new Set([...BCIM.SLOT_ORDER, ...groups.map(g=>g.Name)]);

    nameSet.forEach(gName => {
      const grp  = groups.find(g=>g.Name===gName); if (!grp) return;
      const item = BCIM.BC.getItem(c, gName);
      const label = BCIM.SLOT_LABELS[gName] || gName.replace('Item','').replace(/([A-Z])/g,' $1').trim().slice(0,10);
      const isFav    = BCIM.CFG.favorites?.includes(item?.Asset?.Name);
      const isLocked = !!item?.Property?.LockedBy;
      const cls = ['bs', item?'full':'', BCIM.S.group===gName?'on':'', isLocked?'locked':''].filter(Boolean).join(' ');
      const s = el('div',{class:cls},
        el('div',{class:'bs-n'},label),
        item ? el('div',{class:'bs-i'},(item.Asset?.Name||'?').replace(/([A-Z])/g,' $1').trim().slice(0,12))
             : el('div',{class:'bs-e'},'—'),
      );
      if (isFav)    s.appendChild(el('span',{class:'bs-fav'},'★'));
      if (isLocked) s.appendChild(el('span',{class:'bs-lock-icon'},'🔒'));
      if (BCIM.BC.isAddonAsset(item?.Asset)) s.appendChild(el('span',{class:'addon-dot'}));
      s.addEventListener('click', () => selectGroup(gName));
      grid.appendChild(s);
    });
  }

  // ── Body map tab ──────────────────────────────────────────
  BCIM.TAB_BODY = () => {
    const m = el('div',{id:'bcim-body-map'});
    buildBodyMap(m); content.appendChild(m);
  };

  const BODY_ZONES = [
    {label:'👤 Kopf',     slots:['ItemHead','ItemHair','ItemHairFront','HairAccessory1','HairAccessory2','HatAccessory']},
    {label:'👁 Gesicht',  slots:['ItemEyes','ItemEyesShadow','ItemNose','ItemEars']},
    {label:'👄 Mund',     slots:['ItemMouth','ItemMouthAccessories']},
    {label:'📿 Hals',     slots:['ItemNeck','ItemNeckRestraints','ItemNeckAccessories']},
    {label:'💪 Arme',     slots:['ItemArms','ItemHands','Gloves']},
    {label:'✋ Handheld', slots:['ItemHandheld']},
    {label:'👕 Oberteil', slots:['Cloth','ClothAccessory','ItemTorso','ItemTorso2']},
    {label:'🎀 Brust',    slots:['ItemBreast']},
    {label:'👖 Unterteil',slots:['ClothLower','ItemPelvis']},
    {label:'🍑 Hintern',  slots:['ItemButt','ItemVulva','ItemVulvaPiercings']},
    {label:'🦵 Beine',    slots:['ItemLegs','Socks','SocksRight']},
    {label:'👟 Füße',     slots:['ItemFeet','Shoes']},
  ];

  function buildBodyMap(map) {
    BODY_ZONES.forEach(zone => {
      const char    = BCIM.S.char;
      const hasItem = char && zone.slots.some(sl => BCIM.BC.getItem(char, sl));
      const isActive= BCIM.S.group && zone.slots.includes(BCIM.S.group);
      const count   = char ? zone.slots.filter(sl => BCIM.BC.getItem(char, sl)).length : 0;
      const z = el('div',{class:`bzone${hasItem?' full':''}${isActive?' on':''}`},
        el('span',{},zone.label),
        hasItem ? el('span',{style:{color:'var(--acc)',fontSize:'10px',marginLeft:'4px'}},count+'×') : '',
      );
      z.addEventListener('click', () => {
        const target = zone.slots.find(sl => char && BCIM.BC.getItem(char, sl)) || zone.slots[0];
        selectGroup(target);
      });
      map.appendChild(z);
    });
  }

  // ── Search tab ────────────────────────────────────────────
  BCIM.TAB_SEARCH = () => {
    const infoEl = el('div',{style:{padding:'0 12px 4px',fontSize:'11px',color:'var(--txt3)'}},
      BCIM.S.group ? 'Slot: '+(BCIM.SLOT_LABELS[BCIM.S.group]||BCIM.S.group)+' — '+(BCIM.BC.getAssetsForGroup(BCIM.S.char?.AssetFamily||'Female3DCG',BCIM.S.group).length)+' Items'
                   : 'Zuerst Slot wählen (Slots-Tab)');
    const sq = el('div',{id:'bcim-sq'},
      el('input',{type:'text',class:'bcim-search-inp',placeholder:'🔍 Item suchen...',value:BCIM.S.searchQ||''}));
    const al = el('div',{id:'bcim-al'});
    content.appendChild(infoEl);
    content.appendChild(sq);
    content.appendChild(al);
    refreshAssets(al);
    sq.querySelector('input').addEventListener('input', e => { BCIM.S.searchQ=e.target.value; refreshAssets(al); });
  };

  function refreshAssets(al) {
    al.innerHTML='';
    if (!BCIM.S.char)  { al.appendChild(el('div',{class:'bempty'},'Spieler wählen')); return; }
    if (!BCIM.S.group) { al.appendChild(el('div',{class:'bempty'},'Slot wählen → dann hier suchen')); return; }
    const fam    = BCIM.S.char.AssetFamily||'Female3DCG';
    let   assets = BCIM.BC.getAssetsForGroup(fam, BCIM.S.group);
    const q = (BCIM.S.searchQ||'').toLowerCase().trim();
    if (q) assets = assets.filter(a=>(a.Name||a.name||'').toLowerCase().includes(q)||(a.Description||a.label||'').toLowerCase().includes(q));
    assets = assets.slice(0, 200);
    if (!assets.length) { al.appendChild(el('div',{class:'bempty'},'Keine Items für diesen Slot')); return; }
    assets.forEach(a => {
      const name  = (a.Name||a.name||'').replace(/([A-Z])/g,' $1').trim();
      const isFav = BCIM.CFG.favorites?.includes(a.Name||a.name);
      const arch  = BCIM.BC.getArchetype(a);
      const isMod = a.isMod || BCIM.BC.isAddonAsset(a);
      const row = el('div',{class:'ba'+(BCIM.S.asset?.Name===(a.Name||a.name)?' on':'')},
        isMod ? el('span',{class:'ba-badge',style:{background:'color-mix(in srgb,#fb923c 15%,transparent)',color:'#fb923c'}},'Mod') : '',
        el('span',{style:{flex:1}},name),
        arch!=='basic'&&arch!=='unknown' ? el('span',{class:'ba-badge'},arch) : '',
        el('span',{class:'ba-fav'+(isFav?' on':'')},isFav?'★':'☆'),
      );
      row.querySelector('.ba-fav').addEventListener('click', e => {
        e.stopPropagation();
        const key = a.Name||a.name;
        const idx = (BCIM.CFG.favorites=BCIM.CFG.favorites||[]).indexOf(key);
        if (idx>=0) BCIM.CFG.favorites.splice(idx,1); else BCIM.CFG.favorites.push(key);
        BCIM.saveCFG(); refreshAssets(al);
      });
      row.addEventListener('click', () => {
        // Resolve actual asset object
        const resolved = (a._fromCache||a.isMod)
          ? (BCIM.BC.getAsset(fam, BCIM.S.group, a.Name||a.name) || a)
          : a;
        BCIM.S.asset = resolved;
        BCIM.S.colors=[]; BCIM.S.modSelections={}; BCIM.S.typedType=null;
        const cur = BCIM.BC.getItem(BCIM.S.char, BCIM.S.group);
        if (cur?.Color) BCIM.S.colors = Array.isArray(cur.Color)?[...cur.Color]:[cur.Color];
        refreshAssets(al); renderCfg();
      });
      al.appendChild(row);
    });
  }

  // ── Select group ──────────────────────────────────────────
  function selectGroup(gName) {
    BCIM.S.group=gName; BCIM.S.asset=null; BCIM.resetItem?.();
    const item = BCIM.BC.getItem(BCIM.S.char, gName);
    if (item) {
      BCIM.S.asset  = item.Asset;
      BCIM.S.craft  = {...(item.Craft||{})};
      BCIM.S.prop   = {...(item.Property||{})};
      BCIM.S.colors = Array.isArray(item.Color)?[...item.Color]:[item.Color||'#ffffff'];
      const arch = BCIM.BC.getArchetype(BCIM.S.asset);
      if (arch==='modular') BCIM.S.modSelections = BCIM.BC.decodeModular(BCIM.S.asset, item.Property?.Type||'');
      else                  BCIM.S.typedType = item.Property?.Type||null;
    }
    renderTabContent();
  }

  // ── Config panel ──────────────────────────────────────────
  function renderCfg() {
    cfgWrap.innerHTML=''; act.style.display='none';
    if (!BCIM.S.char||!BCIM.S.group) {
      cfgWrap.appendChild(el('div',{class:'bempty'},'Spieler & Slot wählen'));
      return;
    }
    const curItem = BCIM.BC.getItem(BCIM.S.char, BCIM.S.group);
    const asset   = BCIM.S.asset||curItem?.Asset;
    if (!asset) {
      cfgWrap.appendChild(el('div',{class:'bempty'},'Item wählen (Suchen-Tab)'));
      if (curItem) showActions(true, false);
      return;
    }
    BCIM.CFG_RENDER?.(cfgWrap, asset, curItem);
    showActions(!!curItem, true);
  }

  function showActions(remove, apply) {
    act.innerHTML=''; act.style.display='flex';
    if (apply)  { const b=el('button',{class:'bbt bbt-p'},'✓ Anlegen');   b.addEventListener('click',doApply);  act.appendChild(b); }
    if (remove) { const b=el('button',{class:'bbt bbt-d'},'✕ Entfernen'); b.addEventListener('click',doRemove); act.appendChild(b); }
    const ref=el('button',{class:'bbt bbt-g',title:'Refresh'},'↻');
    ref.addEventListener('click',()=>{ renderPlayers(); renderTabContent(); });
    act.appendChild(ref);
  }

  function doApply() {
    const {char:c, group:g} = BCIM.S;
    const curItem = BCIM.BC.getItem(c,g);
    const asset   = BCIM.S.asset||curItem?.Asset;
    if (!c||!g||!asset) { BCIM.setStatus('Kein Asset!',true); return; }
    const fp = {...BCIM.S.prop};
    const arch = BCIM.BC.getArchetype(asset);
    if (arch==='modular') fp.Type = BCIM.BC.encodeModular(asset, BCIM.S.modSelections);
    else if (arch==='typed') fp.Type = BCIM.S.typedType||undefined;
    const colors   = BCIM.S.colors?.length ? BCIM.S.colors : undefined;
    const craft    = Object.keys(BCIM.S.craft||{}).length ? BCIM.S.craft : undefined;
    const property = Object.keys(fp||{}).length ? fp : undefined;
    if (BCIM.BC.applyItem(c,g,asset,colors,craft,property)) {
      BCIM.SYNC?.saveHistory?.(c); BCIM.SYNC?.logAction?.('apply',g,asset.Name,c.Name);
      BCIM.setStatus('✓ Angelegt: '+(asset.Name||'?'),false);
      setTimeout(()=>renderTabContent(), 400);
    } else { BCIM.setStatus('❌ Fehler beim Anlegen',true); }
  }

  function doRemove() {
    if (!BCIM.S.char||!BCIM.S.group) return;
    if (BCIM.BC.removeItem(BCIM.S.char, BCIM.S.group)) {
      BCIM.SYNC?.saveHistory?.(BCIM.S.char);
      BCIM.SYNC?.logAction?.('remove',BCIM.S.group,'',BCIM.S.char.Name);
      BCIM.S.asset=null; BCIM.resetItem?.();
      BCIM.setStatus('Entfernt',false);
      setTimeout(()=>renderTabContent(),350);
    } else { BCIM.setStatus('❌ Fehler',true); }
  }

  // ── Monitor poll ──────────────────────────────────────────
  BCIM._monitorInterval = setInterval(()=>{
    if (!document.getElementById('bcim-root')) { clearInterval(BCIM._monitorInterval); return; }
    if (!BCIM.S.char) return;
    const changes = BCIM.SYNC?.checkChanges?.(BCIM.S.char);
    if (changes?.length) {
      changes.forEach(c=>{c.time=Date.now();BCIM.S.monitorAlerts.unshift(c);});
      if (BCIM.S.monitorAlerts.length>50) BCIM.S.monitorAlerts.length=50;
      changes.filter(c=>c.type==='removed'&&BCIM.CFG.ownerSlots?.includes(c.group)).forEach(c=>{
        BCIM.S.ownerAlerts?.unshift({group:c.group,time:Date.now()});
      });
      const monTab=BCIM.$?.('.bt[data-t="monitor"]',tabs);
      if (monTab&&BCIM.S.tab!=='monitor'){
        let badge=monTab.querySelector('.bt-n');
        if(!badge){badge=el('span',{class:'bt-n'});monTab.appendChild(badge);}
        badge.textContent=BCIM.S.monitorAlerts.length>9?'9+':String(BCIM.S.monitorAlerts.length);
      }
      if (BCIM.S.tab==='monitor') renderTabContent();
    }
  },2500);

  // ── Command palette (Ctrl+K) ──────────────────────────────
  BCIM.PALETTE_COMMANDS = [
    ...TAB_DEFS.map(t=>({icon:t.icon,label:t.tip,sub:'Tab öffnen',action:()=>{
      BCIM.S.tab=t.id;BCIM.$$('.bt',tabs).forEach(b=>b.classList.toggle('on',b.dataset.t===t.id));renderTabContent();
    }})),
    {icon:'⟳',label:'Assets neu scannen',  sub:'Scan',       action:()=>{ const a=BCIM.scanAssets(true);BCIM.setStatus('Scan: '+a.length+' Assets',false); }},
    {icon:'⭐',label:'Karma starten',       sub:'Karma',      action:()=>{ if(BCIM.S.char)BCIM.KARMA?.start?.(); }},
    {icon:'💬',label:'Chat-Engine starten', sub:'Chat',       action:()=>BCIM.CHAT?.start?.()},
    {icon:'💬',label:'Chat-Engine stoppen', sub:'Chat',       action:()=>BCIM.CHAT?.stop?.()},
    {icon:'⏹',label:'Automationen stoppen',sub:'Automation', action:()=>{ BCIM.AUTO?.stopEscalation?.();BCIM.AUTO?.stopAutoEscape?.(); }},
    {icon:'⤡',label:'Panel groß',          sub:'Ansicht',    action:()=>{ root.style.width='680px';root.style.height='820px'; }},
    {icon:'⊡',label:'Panel normal',        sub:'Ansicht',    action:()=>{ root.style.width='480px';root.style.height='680px'; }},
  ];

  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='k'&&document.getElementById('bcim-root')){e.preventDefault();openPalette();}
    if(e.key==='Escape'&&document.getElementById('bcim-palette-overlay')) document.getElementById('bcim-palette-overlay')?.remove();
  });

  function openPalette() {
    document.getElementById('bcim-palette-overlay')?.remove();
    const ov=el('div',{id:'bcim-palette-overlay'});
    const box=el('div',{id:'bcim-palette'});
    const inp=el('input',{id:'bcim-palette-input',placeholder:'⌘ Befehl suchen...',autocomplete:'off'});
    const list=el('div',{id:'bcim-palette-list'});
    let fi=0;
    const buildList=(q='')=>{
      list.innerHTML=''; fi=0;
      const cmds=BCIM.PALETTE_COMMANDS.filter(c=>!q||c.label.toLowerCase().includes(q)||c.sub?.toLowerCase().includes(q));
      cmds.forEach((cmd,i)=>{
        const item=el('div',{class:'palette-item'+(i===0?' focused':'')},
          el('span',{class:'palette-icon'},cmd.icon),
          el('div',{style:{flex:1}},el('div',{class:'palette-label'},cmd.label),cmd.sub?el('div',{class:'palette-sub'},cmd.sub):''),
        );
        item.addEventListener('click',()=>{cmd.action();ov.remove();});
        item.addEventListener('mouseenter',()=>{list.querySelectorAll('.palette-item').forEach((x,j)=>x.classList.toggle('focused',j===i));fi=i;});
        list.appendChild(item);
      });
    };
    buildList();
    inp.addEventListener('input',e=>buildList(e.target.value.toLowerCase()));
    inp.addEventListener('keydown',e=>{
      const items=list.querySelectorAll('.palette-item');
      if(e.key==='ArrowDown') fi=Math.min(fi+1,items.length-1);
      else if(e.key==='ArrowUp') fi=Math.max(fi-1,0);
      else if(e.key==='Enter'){const visible=BCIM.PALETTE_COMMANDS.filter(c=>!inp.value||c.label.toLowerCase().includes(inp.value));visible[fi]?.action();ov.remove();return;}
      else return;
      items.forEach((x,j)=>x.classList.toggle('focused',j===fi));
      items[fi]?.scrollIntoView({block:'nearest'});
    });
    box.appendChild(inp);box.appendChild(list);
    ov.appendChild(box);ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
    setTimeout(()=>inp.focus(),50);
  }

  // ── ModSDK registration ───────────────────────────────────
  try {
    const sdk=window.bcModSDK||window.ModSDK;
    if(sdk&&!sdk.ModsInfo?.has?.('BCItemManager'))
      sdk.registerMod({name:'BCItemManager',version:'3.2',fullName:'BC Item Manager'});
  } catch {}

  // ── Init ──────────────────────────────────────────────────
  function init() {
    renderPlayers();
    const list = BCIM.BC.players();
    if (list.length) {
      BCIM.S.char = list[0];
      renderPlayers();
      BCIM.SYNC?.startMonitor?.(BCIM.S.char);
    }
    renderTabContent();
    // Refresh player list every 5s
    setInterval(()=>{ if(document.getElementById('bcim-root')) renderPlayers(); }, 5000);
    // Auto-start chat engine if configured
    if (BCIM.CFG.chatAutoStart && BCIM.CHAT) setTimeout(()=>BCIM.CHAT.start(),1200);
    // Update scan badge after scan completes
    setTimeout(()=>{
      const badge=document.getElementById('bcim-scan-badge');
      if(badge) badge.textContent='⟳ '+BCIM._scanState.assets.length+' items';
    },1000);
  }

  typeof Player !== 'undefined'
    ? init()
    : (()=>{ const w=setInterval(()=>{ if(typeof Player!=='undefined'){clearInterval(w);init();} },500); })();
})();
