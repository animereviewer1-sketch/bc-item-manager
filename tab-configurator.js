// ── BCIM / tab-configurator.js (v3.3) ─────────────────────
// Vollständige Item-Konfiguration: Farben · Modular · Typed · Vibrator ·
// Shock/AutoPunish · PublicMode · MandatoryWord · Inflate · BodyWriting ·
// AllowEffect-Overrides · Craft+wearCrafted · Escape-Props · Lock
window.BCIM = window.BCIM || {};

// ═══════════════════════════════════════════════════════════
// HILFSFUNKTIONEN
// ═══════════════════════════════════════════════════════════

// Liest ALLE konfigurierbaren Property-Felder aus einem Item aus
function _readAllProperties(asset, curItem) {
  const prop = curItem?.Property || {};
  const out  = {};

  // ── Grundlegende Felder ─────────────────────────────────
  if (prop.Type          != null) out.Type          = prop.Type;
  if (prop.Mode          != null) out.Mode          = prop.Mode;
  if (prop.Intensity     != null) out.Intensity     = prop.Intensity;
  if (prop.State         != null) out.State         = prop.State;
  if (prop.Difficulty    != null) out.Difficulty    = prop.Difficulty;
  if (prop.SelfUnlock    != null) out.SelfUnlock    = prop.SelfUnlock;
  if (prop.Text          != null) out.Text          = prop.Text;
  if (prop.InflateLevel  != null) out.InflateLevel  = prop.InflateLevel;
  if (prop.Effect        != null) out.Effect        = prop.Effect;
  if (prop.Block         != null) out.Block         = prop.Block;

  // ── Schock / AutoPunish ─────────────────────────────────
  if (prop.AutoPunish    != null) out.AutoPunish    = prop.AutoPunish;
  if (prop.ShockLevel    != null) out.ShockLevel    = prop.ShockLevel;
  if (prop.AutoPunishUndoTimeSaved != null) out.AutoPunishUndoTimeSaved = prop.AutoPunishUndoTimeSaved;
  if (prop.TriggerValues != null) out.TriggerValues = prop.TriggerValues;

  // ── Futuristic Training Belt ────────────────────────────
  if (prop.PublicModeSetting != null) out.PublicModeSetting = prop.PublicModeSetting;
  if (prop.MandatoryWord     != null) out.MandatoryWord     = prop.MandatoryWord;

  // ── Chat-Nachrichten ────────────────────────────────────
  if (prop.ShowMessage    != null) out.ShowMessage   = prop.ShowMessage;
  if (prop.ChatMessage    != null) out.ChatMessage   = prop.ChatMessage;

  // ── Locks ───────────────────────────────────────────────
  if (prop.LockedBy           != null) out.LockedBy           = prop.LockedBy;
  if (prop.RemoveTimer        != null) out.RemoveTimer        = prop.RemoveTimer;
  if (prop.RemoveItemTime     != null) out.RemoveItemTime     = prop.RemoveItemTime;
  if (prop.Password           != null) out.Password           = prop.Password;
  if (prop.Hint               != null) out.Hint               = prop.Hint;
  if (prop.CombinationNumber  != null) out.CombinationNumber  = prop.CombinationNumber;
  if (prop.LockMemberNumber   != null) out.LockMemberNumber   = prop.LockMemberNumber;
  if (prop.MemberNumberListOfRestrictedUsers != null) out.MemberNumberListOfRestrictedUsers = prop.MemberNumberListOfRestrictedUsers;

  return out;
}

// Erkennt ob ein Asset eine bestimmte Property-Funktion unterstützt
function _assetSupports(asset, feat) {
  switch (feat) {
    case 'vibrate':    return !!(asset.IsVibrator || asset.AllowEffect?.includes('Vibrate'));
    case 'inflate':    return !!(asset.AllowInflate || asset.AllowEffect?.includes('Inflate'));
    case 'shock':      return !!(asset.AllowEffect?.includes('Shock') ||
                                  asset.Name?.includes('Futuristic') ||
                                  asset.Name?.includes('Electric') ||
                                  asset.Name?.includes('Shock') ||
                                  asset.FuturisticRecolor);
    case 'autoPunish': return !!(asset.AllowEffect?.includes('Shock') ||
                                  asset.Name?.includes('Futuristic') ||
                                  asset.Name?.toLowerCase().includes('chastity'));
    case 'publicMode': return !!(asset.Name?.includes('Training') && asset.Name?.includes('Futuristic'));
    case 'bodyWrite':  return !!(asset.AllowText || asset.MaxText || asset.AllowEffect?.includes('Tighten'));
    case 'text':       return !!(asset.AllowText || asset.MaxText);
    case 'stimLevel':  return asset.StimLevel != null;
    default: return false;
  }
}

// Vibrations-Modi
const VIBRATE_MODES = [
  {k:'Off',      l:'⬜ Aus'},
  {k:'Low',      l:'🔵 Niedrig'},
  {k:'Medium',   l:'🟡 Mittel'},
  {k:'High',     l:'🟠 Hoch'},
  {k:'Maximum',  l:'🔴 Maximum'},
  {k:'Random',   l:'🎲 Zufall'},
  {k:'Escalate', l:'⬆ Eskalierend'},
  {k:'Tease',    l:'💜 Teasing'},
  {k:'Denial',   l:'🚫 Denial'},
  {k:'Orgasm',   l:'💥 Orgasm'},
];

const SHOCK_LEVELS = [
  {k:0, l:'🟢 Sanft'},
  {k:1, l:'🟡 Mittel'},
  {k:2, l:'🟠 Stark'},
  {k:3, l:'🔴 Maximum'},
];

const PUBLIC_MODE_SETTINGS = [
  {k:0, l:'🔒 Nur Keyholder'},
  {k:1, l:'⭐ Club Mistresses'},
  {k:2, l:'🌐 Öffentlich (alle)'},
];

// ═══════════════════════════════════════════════════════════
// MAIN RENDERER
// ═══════════════════════════════════════════════════════════
BCIM.CFG_RENDER = (container, asset, curItem) => {
  const { el, UI, S, BC, SLOT_LABELS } = BCIM;
  const arch     = BC.getArchetype(asset);
  const archMap  = {typed:'Typed',modular:'Modular',vibrating:'Vibrating',text:'Text',basic:'Basic',unknown:'?'};
  const allProps = _readAllProperties(asset, curItem);

  // Header
  const craftName = curItem?.Craft?.Name || asset.Name.replace(/([A-Z])/g,' $1').trim();
  container.appendChild(el('div',{class:'bsh'},
    el('span',{}, (SLOT_LABELS[S.group]||S.group) + ' — ' + craftName),
    el('span',{class:'arch'}, archMap[arch]||arch),
  ));

  // ── Panels in Reihenfolge ────────────────────────────────
  _buildColors(container, asset, curItem);

  if (asset.AllowType?.length)                              _buildTyped(container, asset, curItem);
  if (arch==='modular' && asset.Modules?.length)            _buildModular(container, asset, curItem);

  // Vibrator (alle die einen haben — auch modular mit VibratingPlug)
  if (_assetSupports(asset,'vibrate') || allProps.Mode != null)
    _buildVibrator(container, asset, curItem, allProps);

  // Schock / AutoPunish
  if (_assetSupports(asset,'shock') || allProps.AutoPunish != null || allProps.ShockLevel != null)
    _buildShock(container, asset, curItem, allProps);

  // Public Mode Setting (Futuristic Training Belt)
  if (_assetSupports(asset,'publicMode') || allProps.PublicModeSetting != null)
    _buildPublicMode(container, curItem, allProps);

  // Pflicht-Wort (Training Belt)
  if (allProps.MandatoryWord != null || _assetSupports(asset,'publicMode'))
    _buildMandatoryWord(container, curItem, allProps);

  // Aufblasbar
  if (_assetSupports(asset,'inflate') || allProps.InflateLevel != null)
    _buildInflate(container, curItem, allProps);

  // Text-Gravur
  if (_assetSupports(asset,'text'))
    _buildText(container, asset, curItem);

  // Craft
  _buildCraft(container, asset, curItem);

  // Allgemeine Properties (Escape-Diff., SelfUnlock, etc.)
  _buildProps(container, asset, curItem);

  // Lock
  _buildLock(container, asset, curItem);
};

// ═══════════════════════════════════════════════════════════
// 🎨 FARBEN
// ═══════════════════════════════════════════════════════════
function _buildColors(c, asset, curItem) {
  const { el, S } = BCIM;

  let numLayers = 1;
  if      (curItem?.Color && Array.isArray(curItem.Color)) numLayers = curItem.Color.length;
  else if (asset.ColorableLayerCount)                       numLayers = asset.ColorableLayerCount;
  else if (Array.isArray(asset.Color))                      numLayers = asset.Color.length;
  else if (asset.Layer?.length)
    numLayers = asset.Layer.filter(l=>l.AllowColorize!==false).length || 1;

  if (!S.colors.length && curItem?.Color)
    S.colors = Array.isArray(curItem.Color) ? [...curItem.Color] : [curItem.Color];
  while (S.colors.length < numLayers) S.colors.push(S.colors[0]||'#ffffff');

  // Ermittle Layer-Namen aus asset.Layer
  const layerNames = asset.Layer?.filter(l=>l.AllowColorize!==false).map(l=>l.Name||'?') || [];

  c.appendChild(el('div',{class:'bsh'},'🎨 Farben (' + numLayers + ' Layer)'));

  const grid = el('div',{class:'bcg'});
  for (let i = 0; i < numLayers; i++) {
    const canColor = !asset.AllowColor || asset.AllowColor[i] !== false;
    const layerLabel = layerNames[i] || (numLayers>1 ? 'Layer '+(i+1) : 'Farbe');
    if (!canColor) {
      grid.appendChild(el('div',{class:'bci'},el('div',{class:'bck'},'🔒'),el('div',{class:'bcl'},layerLabel)));
      continue;
    }
    const cur    = S.colors[i] || '#ffffff';
    const wrap   = el('div',{class:'bci'});
    const picker = el('input',{type:'color',class:'bcp',value:cur.startsWith('#')?cur:'#ffffff'});
    const hexInp = el('input',{type:'text',class:'bi',value:cur,
      style:{width:'76px',fontSize:'10px',padding:'2px 5px',fontFamily:'monospace'}});
    picker.addEventListener('input', e=>{ S.colors[i]=e.target.value; hexInp.value=e.target.value; });
    hexInp.addEventListener('change', e=>{
      const v=e.target.value.trim();
      if(/^#[0-9a-fA-F]{3,6}$/.test(v)){ S.colors[i]=v; picker.value=v; }
    });
    wrap.appendChild(picker);
    wrap.appendChild(hexInp);
    wrap.appendChild(el('div',{class:'bcl'}, layerLabel));
    grid.appendChild(wrap);
  }

  const colorStr = el('div',{class:'encoded-type',style:{marginTop:'4px',fontSize:'9px'}}, S.colors.join(','));
  const pasteRow = el('div',{style:{display:'flex',gap:'4px',marginTop:'4px'}});
  const pasteInp = el('input',{type:'text',class:'bi',placeholder:'BC Farb-String: #hex,#hex,...',style:{flex:1,fontSize:'10px'}});
  const pasteBtn = el('button',{class:'sbtn'},'↩ Einfügen');
  pasteBtn.addEventListener('click',()=>{
    const parts=pasteInp.value.split(',').map(s=>s.trim()).filter(s=>s.startsWith('#'));
    if(parts.length){
      S.colors=parts; colorStr.textContent=parts.join(',');
      c.querySelectorAll('.bcp').forEach((p,i)=>{if(parts[i])p.value=parts[i];});
      c.querySelectorAll('.bi[style*="monospace"]').forEach((inp,i)=>{if(parts[i])inp.value=parts[i];});
    }
  });
  pasteRow.appendChild(pasteInp); pasteRow.appendChild(pasteBtn);
  c.appendChild(grid); c.appendChild(colorStr); c.appendChild(pasteRow);
}

// ═══════════════════════════════════════════════════════════
// 📐 TYPED VARIANTEN
// ═══════════════════════════════════════════════════════════
function _buildTyped(c, asset, curItem) {
  const { el, S, BC } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'📐 Variante / Position'));
  const cur  = S.typedType ?? curItem?.Property?.Type ?? asset.AllowType[0] ?? '';
  const tags = el('div',{class:'btags'});
  asset.AllowType.forEach(t => {
    const label = BC.translateType(asset, t);
    const b = el('button',{class:'btag'+(cur===t?' on':'')}, label);
    b.addEventListener('click',()=>{
      S.typedType=t;
      tags.querySelectorAll('.btag').forEach((x,i)=>x.classList.toggle('on',asset.AllowType[i]===t));
    });
    tags.appendChild(b);
  });
  c.appendChild(tags);
}

// ═══════════════════════════════════════════════════════════
// 🧩 MODULARES SYSTEM (Front/Back Plate, Plug, etc.)
// ═══════════════════════════════════════════════════════════
function _buildModular(c, asset, curItem) {
  const { el, S, BC } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'🧩 Konfiguration (Modulare Optionen)'));

  const encodedEl = el('div',{class:'encoded-type',style:{marginTop:'6px'}},
    '→ ' + (S.prop.Type || curItem?.Property?.Type || BC.encodeModular(asset, S.modSelections) || '—'));

  asset.Modules.forEach((mod, mi) => {
    const key     = mod.Key || mod.Name;
    const curType = S.prop.Type || curItem?.Property?.Type || '';
    // Decode current selection for this module
    if (!S.modSelections[key]) {
      const decoded = BC.decodeModular(asset, curType);
      if (decoded[key]) S.modSelections[key] = decoded[key];
    }
    const cur = S.modSelections[key] ?? (typeof mod.Options[0]==='string'?mod.Options[0]:mod.Options[0]?.Name??'');

    const modDiv = el('div',{class:'bmod'});

    // Modul-Titel mit Beschreibung
    const modTitle = el('div',{class:'bmod-t'});
    const MODUL_ICONS = {
      Back: '🔙', Front: '🔛', Butt: '🍑', Plug: '🔌', Vibrator: '📳',
      Open: '🔓', Panel: '🛡', Plate: '🛡', Chain: '⛓', Padding: '🧸',
    };
    const icon = Object.entries(MODUL_ICONS).find(([k])=>mod.Name?.includes(k))?.[1] || '⚙';
    modTitle.textContent = icon + ' ' + (mod.Name || key);
    modDiv.appendChild(modTitle);

    const tags = el('div',{class:'btags'});
    mod.Options.forEach(opt => {
      const optName = typeof opt==='string'?opt:(opt.Name??'');
      if (!optName) return;

      // Versuche Label zu übersetzen
      let label = optName.replace(/([A-Z])/g,' $1').trim();
      try {
        const tk = asset.Group?.Name + asset.Name + optName;
        const r  = AssetText?.(tk); if (r && r!==tk) label = r;
      } catch {}

      // Icons für bekannte Optionen
      const OPT_ICONS = {
        'None':'⬜','Closed':'🔴','Open':'🟢','Plug':'🔌','VibratingPlug':'📳',
        'Exposed':'👁','Covered':'🛡','Front':'🔛','Back':'🔙','Both':'↔',
        'Chain':'⛓','Padded':'🧸','Smooth':'✨','Rigid':'⬛','Soft':'☁',
      };
      const optIcon = OPT_ICONS[optName] || '';

      const b = el('button',{class:'btag'+(cur===optName?' on':'')}, optIcon + (optIcon?' ':'')+label);
      b.addEventListener('click',()=>{
        S.modSelections[key] = optName;
        tags.querySelectorAll('.btag').forEach((x,i)=>{
          const n = typeof mod.Options[i]==='string'?mod.Options[i]:(mod.Options[i]?.Name??'');
          x.classList.toggle('on', n===optName);
        });
        const encoded = BC.encodeModular(asset, S.modSelections);
        S.prop.Type = encoded;
        encodedEl.textContent = '→ ' + encoded;
      });
      tags.appendChild(b);
    });

    if (mod.ChangeWhenLocked===false)
      modDiv.appendChild(el('div',{class:'bmod-sub'},'⚠ Nicht änderbar wenn gesperrt'));

    modDiv.appendChild(tags);
    c.appendChild(modDiv);
  });

  c.appendChild(encodedEl);
}

// ═══════════════════════════════════════════════════════════
// 📳 VIBRATOR (Mode + Intensität)
// ═══════════════════════════════════════════════════════════
function _buildVibrator(c, asset, curItem, allProps) {
  const { el, S } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'📳 Vibrator'));

  const curMode = S.prop.Mode || allProps.Mode || curItem?.Property?.Mode || 'Off';

  // ── Mode Tags ────────────────────────────────────────────
  c.appendChild(el('div',{class:'bl',style:{marginBottom:'5px'}},'Modus'));
  const tags = el('div',{class:'btags'});
  VIBRATE_MODES.forEach(m => {
    const b = el('button',{class:'btag'+(curMode===m.k?' on':'')}, m.l);
    b.addEventListener('click',()=>{
      S.prop.Mode = m.k;
      tags.querySelectorAll('.btag').forEach((t,i)=>t.classList.toggle('on',VIBRATE_MODES[i].k===m.k));
    });
    tags.appendChild(b);
  });
  c.appendChild(tags);

  // ── Intensität (0-3) ─────────────────────────────────────
  const curIntensity = S.prop.Intensity ?? allProps.Intensity ?? curItem?.Property?.Intensity ?? 2;
  const intensityLabels = ['⬜ Keine','🔵 Niedrig','🟡 Mittel','🔴 Hoch'];
  c.appendChild(el('div',{class:'bl',style:{margin:'8px 0 4px'}},'Intensität'));
  const intTags = el('div',{class:'btags'});
  [0,1,2,3].forEach(v => {
    const b = el('button',{class:'btag'+(curIntensity===v?' on':'')}, intensityLabels[v]||String(v));
    b.addEventListener('click',()=>{
      S.prop.Intensity=v;
      intTags.querySelectorAll('.btag').forEach((t,i)=>t.classList.toggle('on',i===v));
    });
    intTags.appendChild(b);
  });
  c.appendChild(intTags);
}

// ═══════════════════════════════════════════════════════════
// ⚡ SCHOCK / AUTOPUNISH
// ═══════════════════════════════════════════════════════════
function _buildShock(c, asset, curItem, allProps) {
  const { el, S, UI } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'⚡ Schock & Bestrafung'));

  // Warnung
  c.appendChild(el('div',{class:'binfo',style:{color:'#fb923c',marginBottom:'6px'}},
    '⚠ Diese Einstellungen steuern automatische Schockfunktionen des Items.'));

  // ── AutoPunish Modus ─────────────────────────────────────
  const AUTOPUNISH_OPTS = [
    {k:0, l:'⬜ Deaktiviert'},
    {k:1, l:'💥 Schock bei Orgasmus'},
    {k:2, l:'🔄 Schock bei Escape-Versuch'},
    {k:3, l:'💥🔄 Orgasmus + Escape'},
  ];
  const curAP = S.prop.AutoPunish ?? allProps.AutoPunish ?? curItem?.Property?.AutoPunish ?? 0;

  c.appendChild(el('div',{class:'bl',style:{marginBottom:'5px'}},'Schock-Trigger'));
  const apTags = el('div',{class:'btags'});
  AUTOPUNISH_OPTS.forEach(o => {
    const b = el('button',{class:'btag'+(curAP===o.k?' on':'')}, o.l);
    b.addEventListener('click',()=>{
      S.prop.AutoPunish=o.k;
      apTags.querySelectorAll('.btag').forEach((t,i)=>t.classList.toggle('on',AUTOPUNISH_OPTS[i].k===o.k));
    });
    apTags.appendChild(b);
  });
  c.appendChild(apTags);

  // ── Schock-Level ─────────────────────────────────────────
  const curSL = S.prop.ShockLevel ?? allProps.ShockLevel ?? curItem?.Property?.ShockLevel ?? 0;
  c.appendChild(el('div',{class:'bl',style:{margin:'8px 0 4px'}},'Schock-Intensität'));
  const slTags = el('div',{class:'btags'});
  SHOCK_LEVELS.forEach(o => {
    const b = el('button',{class:'btag'+(curSL===o.k?' on':'')}, o.l);
    b.addEventListener('click',()=>{
      S.prop.ShockLevel=o.k;
      slTags.querySelectorAll('.btag').forEach((t,i)=>t.classList.toggle('on',SHOCK_LEVELS[i].k===o.k));
    });
    slTags.appendChild(b);
  });
  c.appendChild(slTags);

  // ── Chat-Nachricht anzeigen ──────────────────────────────
  const curShowMsg = S.prop.ShowMessage ?? allProps.ShowMessage ?? curItem?.Property?.ShowMessage ?? true;
  c.appendChild(UI.toggle(
    '💬 Chat-Nachricht beim Schock anzeigen',
    !!curShowMsg,
    v => { S.prop.ShowMessage = v; }
  ));
}

// ═══════════════════════════════════════════════════════════
// 🌐 PUBLIC MODE SETTING (Futuristic Training Belt)
// ═══════════════════════════════════════════════════════════
function _buildPublicMode(c, curItem, allProps) {
  const { el, S } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'🌐 Vibrations-Berechtigung'));
  c.appendChild(el('div',{class:'binfo',style:{marginBottom:'6px'}},
    'Wer darf die Vibrationsmodi dieses Items steuern?'));

  const cur = S.prop.PublicModeSetting ?? allProps.PublicModeSetting ?? curItem?.Property?.PublicModeSetting ?? 0;
  const tags = el('div',{class:'btags'});
  PUBLIC_MODE_SETTINGS.forEach(o => {
    const b = el('button',{class:'btag'+(cur===o.k?' on':'')}, o.l);
    b.addEventListener('click',()=>{
      S.prop.PublicModeSetting=o.k;
      tags.querySelectorAll('.btag').forEach((t,i)=>t.classList.toggle('on',PUBLIC_MODE_SETTINGS[i].k===o.k));
    });
    tags.appendChild(b);
  });
  c.appendChild(tags);
}

// ═══════════════════════════════════════════════════════════
// 🗣 PFLICHT-WORT (Futuristic Training Belt)
// ═══════════════════════════════════════════════════════════
function _buildMandatoryWord(c, curItem, allProps) {
  const { el, S } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'🗣 Pflicht-Wort'));
  c.appendChild(el('div',{class:'binfo',style:{marginBottom:'6px'}},
    'Das Wort das regelmäßig gesagt werden muss. Wird es nicht gesagt, erfolgt ein Schock.'));

  const curWord = S.prop.MandatoryWord ?? allProps.MandatoryWord ?? curItem?.Property?.MandatoryWord ?? '';
  const inp = el('input',{type:'text',class:'bi',placeholder:'z.B. "nyah" oder "Miss"...',value:curWord});
  inp.addEventListener('input', e => { S.prop.MandatoryWord = e.target.value || undefined; });
  c.appendChild(el('div',{class:'bf'}, inp));

  // Clear-Button
  const clearBtn = el('button',{class:'sbtn',style:{marginTop:'3px'}},'✕ Pflicht-Wort löschen');
  clearBtn.addEventListener('click',()=>{ S.prop.MandatoryWord=undefined; inp.value=''; });
  c.appendChild(clearBtn);
}

// ═══════════════════════════════════════════════════════════
// 💨 AUFBLASBAR
// ═══════════════════════════════════════════════════════════
function _buildInflate(c, curItem, allProps) {
  const { el, S } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'💨 Aufblasbar'));

  const curLevel = S.prop.InflateLevel ?? allProps.InflateLevel ?? curItem?.Property?.InflateLevel ?? 0;
  const inflateLabels = ['⬜ Leer','💧 Level 1','💧💧 Level 2','💧💧💧 Level 3','💧💧💧💧 Level 4','💥 Maximum'];

  const lbl = el('span',{class:'bslr-v'}, inflateLabels[curLevel]||String(curLevel));
  const slr = el('input',{type:'range',class:'bslr',min:'0',max:'5',value:String(curLevel)});
  slr.addEventListener('input', e=>{
    const v=parseInt(e.target.value);
    S.prop.InflateLevel=v;
    lbl.textContent=inflateLabels[v]||String(v);
  });
  c.appendChild(el('div',{class:'bslr-r'}, slr, lbl));
}

// ═══════════════════════════════════════════════════════════
// ✏️ TEXT-GRAVUR
// ═══════════════════════════════════════════════════════════
function _buildText(c, asset, curItem) {
  const { el, S } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'✏️ Text-Gravur'));
  const cur = S.prop.Text || curItem?.Property?.Text || '';
  const max = asset.MaxText || 100;
  const ta  = el('textarea',{class:'bta',placeholder:'Max. '+max+' Zeichen...',maxlength:String(max)}, cur);
  ta.addEventListener('input', e=>{ S.prop.Text=e.target.value||undefined; });
  c.appendChild(ta);
}

// ═══════════════════════════════════════════════════════════
// ✦ CRAFT (Name · Material · Farbe · Lock · wearCrafted)
// ═══════════════════════════════════════════════════════════
function _buildCraft(c, asset, curItem) {
  const { el, UI, S, BC, setStatus } = BCIM;

  const existingCraft = BC.Crafting.readCraft(curItem);

  // Pre-fill S.craft aus bestehendem Item
  if (existingCraft && !S._craftTouched) {
    if (!S.craft.Name        && existingCraft.name)        S.craft.Name        = existingCraft.name;
    if (!S.craft.Description && existingCraft.description) S.craft.Description = existingCraft.description;
    if (!S.craft.Property    && existingCraft.property)    S.craft.Property    = existingCraft.property;
    if (!S.craft.Color       && existingCraft.color)       S.craft.Color       = existingCraft.color;
    if (!S.craft.Lock        && existingCraft.lock)        S.craft.Lock        = existingCraft.lock;
    if (existingCraft.private_)                            S.craft.Private     = true;
    if (existingCraft.itemOrder != null)                   S.craft.ItemOrder   = existingCraft.itemOrder;
  }

  c.appendChild(el('div',{class:'bsh'},'✦ Craft'));

  // Bestehendes Craft anzeigen
  if (existingCraft?.name) {
    const banner = el('div',{class:'card',style:{marginBottom:'8px',borderColor:'color-mix(in srgb,var(--acc) 30%,transparent)'}});
    banner.appendChild(el('div',{class:'card-title'},
      '📦 Vorhandener Craft: ',
      el('span',{style:{color:'var(--acc)',fontWeight:700}}, existingCraft.name),
    ));
    [
      existingCraft.description && ['Beschreibung', existingCraft.description],
      existingCraft.property    && ['Material',     existingCraft.property],
      existingCraft.color       && ['Farbe',        existingCraft.color],
      existingCraft.lock        && ['Schloss',       existingCraft.lock],
    ].filter(Boolean).forEach(([k,v]) => {
      const row = el('div',{class:'card-sub',style:{display:'flex',gap:'6px',marginTop:'2px'}});
      row.appendChild(el('span',{style:{color:'var(--txt3)',minWidth:'80px'}},k+':'));
      row.appendChild(el('span',{style:{color:'var(--txt)'}},v));
      banner.appendChild(row);
    });
    c.appendChild(banner);
  }

  const touch = () => { S._craftTouched = true; };

  // Name
  const nameInp = el('input',{type:'text',class:'bi',placeholder:'Craft-Name...',value:S.craft.Name||''});
  nameInp.addEventListener('input', e=>{ S.craft.Name=e.target.value||undefined; touch(); });

  // Beschreibung
  const descTA = el('textarea',{class:'bta',style:{minHeight:'38px'},
    placeholder:'Beschreibung (sichtbar im Tooltip)...',value:S.craft.Description||''});
  descTA.addEventListener('input', e=>{ S.craft.Description=e.target.value||undefined; touch(); });

  // Material
  const matSel = el('select',{class:'bsel'});
  BC.craftMaterials.forEach(m => {
    const o=el('option',{value:m},m); if((S.craft.Property||'Normal')===m)o.selected=true; matSel.appendChild(o);
  });
  matSel.addEventListener('change', e=>{ S.craft.Property=e.target.value; touch(); });

  // Craft-Farbe
  const colorRow = el('div',{style:{display:'flex',gap:'6px',alignItems:'center'}});
  const cp = el('input',{type:'color',class:'bcp',style:{width:'36px',height:'36px'},value:S.craft.Color||S.colors[0]||'#ffffff'});
  const ch = el('input',{type:'text',class:'bi',style:{flex:1,fontSize:'11px',fontFamily:'monospace'},value:S.craft.Color||S.colors[0]||'#ffffff'});
  cp.addEventListener('input',e=>{ S.craft.Color=e.target.value; ch.value=e.target.value; touch(); });
  ch.addEventListener('change',e=>{ if(/^#[0-9a-fA-F]{3,6}$/.test(e.target.value.trim())){S.craft.Color=e.target.value.trim();cp.value=e.target.value.trim();touch();} });
  const syncBtn=el('button',{class:'sbtn',title:'Farbe aus Layer 1 übernehmen'},'← L1');
  syncBtn.addEventListener('click',()=>{ const v=S.colors[0]||'#ffffff';S.craft.Color=v;cp.value=v;ch.value=v; });
  colorRow.appendChild(cp); colorRow.appendChild(ch); colorRow.appendChild(syncBtn);

  // Drawing Priority
  const prioInp = el('input',{type:'number',class:'bi',min:'0',max:'100',
    value:S.craft.ItemOrder??'',placeholder:'Drawing Priority (leer = Standard)'});
  prioInp.addEventListener('input', e=>{ S.craft.ItemOrder=parseInt(e.target.value)||undefined; touch(); });

  [
    el('div',{class:'bf'},el('label',{class:'bl'},'📛 Name'),nameInp),
    el('div',{class:'bf'},el('label',{class:'bl'},'📝 Beschreibung'),descTA),
    el('div',{class:'bf'},el('label',{class:'bl'},'🧵 Material'),matSel),
    el('div',{class:'bf'},el('label',{class:'bl'},'🎨 Craft-Farbe'),colorRow),
    el('div',{class:'bf'},el('label',{class:'bl'},'⚡ Drawing Priority'),prioInp),
    UI.toggle('👁 Privat (nur Träger sieht den Namen)', !!S.craft.Private, v=>{S.craft.Private=v||undefined;touch();}),
  ].forEach(n=>c.appendChild(n));

  // Buttons
  const btnRow = el('div',{style:{display:'flex',gap:'5px',marginTop:'8px',flexWrap:'wrap'}});

  const wearBtn = el('button',{class:'sbtn sbtn-p',style:{flex:2}},'✦ Als Craft anlegen (wearCrafted)');
  wearBtn.addEventListener('click',()=>{
    if(!S.char||!S.group||!S.asset){setStatus('Kein Asset!',true);return;}
    const assetName = S.asset.Name||S.asset.name;
    if(!assetName){setStatus('Kein Asset-Name!',true);return;}

    // Alle Property-Felder aus S.prop sammeln
    const propObj = {...S.prop};
    if(S.typedType) propObj.Type = S.typedType;
    if(Object.keys(S.modSelections||{}).length) propObj.Type = BCIM.BC.encodeModular(S.asset,S.modSelections);

    const res = BCIM.BC.Crafting.wearCrafted(S.char, assetName, S.group, {
      name:        S.craft.Name,
      description: S.craft.Description,
      property:    S.craft.Property || 'Normal',
      color:       S.craft.Color || (S.colors?.length?S.colors[0]:undefined),
      lock:        S.craft.Lock || '',
      private_:    !!S.craft.Private,
      itemOrder:   S.craft.ItemOrder,
      property_obj: Object.keys(propObj).length ? propObj : undefined,
    });
    if(res.ok){ setStatus('✦ Craft angelegt: '+(S.craft.Name||assetName),false); S._craftTouched=false; setTimeout(()=>BCIM._renderTab?.(),400); }
    else       setStatus('❌ '+res.reason,true);
  });

  const updateBtn = el('button',{class:'sbtn',style:{flex:1}},'↺ Craft updaten');
  updateBtn.addEventListener('click',()=>{
    if(!S.char||!S.group){setStatus('Kein Slot!',true);return;}
    const item=BCIM.BC.getItem(S.char,S.group);
    if(!item){setStatus('Erst Item anlegen!',true);return;}
    const res=BCIM.BC.Crafting.updateCraft(S.char,S.group,{
      name:S.craft.Name,description:S.craft.Description,
      property:S.craft.Property||'Normal',color:S.craft.Color,
      private_:!!S.craft.Private,itemOrder:S.craft.ItemOrder,
    });
    if(res.ok){setStatus('✦ Craft aktualisiert',false);S._craftTouched=false;}
    else setStatus('❌ '+res.reason,true);
  });

  const clearBtn = el('button',{class:'sbtn sbtn-d',title:'Craft zurücksetzen'},'✕');
  clearBtn.addEventListener('click',()=>{S.craft={};S._craftTouched=false;nameInp.value='';descTA.value='';matSel.value='Normal';setStatus('Craft zurückgesetzt',false);});

  btnRow.appendChild(wearBtn); btnRow.appendChild(updateBtn); btnRow.appendChild(clearBtn);
  c.appendChild(btnRow);
  c.appendChild(el('div',{class:'binfo',style:{marginTop:'4px'}},
    '✦ "Als Craft anlegen" legt das Item komplett neu an mit allen aktuellen Einstellungen.'));
}

// ═══════════════════════════════════════════════════════════
// ⚙ ALLGEMEINE PROPERTIES
// ═══════════════════════════════════════════════════════════
function _buildProps(c, asset, curItem) {
  const { el, S, UI } = BCIM;
  c.appendChild(el('div',{class:'bsh'},'⚙ Eigenschaften'));

  // Escape-Schwierigkeit
  const dv   = S.prop.Difficulty ?? curItem?.Property?.Difficulty ?? 0;
  const dlbl = el('span',{class:'bslr-v'},String(dv));
  const dslr = el('input',{type:'range',class:'bslr',min:'0',max:'20',value:String(dv)});
  dslr.addEventListener('input',e=>{S.prop.Difficulty=parseInt(e.target.value);dlbl.textContent=e.target.value;});
  c.appendChild(el('div',{class:'bf'},el('label',{class:'bl'},'🔓 Escape-Schwierigkeit (0-20)'),el('div',{class:'bslr-r'},dslr,dlbl)));

  c.appendChild(UI.toggle('✋ Selbst entfernen möglich', S.prop.SelfUnlock??true, v=>{S.prop.SelfUnlock=v;}));

  // Effekte (readonly info)
  if(asset.Effect?.length){
    const ft=el('div',{class:'btags'});
    asset.Effect.forEach(f=>ft.appendChild(el('span',{class:'btag on',style:{cursor:'default',opacity:.6}},f)));
    c.appendChild(el('div',{class:'bf'},el('label',{class:'bl'},'⚡ Effekte (fest)'),ft));
  }
  if(asset.Block?.length)
    c.appendChild(el('div',{class:'binfo'},'🚫 Blockiert: '+asset.Block.join(', ')));
  if(asset.ArousalZone)
    c.appendChild(el('div',{class:'binfo'},'💜 Erregungszone: '+asset.ArousalZone));
  if(asset.StimLevel!=null)
    c.appendChild(el('div',{class:'binfo'},'💜 Stimulations-Level: '+asset.StimLevel));
  if(asset.AllowLock===false)
    c.appendChild(el('div',{class:'binfo',style:{color:'#fb923c'}},'⚠ Nicht sperrbar'));
}

// ═══════════════════════════════════════════════════════════
// 🔒 LOCK
// ═══════════════════════════════════════════════════════════
function _buildLock(c, asset, curItem) {
  const { el, UI, S, BC, setStatus } = BCIM;
  if(asset.AllowLock===false) return;

  c.appendChild(el('div',{class:'bsh'},'🔒 Schloss'));
  const existing = curItem?.Property?.LockedBy;

  if(existing) {
    const lockBox = el('div',{class:'card',id:'bcim-lock-section',
      style:{borderColor:'color-mix(in srgb,#fb923c 40%,transparent)'}});
    const rem = curItem.Property.RemoveItemTime;
    let timerStr='';
    if(rem){
      const ms=rem-Date.now();
      if(ms>0){const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);timerStr=`  ⏱ ${h}h ${m}m ${s}s`;}
      else timerStr='  ⏱ Abgelaufen';
    }
    lockBox.appendChild(el('div',{class:'card-title'},BC.LOCK_DEFS[existing]?.label||existing,el('span',{class:'lock-timer'},timerStr)));
    if(curItem.Property?.Password)    lockBox.appendChild(el('div',{class:'card-sub'},'🔑 Passwort gesetzt'));
    if(curItem.Property?.Hint)         lockBox.appendChild(el('div',{class:'card-sub'},'💡 Hinweis: '+curItem.Property.Hint));
    if(curItem.Property?.CombinationNumber) lockBox.appendChild(el('div',{class:'card-sub'},'🔢 Kombination gesetzt'));
    const unlockBtn=el('button',{class:'sbtn sbtn-d',style:{width:'100%',marginTop:'5px'}},'🔓 Schloss entfernen');
    unlockBtn.addEventListener('click',()=>{
      const res=BC.removeLock(S.char,S.group);
      if(res.ok){setStatus('✓ Schloss entfernt',false);lockBox.remove();_buildLock(c,asset,BC.getItem(S.char,S.group));}
      else setStatus('❌ '+res.reason,true);
    });
    lockBox.appendChild(unlockBtn);
    c.appendChild(lockBox);
    return;
  }

  const lockWrap=el('div',{id:'bcim-lock-section'});
  lockWrap.appendChild(el('div',{class:'binfo',style:{marginBottom:'6px'}},
    '💡 Schloss jetzt anlegen ODER als Craft-Lock beim "Als Craft anlegen" mitgeben.'));

  let selectedLock='MetalPadlock';
  const lockBtns=el('div',{class:'btags',style:{marginBottom:'8px',flexWrap:'wrap'}});
  Object.entries(BC.LOCK_DEFS).forEach(([key,def])=>{
    const b=el('button',{class:'btag'+(key===selectedLock?' on':'')},def.label);
    b.addEventListener('click',()=>{selectedLock=key;lockBtns.querySelectorAll('.btag').forEach(x=>x.classList.remove('on'));b.classList.add('on');renderFields();});
    lockBtns.appendChild(b);
  });
  lockWrap.appendChild(lockBtns);

  const fieldsEl=el('div',{id:'bcim-lock-fields'});
  let lockOpts={};

  const renderFields=()=>{
    fieldsEl.innerHTML=''; lockOpts={};
    const def=BC.LOCK_DEFS[selectedLock]; if(!def) return;

    if(def.fields.includes('timer')){
      fieldsEl.appendChild(el('label',{class:'bl'},'⏱ Timer (H : M : S)'));
      const row=el('div',{style:{display:'flex',gap:'5px',marginBottom:'6px',alignItems:'center'}});
      const hInp=el('input',{type:'number',class:'bi',min:'0',max:'720',value:'0',placeholder:'Std',style:{flex:1}});
      const mInp=el('input',{type:'number',class:'bi',min:'0',max:'59', value:'0',placeholder:'Min',style:{flex:1}});
      const sInp=el('input',{type:'number',class:'bi',min:'0',max:'59', value:'0',placeholder:'Sek',style:{flex:1}});
      const preview=el('div',{class:'lock-timer',style:{textAlign:'right',marginBottom:'4px'}});
      const updateTimer=()=>{
        const sec=BCIM.BC.hmsToSeconds(hInp.value,mInp.value,sInp.value);
        lockOpts.timerSeconds=sec;
        preview.textContent=sec>0?`= ${sec}s → ${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}m ${sec%60}s`:'';
      };
      [hInp,mInp,sInp].forEach(i=>i.addEventListener('input',updateTimer));
      [el('span',{class:'card-sub'},'H:'),hInp,el('span',{class:'card-sub'},'M:'),mInp,el('span',{class:'card-sub'},'S:'),sInp].forEach(n=>row.appendChild(n));
      fieldsEl.appendChild(row); fieldsEl.appendChild(preview);
    }
    if(def.fields.includes('password')){
      fieldsEl.appendChild(el('label',{class:'bl'},'🔑 Passwort'));
      const pw=el('input',{type:'text',class:'bi',placeholder:'Passwort...',style:{marginBottom:'5px'}});
      pw.addEventListener('input',e=>lockOpts.password=e.target.value);
      fieldsEl.appendChild(pw);
      fieldsEl.appendChild(el('label',{class:'bl'},'💡 Hinweis (optional)'));
      const hint=el('input',{type:'text',class:'bi',placeholder:'Hinweis...'});
      hint.addEventListener('input',e=>lockOpts.hint=e.target.value);
      fieldsEl.appendChild(hint);
    }
    if(def.fields.includes('combination')){
      fieldsEl.appendChild(el('label',{class:'bl'},'🔢 Kombination (4-stellig)'));
      const comb=el('input',{type:'text',class:'bi',placeholder:'z.B. 1234',maxlength:'4'});
      comb.addEventListener('input',e=>lockOpts.combination=e.target.value);
      fieldsEl.appendChild(comb);
    }
  };
  renderFields();
  lockWrap.appendChild(fieldsEl);

  const applyBtn=el('button',{class:'sbtn sbtn-p',style:{width:'100%',marginTop:'6px'}},'🔒 Schloss anlegen & bestätigen');
  applyBtn.addEventListener('click',()=>{
    if(!S.char||!S.group){setStatus('Kein Slot!',true);return;}
    const item=BC.getItem(S.char,S.group);
    if(!item){setStatus('Erst Item anlegen!',true);return;}
    const res=BC.applyLock(S.char,S.group,selectedLock,lockOpts);
    if(res.ok){setStatus('✓ Schloss angelegt: '+(BC.LOCK_DEFS[selectedLock]?.label||selectedLock),false);lockWrap.remove();_buildLock(c,asset,BC.getItem(S.char,S.group));}
    else setStatus('❌ '+res.reason,true);
  });
  lockWrap.appendChild(applyBtn);

  const craftLockBtn=el('button',{class:'sbtn',style:{width:'100%',marginTop:'4px'}},'⚙ Als Craft-Lock setzen');
  craftLockBtn.addEventListener('click',()=>{S.craft.Lock=selectedLock;setStatus('Craft-Lock: '+selectedLock,false);});
  lockWrap.appendChild(craftLockBtn);

  c.appendChild(lockWrap);
}
