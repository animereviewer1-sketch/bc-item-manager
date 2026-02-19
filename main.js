// ── BCIM / main.js (v3.1) ─────────────────────────────────
(function() {
  if (document.getElementById('bcim-root')) { document.getElementById('bcim-root').remove(); return; }
  window.BCIM = window.BCIM || {};

  BCIM.buildCSS();

  const el = BCIM.el;

  // ── DOM ───────────────────────────────────────────────────
  const root    = el('div',{id:'bcim-root'});
  const bar     = el('div',{id:'bcim-bar'},
    el('span',{id:'bcim-logo'},'⬡ BCIM'),
    el('button',{id:'bcim-size-btn',title:'Größe anpassen'},'⤡'),
    el('button',{id:'bcim-mini-btn',title:'Mini Mode'},'_'),
    el('button',{id:'bcim-x'},'✕')
  );
  const pbar    = el('div',{id:'bcim-players'});
  const tabs    = el('div',{id:'bcim-tabs'});
  const content = el('div',{id:'bcim-content'});
  const cfgWrap = el('div',{id:'bcim-cfg-wrap',style:{display:'none'}});
  const act     = el('div',{id:'bcim-act',style:{display:'none'}});
  const stEl    = el('div',{id:'bcim-st'});
  const resizer = el('div',{id:'bcim-resizer'});  // resize handle corner

  [bar,pbar,tabs,content,cfgWrap,act,stEl,resizer].forEach(n=>root.appendChild(n));
  document.body.appendChild(root);

  // ── Apply saved size ──────────────────────────────────────
  const savedW = BCIM.CFG.panelWidth  || 320;
  const savedH = BCIM.CFG.panelHeight || 520;
  root.style.width  = savedW + 'px';
  root.style.height = savedH + 'px';

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

  // ── Drag (bar) ────────────────────────────────────────────
  bar.addEventListener('mousedown', e => {
    const id = e.target.id;
    if (id==='bcim-x'||id==='bcim-mini-btn'||id==='bcim-size-btn') return;
    const r  = root.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    const mv = e2 => {
      root.style.left  = (e2.clientX - ox) + 'px';
      root.style.top   = (e2.clientY - oy) + 'px';
      root.style.right = 'auto';
    };
    document.addEventListener('mousemove', mv);
    document.addEventListener('mouseup', () => document.removeEventListener('mousemove', mv), {once:true});
  });

  // ── Resize (corner handle) ────────────────────────────────
  resizer.addEventListener('mousedown', e => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = root.offsetWidth, startH = root.offsetHeight;
    const mv = e2 => {
      const w = Math.max(260, startW + e2.clientX - startX);
      const h = Math.max(360, startH + e2.clientY - startY);
      root.style.width  = w + 'px';
      root.style.height = h + 'px';
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

  // ── Size presets popup ────────────────────────────────────
  document.getElementById('bcim-size-btn').addEventListener('click', () => {
    const existing = document.getElementById('bcim-size-popup');
    if (existing) { existing.remove(); return; }
    const popup = el('div',{id:'bcim-size-popup'});
    const presets = [
      {label:'Klein',  w:260, h:420},
      {label:'Normal', w:320, h:520},
      {label:'Mittel', w:400, h:600},
      {label:'Groß',   w:500, h:700},
      {label:'XL',     w:620, h:820},
    ];
    popup.appendChild(el('div',{class:'card-sub',style:{marginBottom:'6px',padding:'2px'}},'Größe wählen:'));
    presets.forEach(p => {
      const b = el('button',{class:'sbtn',style:{display:'block',width:'100%',marginBottom:'4px',textAlign:'left'}},
        p.label + ' ('+p.w+'×'+p.h+')');
      b.addEventListener('click', () => {
        root.style.width  = p.w + 'px';
        root.style.height = p.h + 'px';
        BCIM.CFG.panelWidth = p.w; BCIM.CFG.panelHeight = p.h;
        BCIM.saveCFG(); popup.remove();
      });
      popup.appendChild(b);
    });
    // Custom size sliders
    popup.appendChild(el('div',{class:'card-sub',style:{marginTop:'6px',marginBottom:'4px'}},'Benutzerdefiniert:'));
    const wVal = el('span',{}, root.offsetWidth+'px');
    const hVal = el('span',{}, root.offsetHeight+'px');
    const wSlider = el('input',{type:'range',class:'bslr',min:'220',max:'800',value:String(root.offsetWidth),style:{width:'100%'}});
    const hSlider = el('input',{type:'range',class:'bslr',min:'300',max:'900',value:String(root.offsetHeight),style:{width:'100%'}});
    wSlider.addEventListener('input', e => { root.style.width  = e.target.value+'px'; wVal.textContent=e.target.value+'px'; });
    hSlider.addEventListener('input', e => { root.style.height = e.target.value+'px'; hVal.textContent=e.target.value+'px'; });
    const saveBtn = el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'4px'}},'💾 Speichern');
    saveBtn.addEventListener('click', () => {
      BCIM.CFG.panelWidth = root.offsetWidth; BCIM.CFG.panelHeight = root.offsetHeight;
      BCIM.saveCFG(); popup.remove();
    });
    [el('div',{style:{display:'flex',justifyContent:'space-between'}},'Breite:',wVal),
     wSlider,
     el('div',{style:{display:'flex',justifyContent:'space-between'}},'Höhe:',hVal),
     hSlider, saveBtn].forEach(n=>popup.appendChild(n));
    root.appendChild(popup);
    document.addEventListener('mousedown', e => {
      if(!popup.contains(e.target)&&e.target.id!=='bcim-size-btn') popup.remove();
    }, {once:true, capture:true});
  });

  // ── Close ─────────────────────────────────────────────────
  document.getElementById('bcim-x').addEventListener('click', () => {
    root.remove();
    BCIM.AUTO?.stopEscalation(); BCIM.AUTO?.stopAutoEscape();
    BCIM.CHAT?.stop(); BCIM.KARMA?.stop();
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
    BCIM.$$('.bt', tabs).forEach(t => t.classList.toggle('on', t.dataset.t === BCIM.S.tab));
    renderTabContent();
  });

  // ── Players ───────────────────────────────────────────────
  function renderPlayers() {
    pbar.innerHTML='';
    const list = BCIM.BC.players();
    if (!list.length) { pbar.appendChild(el('span',{style:{color:'var(--txt3)',fontSize:'11px',padding:'2px'}},'Kein Raum')); return; }
    list.forEach(c => {
      const name = c.Nickname||c.Name||`#${c.MemberNumber}`;
      const b = el('button',{class:'bp'+(BCIM.S.char?.MemberNumber===c.MemberNumber?' on':'')},
        c.IsPlayer?.() ? `★ ${name}` : name);
      b.addEventListener('click', () => {
        BCIM.S.char = c; BCIM.S.group = null; BCIM.S.asset = null; BCIM.resetItem?.();
        BCIM.SYNC.startMonitor(c);
        renderPlayers(); renderTabContent();
      });
      pbar.appendChild(b);
    });
  }

  // ── Tab router ────────────────────────────────────────────
  function renderTabContent() {
    content.innerHTML = ''; cfgWrap.innerHTML = '';
    act.style.display = 'none'; stEl.textContent = '';
    const showCfg = ['slots','search','body'].includes(BCIM.S.tab);
    cfgWrap.style.display = showCfg ? 'block' : 'none';

    switch (BCIM.S.tab) {
      case 'slots':      BCIM.TAB_SLOTS?.();     renderCfg(); break;
      case 'body':       BCIM.TAB_BODY?.();       renderCfg(); break;
      case 'search':     BCIM.TAB_SEARCH?.();     renderCfg(); break;
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

  // ── Slot grid tab ─────────────────────────────────────────
  BCIM.TAB_SLOTS = () => {
    const g = el('div',{id:'bcim-slots'});
    buildSlotGrid(g);
    content.appendChild(g);
  };

  function buildSlotGrid(grid) {
    if (!BCIM.S.char) { grid.appendChild(el('div',{class:'bempty',style:{gridColumn:'1/-1'}},'Spieler wählen')); return; }
    const c = BCIM.S.char;
    const fam = c.AssetFamily||'Female3DCG';
    const groups = BCIM.BC.getGroups(fam);

    // Get ALL groups that actually have items OR are in SLOT_ORDER
    const groupNames = new Set([...BCIM.SLOT_ORDER, ...groups.map(g=>g.Name)]);

    groupNames.forEach(gName => {
      const grp = groups.find(g=>g.Name===gName); if (!grp) return;
      const item  = BCIM.BC.getItem(c, gName);
      const label = BCIM.SLOT_LABELS[gName] || gName.replace('Item','').replace(/([A-Z])/g,' $1').trim().slice(0,10);
      const isFav = BCIM.CFG.favorites?.includes(item?.Asset?.Name);
      const isLocked = !!item?.Property?.LockedBy;
      const s = el('div',{class:`bs${item?' full':''}${BCIM.S.group===gName?' on':''}${isLocked?' locked':''}`},
        el('div',{class:'bs-n'},label),
        item
          ? el('div',{class:'bs-i'},(item.Asset?.Name||'?').replace(/([A-Z])/g,' $1').trim().slice(0,12))
          : el('div',{class:'bs-e'},'—'),
      );
      if (isFav) s.appendChild(el('span',{class:'bs-fav'},'★'));
      if (isLocked) s.appendChild(el('span',{class:'bs-lock-icon'},'🔒'));
      if (BCIM.BC.isAddonAsset(item?.Asset)) s.appendChild(el('span',{class:'addon-dot'}));
      s.addEventListener('click', () => selectGroup(gName));
      grid.appendChild(s);
    });
  }

  // ── Body map tab ──────────────────────────────────────────
  BCIM.TAB_BODY = () => {
    const m = el('div',{id:'bcim-body-map'});
    buildBodyMap(m);
    content.appendChild(m);
  };

  const BODY_ZONES = [
    {label:'👤 Kopf',     slots:['ItemHead','ItemHair','ItemHairFront','HairAccessory1','HairAccessory2','HatAccessory']},
    {label:'👁 Gesicht',  slots:['ItemEyes','ItemEyesShadow','ItemNose','ItemEars']},
    {label:'👄 Mund',     slots:['ItemMouth','ItemMouthAccessories']},
    {label:'📿 Hals',     slots:['ItemNeck','ItemNeckRestraints','ItemNeckAccessories']},
    {label:'💪 Arme',     slots:['ItemArms','ItemHands','Gloves']},
    {label:'✋ Hand',     slots:['ItemHandheld']},
    {label:'👕 Oberteil', slots:['Cloth','ClothAccessory','ItemTorso','ItemTorso2']},
    {label:'🎀 Brust',    slots:['ItemBreast']},
    {label:'👖 Unterteil',slots:['ClothLower','ItemPelvis']},
    {label:'🍑 Hintern',  slots:['ItemButt','ItemVulva','ItemVulvaPiercings']},
    {label:'🦵 Beine',    slots:['ItemLegs','Socks','SocksRight']},
    {label:'👟 Füße',     slots:['ItemFeet','Shoes']},
  ];

  function buildBodyMap(map) {
    BODY_ZONES.forEach(zone => {
      const char = BCIM.S.char;
      const hasItem  = char && zone.slots.some(sl => BCIM.BC.getItem(char, sl));
      const isActive = BCIM.S.group && zone.slots.includes(BCIM.S.group);
      const count    = char ? zone.slots.filter(sl => BCIM.BC.getItem(char, sl)).length : 0;
      const z = el('div',{class:`bzone${hasItem?' full':''}${isActive?' on':''}`},
        el('span',{},zone.label),
        hasItem ? el('span',{style:{color:'var(--acc)',fontSize:'9px',marginLeft:'4px'}},count+'×') : '',
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
    const sq = el('div',{id:'bcim-sq'},
      el('input',{type:'text',class:'bcim-search-inp',placeholder:'🔍 Item suchen...',value:BCIM.S.searchQ})
    );
    const al = el('div',{id:'bcim-al'});
    content.appendChild(sq); content.appendChild(al);
    refreshAssets(al);
    sq.querySelector('input').addEventListener('input', e => { BCIM.S.searchQ=e.target.value; refreshAssets(al); });
  };

  function refreshAssets(al) {
    al.innerHTML='';
    if (!BCIM.S.char) { al.appendChild(el('div',{class:'bempty'},'Spieler wählen')); return; }
    if (!BCIM.S.group) { al.appendChild(el('div',{class:'bempty'},'Zuerst Slot wählen (Slots-Tab)')); return; }
    const fam = BCIM.S.char.AssetFamily||'Female3DCG';
    let assets = BCIM.BC.getAssetsForGroup(fam, BCIM.S.group);
    const q = (BCIM.S.searchQ||'').toLowerCase().trim();
    if (q) assets = assets.filter(a => a.Name.toLowerCase().includes(q));
    assets = assets.slice(0, 150);
    if (!assets.length) { al.appendChild(el('div',{class:'bempty'},'Nichts gefunden — Slot: '+(BCIM.SLOT_LABELS[BCIM.S.group]||BCIM.S.group))); return; }
    assets.forEach(a => {
      const name   = a.Name.replace(/([A-Z])/g,' $1').trim();
      const isFav  = BCIM.CFG.favorites?.includes(a.Name);
      const arch   = BCIM.BC.getArchetype(a);
      const isAddon= BCIM.BC.isAddonAsset(a);
      const row = el('div',{class:'ba'+(BCIM.S.asset?.Name===a.Name?' on':'')},
        isAddon ? el('span',{class:'ba-badge'},'Addon') : '',
        el('span',{style:{flex:1}},name),
        arch!=='basic'&&arch!=='unknown' ? el('span',{class:'ba-badge'},arch) : '',
        el('span',{class:'ba-fav'+(isFav?' on':'')},isFav?'★':'☆'),
      );
      row.querySelector('.ba-fav').addEventListener('click', e => {
        e.stopPropagation();
        const idx = (BCIM.CFG.favorites=BCIM.CFG.favorites||[]).indexOf(a.Name);
        if (idx>=0) BCIM.CFG.favorites.splice(idx,1); else BCIM.CFG.favorites.push(a.Name);
        BCIM.saveCFG(); refreshAssets(al);
      });
      row.addEventListener('click', () => {
        BCIM.S.asset = a; BCIM.S.colors = []; BCIM.S.modSelections = {}; BCIM.S.typedType = null;
        // Pre-populate from current item
        const cur = BCIM.BC.getItem(BCIM.S.char, BCIM.S.group);
        if (cur?.Color) BCIM.S.colors = Array.isArray(cur.Color)?[...cur.Color]:[cur.Color];
        refreshAssets(al); renderCfg();
      });
      al.appendChild(row);
    });
  }

  // ── Select group ──────────────────────────────────────────
  function selectGroup(gName) {
    BCIM.S.group = gName; BCIM.S.asset = null; BCIM.resetItem?.();
    const item = BCIM.BC.getItem(BCIM.S.char, gName);
    if (item) {
      BCIM.S.asset    = item.Asset;
      BCIM.S.craft    = {...(item.Craft||{})};
      BCIM.S.prop     = {...(item.Property||{})};
      BCIM.S.colors   = Array.isArray(item.Color) ? [...item.Color] : [item.Color||'#ffffff'];
      const arch = BCIM.BC.getArchetype(BCIM.S.asset);
      if (arch==='modular') BCIM.S.modSelections = BCIM.BC.decodeModular(BCIM.S.asset, item.Property?.Type||'');
      else                  BCIM.S.typedType = item.Property?.Type||null;
    }
    renderTabContent();
  }

  // ── Config panel ──────────────────────────────────────────
  function renderCfg() {
    cfgWrap.innerHTML = ''; act.style.display = 'none';
    if (!BCIM.S.char || !BCIM.S.group) {
      cfgWrap.appendChild(BCIM.UI.emptyState?.('👆','Spieler & Slot wählen') || el('div',{class:'bempty'},'Slot wählen'));
      return;
    }
    const curItem = BCIM.BC.getItem(BCIM.S.char, BCIM.S.group);
    const asset   = BCIM.S.asset || curItem?.Asset;
    if (!asset) {
      cfgWrap.appendChild(BCIM.UI.emptyState?.('🔍','Item über Suchen wählen') || el('div',{class:'bempty'},'Item wählen'));
      if (curItem) showActions(true, false);
      return;
    }
    BCIM.CFG_RENDER?.(cfgWrap, asset, curItem);
    showActions(!!curItem, true);
  }

  function showActions(remove, apply) {
    act.innerHTML = ''; act.style.display = 'flex';
    if (apply)  { const b=el('button',{class:'bbt bbt-p'},'✓ Anlegen');   b.addEventListener('click',doApply);  act.appendChild(b); }
    if (remove) { const b=el('button',{class:'bbt bbt-d'},'✕ Entfernen'); b.addEventListener('click',doRemove); act.appendChild(b); }
    const ref = el('button',{class:'bbt bbt-g',title:'Aktualisieren'},'↻');
    ref.addEventListener('click', () => { renderPlayers(); renderTabContent(); });
    act.appendChild(ref);
  }

  function doApply() {
    const {char:c, group:g} = BCIM.S;
    const curItem = BCIM.BC.getItem(c, g);
    const asset   = BCIM.S.asset || curItem?.Asset;
    if (!c||!g||!asset) { BCIM.setStatus('Kein Asset!', true); return; }
    const fp = {...BCIM.S.prop};
    const arch = BCIM.BC.getArchetype(asset);
    if (arch==='modular') fp.Type = BCIM.BC.encodeModular(asset, BCIM.S.modSelections);
    else if (arch==='typed') fp.Type = BCIM.S.typedType || undefined;
    const colors   = BCIM.S.colors?.length ? BCIM.S.colors : undefined;
    const craft    = Object.keys(BCIM.S.craft||{}).length ? BCIM.S.craft : undefined;
    const property = Object.keys(fp||{}).length ? fp : undefined;
    if (BCIM.BC.applyItem(c, g, asset, colors, craft, property)) {
      BCIM.SYNC?.saveHistory(c);
      BCIM.SYNC?.logAction('apply', g, asset.Name, c.Name);
      BCIM.setStatus('✓ Angelegt!', false);
      setTimeout(() => renderTabContent(), 350);
    } else {
      BCIM.setStatus('❌ Fehler beim Anlegen', true);
    }
  }

  function doRemove() {
    if (!BCIM.S.char || !BCIM.S.group) return;
    if (BCIM.BC.removeItem(BCIM.S.char, BCIM.S.group)) {
      BCIM.SYNC?.saveHistory(BCIM.S.char);
      BCIM.SYNC?.logAction('remove', BCIM.S.group, '', BCIM.S.char.Name);
      BCIM.S.asset = null; BCIM.resetItem?.();
      BCIM.setStatus('Entfernt', false);
      setTimeout(() => renderTabContent(), 300);
    } else {
      BCIM.setStatus('❌ Fehler', true);
    }
  }

  // ── Monitor polling ───────────────────────────────────────
  BCIM._monitorInterval = setInterval(() => {
    if (!document.getElementById('bcim-root')) { clearInterval(BCIM._monitorInterval); return; }
    if (!BCIM.S.char) return;
    const changes = BCIM.SYNC?.checkChanges(BCIM.S.char);
    if (changes?.length) {
      changes.forEach(c => { c.time = Date.now(); BCIM.S.monitorAlerts.unshift(c); });
      if (BCIM.S.monitorAlerts.length > 50) BCIM.S.monitorAlerts.length = 50;
      changes.filter(c => c.type==='removed' && BCIM.CFG.ownerSlots?.includes(c.group)).forEach(c => {
        BCIM.S.ownerAlerts.unshift({group:c.group, time:Date.now()});
      });
      const monTab = BCIM.$?.('.bt[data-t="monitor"]', tabs);
      if (monTab && BCIM.S.tab !== 'monitor') {
        let badge = monTab.querySelector('.bt-n');
        if (!badge) { badge = el('span',{class:'bt-n'}); monTab.appendChild(badge); }
        badge.textContent = BCIM.S.monitorAlerts.length > 9 ? '9+' : String(BCIM.S.monitorAlerts.length);
      }
      if (BCIM.S.tab === 'monitor') renderTabContent();
    }
  }, 2500);

  // ── Command Palette (Ctrl+K) ──────────────────────────────
  BCIM.PALETTE_COMMANDS = [
    ...TAB_DEFS.map(t => ({
      icon: t.icon, label: t.tip, sub: 'Tab öffnen',
      action: () => { BCIM.S.tab=t.id; BCIM.$$('.bt',tabs).forEach(b=>b.classList.toggle('on',b.dataset.t===t.id)); renderTabContent(); }
    })),
    {icon:'⭐', label:'Karma starten',        sub:'Karma',      action:()=>{ if(BCIM.S.char)BCIM.KARMA?.start(); }},
    {icon:'💬', label:'Chat-Engine starten',  sub:'Chat',       action:()=>BCIM.CHAT?.start()},
    {icon:'💬', label:'Chat-Engine stoppen',  sub:'Chat',       action:()=>BCIM.CHAT?.stop()},
    {icon:'⏹', label:'Alle Automationen stoppen',sub:'Automation',action:()=>{ BCIM.AUTO?.stopEscalation(); BCIM.AUTO?.stopAutoEscape(); BCIM.AUTO?.stopSequence?.(); }},
    {icon:'⤡', label:'Panel vergrößern',     sub:'Ansicht',    action:()=>{ root.style.width='500px'; root.style.height='700px'; }},
    {icon:'⊡', label:'Panel auf Normal',      sub:'Ansicht',    action:()=>{ root.style.width='320px'; root.style.height='520px'; }},
  ];

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && e.key==='k' && document.getElementById('bcim-root')) {
      e.preventDefault(); openPalette();
    }
    if (e.key==='Escape' && document.getElementById('bcim-palette-overlay'))
      document.getElementById('bcim-palette-overlay')?.remove();
  });

  function openPalette() {
    document.getElementById('bcim-palette-overlay')?.remove();
    const ov   = el('div',{id:'bcim-palette-overlay'});
    const box  = el('div',{id:'bcim-palette'});
    const inp  = el('input',{id:'bcim-palette-input',placeholder:'⌘ Befehl suchen...',autocomplete:'off'});
    const list = el('div',{id:'bcim-palette-list'});
    let focusIdx = 0;
    const buildList = (q='') => {
      list.innerHTML=''; focusIdx=0;
      const cmds = BCIM.PALETTE_COMMANDS.filter(c=>!q||c.label.toLowerCase().includes(q)||c.sub?.toLowerCase().includes(q));
      cmds.forEach((cmd,i) => {
        const item = el('div',{class:'palette-item'+(i===0?' focused':'')},
          el('span',{class:'palette-icon'},cmd.icon),
          el('div',{style:{flex:1}},el('div',{class:'palette-label'},cmd.label),cmd.sub?el('div',{class:'palette-sub'},cmd.sub):''),
        );
        item.addEventListener('click',()=>{cmd.action(); ov.remove();});
        item.addEventListener('mouseenter',()=>{ list.querySelectorAll('.palette-item').forEach((x,j)=>x.classList.toggle('focused',j===i)); focusIdx=i; });
        list.appendChild(item);
      });
    };
    buildList();
    inp.addEventListener('input',e=>buildList(e.target.value.toLowerCase()));
    inp.addEventListener('keydown',e=>{
      const items=list.querySelectorAll('.palette-item');
      if (e.key==='ArrowDown')      focusIdx=Math.min(focusIdx+1,items.length-1);
      else if (e.key==='ArrowUp')   focusIdx=Math.max(focusIdx-1,0);
      else if (e.key==='Enter')     { const visible=BCIM.PALETTE_COMMANDS.filter(c=>!inp.value||c.label.toLowerCase().includes(inp.value)||c.sub?.toLowerCase().includes(inp.value)); visible[focusIdx]?.action(); ov.remove(); return; }
      else return;
      items.forEach((x,j)=>x.classList.toggle('focused',j===focusIdx));
      items[focusIdx]?.scrollIntoView({block:'nearest'});
    });
    box.appendChild(inp); box.appendChild(list);
    ov.appendChild(box); ov.addEventListener('click',e=>{ if(e.target===ov) ov.remove(); });
    document.body.appendChild(ov);
    setTimeout(()=>inp.focus(),50);
  }

  // ── ModSDK ────────────────────────────────────────────────
  try {
    const sdk = window.bcModSDK||window.ModSDK;
    if (sdk && !sdk.ModsInfo?.has?.('BCItemManager'))
      sdk.registerMod({name:'BCItemManager',version:'3.1',fullName:'BC Item Manager'});
  } catch {}

  // ── Init ──────────────────────────────────────────────────
  function init() {
    renderPlayers();
    const list = BCIM.BC.players();
    if (list.length) {
      BCIM.S.char = list[0];
      renderPlayers();
      BCIM.SYNC?.startMonitor(BCIM.S.char);
    }
    renderTabContent();
    setInterval(()=>{ if(document.getElementById('bcim-root')) renderPlayers(); }, 5000);
    // Auto-start chat if configured
    if (BCIM.CFG.chatAutoStart && BCIM.CHAT) setTimeout(()=>BCIM.CHAT.start(), 1000);
  }

  typeof Player !== 'undefined'
    ? init()
    : (()=>{ const w=setInterval(()=>{ if(typeof Player!=='undefined'){clearInterval(w);init();} },500); })();
})();
