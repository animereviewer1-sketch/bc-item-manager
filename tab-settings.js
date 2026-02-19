// ── BCIM / tabs / tab-settings.js ────────────────────────
window.BCIM = window.BCIM || {};

BCIM.TAB_SETTINGS = () => {
  const {el, UI, CFG, saveCFG, BC, setStatus, THEMES, buildCSS} = BCIM;
  const body = el('div',{class:'tab-body'});

  // ── Theme ──────────────────────────────────────────────────
  body.appendChild(UI.section('🎨 Theme'));
  const themeCard=el('div',{class:'card'});
  const swatches=el('div',{style:{display:'flex',gap:'10px',alignItems:'center'}});
  [
    {k:'dark',   color:'#0c0c14', label:'Dark'},
    {k:'purple', color:'#1e1033', label:'Purple'},
    {k:'pink',   color:'#200f1a', label:'Pink'},
  ].forEach(t=>{
    const sw=el('div',{class:'theme-swatch'+(CFG.theme===t.k?' on':''),
      style:{background:t.color,border:`2.5px solid ${THEMES[t.k].acc}`},title:t.label});
    const lbl=el('div',{style:{fontSize:'10px',color:'var(--txt2)',textAlign:'center',marginTop:'3px'}},t.label);
    const wrap=el('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',cursor:'pointer'}});
    wrap.appendChild(sw); wrap.appendChild(lbl);
    wrap.addEventListener('click',()=>{
      CFG.theme=t.k; saveCFG(); buildCSS();
      swatches.querySelectorAll('.theme-swatch').forEach(s=>s.classList.toggle('on',s.title===t.label));
      // Force opacity update
      const root=document.getElementById('bcim-root');
      if(root)root.style.opacity=CFG.opacity;
    });
    swatches.appendChild(wrap);
  });
  themeCard.appendChild(swatches);
  body.appendChild(themeCard);

  // ── Opacity ────────────────────────────────────────────────
  body.appendChild(UI.section('🌫 Transparenz'));
  const opCard=el('div',{class:'card'});
  const opSlider=UI.slider(null,Math.round(CFG.opacity*100),20,100,v=>{
    CFG.opacity=v/100; saveCFG();
    const root=document.getElementById('bcim-root');
    if(root)root.style.opacity=CFG.opacity;
  });
  opCard.appendChild(opSlider);
  body.appendChild(opCard);

  // ── Mini mode ──────────────────────────────────────────────
  body.appendChild(UI.section('🪟 Fenster'));
  body.appendChild(UI.card(
    UI.toggle('Mini-Modus (nur Titelleiste)',CFG.miniMode,v=>{
      CFG.miniMode=v; saveCFG();
      const root=document.getElementById('bcim-root');
      if(root){ root.classList.toggle('mini',v); }
      const btn=document.getElementById('bcim-mini-btn');
      if(btn)btn.textContent=v?'□':'_';
    }),
  ));

  // ── Keyboard shortcuts ─────────────────────────────────────
  body.appendChild(UI.section('⌨ Tastenkürzel'));
  body.appendChild(UI.card(
    el('div',{class:'card-sub',style:{marginBottom:'6px'}},'Diese Shortcuts funktionieren im BC-Fenster:'),
    ...[
      ['Ctrl+K / ⌘K','Command Palette öffnen'],
      ['Escape',      'Palette / Overlay schließen'],
    ].map(([k,l])=>el('div',{class:'card-row',style:{marginBottom:'4px'}},
      el('span',{class:'palette-kbd'},k),
      el('span',{class:'card-sub',style:{flex:1,marginLeft:'8px'}},l),
    )),
  ));

  // ── Favorites ──────────────────────────────────────────────
  body.appendChild(UI.section('⭐ Favoriten-Items'));
  const favCard=el('div',{class:'card'});
  const favListEl=el('div');
  const renderFavs=()=>{
    favListEl.innerHTML='';
    if(!CFG.favorites?.length){
      favListEl.appendChild(el('div',{class:'section-note'},'Noch keine Favoriten — über ☆ in der Suche hinzufügen.'));
      return;
    }
    CFG.favorites.forEach((name,i)=>{
      const row=el('div',{class:'card-row',style:{marginBottom:'4px'}},
        el('span',{style:{flex:1,fontSize:'11px'}},name.replace(/([A-Z])/g,' $1').trim()),
        el('button',{class:'sbtn sbtn-d',style:{padding:'2px 6px'}},'✕'),
      );
      row.querySelector('.sbtn').addEventListener('click',()=>{CFG.favorites.splice(i,1);saveCFG();renderFavs();});
      favListEl.appendChild(row);
    });
    const clrBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%',marginTop:'4px'}},'Alle Favoriten löschen');
    clrBtn.addEventListener('click',()=>{CFG.favorites=[];saveCFG();renderFavs();});
    favListEl.appendChild(clrBtn);
  };
  renderFavs();
  favCard.appendChild(favListEl);
  body.appendChild(favCard);

  // ── Chat Engine defaults ────────────────────────────────────
  body.appendChild(UI.section('💬 Chat-Engine'));
  body.appendChild(UI.card(
    UI.toggle('Chat-Engine auto-starten',CFG.chatAutoStart||false,v=>{CFG.chatAutoStart=v;saveCFG();}),
    el('div',{class:'binfo'},'Startet die Chat-Engine automatisch beim Laden des Panels.'),
  ));

  // ── Karma defaults ─────────────────────────────────────────
  body.appendChild(UI.section('⭐ Karma'));
  const karmaDefaultsBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%',marginBottom:'5px'}},'⟳ Karma-Config auf Standard zurücksetzen');
  karmaDefaultsBtn.addEventListener('click',()=>{
    BCIM.UI.confirmOverlay('Karma-Konfiguration wirklich zurücksetzen?',()=>{
      BCIM.KARMA?.resetToDefaults();
      setStatus('Karma-Config zurückgesetzt',false);
    });
  });
  body.appendChild(UI.card(karmaDefaultsBtn));

  // ── ModSDK / Addon info ────────────────────────────────────
  body.appendChild(UI.section('🧩 Addon Loader / ModSDK'));
  const addonCard=el('div',{class:'card'});
  const addons=BC.loadedAddons();
  if(!addons.length){
    addonCard.appendChild(el('div',{class:'section-note'},'Kein ModSDK erkannt — Addon-Items werden möglicherweise nicht gefunden.'));
  } else {
    addonCard.appendChild(el('div',{class:'card-sub',style:{marginBottom:'5px'}},`${addons.length} Mods/Addons geladen:`));
    addons.forEach(a=>{
      addonCard.appendChild(el('div',{class:'card-row',style:{marginBottom:'3px'}},
        el('span',{style:{color:'var(--acc)',fontSize:'11px'}},'⬡ '),
        el('span',{style:{fontSize:'11px'}},a),
      ));
    });
  }
  body.appendChild(addonCard);

  // ── About ──────────────────────────────────────────────────
  body.appendChild(UI.section('ℹ Info'));
  body.appendChild(UI.card(
    el('div',{class:'card-title'},'BC Item Manager v3.0'),
    el('div',{class:'card-sub',style:{marginTop:'3px'}},'14 Tabs · 18 Dateien · Modulare Architektur'),
    el('div',{class:'card-sub',style:{marginTop:'2px'}},'Bookmarklet · Clientseitig · Nur LocalStorage'),
    el('div',{class:'card-sub',style:{marginTop:'6px',color:'#4ade80'}},'✓ Kein Tracking. Keine Server. Alle Daten lokal.'),
  ));

  return body;
};
