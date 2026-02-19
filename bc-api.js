// ── BCIM / bc-api.js (v3.1) ───────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.BC = {
  players: () => {
    try { return [Player, ...(ChatRoomCharacter||[])].filter(Boolean); } catch { return []; }
  },
  player: (id) => BCIM.BC.players().find(c=>c.MemberNumber===id||c.Name===id)||null,
  inRoom: () => { try { return !!(ChatRoomData?.Name); } catch { return false; } },

  getItem: (char, group) => {
    if (!char || !group) return null;
    try { const r = InventoryGet(char, group); if (r) return r; } catch {}
    try { return char.Appearance?.find(i => i.Asset?.Group?.Name === group) || null; } catch { return null; }
  },

  getGroups: (family = 'Female3DCG') => {
    try {
      return (AssetGroup||[]).filter(g => g.Family === family && !g.MirrorActivitiesFrom && g.Name);
    } catch { return []; }
  },

  getAssetsForGroup: (family, group) => {
    try {
      if (typeof Asset !== 'undefined') {
        const list = Asset.filter(a => a.Group?.Name === group && a.Group?.Family === family);
        if (list.length) return list;
      }
      return [];
    } catch { return []; }
  },

  getAsset: (family, group, name) => {
    try { return AssetGet(family, group, name) || null; } catch { return null; }
  },

  // FIX: correct visibility — self uses ChatRoomCharacterUpdate, others via ServerSend
  applyItem: (char, group, asset, color, craft, property) => {
    try {
      const colorArr = !color ? undefined : Array.isArray(color) ? color : [color];
      CharacterAppearanceSetItem(char, group, asset, colorArr);
      const item = BCIM.BC.getItem(char, group);
      if (item) {
        if (craft && Object.keys(craft).length)       item.Craft    = {...(item.Craft||{}),    ...craft};
        if (property && Object.keys(property).length) item.Property = {...(item.Property||{}), ...property};
      }
      CharacterRefresh(char);
      if (char.IsPlayer?.()) {
        ChatRoomCharacterUpdate(char); // broadcast to whole room — everyone sees
      } else {
        // Only works with BC permission (owner/lover/admin)
        try { ServerSend('ChatRoomCharacterItemUpdate', {Target: char.MemberNumber, Group: group}); } catch {}
        CharacterRefresh(char);
      }
      BCIM.emit('itemApplied', {char, group, asset, color: colorArr, craft, property});
      return true;
    } catch(e) { console.warn('[BCIM applyItem]', e); return false; }
  },

  removeItem: (char, group) => {
    try {
      CharacterAppearanceSetItem(char, group, null);
      CharacterRefresh(char);
      if (char.IsPlayer?.()) ChatRoomCharacterUpdate(char);
      else try { ServerSend('ChatRoomCharacterItemUpdate', {Target:char.MemberNumber, Group:group}); } catch {}
      BCIM.emit('itemRemoved', {char, group});
      return true;
    } catch(e) { console.warn('[BCIM removeItem]', e); return false; }
  },

  // ── Lock definitions ───────────────────────────────────
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

  hmsToSeconds: (h, m, s) => (parseInt(h)||0)*3600 + (parseInt(m)||0)*60 + (parseInt(s)||0),

  applyLock: (char, group, lockName, opts = {}) => {
    try {
      const item = BCIM.BC.getItem(char, group);
      if (!item) return {ok:false, reason:'Kein Item in diesem Slot'};
      const prop = item.Property ? {...item.Property} : {};
      prop.LockedBy = lockName;
      const timerSec = opts.timerSeconds || 0;
      if (timerSec > 0) {
        prop.RemoveTimer    = timerSec;
        prop.RemoveItemTime = Date.now() + timerSec * 1000;
      }
      if (opts.password)    prop.Password          = opts.password;
      if (opts.hint)        prop.Hint              = opts.hint;
      if (opts.combination) prop.CombinationNumber = opts.combination;
      item.Property = prop;
      try {
        const lockAsset = BCIM.BC.getAsset(char.AssetFamily||'Female3DCG','ItemMisc',lockName);
        if (lockAsset && typeof InventoryLock === 'function')
          InventoryLock(char, item, {Asset: lockAsset}, char.MemberNumber);
      } catch {}
      CharacterRefresh(char);
      if (char.IsPlayer?.()) ChatRoomCharacterUpdate(char);
      else try { ServerSend('ChatRoomCharacterItemUpdate',{Target:char.MemberNumber,Group:group}); } catch {}
      BCIM.DB.push('lockLog',{timestamp:Date.now(),action:'add',group,lock:lockName,charName:char.Name},200);
      BCIM.emit('lockApplied',{char,group,lockName,opts});
      return {ok:true};
    } catch(e) { return {ok:false, reason:String(e.message||e)}; }
  },

  removeLock: (char, group) => {
    try {
      const item = BCIM.BC.getItem(char, group);
      if (!item?.Property?.LockedBy) return {ok:false, reason:'Kein Schloss vorhanden'};
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
      const fam   = char.AssetFamily||'Female3DCG';
      const asset = BCIM.BC.getAssetsForGroup(fam, entry.group).find(a=>a.Name===entry.assetName);
      if (asset) BCIM.BC.applyItem(char, entry.group, asset, entry.colors, entry.craft, entry.property);
    });
  },

  getLockedItems: (char) => {
    if (!char) return [];
    return BCIM.BC.getGroups(char.AssetFamily||'Female3DCG').map(g => {
      const item = BCIM.BC.getItem(char, g.Name);
      if (!item?.Property?.LockedBy) return null;
      return {
        group: g.Name, assetName: item.Asset?.Name,
        lock: item.Property.LockedBy,
        timerSeconds: item.Property.RemoveTimer,
        removeAt: item.Property.RemoveItemTime,
      };
    }).filter(Boolean);
  },

  getArchetype: (asset) => {
    if (!asset) return 'unknown';
    const a = (asset.Archetype||'').toLowerCase();
    if (a) return a;
    if (asset.Modules?.length)                                    return 'modular';
    if (asset.AllowType?.length)                                  return 'typed';
    if (asset.AllowEffect?.includes('Vibrate')||asset.IsVibrator) return 'vibrating';
    if (asset.AllowText||asset.MaxText)                           return 'text';
    return 'basic';
  },

  decodeModular: (asset, typeStr) => {
    const result = {}; if (!asset.Modules?.length) return result;
    let rem = typeStr||'';
    for (const mod of asset.Modules) {
      const key = mod.Key||mod.Name; let matched = false;
      for (const opt of mod.Options) {
        const n = typeof opt==='string'?opt:(opt.Name??'');
        if (n && rem.startsWith(n)) { result[key]=n; rem=rem.slice(n.length); matched=true; break; }
      }
      if (!matched) { const f=mod.Options[0]; result[key]=typeof f==='string'?f:(f?.Name??''); }
    }
    return result;
  },

  encodeModular: (asset, sel) => {
    if (!asset.Modules?.length) return '';
    return asset.Modules.map(mod => {
      const key=mod.Key||mod.Name; const v=sel[key]; if(v!=null) return v;
      const f=mod.Options[0]; return typeof f==='string'?f:(f?.Name??'');
    }).join('');
  },

  translateType: (asset, t) => {
    try {
      const k=`${asset.Group?.Name}${asset.Name}${t}`;
      const r=AssetText(k); if(r&&r!==k) return r;
      const r2=AssetText(t); if(r2&&r2!==t) return r2;
    } catch {}
    return t.replace(/([A-Z])/g,' $1').trim();
  },

  sendChat:  (msg) => { try { ServerSend('ChatRoomChat',{Content:msg,Type:'Chat'});  return true; } catch { return false; } },
  sendEmote: (msg) => { try { ServerSend('ChatRoomChat',{Content:'*'+msg,Type:'Emote'}); return true; } catch { return false; } },

  tryEscape: (char, group) => {
    try {
      const item = BCIM.BC.getItem(char, group);
      if (!item || item.Property?.LockedBy) return false;
      CharacterAppearanceSetItem(char, group, null);
      CharacterRefresh(char);
      if (char.IsPlayer?.()) ChatRoomCharacterUpdate(char);
      return true;
    } catch { return false; }
  },

  isAddonAsset: (asset) => !!(asset?.DynamicGroupName||asset?.FromAddon||asset?.AddedByMod),

  loadedAddons: () => {
    try { const sdk=window.bcModSDK||window.ModSDK; return sdk?.ModsInfo?[...sdk.ModsInfo.values()].map(m=>m.name):[]; }
    catch { return []; }
  },

  bcxRules: () => {
    try { return window.bcx?.getRuleState ? Object.keys(window.bcx.rules||{}).map(k=>({name:k,active:window.bcx.getRuleState(k)})) : null; }
    catch { return null; }
  },

  craftMaterials: ['Shiny','Leather','LeatherSoft','Metal','Cloth','Rope','Latex','Rubber','Plastic','Fluffy','Silk'],
};
