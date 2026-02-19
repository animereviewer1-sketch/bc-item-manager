// ── BCIM / tabs / tab-configurator.js ────────────────────
// Renders the item config panel into a given container element
window.BCIM = window.BCIM || {};

BCIM.CFG_RENDER = (container, asset, curItem) => {
  const {el, UI, S, BC, SLOT_LABELS} = BCIM;
  const arch = BC.getArchetype(asset);
  const archLabels = {typed:'Typed',modular:'Modular',vibrating:'Vibrating',text:'Text',basic:'Basic',unknown:'?'};

  container.appendChild(el('div',{class:'bsh'},
    el('span',{},(SLOT_LABELS[S.group]||S.group)+' — '+(curItem?.Craft?.Name||asset.Name.replace(/([A-Z])/g,' $1').trim())),
    el('span',{class:'arch'},archLabels[arch]||arch),
  ));

  _buildColors(container, asset, curItem);

  if ((arch==='typed'||arch==='basic') && asset.AllowType?.length) _buildTyped(container, asset);
  if (arch==='modular' && asset.Modules?.length)                   _buildModular(container, asset);
  if (arch==='vibrating'||(arch!=='modular'&&(asset.AllowEffect?.includes('Vibrate')||asset.IsVibrator))) _buildVibrating(container, curItem);
  if (asset.AllowText||asset.MaxText)                              _buildText(container, asset, curItem);

  _buildCraft(container, asset, curItem);
  _buildProps(container, asset, curItem);
};

// ── Colors ────────────────────────────────────────────────
function _buildColors(c, asset, curItem) {
  const {el, S, BC} = BCIM;
  const num = Array.isArray(asset.Color) ? asset.Color.length : (asset.ColorableLayerCount||1);
  while (S.colors.length < num) S.colors.push('#ffffff');

  const grid = el('div',{class:'bcg'});
  for (let i=0;i<num;i++) {
    const canColor = !asset.AllowColor || asset.AllowColor[i] !== false;
    if (canColor) {
      const inp = el('input',{type:'color',class:'bcp',value:S.colors[i]||'#ffffff'});
      inp.addEventListener('input',e=>{S.colors[i]=e.target.value;});
      if (BCIM.CFG.masterColorGroup===S.group&&i===0) {
        inp.style.outline='2px solid var(--acc)'; inp.title='Master-Farbe';
      }
      grid.appendChild(el('div',{class:'bci'},inp,el('div',{class:'bcl'},num>1?`L${i+1}`:'Farbe')));
    } else {
      grid.appendChild(el('div',{class:'bci'},el('div',{class:'bck'},'🔒'),el('div',{class:'bcl'},`L${i+1}`)));
    }
  }
  c.appendChild(el('div',{class:'bsh'},'Farben'));
  c.appendChild(grid);
}

// ── Typed ────────────────────────────────────────────────
function _buildTyped(c, asset) {
  const {el, S, BC} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'Position / Variante'));
  const tags = el('div',{class:'btags'});
  const none = el('button',{class:'btag'+(S.typedType==null?' on':'')},'Standard');
  none.addEventListener('click',()=>{S.typedType=null; _refreshTyped(tags,asset,null);});
  tags.appendChild(none);
  asset.AllowType.forEach(t=>{
    const display = BC.translateType(asset,t);
    const b = el('button',{class:'btag'+(S.typedType===t?' on':'')},display);
    b.addEventListener('click',()=>{S.typedType=t; _refreshTyped(tags,asset,t);});
    tags.appendChild(b);
  });
  c.appendChild(tags);
  c.appendChild(el('div',{class:'binfo'},`→ ${S.typedType||'(Standard)'}`));
}

function _refreshTyped(tags, asset, selected) {
  BCIM.S.typedType = selected;
  tags.querySelectorAll('.btag').forEach((btn,i)=>{
    if (i===0) btn.classList.toggle('on', selected==null);
    else btn.classList.toggle('on', asset.AllowType[i-1]===selected);
  });
}

// ── Modular ───────────────────────────────────────────────
function _buildModular(c, asset) {
  const {el, S, BC} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'Module & Position'));

  asset.Modules.forEach(mod=>{
    const key = mod.Key||mod.Name;
    const modDiv = el('div',{class:'bmod'});
    modDiv.appendChild(el('div',{class:'bmod-t'},mod.Name||key));
    const tags = el('div',{class:'btags'});
    mod.Options.forEach(opt=>{
      const optName  = typeof opt==='string'?opt:(opt.Name??'');
      let display    = typeof opt==='string'?opt:(opt.Description||opt.Name||'');
      try { const tk=`${asset.Group.Name}${asset.Name}${optName}`; const tr=AssetText(tk); if(tr&&tr!==tk)display=tr; } catch {}
      if(!display||display===optName) display=optName.replace(/([A-Z])/g,' $1').trim();

      const cur     = S.modSelections[key];
      const isFirst = !cur && mod.Options[0]===opt;
      const b = el('button',{class:'btag'+((cur===optName||(!cur&&isFirst))?' on':'')},display||optName);
      b.addEventListener('click',()=>{
        S.modSelections[key] = optName;
        S.prop.Type = BC.encodeModular(asset, S.modSelections);
        tags.querySelectorAll('.btag').forEach((t,i)=>{
          const o=mod.Options[i]; const n=typeof o==='string'?o:(o?.Name??'');
          t.classList.toggle('on', n===optName);
        });
        const enc = modDiv.querySelector('.encoded-type');
        if(enc) enc.textContent=`→ ${S.prop.Type}`;
      });
      tags.appendChild(b);
    });
    modDiv.appendChild(tags);
    if(mod.ChangeWhenLocked===false) modDiv.appendChild(el('div',{class:'bmod-sub'},'⚠ Nicht änderbar wenn gesperrt'));
    c.appendChild(modDiv);
  });

  const encoded = S.prop.Type || BC.encodeModular(asset, S.modSelections);
  c.appendChild(el('div',{class:'encoded-type'},`→ ${encoded}`));
}

// ── Vibrating ─────────────────────────────────────────────
function _buildVibrating(c, curItem) {
  const {el, S} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'Vibration'));
  const modes = [
    {k:'Off',l:'Aus'},{k:'Low',l:'Niedrig'},{k:'Medium',l:'Mittel'},{k:'High',l:'Hoch'},
    {k:'Maximum',l:'Maximum'},{k:'Random',l:'Zufall'},{k:'Escalate',l:'Eskalierend'},
    {k:'Tease',l:'Teasing'},{k:'Denial',l:'Denial'},{k:'Orgasm',l:'Orgasm'},
  ];
  const cur  = S.prop.Mode || curItem?.Property?.Mode || 'Off';
  const tags = el('div',{class:'btags'});
  modes.forEach(m=>{
    const b = el('button',{class:'btag'+(cur===m.k?' on':'')},m.l);
    b.addEventListener('click',()=>{
      S.prop.Mode = m.k;
      tags.querySelectorAll('.btag').forEach((t,i)=>t.classList.toggle('on',modes[i].k===m.k));
    });
    tags.appendChild(b);
  });
  c.appendChild(tags);
}

// ── Text ──────────────────────────────────────────────────
function _buildText(c, asset, curItem) {
  const {el, S} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'Beschriftung'));
  const cur = curItem?.Property?.Text || S.prop.Text || '';
  const max = asset.MaxText||100;
  const ta  = el('textarea',{class:'bta',placeholder:`Max. ${max} Zeichen...`,maxlength:String(max)},cur);
  ta.addEventListener('input',e=>{S.prop.Text=e.target.value||undefined;});
  c.appendChild(ta);
}

// ── Craft ─────────────────────────────────────────────────
function _buildCraft(c, asset, curItem) {
  const {el, S, BC, UI} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'✦ Craft'));

  const matSel = el('select',{class:'bsel'});
  matSel.appendChild(el('option',{value:''},'— Standard —'));
  BC.craftMaterials.forEach(m=>{
    const o=el('option',{value:m},m); if(S.craft.Property===m)o.selected=true; matSel.appendChild(o);
  });
  matSel.addEventListener('change',e=>{S.craft.Property=e.target.value||undefined;});

  const nameInp = el('input',{type:'text',class:'bi',placeholder:'Custom Name...',value:S.craft.Name||''});
  nameInp.addEventListener('input',e=>{S.craft.Name=e.target.value||undefined;});

  const descTA = el('textarea',{class:'bta',style:{minHeight:'38px'},placeholder:'Beschreibung...'},S.craft.Description||'');
  descTA.addEventListener('input',e=>{S.craft.Description=e.target.value||undefined;});

  const craftColor = el('div',{class:'btr'},
    el('span',{class:'btr-l'},'Farb-Override'),
    (()=>{
      const ci=el('input',{type:'color',class:'bcp',style:{width:'30px',height:'30px'},value:S.craft.Color||'#ffffff'});
      ci.addEventListener('input',e=>{S.craft.Color=e.target.value;}); return ci;
    })()
  );

  [
    el('div',{class:'bf'},el('label',{class:'bl'},'Material'),matSel),
    el('div',{class:'bf'},el('label',{class:'bl'},'Name'),nameInp),
    el('div',{class:'bf'},el('label',{class:'bl'},'Beschreibung'),descTA),
    craftColor,
    UI.toggle('Privat (Name verbergen)', !!S.craft.Private, v=>{S.craft.Private=v||undefined;}),
    UI.toggle('Für Mitglied sperren',    !!S.craft.Lock,    v=>{S.craft.Lock=v||undefined;}),
  ].forEach(n=>c.appendChild(n));
}

// ── Properties ────────────────────────────────────────────
function _buildProps(c, asset, curItem) {
  const {el, S, UI} = BCIM;
  c.appendChild(el('div',{class:'bsh'},'Eigenschaften'));

  // Difficulty
  const dv   = S.prop.Difficulty ?? curItem?.Property?.Difficulty ?? curItem?.Difficulty ?? 0;
  const dlbl = el('span',{class:'bslr-v'},String(dv));
  const dslr = el('input',{type:'range',class:'bslr',min:'0',max:'20',value:String(dv)});
  dslr.addEventListener('input',e=>{S.prop.Difficulty=parseInt(e.target.value);dlbl.textContent=e.target.value;});
  c.appendChild(el('div',{class:'bf'},el('label',{class:'bl'},'Escape-Schwierigkeit'),el('div',{class:'bslr-r'},dslr,dlbl)));

  // SelfUnlock
  c.appendChild(UI.toggle('Selbst entfernen möglich', S.prop.SelfUnlock??true, v=>{S.prop.SelfUnlock=v;}));

  // RemoveTimer
  const ti = el('input',{type:'number',class:'bi',min:'0',max:'86400',value:S.prop.RemoveTimer||'0',placeholder:'0 = kein Timer'});
  ti.addEventListener('input',e=>{const v=parseInt(e.target.value);S.prop.RemoveTimer=v>0?v:undefined;});
  c.appendChild(el('div',{class:'bf'},el('label',{class:'bl'},'Auto-Remove Timer (Sekunden)'),ti));

  // Effects info
  if (asset.Effect?.length) {
    const ft = el('div',{class:'btags'});
    asset.Effect.forEach(f=>ft.appendChild(el('span',{class:'btag on',style:{cursor:'default',opacity:'.6'}},f)));
    c.appendChild(el('div',{class:'bf'},el('label',{class:'bl'},'Effekte (fest)'),ft));
  }
  if (asset.Block?.length)    c.appendChild(el('div',{class:'binfo'},`Blockiert: ${asset.Block.join(', ')}`));
  if (asset.AllowLock===false) c.appendChild(el('div',{class:'binfo'},'⚠ Nicht sperrbar'));
}
