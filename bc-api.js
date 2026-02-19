// ── BCIM / core / bc-api.js ───────────────────────────────
window.BCIM = window.BCIM || {};

BCIM.BC = {
  // ── Players ────────────────────────────────────────────
  players: () => { try { return [Player,...(ChatRoomCharacter||[])].filter(Boolean); } catch { return []; } },
  player:  (id) => BCIM.BC.players().find(c=>c.MemberNumber===id||c.Name===id) || null,
  inRoom:  () => { try { return !!(ChatRoomData?.Name); } catch { return false; } },

  // ── Items ──────────────────────────────────────────────
  getItem:  (c,g)      => { try { return InventoryGet(c,g); } catch { return null; } },
  getGroups:(f='Female3DCG') => { try { return (AssetGroup||[]).filter(g=>g.Family===f&&!g.MirrorActivitiesFrom); } catch { return []; } },
  getAssetsForGroup:(f,g) => { try { return (Asset||[]).filter(a=>a.Group?.Name===g&&a.Group?.Family===f); } catch { return []; } },
  getAsset: (f,g,n)    => { try { return AssetGet(f,g,n); } catch { return null; } },

  applyItem: (char, group, asset, color, craft, property) => {
    try {
      CharacterAppearanceSetItem(char, group, asset, color);
      const item = InventoryGet(char, group);
      if (item) {
        if (craft)    item.Craft    = {...(item.Craft   ||{}), ...craft   };
        if (property) item.Property = {...(item.Property||{}), ...property};
      }
      CharacterRefresh(char);
      if (char.IsPlayer?.()) ChatRoomCharacterUpdate(char);
      else ServerSend('ChatRoomCharacterItemUpdate',{Target:char.MemberNumber});
      BCIM.emit('itemApplied', {char, group, asset, color, craft, property});
      return true;
    } catch(e) { console.warn('[BCIM]',e); return false; }
  },

  removeItem: (char, group) => {
    try {
      CharacterAppearanceSetItem(char, group, null);
      CharacterRefresh(char);
      if (char.IsPlayer?.()) ChatRoomCharacterUpdate(char);
      BCIM.emit('itemRemoved', {char, group});
      return true;
    } catch { return false; }
  },

  // ── Snapshot helpers ───────────────────────────────────
  snapshot: (char) => {
    if (!char) return [];
    return BCIM.BC.getGroups(char.AssetFamily||'Female3DCG').map(g => {
      const item = BCIM.BC.getItem(char, g.Name);
      if (!item) return null;
      return { group:g.Name, assetName:item.Asset?.Name,
        colors:Array.isArray(item.Color)?[...item.Color]:[item.Color],
        craft:item.Craft?{...item.Craft}:undefined,
        property:item.Property?{...item.Property}:undefined };
    }).filter(Boolean);
  },

  applySnapshot: (char, snap) => {
    snap.forEach(entry => {
      const fam = char.AssetFamily||'Female3DCG';
      const asset = BCIM.BC.getAssetsForGroup(fam, entry.group).find(a=>a.Name===entry.assetName);
      if (asset) BCIM.BC.applyItem(char, entry.group, asset, entry.colors, entry.craft, entry.property);
    });
  },

  // ── Locked items ───────────────────────────────────────
  getLockedItems: (char) => {
    if (!char) return [];
    return BCIM.BC.getGroups(char.AssetFamily||'Female3DCG').map(g => {
      const item = BCIM.BC.getItem(char, g.Name);
      if (!item?.Property?.LockedBy) return null;
      return { group:g.Name, assetName:item.Asset?.Name,
        lock:item.Property.LockedBy, timer:item.Property.RemoveTimer,
        setAt:item.Property.RemoveItemTime };
    }).filter(Boolean);
  },

  // ── Archetype ──────────────────────────────────────────
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
    const result = {};
    if (!asset.Modules?.length) return result;
    let rem = typeStr||'';
    for (const mod of asset.Modules) {
      const key = mod.Key||mod.Name;
      let matched = false;
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
    try { const k=`${asset.Group.Name}${asset.Name}${t}`; const r=AssetText(k); if(r&&r!==k) return r; const r2=AssetText(t); if(r2&&r2!==t) return r2; } catch {}
    return t.replace(/([A-Z])/g,' $1').trim();
  },

  // ── Chat ───────────────────────────────────────────────
  sendChat: (msg) => {
    try { ServerSend('ChatRoomChat', {Content:msg, Type:'Chat'}); return true; }
    catch { return false; }
  },
  sendEmote: (msg) => {
    try { ServerSend('ChatRoomChat', {Content:'*'+msg+'*', Type:'Emote'}); return true; }
    catch { return false; }
  },

  // ── Minigame helper (for escape) ──────────────────────
  tryEscape: (char, group) => {
    try {
      const item = InventoryGet(char, group);
      if (!item) return false;
      if (!item.Property?.LockedBy) {
        CharacterAppearanceSetItem(char, group, null);
        CharacterRefresh(char); ChatRoomCharacterUpdate(char);
        return true;
      }
      return false;
    } catch { return false; }
  },

  // ── Addon / ModSDK ─────────────────────────────────────
  isAddonAsset: (asset) => !!(asset?.DynamicGroupName||asset?.FromAddon||asset?.AddedByMod),
  loadedAddons: () => {
    try { const sdk=window.bcModSDK||window.ModSDK; return sdk?.ModsInfo?[...sdk.ModsInfo.values()].map(m=>m.name):[]; }
    catch { return []; }
  },
  bcxRules: () => {
    try { return window.bcx?.getRuleState?Object.keys(window.bcx.rules||{}).map(k=>({name:k,active:window.bcx.getRuleState(k)})):null; }
    catch { return null; }
  },

  craftMaterials: ['Shiny','Leather','LeatherSoft','Metal','Cloth','Rope','Latex','Rubber','Plastic','Fluffy','Silk'],
};
