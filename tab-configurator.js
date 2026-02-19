// ── BCIM / tab-configurator.js (v3.1) ────────────────────
// Full item config: Colors, Variants, Craft, Properties, LOCKS
window.BCIM = window.BCIM || {};

BCIM.CFG_RENDER = (container, asset, curItem) => {
  const {el, UI, S, BC, SLOT_LABELS} = BCIM;
  const arch = BC.getArchetype(asset);
  const archMap = {typed:'Typed',modular:'Modular',vibrating:'Vibrating',text:'Text',basic:'Basic',unknown:'?'};

  // Header
  container.appendChild(el('div',{class:'bsh'},
    el('span',{}, (SLOT_LABELS[S.group]||S.group) + ' — ' + (curItem?.Craft?.Name||asset.Name.replace(/([A-Z])/g,' $1').trim())),
    el('span',{class:'arch'}, archMap[arch]||arch),
  ));

  _buildColors(container, asset, curItem);

  if (asset.AllowType?.length)                                    _buildTyped(container, asset);
  if (arch==='modular' && asset.Modules?.length)                  _buildModular(container, asset);
  if (asset.AllowEffect?.includes('Vibrate')||asset.IsVibrator)   _buildVibrating(container, curItem);
  if (asset.AllowText||asset.MaxText)                             _buildText(container, asset, curItem);

  _buildCraft(container, asset, curItem);
  _buildProps(container, asset, curItem);
  _buildLock(container, asset, curItem);  // ← NEW: lock always visible
};

// ── Colors ────────────────────────────────────────────────
function _buildColors(c, asset, curItem) {
  const {el, S} = BCIM;

  // Detect number of color layers from current item OR asset definition
  let numLayers = 1;
  if (curItem?.Color && Array.isArray(curItem.Color))      numLayers = curItem.Color.length;
  else if (asset.ColorableLayerCount)                       numLayers = asset.ColorableLayerCount;
  else if (Array.isArray(asset.Color))                      numLayers = asset.Color.length;
  else if (asset.Layer?.length)                             numLayers = asset.Layer.filter(l=>l.AllowColorize!==false).length || 1;

  // Init S.colors from current item if empty
  if (!S.colors.length && curItem?.Color) {
    S.colors = Array.isArray(curItem.Color) ? [...curItem.Color] : [curItem.Color];
  }
  while (S.colors.length < numLayers) S.colors.push(S.colors[0]||'#ffffff');

  c.appendChild(el('div',{class:'bsh'},'🎨 Farben ('+numLayers+' Layer)'));

  // Hex input + color picker for each layer
  const grid = el('div',{class:'bcg',style:{flexWrap:'wrap',gap:'8px'}});
  for (let i = 0; i < numLayers; i++) {
    const canColor = !asset.AllowColor || asset.AllowColor[i] !== false;
    if (!canColor) {
      grid.appendChild(el('div',{class:'bci'},el('div',{class:'bck'},'🔒'),el('div',{class:'bcl'},'L'+(i+1))));
      continue;
    }
    const currentVal = S.colors[i] || '#ffffff';
    const wrap  = el('div',{class:'bci'});
    const picker = el('input',{type:'color',class:'bcp',value:currentVal.startsWith('#')?currentVal:'#ffffff'});
    const hexInp = el('input',{type:'text',class:'bi',value:currentVal,
      style:{width:'75px',fontSize:'10px',padding:'2px 4px',fontFamily:'monospace'}});

    picker.addEventListener('input', e=>{
      S.colors[i] = e.target.value;
      hexInp.value = e.target.value;
    });
    hexInp.addEventListener('change', e=>{
      const v = e.target.value.trim();
      if(/^#[0-9a-fA-F]{6}$/.test(v)||/^#[0-9a-fA-F]{3}$/.test(v)) {
        S.colors[i] = v;
        picker.value = v;
      }
    });
    wrap.appendChild(picker);
    wrap.appendChild(hexInp);
    wrap.appendChild(el('div',{class:'bcl'}, numLayers>1 ? 'Layer '+(i+1) : 'Farbe'));
    grid.appendChild(wrap);
  }

  // Color string display (BC format)
  const colorStr = el('div',{class:'encoded-type',style:{marginTop:'4px',fontSize:'9px'}}, S.colors.join(','));
  // Paste-all: enter a BC color string
  const pasteRow = el('div',{style:{display:'flex',gap:'4px',marginTop:'4px'}});
  const pasteInp = el('input',{type:'text',class:'bi',placeholder:'BC Farb-String einfügen: #hex,#hex,...',style:{flex:1,fontSize:'10px'}});
  const pasteBtn = el('button',{class:'sbtn'},'↩ Einfügen');
  pasteBtn.addEventListener('click',()=>{
    const parts = pasteInp.value.split(',').map(s=>s.trim()).filter(s=>s.startsWith('#'));
    if(parts.length){
      S.colors = parts;
      colorStr.textContent = parts.join(',');
      c.querySelectorAll('.bcp').forEach((p,i)=>{ if(parts[i]) p.value=parts[i]; });
      c.querySelectorAll('.bi[style*="monospace"]').forEach((inp,i)=>{ if(parts[i]) inp.value=parts[i]; });
    }
  });
  pasteRow.appendChild(pasteInp); pasteRow.appendChild(pasteBtn);
  c.appendChild(grid); c.appendChild(colorStr); c.appendChild(pasteRow);
}

// ── Typed ─────────────────────────────────────────────────
function _buildTyped(c, asset) {
  const {el, S, BC} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'📐 Position / Variante'));
  const tags = el('div',{class:'btags'});
  const none = el('button',{class:'btag'+(S.typedType==null?' on':'')},'Standard');
  none.addEventListener('click',()=>{ S.typedType=null; _refreshTags(tags, asset, null); });
  tags.appendChild(none);
  asset.AllowType.forEach(t=>{
    const display = BC.translateType(asset, t) || t.replace(/([A-Z])/g,' $1').trim();
    const b = el('button',{class:'btag'+(S.typedType===t?' on':'')},display);
    b.addEventListener('click',()=>{ S.typedType=t; _refreshTags(tags, asset, t); });
    tags.appendChild(b);
  });
  c.appendChild(tags);
}
function _refreshTags(tags, asset, selected) {
  BCIM.S.typedType=selected;
  tags.querySelectorAll('.btag').forEach((b,i)=>{
    b.classList.toggle('on', i===0 ? selected==null : asset.AllowType[i-1]===selected);
  });
}

// ── Modular ───────────────────────────────────────────────
function _buildModular(c, asset) {
  const {el, S, BC} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'🧩 Module'));
  asset.Modules.forEach(mod=>{
    const key = mod.Key||mod.Name;
    const modDiv = el('div',{class:'bmod'});
    modDiv.appendChild(el('div',{class:'bmod-t'}, mod.Name||key));
    const tags = el('div',{class:'btags'});
    mod.Options.forEach(opt=>{
      const optName = typeof opt==='string'?opt:(opt.Name??'');
      let display = typeof opt==='string'?opt:(opt.Description||opt.Name||'');
      try { const tk=`${asset.Group.Name}${asset.Name}${optName}`; const tr=AssetText(tk); if(tr&&tr!==tk)display=tr; } catch {}
      if(!display||display===optName) display=optName.replace(/([A-Z])/g,' $1').trim();
      const cur=S.modSelections[key];
      const isFirst=!cur&&mod.Options[0]===opt;
      const b=el('button',{class:'btag'+((cur===optName||(!cur&&isFirst))?' on':'')},display||optName);
      b.addEventListener('click',()=>{
        S.modSelections[key]=optName;
        S.prop.Type=BC.encodeModular(asset,S.modSelections);
        tags.querySelectorAll('.btag').forEach((t,i)=>{
          const o=mod.Options[i]; t.classList.toggle('on',(typeof o==='string'?o:(o?.Name??''))===optName);
        });
        const enc=modDiv.querySelector('.encoded-type');
        if(enc) enc.textContent='→ '+S.prop.Type;
      });
      tags.appendChild(b);
    });
    if(mod.ChangeWhenLocked===false) modDiv.appendChild(el('div',{class:'bmod-sub'},'⚠ Nicht änderbar wenn gesperrt'));
    modDiv.appendChild(tags);
    c.appendChild(modDiv);
  });
  c.appendChild(el('div',{class:'encoded-type'},'→ '+(S.prop.Type||BC.encodeModular(asset,S.modSelections))));
}

// ── Vibrating ─────────────────────────────────────────────
function _buildVibrating(c, curItem) {
  const {el, S} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'💫 Vibration'));
  const modes=[
    {k:'Off',l:'Aus'},{k:'Low',l:'Niedrig'},{k:'Medium',l:'Mittel'},{k:'High',l:'Hoch'},
    {k:'Maximum',l:'Maximum'},{k:'Random',l:'Zufall'},{k:'Escalate',l:'Eskalierend'},
    {k:'Tease',l:'Teasing'},{k:'Denial',l:'Denial'},{k:'Orgasm',l:'Orgasm'},
  ];
  const cur=S.prop.Mode||curItem?.Property?.Mode||'Off';
  const tags=el('div',{class:'btags'});
  modes.forEach(m=>{
    const b=el('button',{class:'btag'+(cur===m.k?' on':'')},m.l);
    b.addEventListener('click',()=>{S.prop.Mode=m.k;tags.querySelectorAll('.btag').forEach((t,i)=>t.classList.toggle('on',modes[i].k===m.k));});
    tags.appendChild(b);
  });
  c.appendChild(tags);
}

// ── Text ──────────────────────────────────────────────────
function _buildText(c, asset, curItem) {
  const {el, S} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'✏️ Text'));
  const cur=curItem?.Property?.Text||S.prop.Text||'';
  const max=asset.MaxText||100;
  const ta=el('textarea',{class:'bta',placeholder:'Max. '+max+' Zeichen...',maxlength:String(max)},cur);
  ta.addEventListener('input',e=>{S.prop.Text=e.target.value||undefined;});
  c.appendChild(ta);
}

// ── Craft ─────────────────────────────────────────────────
function _buildCraft(c, asset, curItem) {
  const {el, S, BC, UI} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'✦ Craft-Einstellungen'));

  // Material
  const matSel=el('select',{class:'bsel'});
  matSel.appendChild(el('option',{value:''},'— Kein Material —'));
  BC.craftMaterials.forEach(m=>{
    const o=el('option',{value:m},m); if(S.craft.Property===m) o.selected=true; matSel.appendChild(o);
  });
  matSel.addEventListener('change',e=>{S.craft.Property=e.target.value||undefined;});

  // Name
  const nameInp=el('input',{type:'text',class:'bi',placeholder:'Craft-Name (z.B. PetGag)...',value:S.craft.Name||''});
  nameInp.addEventListener('input',e=>{S.craft.Name=e.target.value||undefined;});

  // Description
  const descTA=el('textarea',{class:'bta',style:{minHeight:'42px'},
    placeholder:'Beschreibung (z.B. "tamperproof""electric")...'},S.craft.Description||'');
  descTA.addEventListener('input',e=>{S.craft.Description=e.target.value||undefined;});

  // Color override
  const colorRow=el('div',{class:'btr'},
    el('span',{class:'btr-l'},'Farb-Override'),
    (()=>{
      const ci=el('input',{type:'color',class:'bcp',style:{width:'28px',height:'28px'},value:S.craft.Color||'#ffffff'});
      ci.addEventListener('input',e=>{S.craft.Color=e.target.value;}); return ci;
    })()
  );

  // Drawing priority
  const prioInp=el('input',{type:'number',class:'bi',min:'0',max:'100',
    value:S.craft.ItemOrder??'',placeholder:'Drawing Priority (0-100)'});
  prioInp.addEventListener('input',e=>{S.craft.ItemOrder=parseInt(e.target.value)||undefined;});

  [
    el('div',{class:'bf'},el('label',{class:'bl'},'Material'),matSel),
    el('div',{class:'bf'},el('label',{class:'bl'},'Name'),nameInp),
    el('div',{class:'bf'},el('label',{class:'bl'},'Beschreibung'),descTA),
    colorRow,
    el('div',{class:'bf'},el('label',{class:'bl'},'Drawing Priority'),prioInp),
    UI.toggle('Privat (Name nur für dich)',!!S.craft.Private, v=>{S.craft.Private=v||undefined;}),
    UI.toggle('Für Mitglied sperren',      !!S.craft.Lock,    v=>{S.craft.Lock=v||undefined;}),
  ].forEach(n=>c.appendChild(n));
}

// ── Properties ────────────────────────────────────────────
function _buildProps(c, asset, curItem) {
  const {el, S, UI} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'⚙ Eigenschaften'));

  const dv=S.prop.Difficulty??curItem?.Property?.Difficulty??0;
  const dlbl=el('span',{class:'bslr-v'},String(dv));
  const dslr=el('input',{type:'range',class:'bslr',min:'0',max:'20',value:String(dv)});
  dslr.addEventListener('input',e=>{S.prop.Difficulty=parseInt(e.target.value);dlbl.textContent=e.target.value;});
  c.appendChild(el('div',{class:'bf'},el('label',{class:'bl'},'Escape-Schwierigkeit (0-20)'),el('div',{class:'bslr-r'},dslr,dlbl)));

  c.appendChild(UI.toggle('Selbst entfernen möglich',S.prop.SelfUnlock??true,v=>{S.prop.SelfUnlock=v;}));

  if(asset.Effect?.length){
    const ft=el('div',{class:'btags'});
    asset.Effect.forEach(f=>ft.appendChild(el('span',{class:'btag on',style:{cursor:'default',opacity:'.6'}},f)));
    c.appendChild(el('div',{class:'bf'},el('label',{class:'bl'},'Effekte (fest)'),ft));
  }
  if(asset.Block?.length)    c.appendChild(el('div',{class:'binfo'},'Blockiert: '+asset.Block.join(', ')));
  if(asset.AllowLock===false) c.appendChild(el('div',{class:'binfo',style:{color:'#fb923c'}},'⚠ Dieses Item ist nicht sperrbar'));
}

// ── Lock (INTEGRATED) ─────────────────────────────────────
function _buildLock(c, asset, curItem) {
  const {el, UI, S, BC, setStatus} = BCIM;
  if (asset.AllowLock===false) return; // skip if explicitly not lockable

  c.appendChild(el('div',{class:'bsh'},'🔒 Schloss'));

  const existing = curItem?.Property?.LockedBy;
  if (existing) {
    // Show current lock + unlock button
    const lockInfo = el('div',{class:'card',style:{marginBottom:'6px'}});
    const rem = curItem?.Property?.RemoveItemTime;
    let timerStr = '';
    if (rem) {
      const ms = rem - Date.now();
      if (ms > 0) {
        const h=Math.floor(ms/3600000), m=Math.floor((ms%3600000)/60000), s=Math.floor((ms%60000)/1000);
        timerStr = ` · ${h}h ${m}m ${s}s`;
      } else timerStr = ' · Abgelaufen';
    }
    lockInfo.appendChild(el('div',{class:'card-title'},BC.LOCK_DEFS[existing]?.label||existing, timerStr));
    lockInfo.appendChild(el('div',{class:'card-sub',style:{marginBottom:'5px'}},
      curItem.Property?.Password ? '🔑 Passwort gesetzt' : '',
    ));
    const unlockBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%'}},'🔓 Schloss entfernen');
    unlockBtn.addEventListener('click',()=>{
      const res=BC.removeLock(S.char, S.group);
      if(res.ok){setStatus('✓ Schloss entfernt',false); c.querySelector('#bcim-lock-section')?.remove(); _buildLock(c,asset,BCIM.BC.getItem(S.char,S.group));}
      else setStatus('❌ '+res.reason,true);
    });
    lockInfo.appendChild(unlockBtn);
    lockInfo.id='bcim-lock-section';
    c.appendChild(lockInfo);
    return;
  }

  // No lock — show lock selector
  const lockWrap = el('div',{id:'bcim-lock-section'});

  // Lock type selector
  let selectedLock = 'MetalPadlock';
  const lockBtns = el('div',{class:'btags',style:{marginBottom:'8px'}});
  Object.entries(BC.LOCK_DEFS).forEach(([key,def])=>{
    const b=el('button',{class:'btag'+(key===selectedLock?' on':'')},def.label);
    b.addEventListener('click',()=>{
      selectedLock=key;
      lockBtns.querySelectorAll('.btag').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      renderLockFields();
    });
    lockBtns.appendChild(b);
  });
  lockWrap.appendChild(lockBtns);

  // Dynamic fields
  const fieldsEl = el('div',{id:'bcim-lock-fields'});
  let lockOpts = {};

  const renderLockFields = () => {
    fieldsEl.innerHTML='';
    lockOpts={};
    const def=BC.LOCK_DEFS[selectedLock];
    if(!def) return;

    if (def.fields.includes('timer')) {
      // H:M:S inputs
      fieldsEl.appendChild(el('label',{class:'bl'},'⏱ Timer (H : M : S)'));
      const row=el('div',{style:{display:'flex',gap:'4px',marginBottom:'6px',alignItems:'center'}});
      const hInp=el('input',{type:'number',class:'bi',min:'0',max:'720',value:'0',style:{flex:'1'},placeholder:'Std'});
      const mInp=el('input',{type:'number',class:'bi',min:'0',max:'59', value:'0',style:{flex:'1'},placeholder:'Min'});
      const sInp=el('input',{type:'number',class:'bi',min:'0',max:'59', value:'0',style:{flex:'1'},placeholder:'Sek'});
      const updateTimer=()=>{
        const sec=BC.hmsToSeconds(hInp.value,mInp.value,sInp.value);
        lockOpts.timerSeconds=sec;
        timerPreview.textContent=sec>0?`= ${sec}s (${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m ${sec%60}s)`:'';
      };
      [hInp,mInp,sInp].forEach(i=>i.addEventListener('input',updateTimer));
      const timerPreview=el('div',{class:'binfo',style:{marginBottom:'4px'}});
      [el('span',{class:'card-sub'},'H:'),hInp,el('span',{class:'card-sub'},'M:'),mInp,el('span',{class:'card-sub'},'S:'),sInp]
        .forEach(n=>row.appendChild(n));
      fieldsEl.appendChild(row); fieldsEl.appendChild(timerPreview);
    }

    if (def.fields.includes('password')) {
      const pwInp=el('input',{type:'text',class:'bi',placeholder:'Passwort...',style:{marginBottom:'4px'}});
      pwInp.addEventListener('input',e=>lockOpts.password=e.target.value);
      const hintInp=el('input',{type:'text',class:'bi',placeholder:'Hinweis (optional)...',style:{marginBottom:'4px'}});
      hintInp.addEventListener('input',e=>lockOpts.hint=e.target.value);
      fieldsEl.appendChild(el('label',{class:'bl'},'Passwort'));
      fieldsEl.appendChild(pwInp);
      fieldsEl.appendChild(el('label',{class:'bl'},'Hinweis'));
      fieldsEl.appendChild(hintInp);
    }

    if (def.fields.includes('combination')) {
      const combInp=el('input',{type:'text',class:'bi',placeholder:'4-stellig (z.B. 1234)...',maxlength:'4',style:{marginBottom:'4px'}});
      combInp.addEventListener('input',e=>lockOpts.combination=e.target.value);
      fieldsEl.appendChild(el('label',{class:'bl'},'Kombination'));
      fieldsEl.appendChild(combInp);
    }
  };
  renderLockFields();
  lockWrap.appendChild(fieldsEl);

  // CONFIRM BUTTON
  const applyLockBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'4px'}},'🔒 Schloss anlegen & bestätigen');
  applyLockBtn.addEventListener('click',()=>{
    if(!S.char||!S.group){setStatus('Kein Slot gewählt',true);return;}
    const item=BC.getItem(S.char,S.group);
    if(!item){setStatus('Erst Item anlegen!',true);return;}
    const res=BC.applyLock(S.char,S.group,selectedLock,lockOpts);
    if(res.ok) setStatus('✓ Schloss angelegt: '+(BC.LOCK_DEFS[selectedLock]?.label||selectedLock),false);
    else       setStatus('❌ '+res.reason,true);
  });
  lockWrap.appendChild(applyLockBtn);
  c.appendChild(lockWrap);
}