// ── BCIM / main.js (v3.3) ─────────────────────────────────
// Unified flow: Slot auswählen → Item durchsuchen → Konfigurieren
// Alles in einem Tab, kein Tab-Wechsel nötig
(function() {
  if (document.getElementById('bcim-root')) { document.getElementById('bcim-root').remove(); return; }
  window.BCIM = window.BCIM || {};

  BCIM.buildCSS();
  const el = BCIM.el;

  // ════════════════════════════════════════════════════════
  // DOM AUFBAU
  // ════════════════════════════════════════════════════════
  const root    = el('div',{id:'bcim-root'});
  const bar     = el('div',{id:'bcim-bar'},
    el('span',{id:'bcim-logo'},'⬡ BCIM v3'),
    el('span',{id:'bcim-scan-badge',title:'Klicken zum Neu-Scannen'},'⟳ ...'),
    el('button',{id:'bcim-size-btn',title:'Größe'},'⤡'),
    el('button',{id:'bcim-mini-btn',title:'Mini'},'_'),
    el('button',{id:'bcim-x'},'✕'),
  );
  const pbar    = el('div',{id:'bcim-players'});
  const tabs    = el('div',{id:'bcim-tabs'});
  const content = el('div',{id:'bcim-content'});
  const stEl    = el('div',{id:'bcim-st'});
  const resizer = el('div',{id:'bcim-resizer'});

  [bar,pbar,tabs,content,stEl,resizer].forEach(n=>root.appendChild(n));
  document.body.appendChild(root);

  // Gespeicherte Größe wiederherstellen
  root.style.width  = (BCIM.CFG.panelWidth  || 520) + 'px';
  root.style.height = (BCIM.CFG.panelHeight || 700) + 'px';

  // ════════════════════════════════════════════════════════
  // TABS
  // ════════════════════════════════════════════════════════
  const TAB_DEFS = [
    {id:'items',      icon:'👗', tip:'Items verwalten'},
    {id:'body',       icon:'🧍', tip:'Körper-Übersicht'},
    {id:'outfits',    icon:'🎭', tip:'Outfits'},
    {id:'locks',      icon:'🔒', tip:'Locks'},
    {id:'automation', icon:'⏱', tip:'Automation'},
    {id:'chat',       icon:'💬', tip:'Chat'},
    {id:'games',      icon:'🎲', tip:'Spiele'},
    {id:'karma',      icon:'⭐', tip:'Karma'},
    {id:'colors',     icon:'🎨', tip:'Farben'},
    {id:'monitor',    icon:'👁', tip:'Monitor'},
    {id:'rules',      icon:'⚡', tip:'Regeln'},
    {id:'stats',      icon:'📊', tip:'Statistik'},
    {id:'settings',   icon:'⚙️', tip:'Einstellungen'},
  ];
  if (!BCIM.S.tab || !TAB_DEFS.find(t=>t.id===BCIM.S.tab)) BCIM.S.tab = 'items';

  TAB_DEFS.forEach(t => {
    const b = el('button',{class:`bt${BCIM.S.tab===t.id?' on':''}`,title:t.tip,'data-t':t.id},t.icon);
    tabs.appendChild(b);
  });

  // ════════════════════════════════════════════════════════
  // SCAN BADGE
  // ════════════════════════════════════════════════════════
  document.getElementById('bcim-scan-badge').addEventListener('click', () => {
    const badge = document.getElementById('bcim-scan-badge');
    badge.textContent = '⟳ ...';
    setTimeout(() => {
      const assets = BCIM.scanAssets(true);
      badge.textContent = '⟳ ' + assets.length;
      // Re-render item browser if open
      if (BCIM.S.group) _renderItemBrowser();
      BCIM.setStatus('Scan: ' + assets.length + ' Assets', false);
    }, 50);
  });

  // ════════════════════════════════════════════════════════
  // DRAG + RESIZE
  // ════════════════════════════════════════════════════════
  bar.addEventListener('mousedown', e => {
    if (['bcim-x','bcim-mini-btn','bcim-size-btn','bcim-scan-badge'].includes(e.target.id)) return;
    const r  = root.getBoundingClientRect();
    const ox = e.clientX-r.left, oy = e.clientY-r.top;
    const mv = e2 => { root.style.left=(e2.clientX-ox)+'px'; root.style.top=(e2.clientY-oy)+'px'; root.style.right='auto'; };
    document.addEventListener('mousemove',mv);
    document.addEventListener('mouseup',()=>document.removeEventListener('mousemove',mv),{once:true});
  });

  resizer.addEventListener('mousedown', e => {
    e.preventDefault(); e.stopPropagation();
    const sx=e.clientX, sy=e.clientY, sw=root.offsetWidth, sh=root.offsetHeight;
    const mv = e2 => {
      root.style.width  = Math.max(340,sw+e2.clientX-sx)+'px';
      root.style.height = Math.max(420,sh+e2.clientY-sy)+'px';
    };
    const up = () => {
      document.removeEventListener('mousemove',mv);
      document.removeEventListener('mouseup',up);
      BCIM.CFG.panelWidth=root.offsetWidth; BCIM.CFG.panelHeight=root.offsetHeight; BCIM.saveCFG();
    };
    document.addEventListener('mousemove',mv);
    document.addEventListener('mouseup',up);
  });

  // ════════════════════════════════════════════════════════
  // SIZE PRESETS
  // ════════════════════════════════════════════════════════
  document.getElementById('bcim-size-btn').addEventListener('click', () => {
    const ex = document.getElementById('bcim-size-popup');
    if (ex) { ex.remove(); return; }
    const popup = el('div',{id:'bcim-size-popup'});
    [
      {label:'Kompakt',   w:360, h:520},
      {label:'Normal',    w:520, h:700},
      {label:'Breit',     w:640, h:760},
      {label:'Groß',      w:760, h:860},
      {label:'Maximiert', w:920, h:960},
    ].forEach(p => {
      const b = el('button',{class:'sbtn',style:{display:'block',width:'100%',marginBottom:'4px',textAlign:'left'}},
        p.label + '  ' + p.w + '×' + p.h);
      b.addEventListener('click',()=>{ root.style.width=p.w+'px'; root.style.height=p.h+'px'; BCIM.CFG.panelWidth=p.w; BCIM.CFG.panelHeight=p.h; BCIM.saveCFG(); popup.remove(); });
      popup.appendChild(b);
    });
    // Sliders
    for (const [axis,min,max,get,set] of [
      ['Breite','340','960',()=>root.offsetWidth, v=>{root.style.width=v+'px';}],
      ['Höhe',  '400','980',()=>root.offsetHeight,v=>{root.style.height=v+'px';}],
    ]) {
      const lbl=el('span',{class:'bslr-v'},get()+'px');
      const slr=el('input',{type:'range',class:'bslr',min,max,value:String(get())});
      slr.addEventListener('input',e=>{set(e.target.value);lbl.textContent=e.target.value+'px';});
      popup.appendChild(el('div',{class:'bl',style:{marginTop:'7px'}},axis));
      popup.appendChild(el('div',{class:'bslr-r'},slr,lbl));
    }
    const saveBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'7px'}},'💾 Speichern');
    saveBtn.addEventListener('click',()=>{BCIM.CFG.panelWidth=root.offsetWidth;BCIM.CFG.panelHeight=root.offsetHeight;BCIM.saveCFG();popup.remove();});
    popup.appendChild(saveBtn);
    root.appendChild(popup);
    setTimeout(()=>document.addEventListener('mousedown',e=>{if(!popup.contains(e.target)&&e.target.id!=='bcim-size-btn')popup.remove();},{once:true,capture:true}),100);
  });

  // ════════════════════════════════════════════════════════
  // CLOSE + MINI
  // ════════════════════════════════════════════════════════
  document.getElementById('bcim-x').addEventListener('click',()=>{
    root.remove(); BCIM.AUTO?.stopEscalation?.(); BCIM.AUTO?.stopAutoEscape?.();
    BCIM.CHAT?.stop?.(); BCIM.KARMA?.stop?.(); clearInterval(BCIM._monitorInterval);
  });
  document.getElementById('bcim-mini-btn').addEventListener('click',()=>{
    BCIM.CFG.miniMode=!BCIM.CFG.miniMode; BCIM.saveCFG();
    root.classList.toggle('mini',BCIM.CFG.miniMode);
    document.getElementById('bcim-mini-btn').textContent=BCIM.CFG.miniMode?'□':'_';
  });
  if (BCIM.CFG.miniMode){root.classList.add('mini');document.getElementById('bcim-mini-btn').textContent='□';}

  // ════════════════════════════════════════════════════════
  // SPIELER LEISTE
  // ════════════════════════════════════════════════════════
  function renderPlayers() {
    pbar.innerHTML='';
    const list = BCIM.BC.players();
    if (!list.length) { pbar.appendChild(el('span',{style:{color:'var(--txt3)',fontSize:'12px',padding:'3px'}},'Kein Raum')); return; }
    list.forEach(c => {
      const name = c.Nickname||c.Name||'#'+c.MemberNumber;
      const b = el('button',{class:'bp'+(BCIM.S.char?.MemberNumber===c.MemberNumber?' on':'')},
        c.IsPlayer?.() ? '★ '+name : name);
      b.addEventListener('click',()=>{
        BCIM.S.char=c; BCIM.S.group=null; BCIM.S.asset=null; BCIM.resetItem?.();
        BCIM.SYNC?.startMonitor?.(c);
        renderPlayers(); renderTabContent();
      });
      pbar.appendChild(b);
    });
  }

  // ════════════════════════════════════════════════════════
  // TAB ROUTER
  // ════════════════════════════════════════════════════════
  tabs.addEventListener('click', e => {
    const b = e.target.closest('.bt'); if (!b) return;
    BCIM.S.tab = b.dataset.t;
    BCIM.$$('.bt',tabs).forEach(t=>t.classList.toggle('on',t.dataset.t===BCIM.S.tab));
    renderTabContent();
  });

  function renderTabContent() {
    content.innerHTML=''; stEl.textContent='';
    switch (BCIM.S.tab) {
      case 'items':      _buildItemsTab();    break;
      case 'body':       _buildBodyTab();     break;
      case 'outfits':    content.appendChild(BCIM.TAB_OUTFITS?.()||_err()); break;
      case 'locks':      content.appendChild(BCIM.TAB_LOCKS?.()||_err());   break;
      case 'automation': content.appendChild(BCIM.TAB_AUTOMATION?.()||_err()); break;
      case 'chat':       content.appendChild(BCIM.TAB_CHAT?.()||_err());    break;
      case 'games':      content.appendChild(BCIM.TAB_GAMES?.()||_err());   break;
      case 'karma':      content.appendChild(BCIM.TAB_KARMA?.()||_err());   break;
      case 'colors':     content.appendChild(BCIM.TAB_COLORS?.()||_err());  break;
      case 'monitor':    content.appendChild(BCIM.TAB_MONITOR?.()||_err()); break;
      case 'rules':      content.appendChild(BCIM.TAB_RULES?.()||_err());   break;
      case 'stats':      content.appendChild(BCIM.TAB_STATS?.()||_err());   break;
      case 'settings':   content.appendChild(BCIM.TAB_SETTINGS?.()||_err());break;
    }
  }
  const _err = () => el('div',{class:'bempty'},'Modul nicht geladen');

  // Expose so tab modules can call it
  BCIM._renderTab = renderTabContent;

  // ════════════════════════════════════════════════════════
  // ██████████████████████████████████████████████████████
  //  ITEMS TAB  —  3-Phasen-Flow
  //  Phase 1: Slot-Grid (immer sichtbar)
  //  Phase 2: Item-Browser für gewählten Slot
  //  Phase 3: Konfigurator für gewähltes Item
  // ██████████████████████████████████████████████████████
  // ════════════════════════════════════════════════════════

  // ── Interne Referenzen auf die 3 Phasen-Container ────────
  let _phaseSlots  = null;  // Phase 1: Grid
  let _phaseBrowser= null;  // Phase 2: Browser
  let _phaseCfg    = null;  // Phase 3: Config
  let _phaseAct    = null;  // Aktions-Buttons

  function _buildItemsTab() {
    content.style.flexDirection = 'column';
    content.style.overflow = 'hidden';

    // ── Phase 1: Slot-Grid (kompakt, oben fixiert) ──────────
    _phaseSlots = el('div',{id:'bcim-phase-slots'});
    _buildSlotGrid(_phaseSlots);
    content.appendChild(_phaseSlots);

    // ── Phase 2: Item-Browser (erscheint nach Slot-Wahl) ────
    _phaseBrowser = el('div',{id:'bcim-phase-browser',style:{display:'none'}});
    content.appendChild(_phaseBrowser);

    // ── Phase 3: Konfigurator (erscheint nach Item-Wahl) ────
    _phaseCfg = el('div',{id:'bcim-phase-cfg',style:{display:'none'}});
    content.appendChild(_phaseCfg);

    // ── Aktions-Buttons (unter cfg) ─────────────────────────
    _phaseAct = el('div',{id:'bcim-act',style:{display:'none'}});
    content.appendChild(_phaseAct);

    // Wenn schon ein Slot gewählt war → direkt anzeigen
    if (BCIM.S.group) { _renderItemBrowser(); if (BCIM.S.asset) _renderCfg(); }
  }

  // ─────────────────────────────────────────────────────────
  // PHASE 1: SLOT-GRID
  // ─────────────────────────────────────────────────────────
  function _buildSlotGrid(container) {
    container.innerHTML = '';
    if (!BCIM.S.char) {
      container.appendChild(el('div',{class:'bempty'},'Spieler wählen'));
      return;
    }

    const c    = BCIM.S.char;
    const fam  = c.AssetFamily||'Female3DCG';
    const groups = BCIM.BC.getGroups(fam);

    // Sortierte Slot-Reihenfolge
    const allNames = [...new Set([...BCIM.SLOT_ORDER, ...groups.map(g=>g.Name)])];
    const grid = el('div',{id:'bcim-slots'});

    allNames.forEach(gName => {
      const grp = groups.find(g=>g.Name===gName); if (!grp) return;
      const item     = BCIM.BC.getItem(c, gName);
      const label    = BCIM.SLOT_LABELS[gName] || gName.replace('Item','').replace(/([A-Z])/g,' $1').trim().slice(0,11);
      const isLocked = !!item?.Property?.LockedBy;
      const isFav    = BCIM.CFG.favorites?.includes(item?.Asset?.Name);
      const isActive = BCIM.S.group === gName;

      const cls = ['bs', item?'full':'', isActive?'on':'', isLocked?'locked':''].filter(Boolean).join(' ');
      const s = el('div',{class:cls},
        el('div',{class:'bs-n'}, label),
        item
          ? el('div',{class:'bs-i'}, (item.Craft?.Name || item.Asset?.Name||'?').replace(/([A-Z])/g,' $1').trim().slice(0,14))
          : el('div',{class:'bs-e'}, '+ anlegen'),
      );
      if (isFav)    s.appendChild(el('span',{class:'bs-fav'},'★'));
      if (isLocked) s.appendChild(el('span',{class:'bs-lock-icon'},'🔒'));
      if (BCIM.BC.isAddonAsset(item?.Asset)) s.appendChild(el('span',{class:'addon-dot'}));

      s.addEventListener('click', () => _selectSlot(gName));
      grid.appendChild(s);
    });

    container.appendChild(grid);
  }

  // ─────────────────────────────────────────────────────────
  // SLOT WÄHLEN → Phase 2 öffnen
  // ─────────────────────────────────────────────────────────
  function _selectSlot(gName) {
    const changed = BCIM.S.group !== gName;
    BCIM.S.group  = gName;

    // Zustand des neuen Slots laden (getragenes Item)
    const item = BCIM.BC.getItem(BCIM.S.char, gName);
    if (item && changed) {
      // Vorhandenes Item als Ausgangspunkt
      BCIM.S.asset         = item.Asset;
      BCIM.S.craft         = {...(item.Craft||{})};
      BCIM.S.prop          = {...(item.Property||{})};
      BCIM.S.colors        = Array.isArray(item.Color)?[...item.Color]:[item.Color||'#ffffff'];
      BCIM.S.modSelections = {};
      BCIM.S.typedType     = null;
      BCIM.S.searchQ       = '';
      const arch = BCIM.BC.getArchetype(BCIM.S.asset);
      if (arch==='modular') BCIM.S.modSelections = BCIM.BC.decodeModular(BCIM.S.asset, item.Property?.Type||'');
      else                   BCIM.S.typedType     = item.Property?.Type||null;
    } else if (!item && changed) {
      BCIM.S.asset=null; BCIM.S.craft={}; BCIM.S.prop={}; BCIM.S.colors=[];
      BCIM.S.modSelections={}; BCIM.S.typedType=null; BCIM.S.searchQ='';
    }

    // Slot-Grid Highlight aktualisieren (ohne kompletten re-render)
    _phaseSlots.querySelectorAll('.bs').forEach(s=>{
      // find slot name from label — simpler: just rebuild
    });
    _buildSlotGrid(_phaseSlots);

    // Phase 2 rendern
    _renderItemBrowser();

    // Phase 3 rendern wenn Asset vorhanden
    if (BCIM.S.asset) _renderCfg();
    else {
      if (_phaseCfg) _phaseCfg.style.display = 'none';
      if (_phaseAct) _phaseAct.style.display  = 'none';
    }
  }

  // ─────────────────────────────────────────────────────────
  // PHASE 2: ITEM BROWSER
  // ─────────────────────────────────────────────────────────
  function _renderItemBrowser() {
    if (!_phaseBrowser) return;
    _phaseBrowser.innerHTML = '';
    _phaseBrowser.style.display = 'flex';
    _phaseBrowser.style.flexDirection = 'column';

    if (!BCIM.S.char || !BCIM.S.group) { _phaseBrowser.style.display='none'; return; }

    const fam    = BCIM.S.char.AssetFamily||'Female3DCG';
    const grpLabel = BCIM.SLOT_LABELS[BCIM.S.group]||BCIM.S.group;
    const curItem  = BCIM.BC.getItem(BCIM.S.char, BCIM.S.group);
    const totalAssets = BCIM.BC.getAssetsForGroup(fam, BCIM.S.group);

    // ── Browser Header ────────────────────────────────────
    const hdr = el('div',{id:'bcim-browser-hdr'});

    // Slot-Info + Schließen-Button
    const hdrTop = el('div',{style:{display:'flex',alignItems:'center',gap:'6px'}});
    hdrTop.appendChild(el('span',{style:{fontSize:'12px',color:'var(--acc)',fontWeight:600}},
      grpLabel));
    hdrTop.appendChild(el('span',{style:{fontSize:'11px',color:'var(--txt3)',flex:1}},
      totalAssets.length + ' Items verfügbar'));

    // Getragenes Item Info
    if (curItem) {
      const itemBadge = el('span',{style:{
        fontSize:'10px',padding:'2px 7px',borderRadius:'20px',
        background:'color-mix(in srgb,var(--acc2) 15%,transparent)',
        border:'1px solid color-mix(in srgb,var(--acc2) 30%,transparent)',
        color:'var(--acc)',whiteSpace:'nowrap',
      }}, '✓ ' + (curItem.Craft?.Name||curItem.Asset?.Name||'?'));
      hdrTop.appendChild(itemBadge);
    }

    // ← Slot-Auswahl zurücksetzen
    const closeBtn = el('button',{class:'sbtn',style:{padding:'2px 7px'}},'← Slots');
    closeBtn.addEventListener('click',()=>{
      BCIM.S.group=null; BCIM.S.asset=null;
      _buildSlotGrid(_phaseSlots);
      _phaseBrowser.style.display='none';
      if(_phaseCfg)_phaseCfg.style.display='none';
      if(_phaseAct)_phaseAct.style.display='none';
    });
    hdrTop.appendChild(closeBtn);
    hdr.appendChild(hdrTop);

    // ── Suchfeld ──────────────────────────────────────────
    const searchInp = el('input',{
      type:'text',class:'bcim-search-inp',
      placeholder:'🔍 In ' + grpLabel + ' suchen...',
      value:BCIM.S.searchQ||'',
    });
    searchInp.addEventListener('input', e => {
      BCIM.S.searchQ = e.target.value;
      _refreshAssetList(listEl);
    });
    hdr.appendChild(searchInp);

    // ── Filter: Alle / Getragen / Favoriten ───────────────
    const filterRow = el('div',{style:{display:'flex',gap:'4px'}});
    ['Alle','Getragen','★ Favoriten'].forEach((lbl,i) => {
      const b = el('button',{class:'btag'+((BCIM.S.assetFilter||0)===i?' on':'')},lbl);
      b.addEventListener('click',()=>{
        BCIM.S.assetFilter=i;
        filterRow.querySelectorAll('.btag').forEach((t,j)=>t.classList.toggle('on',j===i));
        _refreshAssetList(listEl);
      });
      filterRow.appendChild(b);
    });
    hdr.appendChild(filterRow);

    _phaseBrowser.appendChild(hdr);

    // ── Item Liste ────────────────────────────────────────
    const listEl = el('div',{id:'bcim-asset-list'});
    _phaseBrowser.appendChild(listEl);
    _refreshAssetList(listEl);

    // Focus Suchfeld
    setTimeout(()=>searchInp.focus(),80);
  }

  function _refreshAssetList(listEl) {
    listEl.innerHTML = '';
    if (!BCIM.S.char || !BCIM.S.group) return;

    const fam     = BCIM.S.char.AssetFamily||'Female3DCG';
    const curItem = BCIM.BC.getItem(BCIM.S.char, BCIM.S.group);
    let assets    = BCIM.BC.getAssetsForGroup(fam, BCIM.S.group);

    // Filter
    const filter = BCIM.S.assetFilter || 0;
    if (filter===1) {
      // Nur getragenes
      assets = assets.filter(a=>(a.Name||a.name)===curItem?.Asset?.Name);
    } else if (filter===2) {
      // Nur Favoriten
      assets = assets.filter(a=>BCIM.CFG.favorites?.includes(a.Name||a.name));
    }

    // Suche
    const q = (BCIM.S.searchQ||'').toLowerCase().trim();
    if (q) assets = assets.filter(a=>
      (a.Name||a.name||'').toLowerCase().includes(q) ||
      (a.Description||a.label||'').toLowerCase().includes(q)
    );

    // Favoriten nach oben sortieren
    assets = [...assets].sort((a,b)=>{
      const af=BCIM.CFG.favorites?.includes(a.Name||a.name)?0:1;
      const bf=BCIM.CFG.favorites?.includes(b.Name||b.name)?0:1;
      return af-bf;
    });

    assets = assets.slice(0,300);

    if (!assets.length) {
      listEl.appendChild(el('div',{class:'bempty',style:{padding:'14px'}},
        q ? 'Keine Items für "'+q+'"' : 'Keine Items für diesen Slot gefunden'));
      return;
    }

    assets.forEach(a => {
      const assetName = a.Name||a.name||'';
      const label     = (a.Description||a.label||assetName).replace(/([A-Z])/g,' $1').trim();
      const isFav     = BCIM.CFG.favorites?.includes(assetName);
      const isWorn    = curItem?.Asset?.Name === assetName;
      const isMod     = a.isMod || BCIM.BC.isAddonAsset(a);
      const arch      = BCIM.BC.getArchetype(a);
      const isSelected= BCIM.S.asset && (BCIM.S.asset.Name||BCIM.S.asset.name) === assetName;

      const row = el('div',{class:'ba'+(isSelected?' on':'')+(isWorn?' ba-worn':'')});

      // Linke Seite: Badges + Name
      const rowLeft = el('div',{style:{flex:1,display:'flex',alignItems:'center',gap:'5px',overflow:'hidden'}});
      if (isWorn) rowLeft.appendChild(el('span',{class:'ba-badge',style:{
        background:'color-mix(in srgb,var(--acc) 12%,transparent)',
        color:'var(--acc)',flexShrink:0}},'✓'));
      if (isMod)  rowLeft.appendChild(el('span',{class:'ba-badge',style:{
        background:'color-mix(in srgb,#fb923c 12%,transparent)',
        color:'#fb923c',flexShrink:0}},'Mod'));
      rowLeft.appendChild(el('span',{style:{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},
        label||assetName));
      row.appendChild(rowLeft);

      // Rechte Seite: Archetype + Fav
      const rowRight = el('div',{style:{display:'flex',alignItems:'center',gap:'4px',flexShrink:0}});
      if (arch!=='basic'&&arch!=='unknown')
        rowRight.appendChild(el('span',{class:'ba-badge'},arch));
      const fav = el('span',{class:'ba-fav'+(isFav?' on':'')}, isFav?'★':'☆');
      fav.addEventListener('click',e=>{
        e.stopPropagation();
        const idx=(BCIM.CFG.favorites=BCIM.CFG.favorites||[]).indexOf(assetName);
        if(idx>=0)BCIM.CFG.favorites.splice(idx,1); else BCIM.CFG.favorites.push(assetName);
        BCIM.saveCFG(); _refreshAssetList(listEl);
      });
      rowRight.appendChild(fav);
      row.appendChild(rowRight);

      row.addEventListener('click', () => _selectAsset(a));
      listEl.appendChild(row);
    });
  }

  // ─────────────────────────────────────────────────────────
  // ASSET WÄHLEN → Phase 3 öffnen
  // ─────────────────────────────────────────────────────────
  function _selectAsset(a) {
    const fam = BCIM.S.char?.AssetFamily||'Female3DCG';
    // Auflösen zum echten Asset-Objekt
    const resolved = (a._fromCache||a.isMod||!a.Group)
      ? (BCIM.BC.getAsset(fam, BCIM.S.group, a.Name||a.name) || a)
      : a;
    BCIM.S.asset = resolved;

    // Farben aus getragenem Item übernehmen wenn gleicher Asset
    const curItem = BCIM.BC.getItem(BCIM.S.char, BCIM.S.group);
    const sameAsset = curItem?.Asset?.Name === (resolved.Name||resolved.name);
    if (sameAsset && curItem?.Color) {
      BCIM.S.colors = Array.isArray(curItem.Color)?[...curItem.Color]:[curItem.Color];
      BCIM.S.prop   = {...(curItem.Property||{})};
      BCIM.S.craft  = {...(curItem.Craft||{})};
      const arch = BCIM.BC.getArchetype(resolved);
      if (arch==='modular') BCIM.S.modSelections = BCIM.BC.decodeModular(resolved, curItem.Property?.Type||'');
      else                   BCIM.S.typedType     = curItem.Property?.Type||null;
    } else if (!sameAsset) {
      // Neues Item: State zurücksetzen
      BCIM.S.colors=[]; BCIM.S.prop={}; BCIM.S.craft={}; BCIM.S.modSelections={}; BCIM.S.typedType=null;
      BCIM.S._craftTouched=false;
    }

    // Asset-Liste aktualisieren (Highlight)
    const listEl = document.getElementById('bcim-asset-list');
    if (listEl) _refreshAssetList(listEl);

    // Phase 3 rendern
    _renderCfg();
  }

  // ─────────────────────────────────────────────────────────
  // PHASE 3: KONFIGURATOR
  // ─────────────────────────────────────────────────────────
  function _renderCfg() {
    if (!_phaseCfg) return;
    _phaseCfg.innerHTML = '';
    _phaseCfg.style.display = 'block';
    if (_phaseAct) { _phaseAct.innerHTML=''; _phaseAct.style.display='none'; }

    if (!BCIM.S.char || !BCIM.S.group || !BCIM.S.asset) {
      _phaseCfg.style.display='none'; return;
    }

    const curItem = BCIM.BC.getItem(BCIM.S.char, BCIM.S.group);
    const asset   = BCIM.S.asset;

    // Konfigurator-Content
    const cfgContent = el('div',{id:'bcim-cfg-content'});
    BCIM.CFG_RENDER?.(cfgContent, asset, curItem);
    _phaseCfg.appendChild(cfgContent);

    // Aktions-Buttons
    _buildActionBar(curItem);

    // Scrollen zum Konfigurator
    setTimeout(()=>_phaseCfg.scrollIntoView({behavior:'smooth',block:'nearest'}),50);
  }

  function _buildActionBar(curItem) {
    if (!_phaseAct) return;
    _phaseAct.innerHTML='';
    _phaseAct.style.display='flex';

    // ✓ Anlegen
    const applyBtn = el('button',{class:'bbt bbt-p'},'✓ Anlegen');
    applyBtn.addEventListener('click', _doApply);
    _phaseAct.appendChild(applyBtn);

    // ✕ Entfernen (nur wenn Item getragen)
    if (curItem) {
      const removeBtn = el('button',{class:'bbt bbt-d'},'✕ Entfernen');
      removeBtn.addEventListener('click', _doRemove);
      _phaseAct.appendChild(removeBtn);
    }

    // ↻ Refresh
    const refBtn = el('button',{class:'bbt bbt-g',title:'Aktualisieren'},'↻');
    refBtn.addEventListener('click',()=>{
      _buildSlotGrid(_phaseSlots); _renderItemBrowser(); _renderCfg();
    });
    _phaseAct.appendChild(refBtn);
  }

  function _doApply() {
    const {char:c, group:g, asset} = BCIM.S;
    if (!c||!g||!asset) { BCIM.setStatus('Kein Asset!',true); return; }

    const fp = {...BCIM.S.prop};
    const arch = BCIM.BC.getArchetype(asset);
    if (arch==='modular') fp.Type = BCIM.BC.encodeModular(asset, BCIM.S.modSelections);
    else if (arch==='typed') fp.Type = BCIM.S.typedType||undefined;

    const colors   = BCIM.S.colors?.length ? BCIM.S.colors : undefined;
    const craft    = Object.keys(BCIM.S.craft||{}).length ? BCIM.S.craft : undefined;
    const property = Object.keys(fp||{}).length ? fp : undefined;

    if (BCIM.BC.applyItem(c,g,asset,colors,craft,property)) {
      BCIM.SYNC?.saveHistory?.(c);
      BCIM.SYNC?.logAction?.('apply',g,asset.Name||asset.name,c.Name);
      BCIM.setStatus('✓ Angelegt: '+(asset.Name||asset.name||'?'),false);
      setTimeout(()=>{ _buildSlotGrid(_phaseSlots); _renderCfg(); },350);
    } else {
      BCIM.setStatus('❌ Fehler beim Anlegen',true);
    }
  }

  function _doRemove() {
    const {char:c, group:g} = BCIM.S;
    if (!c||!g) return;
    if (BCIM.BC.removeItem(c,g)) {
      BCIM.SYNC?.saveHistory?.(c);
      BCIM.SYNC?.logAction?.('remove',g,'',c.Name);
      BCIM.S.asset=null; BCIM.S.craft={}; BCIM.S.prop={};
      BCIM.S._craftTouched=false;
      BCIM.setStatus('Entfernt',false);
      setTimeout(()=>{
        _buildSlotGrid(_phaseSlots);
        _renderItemBrowser();
        if(_phaseCfg){_phaseCfg.innerHTML='';_phaseCfg.style.display='none';}
        if(_phaseAct)_phaseAct.style.display='none';
      },300);
    } else {
      BCIM.setStatus('❌ Fehler',true);
    }
  }

  // ════════════════════════════════════════════════════════
  // KÖRPER-MAP TAB
  // ════════════════════════════════════════════════════════
  const BODY_ZONES = [
    {label:'👤 Kopf',      slots:['ItemHead','HatAccessory','ItemHair']},
    {label:'👁 Gesicht',   slots:['ItemEyes','ItemEyesShadow','ItemNose','ItemEars']},
    {label:'👄 Mund',      slots:['ItemMouth','ItemMouthAccessories']},
    {label:'📿 Hals',      slots:['ItemNeck','ItemNeckRestraints','ItemNeckAccessories']},
    {label:'💪 Arme',      slots:['ItemArms','ItemHands','Gloves']},
    {label:'👕 Oberteil',  slots:['Cloth','ClothAccessory','ItemTorso','ItemTorso2']},
    {label:'🎀 Brust',     slots:['ItemBreast','Bra']},
    {label:'👖 Unterteil', slots:['ClothLower','ItemPelvis']},
    {label:'🍑 Hintern',   slots:['ItemButt','ItemVulva','ItemVulvaPiercings']},
    {label:'🦵 Beine',     slots:['ItemLegs','Socks']},
    {label:'👟 Füße',      slots:['ItemFeet','Shoes']},
    {label:'✋ Handheld',  slots:['ItemHandheld']},
  ];

  function _buildBodyTab() {
    const wrap = el('div',{class:'tab-body'});

    if (!BCIM.S.char) {
      wrap.appendChild(el('div',{class:'bempty'},'Spieler wählen'));
      content.appendChild(wrap); return;
    }

    const char = BCIM.S.char;
    const map  = el('div',{id:'bcim-body-map',style:{gridTemplateColumns:'1fr 1fr',padding:'10px 12px'}});

    BODY_ZONES.forEach(zone => {
      const items   = zone.slots.map(sl=>BCIM.BC.getItem(char,sl)).filter(Boolean);
      const hasItem = items.length > 0;
      const z = el('div',{class:`bzone${hasItem?' full':''}`});

      const left = el('div',{style:{flex:1}});
      left.appendChild(el('div',{},zone.label));
      if (hasItem) {
        items.forEach(item=>{
          const name = item.Craft?.Name||item.Asset?.Name||'?';
          left.appendChild(el('div',{style:{fontSize:'10px',color:'var(--acc)',marginTop:'2px'}},
            '· '+(item.Property?.LockedBy?'🔒 ':'')+name.replace(/([A-Z])/g,' $1').trim().slice(0,16)));
        });
      }
      z.appendChild(left);

      if (hasItem)
        z.appendChild(el('span',{style:{fontSize:'12px',color:'var(--txt3)',flexShrink:0}},items.length+'×'));

      z.addEventListener('click',()=>{
        // Zu Items-Tab wechseln und Slot direkt öffnen
        BCIM.S.tab='items';
        BCIM.$$('.bt',tabs).forEach(b=>b.classList.toggle('on',b.dataset.t==='items'));
        const target = zone.slots.find(sl=>BCIM.BC.getItem(char,sl)) || zone.slots[0];
        renderTabContent();
        setTimeout(()=>_selectSlot(target),50);
      });
      map.appendChild(z);
    });

    wrap.appendChild(map);
    content.appendChild(wrap);
  }

  // ════════════════════════════════════════════════════════
  // MONITOR (Hintergrund-Polling)
  // ════════════════════════════════════════════════════════
  BCIM._monitorInterval = setInterval(()=>{
    if (!document.getElementById('bcim-root')){clearInterval(BCIM._monitorInterval);return;}
    if (!BCIM.S.char) return;
    const changes = BCIM.SYNC?.checkChanges?.(BCIM.S.char);
    if (!changes?.length) return;
    changes.forEach(c=>{c.time=Date.now();BCIM.S.monitorAlerts.unshift(c);});
    if(BCIM.S.monitorAlerts.length>50)BCIM.S.monitorAlerts.length=50;
    const monTab=BCIM.$?.('.bt[data-t="monitor"]',tabs);
    if(monTab&&BCIM.S.tab!=='monitor'){
      let badge=monTab.querySelector('.bt-n');
      if(!badge){badge=el('span',{class:'bt-n'});monTab.appendChild(badge);}
      badge.textContent=BCIM.S.monitorAlerts.length>9?'9+':String(BCIM.S.monitorAlerts.length);
    }
    if(BCIM.S.tab==='monitor') renderTabContent();
  },2500);

  // ════════════════════════════════════════════════════════
  // COMMAND PALETTE (Ctrl+K)
  // ════════════════════════════════════════════════════════
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='k'&&document.getElementById('bcim-root')){e.preventDefault();_openPalette();}
    if(e.key==='Escape'&&document.getElementById('bcim-palette-overlay'))document.getElementById('bcim-palette-overlay')?.remove();
  });

  function _openPalette() {
    document.getElementById('bcim-palette-overlay')?.remove();
    const ov=el('div',{id:'bcim-palette-overlay'});
    const box=el('div',{id:'bcim-palette'});
    const inp=el('input',{id:'bcim-palette-input',placeholder:'⌘ Befehl suchen...',autocomplete:'off'});
    const list=el('div',{id:'bcim-palette-list'});
    let fi=0;
    const cmds=[
      ...TAB_DEFS.map(t=>({icon:t.icon,label:t.tip,sub:'Tab',action:()=>{BCIM.S.tab=t.id;BCIM.$$('.bt',tabs).forEach(b=>b.classList.toggle('on',b.dataset.t===t.id));renderTabContent();}})),
      {icon:'⟳',label:'Assets neu scannen',action:()=>{const a=BCIM.scanAssets(true);BCIM.setStatus('Scan: '+a.length,false);}},
      {icon:'⤡',label:'Panel groß',         action:()=>{root.style.width='760px';root.style.height='860px';}},
      {icon:'⊡',label:'Panel normal',       action:()=>{root.style.width='520px';root.style.height='700px';}},
    ];
    const buildList=(q='')=>{
      list.innerHTML=''; fi=0;
      const filtered=cmds.filter(c=>!q||c.label.toLowerCase().includes(q)||c.sub?.toLowerCase().includes(q));
      filtered.forEach((cmd,i)=>{
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
      if(e.key==='ArrowDown')fi=Math.min(fi+1,items.length-1);
      else if(e.key==='ArrowUp')fi=Math.max(fi-1,0);
      else if(e.key==='Enter'){cmds[fi]?.action();ov.remove();return;}
      else return;
      items.forEach((x,j)=>x.classList.toggle('focused',j===fi));
      items[fi]?.scrollIntoView({block:'nearest'});
    });
    box.appendChild(inp);box.appendChild(list);
    ov.appendChild(box);ov.addEventListener('click',e=>{if(e.target===ov)ov.remove();});
    document.body.appendChild(ov);
    setTimeout(()=>inp.focus(),50);
  }

  // ════════════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════════════
  function init() {
    renderPlayers();
    if (!BCIM.S.char) {
      const players = BCIM.BC.players();
      if (players.length) { BCIM.S.char=players[0]; renderPlayers(); }
    }
    BCIM.SYNC?.startMonitor?.(BCIM.S.char);
    renderTabContent();
    setInterval(()=>{ if(document.getElementById('bcim-root')) renderPlayers(); },5000);
    if(BCIM.CFG.chatAutoStart&&BCIM.CHAT) setTimeout(()=>BCIM.CHAT.start(),1200);
    setTimeout(()=>{
      const b=document.getElementById('bcim-scan-badge');
      if(b)b.textContent='⟳ '+BCIM._scanState.assets.length;
    },900);
    // ModSDK
    try{const sdk=window.bcModSDK||window.ModSDK;if(sdk&&!sdk.ModsInfo?.has?.('BCItemManager'))sdk.registerMod({name:'BCItemManager',version:'3.3',fullName:'BC Item Manager'});}catch{}
  }

  typeof Player!=='undefined' ? init() : (()=>{const w=setInterval(()=>{if(typeof Player!=='undefined'){clearInterval(w);init();}},500);})();
})();
