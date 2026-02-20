// ── BCIM / bc-api.js (v3.2 – exact DirectApply scan + sync) ─
window.BCIM = window.BCIM || {};

// ════════════════════════════════════════════════════════════
// ASSET SCAN  (ported 1:1 from DirectApply_ScanAssets)
// ════════════════════════════════════════════════════════════
BCIM._scanState = { assets: [], isScanning: false };

BCIM.scanAssets = function(force) {
  if (BCIM._scanState.isScanning && !force) {
    console.warn('[BCIM] Scan already in progress...');
    return BCIM._scanState.assets;
  }

  BCIM._scanState.isScanning = true;
  console.log('[BCIM] Starting asset scan...');

  const w = window;
  const assets = [];
  const seen   = {};
  const stats  = {
    fromAssetFemale3DCG: 0,
    fromAsset: 0,
    modGroups: [],
    vanillaGroups: [],
    errors: [],
    structure: 'unknown',
  };

  function addAsset(name, group, desc, isMod) {
    if (!name)        return false;
    if (seen[name])   return false;
    seen[name] = true;
    assets.push({ name, group, label: desc || name, isMod: !!isMod });
    return true;
  }

  // ── 1. Scan AssetFemale3DCG (Vanilla) ─────────────────────
  if (w.AssetFemale3DCG) {
    const keys = Object.keys(w.AssetFemale3DCG);
    console.log('[BCIM] Scanning AssetFemale3DCG: ' + keys.length + ' keys');

    if (keys.length > 0) {
      const firstItem = w.AssetFemale3DCG[keys[0]];

      if (Array.isArray(firstItem)) {
        // ── Grouped structure: { ItemArms: [{Name,...}], ... }
        stats.structure = 'grouped';
        console.log('[BCIM] Detected grouped structure (arrays)');
        let lastProgress = 0;

        for (let gIdx = 0; gIdx < keys.length; gIdx++) {
          const gn  = keys[gIdx];
          const pct = Math.floor((gIdx / keys.length) * 100);
          if (pct >= lastProgress + 10) {
            console.log('[BCIM] AssetFemale3DCG: ' + pct + '% (' + gIdx + '/' + keys.length + ' groups)');
            lastProgress = pct;
          }
          try {
            const grp = w.AssetFemale3DCG[gn];
            if (!Array.isArray(grp) || grp.length === 0) continue;
            const gnStr = String(gn);
            stats.vanillaGroups.push(gnStr + '(' + grp.length + ')');
            for (const a of grp) {
              if (a?.Name && addAsset(a.Name, gnStr, a.Description, false))
                stats.fromAssetFemale3DCG++;
            }
          } catch (e) {
            stats.errors.push('Error in group ' + gn + ': ' + e.message);
          }
        }

      } else if (typeof firstItem === 'object' && firstItem !== null) {
        // ── Flat structure: { key: {Name, Group, ...} }
        stats.structure = 'flat';
        console.log('[BCIM] Detected flat structure (objects)');
        const groupCounts = {};
        let lastProgress  = 0;

        for (let i = 0; i < keys.length; i++) {
          const item = w.AssetFemale3DCG[keys[i]];
          const pct  = Math.floor((i / keys.length) * 100);
          if (pct >= lastProgress + 10) {
            console.log('[BCIM] AssetFemale3DCG flat: ' + pct + '%');
            lastProgress = pct;
          }
          if (!item?.Name) continue;
          let groupName = 'Unknown';
          if (item.Group) {
            groupName = typeof item.Group === 'string' ? item.Group
              : item.Group.Name ? item.Group.Name : String(item.Group);
          } else if (item.GroupName) {
            groupName = item.GroupName;
          }
          if (addAsset(item.Name, groupName, item.Description, false)) {
            stats.fromAssetFemale3DCG++;
            groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
          }
        }
        for (const gn in groupCounts) stats.vanillaGroups.push(gn + '(' + groupCounts[gn] + ')');

      } else {
        stats.errors.push('Unknown AssetFemale3DCG structure: ' + typeof firstItem);
      }
    }
  } else {
    console.error('[BCIM] AssetFemale3DCG not found!');
    stats.errors.push('AssetFemale3DCG: not_found');
  }

  // ── 2. Scan window.Asset (includes mods) ──────────────────
  if (w.Asset) {
    const keys = Object.keys(w.Asset);
    console.log('[BCIM] Scanning window.Asset: ' + keys.length + ' keys');

    if (keys.length > 0) {
      const firstItem = w.Asset[keys[0]];

      if (Array.isArray(firstItem)) {
        // Grouped
        for (const gn in w.Asset) {
          try {
            const grp = w.Asset[gn];
            if (!Array.isArray(grp) || grp.length === 0) continue;
            const gnStr = String(gn);
            const isMod = !/^(Item|Cloth|Body|Hair|Cosplay|Animation|Pose|Expression)/i.test(gnStr);
            if (isMod) stats.modGroups.push(gnStr + '(' + grp.length + ')');
            for (const a of grp) {
              if (!a?.Name) continue;
              const label = isMod ? '[MOD] ' + (a.Description || a.Name) : (a.Description || a.Name);
              if (addAsset(a.Name, gnStr, label, isMod)) stats.fromAsset++;
            }
          } catch (e) {
            stats.errors.push('Error in Asset group ' + gn + ': ' + e.message);
          }
        }

      } else if (typeof firstItem === 'object' && firstItem !== null) {
        // Flat
        const groupCounts = {};
        let lastProgress  = 0;
        for (let i = 0; i < keys.length; i++) {
          const item = w.Asset[keys[i]];
          const pct  = Math.floor((i / keys.length) * 100);
          if (pct >= lastProgress + 10) {
            console.log('[BCIM] window.Asset flat: ' + pct + '%');
            lastProgress = pct;
          }
          if (!item?.Name) continue;
          let groupName = 'Unknown';
          if (item.Group) {
            groupName = typeof item.Group === 'string' ? item.Group
              : item.Group.Name ? item.Group.Name : String(item.Group);
          } else if (item.GroupName) {
            groupName = item.GroupName;
          }
          const isMod = !/^(Item|Cloth|Body|Hair|Cosplay|Animation|Pose|Expression)/i.test(groupName);
          const label = isMod ? '[MOD] ' + (item.Description || item.Name) : (item.Description || item.Name);
          if (addAsset(item.Name, groupName, label, isMod)) {
            stats.fromAsset++;
            groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;
          }
        }
        for (const gn in groupCounts) {
          if (!/^(Item|Cloth|Body|Hair|Cosplay|Animation|Pose|Expression)/i.test(gn))
            stats.modGroups.push(gn + '(' + groupCounts[gn] + ')');
        }
      }
    }
  }

  // ── 3. Fallback: global Asset[] array ─────────────────────
  if (Array.isArray(w.Asset) && w.Asset.length) {
    for (const a of w.Asset) {
      if (!a?.Name) continue;
      const gn = a.Group?.Name || a.Group || 'Unknown';
      addAsset(a.Name, String(gn), a.Description || a.Name, false);
    }
  }

  BCIM._scanState.assets    = assets;
  BCIM._scanState.isScanning = false;

  const summary = '[BCIM] Scan complete! ' + assets.length + ' assets | structure:' + stats.structure
    + ' | vanilla:' + stats.fromAssetFemale3DCG + ' | mods:' + stats.fromAsset
    + ' | errors:' + stats.errors.length;
  console.log(summary);
  if (stats.errors.length) console.warn('[BCIM] Scan errors:', stats.errors.slice(0,3));

  // Update badge in UI
  const badge = document.getElementById('bcim-scan-badge');
  if (badge) badge.textContent = '⟳ ' + assets.length + ' items';

  return assets;
};

// ── Get assets for a group (from scan cache) ───────────────
BCIM.getAssetsByGroup = function(groupName) {
  if (!BCIM._scanState.assets.length) BCIM.scanAssets();
  return BCIM._scanState.assets.filter(a => a.group === groupName);
};


// ════════════════════════════════════════════════════════════
// SYNC  (ported 1:1 from DirectApply_SyncStepX)
// ════════════════════════════════════════════════════════════
BCIM._lastSyncData = {
  memberNumber: null,
  assetName:    null,
  assetGroup:   null,
  targetChar:   null,
};

// Step 1: Immediate Appearance Update
BCIM._syncStep1 = function() {
  const data = BCIM._lastSyncData;
  if (!data.memberNumber || !data.targetChar) return;
  try {
    console.log('[BCIM Sync] Step 1: Immediate appearance update');
    ServerSend('ChatRoomCharacterUpdate', {
      ID:           window.ChatRoomData ? window.ChatRoomData.ChatRoomID : null,
      MemberNumber: data.memberNumber,
      Appearance:   data.targetChar.Appearance,
    });
  } catch(e) { console.warn('[BCIM Sync1]', e); }
};

// Step 2: Item Update
BCIM._syncStep2 = function() {
  const data = BCIM._lastSyncData;
  if (!data.memberNumber || !data.assetName) return;
  try {
    console.log('[BCIM Sync] Step 2: Item update');
    ServerSend('ChatRoomCharacterItemUpdate', {
      Target: data.memberNumber,
      Item: { Name: data.assetName, Group: data.assetGroup },
    });
  } catch(e) { console.warn('[BCIM Sync2]', e); }
};

// Step 3: Final Appearance Update
BCIM._syncStep3 = function() {
  const data = BCIM._lastSyncData;
  if (!data.memberNumber || !data.targetChar) return;
  try {
    console.log('[BCIM Sync] Step 3: Final appearance update');
    ServerSend('ChatRoomCharacterUpdate', {
      ID:           window.ChatRoomData ? window.ChatRoomData.ChatRoomID : null,
      MemberNumber: data.memberNumber,
      Appearance:   data.targetChar.Appearance,
    });
  } catch(e) { console.warn('[BCIM Sync3]', e); }
};

// Step 4: Action Message (FBC nonce trick)
BCIM._syncStep4 = function() {
  const data = BCIM._lastSyncData;
  if (!data.memberNumber || !data.assetName) return;
  try {
    console.log('[BCIM Sync] Step 4: Action message');
    ServerSend('ChatRoomMessage', {
      Content: 'Beep',
      Type: 'Action',
      Sender: window.Player ? window.Player.MemberNumber : data.memberNumber,
      Dictionary: [
        { Tag: 'Beep', Text: 'applies ' + data.assetName + ' to the target.' },
        { Tag: 'fbc_nonce', Text: String(Math.floor(Math.random() * 10000)) },
      ],
    });
  } catch(e) { console.warn('[BCIM Sync4]', e); }
};

// Step 5: Local Auto-Sync (most important — always runs)
BCIM._syncStep5 = function() {
  console.log('[BCIM Sync] Step 5: Local auto-sync');
  try { if (window.ChatRoomSyncCharacter) window.ChatRoomSyncCharacter(); } catch {}
  try { if (window.ChatRoomCharacterDraw)  window.ChatRoomCharacterDraw();  } catch {}
  try {
    if (window.ChatRoomCharacterUpdate && Array.isArray(window.ChatRoomCharacter)) {
      for (let i = 0; i < window.ChatRoomCharacter.length; i++) {
        try { window.ChatRoomCharacterUpdate(window.ChatRoomCharacter[i]); } catch {}
      }
    }
  } catch {}
};

// Full sync sequence (mirrors sendFullSync from DirectApply)
BCIM._sendFullSync = function(memberNumber, assetName, assetGroup, targetChar) {
  // Store for manual use / re-trigger
  BCIM._lastSyncData = { memberNumber, assetName, assetGroup, targetChar };

  // Update UI badge
  const badge = document.getElementById('bcim-sync-status');
  if (badge) {
    badge.textContent = 'Sync: ' + assetName + ' → #' + memberNumber;
    badge.style.color = '#4ade80';
  }

  // Step 5 is the critical one (local refresh)
  BCIM._syncStep5();
};


// ════════════════════════════════════════════════════════════
// BC API  (core game wrappers)
// ════════════════════════════════════════════════════════════
BCIM.BC = {
  players: () => { try { return [Player,...(ChatRoomCharacter||[])].filter(Boolean); } catch { return []; } },
  player:  (id) => BCIM.BC.players().find(c=>c.MemberNumber===id||c.Name===id)||null,
  inRoom:  () => { try { return !!(ChatRoomData?.Name); } catch { return false; } },

  // ── Get item (robust fallback) ────────────────────────
  getItem: (char, group) => {
    if (!char || !group) return null;
    try { const r = InventoryGet(char, group); if (r) return r; } catch {}
    try { return char.Appearance?.find(i => i.Asset?.Group?.Name === group) || null; } catch { return null; }
  },

  // ── Groups list ───────────────────────────────────────
  getGroups: (family='Female3DCG') => {
    try { return (AssetGroup||[]).filter(g=>g.Family===family&&!g.MirrorActivitiesFrom&&g.Name); }
    catch { return []; }
  },

  // ── Assets for group — uses scan cache ────────────────
  getAssetsForGroup: (family, group) => {
    // Use scan cache first (most complete, includes mods)
    const cached = BCIM.getAssetsByGroup(group);
    if (cached.length) {
      return cached.map(c => {
        try { return AssetGet(family, group, c.name) || {Name:c.name, Group:{Name:group,Family:family}, _fromCache:true}; }
        catch { return {Name:c.name, Group:{Name:group,Family:family}, _fromCache:true}; }
      }).filter(Boolean);
    }
    // Fallback: global Asset array
    try {
      if (typeof Asset !== 'undefined') {
        const list = (Array.isArray(Asset)?Asset:Object.values(Asset))
          .filter(a => a.Group?.Name===group && (!family||a.Group?.Family===family));
        if (list.length) return list;
      }
    } catch {}
    // Fallback: AssetFemale3DCG grouped
    try {
      const grp = window.AssetFemale3DCG?.[group];
      if (Array.isArray(grp)) return grp.filter(a=>a.Name);
    } catch {}
    return [];
  },

  getAsset: (family, group, name) => {
    try { return AssetGet(family, group, name)||null; } catch { return null; }
  },

  // ── Apply item ────────────────────────────────────────
  applyItem: (char, group, asset, color, craft, property) => {
    try {
      const isPlayer = !!char.IsPlayer?.();
      const colorArr = !color ? undefined : Array.isArray(color) ? color : [color];
      const assetObj = (typeof asset === 'string')
        ? (BCIM.BC.getAsset(char.AssetFamily||'Female3DCG', group, asset) || {Name:asset})
        : asset;

      CharacterAppearanceSetItem(char, group, assetObj, colorArr);

      const item = BCIM.BC.getItem(char, group);
      if (item) {
        if (craft    && Object.keys(craft).length)    item.Craft    = {...(item.Craft||{}),    ...craft};
        if (property && Object.keys(property).length) item.Property = {...(item.Property||{}), ...property};
      }

      CharacterRefresh(char);

      if (isPlayer) {
        // Self: broadcast to whole room, then local sync
        ChatRoomCharacterUpdate(char);
        BCIM._sendFullSync(char.MemberNumber, assetObj?.Name||String(asset), group, char);
      } else {
        // Other: full 5-step sync sequence
        BCIM._lastSyncData = { memberNumber:char.MemberNumber, assetName:assetObj?.Name||String(asset), assetGroup:group, targetChar:char };
        BCIM._syncStep1();
        setTimeout(()=>BCIM._syncStep2(), 150);
        setTimeout(()=>BCIM._syncStep3(), 350);
        setTimeout(()=>BCIM._syncStep5(), 500);
      }

      BCIM.emit('itemApplied', {char, group, asset:assetObj, color:colorArr, craft, property});
      return true;
    } catch(e) { console.warn('[BCIM applyItem]', e); return false; }
  },

  removeItem: (char, group) => {
    try {
      CharacterAppearanceSetItem(char, group, null);
      CharacterRefresh(char);
      if (char.IsPlayer?.()) {
        ChatRoomCharacterUpdate(char);
        BCIM._syncStep5();
      } else {
        BCIM._lastSyncData = { memberNumber:char.MemberNumber, assetName:null, assetGroup:group, targetChar:char };
        BCIM._syncStep1();
        setTimeout(()=>BCIM._syncStep5(), 300);
      }
      BCIM.emit('itemRemoved', {char, group});
      return true;
    } catch(e) { console.warn('[BCIM removeItem]', e); return false; }
  },

  // ── Lock system ───────────────────────────────────────
  LOCK_DEFS: {
    'MetalPadlock':         {label:'🔒 Metall',          fields:[]},
    'ExclusivePadlock':     {label:'⭐ Exclusive',        fields:[]},
    'OwnerPadlock':         {label:'👑 Owner',            fields:[]},
    'LoversPadlock':        {label:'❤️ Lovers',           fields:[]},
    'SafewordPadlock':      {label:'🛡 Safeword',         fields:[]},
    'CombinationPadlock':   {label:'🔢 Kombination',      fields:['combination']},
    'PasswordPadlock':      {label:'🔑 Passwort',         fields:['password','hint']},
    'TimerPadlock':         {label:'⏱ Timer',             fields:['timer']},
    'TimerPasswordPadlock': {label:'⏱🔑 Timer+Passwort', fields:['timer','password','hint']},
    'HighSecurityPadlock':  {label:'🔐 High-Security',    fields:['combination']},
  },

  hmsToSeconds: (h,m,s) => (parseInt(h)||0)*3600+(parseInt(m)||0)*60+(parseInt(s)||0),

  applyLock: (char, group, lockName, opts={}) => {
    try {
      const item = BCIM.BC.getItem(char, group);
      if (!item) return {ok:false, reason:'Kein Item in diesem Slot'};
      const prop = item.Property ? {...item.Property} : {};
      prop.LockedBy = lockName;
      if (opts.timerSeconds > 0) {
        prop.RemoveTimer    = opts.timerSeconds;
        prop.RemoveItemTime = Date.now() + opts.timerSeconds * 1000;
      }
      if (opts.password)    prop.Password          = opts.password;
      if (opts.hint)        prop.Hint              = opts.hint;
      if (opts.combination) prop.CombinationNumber = opts.combination;
      item.Property = prop;
      try {
        const la = BCIM.BC.getAsset(char.AssetFamily||'Female3DCG','ItemMisc',lockName);
        if (la && typeof InventoryLock==='function') InventoryLock(char, item, {Asset:la}, char.MemberNumber);
      } catch {}
      CharacterRefresh(char);
      if (char.IsPlayer?.()) ChatRoomCharacterUpdate(char);
      BCIM.DB.push('lockLog',{timestamp:Date.now(),action:'add',group,lock:lockName,charName:char.Name},200);
      BCIM.emit('lockApplied',{char,group,lockName,opts});
      return {ok:true};
    } catch(e) { return {ok:false, reason:String(e.message||e)}; }
  },

  removeLock: (char, group) => {
    try {
      const item = BCIM.BC.getItem(char, group);
      if (!item?.Property?.LockedBy) return {ok:false, reason:'Kein Schloss'};
      const lockName = item.Property.LockedBy;
      try { if (typeof InventoryUnlock==='function') InventoryUnlock(char, item); } catch {}
      ['LockedBy','RemoveTimer','RemoveItemTime','Password','Hint','CombinationNumber']
        .forEach(k => delete item.Property[k]);
      CharacterRefresh(char);
      if (char.IsPlayer?.()) ChatRoomCharacterUpdate(char);
      BCIM.DB.push('lockLog',{timestamp:Date.now(),action:'remove',group,lock:lockName,charName:char.Name},200);
      return {ok:true};
    } catch(e) { return {ok:false, reason:String(e.message||e)}; }
  },

  // ── Snapshot ──────────────────────────────────────────
  snapshot: (char) => {
    if (!char) return [];
    return BCIM.BC.getGroups(char.AssetFamily||'Female3DCG').map(g => {
      const item = BCIM.BC.getItem(char, g.Name);
      if (!item?.Asset?.Name) return null;
      return {
        group: g.Name, assetName: item.Asset.Name,
        colors: Array.isArray(item.Color)?[...item.Color]:(item.Color?[item.Color]:[]),
        craft:    item.Craft    ? {...item.Craft}    : undefined,
        property: item.Property ? {...item.Property} : undefined,
      };
    }).filter(Boolean);
  },

  applySnapshot: (char, snap) => {
    snap.forEach(entry => {
      const fam    = char.AssetFamily||'Female3DCG';
      const assets = BCIM.BC.getAssetsForGroup(fam, entry.group);
      const asset  = assets.find(a=>a.Name===entry.assetName);
      if (asset) BCIM.BC.applyItem(char, entry.group, asset, entry.colors, entry.craft, entry.property);
    });
  },

  getLockedItems: (char) => {
    if (!char) return [];
    return BCIM.BC.getGroups(char.AssetFamily||'Female3DCG').map(g => {
      const item = BCIM.BC.getItem(char, g.Name);
      if (!item?.Property?.LockedBy) return null;
      return {group:g.Name, assetName:item.Asset?.Name, lock:item.Property.LockedBy,
        timerSeconds:item.Property.RemoveTimer, removeAt:item.Property.RemoveItemTime};
    }).filter(Boolean);
  },

  // ── Archetype ─────────────────────────────────────────
  getArchetype: (asset) => {
    if (!asset) return 'unknown';
    const a = (asset.Archetype||'').toLowerCase();
    if (a) return a;
    if (asset.Modules?.length)                                     return 'modular';
    if (asset.AllowType?.length)                                   return 'typed';
    if (asset.AllowEffect?.includes('Vibrate')||asset.IsVibrator)  return 'vibrating';
    if (asset.AllowText||asset.MaxText)                            return 'text';
    return 'basic';
  },

  decodeModular: (asset, typeStr) => {
    const result={}; if(!asset.Modules?.length) return result; let rem=typeStr||'';
    for(const mod of asset.Modules){
      const key=mod.Key||mod.Name; let matched=false;
      for(const opt of mod.Options){
        const n=typeof opt==='string'?opt:(opt.Name??'');
        if(n&&rem.startsWith(n)){result[key]=n;rem=rem.slice(n.length);matched=true;break;}
      }
      if(!matched){const f=mod.Options[0];result[key]=typeof f==='string'?f:(f?.Name??'');}
    }
    return result;
  },

  encodeModular: (asset, sel) => {
    if(!asset.Modules?.length) return '';
    return asset.Modules.map(mod=>{
      const key=mod.Key||mod.Name; const v=sel[key]; if(v!=null) return v;
      const f=mod.Options[0]; return typeof f==='string'?f:(f?.Name??'');
    }).join('');
  },

  translateType: (asset, t) => {
    try{const k=`${asset.Group?.Name}${asset.Name}${t}`;const r=AssetText(k);if(r&&r!==k)return r;const r2=AssetText(t);if(r2&&r2!==t)return r2;}catch{}
    return t.replace(/([A-Z])/g,' $1').trim();
  },

  sendChat:  (msg) => { try{ServerSend('ChatRoomChat',{Content:msg,Type:'Chat'});return true;}catch{return false;} },
  sendEmote: (msg) => { try{ServerSend('ChatRoomChat',{Content:'*'+msg,Type:'Emote'});return true;}catch{return false;} },

  tryEscape: (char, group) => {
    try{const item=BCIM.BC.getItem(char,group);if(!item||item.Property?.LockedBy)return false;
      CharacterAppearanceSetItem(char,group,null);CharacterRefresh(char);
      if(char.IsPlayer?.())ChatRoomCharacterUpdate(char);return true;}catch{return false;}
  },

  isAddonAsset: (asset) => !!(asset?.DynamicGroupName||asset?.FromAddon||asset?.AddedByMod),
  loadedAddons: () => { try{const sdk=window.bcModSDK||window.ModSDK;return sdk?.ModsInfo?[...sdk.ModsInfo.values()].map(m=>m.name):[];}catch{return[];} },
  bcxRules:    () => { try{return window.bcx?.getRuleState?Object.keys(window.bcx.rules||{}).map(k=>({name:k,active:window.bcx.getRuleState(k)})):null;}catch{return null;} },
  craftMaterials:['Shiny','Leather','LeatherSoft','Metal','Cloth','Rope','Latex','Rubber','Plastic','Fluffy','Silk'],
};

// ── Auto-scan on load ─────────────────────────────────────
setTimeout(() => { try { BCIM.scanAssets(); } catch {} }, 600);
